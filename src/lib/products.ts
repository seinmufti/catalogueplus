import {
  PRODUCT_IMAGES_BUCKET,
  supabase,
  supabaseConfigError,
} from '@/lib/supabase'
import {
  applyHiddenFlags,
  readHiddenProductIds,
  removeProductFromHiddenStorage,
  setProductHiddenInStorage,
} from '@/lib/productVisibility'
import { isBrandColumnMissingError } from '@/lib/productBrand'
import { clearBrandColumnCache, hasBrandColumn } from '@/lib/productBrandColumn'
import {
  applyStorageBrands,
  readProductBrands,
  removeProductBrandFromStorage,
  setProductBrandInStorage,
} from '@/lib/productBrandStorage'
import { hasProductKeyColumn } from '@/lib/productKeyColumn'
import { isProductKeyColumnMissingError } from '@/lib/productKey'
import {
  allocateNextProductKey as allocateNextProductKeyCounter,
  applyStorageProductKeys,
  removeStorageProductKey,
  syncProductKeyCounter,
} from '@/lib/productKeyStorage'
import { prepareProductImage } from '@/lib/prepareProductImage'
import type { NewProductInput, Product, UpdateProductInput } from '@/types/product'

export type CreateProductPhase = 'upload' | 'save'

type CreateProductOptions = {
  onPhase?: (phase: CreateProductPhase) => void
}

function assertSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? 'Supabase is not configured.')
  }
  return supabase
}

const DUPLICATE_NAME_MESSAGE = 'A product with this name already exists.'

function isDuplicateNameError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { code?: string; message?: string }
  return e.code === '23505' || (e.message?.includes('products_name_unique') ?? false)
}

async function assertNameAvailable(
  name: string,
  client: ReturnType<typeof assertSupabase>,
  excludeProductId?: string,
): Promise<void> {
  const trimmed = name.trim()
  const { data, error } = await client.from('products').select('id').eq('name', trimmed)

  if (error) throw error
  const taken = (data ?? []).some((row) => row.id !== excludeProductId)
  if (taken) throw new Error(DUPLICATE_NAME_MESSAGE)
}

function extensionFromFile(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName
  const fromMime = file.type.split('/').pop()?.toLowerCase()
  if (fromMime === 'jpeg') return 'jpg'
  if (fromMime) return fromMime
  return 'jpg'
}

export function getPublicImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null
  if (imagePath.startsWith('blob:') || imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  const client = assertSupabase()
  const { data } = client.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(imagePath)
  return data.publicUrl
}

export function distinctCategoriesFromProducts(products: Product[]): string[] {
  const unique = [...new Set(products.map((p) => p.category.trim()).filter(Boolean))]
  unique.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  return unique
}

export function distinctBrandsFromProducts(products: Product[]): string[] {
  const unique = [...new Set(products.map((p) => p.brand.trim()).filter(Boolean))]
  unique.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  return unique
}

function normalizeProductRow(row: Record<string, unknown>): Product {
  const { revealed: _legacy, ...rest } = row
  const product_key =
    typeof rest.product_key === 'string' && rest.product_key.length > 0
      ? rest.product_key
      : '????'
  const brand = typeof rest.brand === 'string' ? rest.brand : ''
  return {
    ...(rest as Omit<Product, 'hidden' | 'product_key' | 'brand'>),
    brand,
    product_key,
    hidden: false,
  }
}

async function withHiddenState(products: Product[]): Promise<Product[]> {
  const client = assertSupabase()
  const hiddenIds = await readHiddenProductIds(client)
  return applyHiddenFlags(products, hiddenIds)
}

async function attachProductKeys(client: ReturnType<typeof assertSupabase>, rows: Record<string, unknown>[]) {
  const useDbKeys = await hasProductKeyColumn(client)
  let products = rows.map((row) => normalizeProductRow(row))

  if (useDbKeys) {
    await syncProductKeyCounter(
      client,
      products.map((p) => p.product_key).filter((k) => k !== '????'),
    )
  } else {
    const withKeys = await applyStorageProductKeys(client, products)
    products = withKeys.map((p) => normalizeProductRow(p as Record<string, unknown>))
    products.sort((a, b) => a.product_key.localeCompare(b.product_key))
  }

  if (!(await hasBrandColumn(client))) {
    products = applyStorageBrands(products, await readProductBrands(client))
  }

  return withHiddenState(products)
}

export async function listProducts(): Promise<Product[]> {
  const client = assertSupabase()
  const useDbKeys = await hasProductKeyColumn(client)

  const { data, error } = await client
    .from('products')
    .select('*')
    .order(useDbKeys ? 'product_key' : 'created_at', { ascending: true })

  if (error) throw error
  return attachProductKeys(client, (data ?? []) as Record<string, unknown>[])
}

/** Products visible on the customer catalogue (not hidden). */
export async function listCatalogueProducts(): Promise<Product[]> {
  const all = await listProducts()
  return all.filter((p) => !p.hidden)
}

export async function setProductHidden(id: string, hidden: boolean): Promise<void> {
  const client = assertSupabase()
  await setProductHiddenInStorage(client, id, hidden)
}

export async function createProduct(
  input: NewProductInput,
  options?: CreateProductOptions,
): Promise<Product> {
  const client = assertSupabase()
  const trimmedName = input.name.trim()
  await assertNameAvailable(trimmedName, client)

  const image = await prepareProductImage(input.image)
  const ext = extensionFromFile(image)
  const objectPath = `${crypto.randomUUID()}.${ext}`

  options?.onPhase?.('upload')
  const { error: uploadError } = await client.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(objectPath, image, {
      cacheControl: '3600',
      upsert: false,
      contentType: image.type || 'image/jpeg',
    })

  if (uploadError) throw uploadError

  options?.onPhase?.('save')
  const useDbKeys = await hasProductKeyColumn(client)
  const brandValue = input.brand.trim()
  const useBrandColumn = await hasBrandColumn(client)

  const row: Record<string, unknown> = {
    name: trimmedName,
    category: input.category.trim(),
    quantity_in_carton: input.quantityInCarton,
    image_path: objectPath,
  }
  if (useBrandColumn) row.brand = brandValue

  let product_key: string | undefined
  if (useDbKeys) {
    product_key = await allocateNextProductKeyCounter(client)
    row.product_key = product_key
  }

  let { data, error } = await client.from('products').insert(row).select('*').single()

  if (error && useDbKeys && isProductKeyColumnMissingError(error)) {
    delete row.product_key
    product_key = undefined
    ;({ data, error } = await client.from('products').insert(row).select('*').single())
  }

  if (error && isBrandColumnMissingError(error)) {
    clearBrandColumnCache()
    delete row.brand
    ;({ data, error } = await client.from('products').insert(row).select('*').single())
  }

  if (error) {
    await client.storage.from(PRODUCT_IMAGES_BUCKET).remove([objectPath])
    if (isDuplicateNameError(error)) throw new Error(DUPLICATE_NAME_MESSAGE)
    throw error
  }

  const inserted = data as Record<string, unknown>
  let product = normalizeProductRow(inserted)

  if (!(await hasProductKeyColumn(client))) {
    product_key = await allocateNextProductKeyCounter(client, product.id)
  }
  product = { ...product, product_key: product_key ?? product.product_key }

  if (!(await hasBrandColumn(client))) {
    await setProductBrandInStorage(client, product.id, brandValue)
  }
  product = { ...product, brand: brandValue || product.brand }

  return product
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
  options?: CreateProductOptions,
): Promise<Product> {
  const client = assertSupabase()
  const trimmedName = input.name.trim()
  await assertNameAvailable(trimmedName, client, id)

  const { data: existing, error: fetchError } = await client
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError
  const current = normalizeProductRow(existing as Record<string, unknown>)
  const hiddenIds = await readHiddenProductIds(client)
  current.hidden = hiddenIds.has(id)

  if (!(await hasProductKeyColumn(client))) {
    const [withKey] = await applyStorageProductKeys(client, [current])
    current.product_key = withKey.product_key
  }

  let imagePath = current.image_path
  let uploadedPath: string | null = null

  if (input.image) {
    const image = await prepareProductImage(input.image)
    const ext = extensionFromFile(image)
    uploadedPath = `${crypto.randomUUID()}.${ext}`

    options?.onPhase?.('upload')
    const { error: uploadError } = await client.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(uploadedPath, image, {
        cacheControl: '3600',
        upsert: false,
        contentType: image.type || 'image/jpeg',
      })
    if (uploadError) throw uploadError
    imagePath = uploadedPath
  }

  options?.onPhase?.('save')
  const brandValue = input.brand.trim()
  const useBrandColumn = await hasBrandColumn(client)

  const patch: Record<string, unknown> = {
    name: trimmedName,
    category: input.category.trim(),
    quantity_in_carton: input.quantityInCarton,
    image_path: imagePath,
  }
  if (useBrandColumn) patch.brand = brandValue

  let { data, error } = await client
    .from('products')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error && isBrandColumnMissingError(error)) {
    clearBrandColumnCache()
    delete patch.brand
    ;({ data, error } = await client
      .from('products')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single())
  }

  if (error) {
    if (uploadedPath) {
      await client.storage.from(PRODUCT_IMAGES_BUCKET).remove([uploadedPath])
    }
    if (isDuplicateNameError(error)) throw new Error(DUPLICATE_NAME_MESSAGE)
    throw error
  }

  if (uploadedPath && current.image_path) {
    await client.storage.from(PRODUCT_IMAGES_BUCKET).remove([current.image_path])
  }

  const updated = normalizeProductRow(data as Record<string, unknown>)
  updated.hidden = current.hidden
  updated.product_key = current.product_key
  if (!(await hasBrandColumn(client))) {
    await setProductBrandInStorage(client, id, brandValue)
  }
  updated.brand = brandValue || updated.brand
  return updated
}

export async function deleteProduct(id: string): Promise<void> {
  const client = assertSupabase()
  const { data: existing, error: fetchError } = await client
    .from('products')
    .select('image_path')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  const { error } = await client.from('products').delete().eq('id', id)
  if (error) throw error

  await removeProductFromHiddenStorage(client, id)
  await removeProductBrandFromStorage(client, id)

  if (!(await hasProductKeyColumn(client))) {
    await removeStorageProductKey(client, id)
  }

  const imagePath = (existing as { image_path: string | null }).image_path
  if (imagePath) {
    await client.storage.from(PRODUCT_IMAGES_BUCKET).remove([imagePath])
  }
}
