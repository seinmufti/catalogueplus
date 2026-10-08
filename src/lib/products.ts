import {
  PRODUCT_IMAGES_BUCKET,
  supabase,
  supabaseConfigError,
} from '@/lib/supabase'
import { prepareProductImage } from '@/lib/prepareProductImage'
import type { NewProductInput, Product } from '@/types/product'

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

async function assertNameAvailable(name: string, client: ReturnType<typeof assertSupabase>): Promise<void> {
  const trimmed = name.trim()
  const { data, error } = await client
    .from('products')
    .select('id')
    .eq('name', trimmed)
    .maybeSingle()

  if (error) throw error
  if (data) throw new Error(DUPLICATE_NAME_MESSAGE)
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
  const client = assertSupabase()
  const { data } = client.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(imagePath)
  return data.publicUrl
}

function normalizeProduct(row: Record<string, unknown>): Product {
  return {
    ...(row as Product),
    revealed: row.revealed === false ? false : true,
  }
}

export async function listProducts(): Promise<Product[]> {
  const client = assertSupabase()
  const { data, error } = await client
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => normalizeProduct(row as Record<string, unknown>))
}

/** Products visible on the customer catalogue (`revealed = true`). */
export async function listCatalogueProducts(): Promise<Product[]> {
  const client = assertSupabase()
  const { data, error } = await client
    .from('products')
    .select('*')
    .eq('revealed', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => normalizeProduct(row as Record<string, unknown>))
}

export async function setProductRevealed(id: string, revealed: boolean): Promise<void> {
  const client = assertSupabase()
  const { error } = await client.from('products').update({ revealed }).eq('id', id)
  if (error) throw error
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
  const { data, error } = await client
    .from('products')
    .insert({
      name: trimmedName,
      category: input.category.trim(),
      quantity_in_carton: input.quantityInCarton,
      image_path: objectPath,
      revealed: true,
    })
    .select('*')
    .single()

  if (error) {
    await client.storage.from(PRODUCT_IMAGES_BUCKET).remove([objectPath])
    if (isDuplicateNameError(error)) throw new Error(DUPLICATE_NAME_MESSAGE)
    throw error
  }

  return data as Product
}
