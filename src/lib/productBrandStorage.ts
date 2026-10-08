import { PRODUCT_IMAGES_BUCKET } from '@/lib/supabase'
import type { Product } from '@/types/product'
import type { SupabaseClient } from '@supabase/supabase-js'

const BRANDS_PATH = 'config/product-brands.json'

type BrandsFile = { brands: Record<string, string> }

let brandsCache: Record<string, string> | null = null
let brandsLoadPromise: Promise<Record<string, string>> | null = null
let persistQueue: Promise<void> = Promise.resolve()

async function fetchBrandsFromStorage(client: SupabaseClient): Promise<Record<string, string>> {
  const { data, error } = await client.storage.from(PRODUCT_IMAGES_BUCKET).download(BRANDS_PATH)
  if (error) {
    const message = 'message' in error ? String(error.message) : ''
    if (/not found|404|does not exist/i.test(message)) return {}
    throw error
  }
  const text = await data.text()
  if (!text.trim()) return {}
  const parsed = JSON.parse(text) as BrandsFile
  return parsed.brands ?? {}
}

async function getBrandsMutable(client: SupabaseClient): Promise<Record<string, string>> {
  if (brandsCache) return brandsCache
  if (!brandsLoadPromise) {
    brandsLoadPromise = fetchBrandsFromStorage(client).then((brands) => {
      brandsCache = brands
      return brands
    })
  }
  return brandsLoadPromise
}

async function writeBrands(client: SupabaseClient, brands: Record<string, string>): Promise<void> {
  const body = JSON.stringify({ brands })
  const { error } = await client.storage.from(PRODUCT_IMAGES_BUCKET).upload(BRANDS_PATH, body, {
    contentType: 'application/json',
    upsert: true,
    cacheControl: '60',
  })
  if (error) throw error
}

export async function readProductBrands(client: SupabaseClient): Promise<Record<string, string>> {
  const brands = await getBrandsMutable(client)
  return { ...brands }
}

export async function setProductBrandInStorage(
  client: SupabaseClient,
  productId: string,
  brand: string,
): Promise<void> {
  const brands = await getBrandsMutable(client)
  const trimmed = brand.trim()
  if (brands[productId] === trimmed) return
  if (trimmed) brands[productId] = trimmed
  else delete brands[productId]

  const snapshot = { ...brands }
  const task = persistQueue.then(() => writeBrands(client, snapshot))
  persistQueue = task.catch(() => {})
  await task
}

export async function removeProductBrandFromStorage(
  client: SupabaseClient,
  productId: string,
): Promise<void> {
  const brands = await getBrandsMutable(client)
  if (!(productId in brands)) return
  delete brands[productId]
  const snapshot = { ...brands }
  const task = persistQueue.then(() => writeBrands(client, snapshot))
  persistQueue = task.catch(() => {})
  await task
}

export function applyStorageBrands(products: Product[], brands: Record<string, string>): Product[] {
  return products.map((p) => {
    const fromStorage = brands[p.id]
    if (fromStorage === undefined) return p
    if (p.brand.trim() === fromStorage.trim()) return p
    return { ...p, brand: fromStorage }
  })
}
