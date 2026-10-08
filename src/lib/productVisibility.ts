import { PRODUCT_IMAGES_BUCKET } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

const HIDDEN_IDS_PATH = 'config/hidden-product-ids.json'

type HiddenIdsFile = { ids: string[] }

/** Loaded once per session; updated on every hide toggle. */
let hiddenIdsCache: Set<string> | null = null
let hiddenIdsLoadPromise: Promise<Set<string>> | null = null
let persistQueue: Promise<void> = Promise.resolve()

async function fetchHiddenProductIdsFromStorage(client: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await client.storage.from(PRODUCT_IMAGES_BUCKET).download(HIDDEN_IDS_PATH)
  if (error) {
    const message = 'message' in error ? String(error.message) : ''
    if (/not found|404|does not exist/i.test(message)) return new Set()
    throw error
  }
  const text = await data.text()
  if (!text.trim()) return new Set()
  const parsed = JSON.parse(text) as HiddenIdsFile
  return new Set(parsed.ids ?? [])
}

async function getHiddenIdsMutable(client: SupabaseClient): Promise<Set<string>> {
  if (hiddenIdsCache) return hiddenIdsCache
  if (!hiddenIdsLoadPromise) {
    hiddenIdsLoadPromise = fetchHiddenProductIdsFromStorage(client).then((ids) => {
      hiddenIdsCache = ids
      return ids
    })
  }
  return hiddenIdsLoadPromise
}

async function writeHiddenProductIds(client: SupabaseClient, ids: Set<string>): Promise<void> {
  const body = JSON.stringify({ ids: [...ids] })
  const { error } = await client.storage.from(PRODUCT_IMAGES_BUCKET).upload(HIDDEN_IDS_PATH, body, {
    contentType: 'application/json',
    upsert: true,
    cacheControl: '60',
  })
  if (error) throw error
}

export async function readHiddenProductIds(client: SupabaseClient): Promise<Set<string>> {
  const ids = await getHiddenIdsMutable(client)
  return new Set(ids)
}

export async function setProductHiddenInStorage(
  client: SupabaseClient,
  productId: string,
  hidden: boolean,
): Promise<void> {
  const ids = await getHiddenIdsMutable(client)
  const had = ids.has(productId)
  if (hidden) ids.add(productId)
  else ids.delete(productId)
  if (had === hidden) return

  const snapshot = new Set(ids)
  const task = persistQueue.then(() => writeHiddenProductIds(client, snapshot))
  persistQueue = task.catch(() => {})
  await task
}

export async function removeProductFromHiddenStorage(
  client: SupabaseClient,
  productId: string,
): Promise<void> {
  const ids = await getHiddenIdsMutable(client)
  if (!ids.delete(productId)) return
  const snapshot = new Set(ids)
  const task = persistQueue.then(() => writeHiddenProductIds(client, snapshot))
  persistQueue = task.catch(() => {})
  await task
}

export function applyHiddenFlags<T extends { id: string; hidden: boolean }>(
  products: T[],
  hiddenIds: Set<string>,
): T[] {
  return products.map((p) => ({
    ...p,
    hidden: hiddenIds.has(p.id),
  }))
}
