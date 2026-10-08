import { PRODUCT_IMAGES_BUCKET } from '@/lib/supabase'
import { formatProductKey, parseProductKey } from '@/lib/productKey'
import type { SupabaseClient } from '@supabase/supabase-js'

const KEYS_PATH = 'config/product-keys.json'

type ProductKeysFile = {
  /** Highest key number ever issued; never decreases when products are deleted. */
  lastNumber: number
  keys: Record<string, string>
}

type KeyState = ProductKeysFile

let stateCache: KeyState | null = null
let stateLoadPromise: Promise<KeyState> | null = null

function maxFromKeyStrings(values: Iterable<string>): number {
  let max = 0
  for (const value of values) {
    const n = parseProductKey(value)
    if (n !== null && n > max) max = n
  }
  return max
}

function normalizeState(raw: Partial<ProductKeysFile> | null): KeyState {
  const keys = raw?.keys ?? {}
  const fromKeys = maxFromKeyStrings(Object.values(keys))
  const lastNumber = Math.max(typeof raw?.lastNumber === 'number' ? raw.lastNumber : 0, fromKeys)
  return { lastNumber, keys: { ...keys } }
}

async function fetchStateFromStorage(client: SupabaseClient): Promise<KeyState> {
  const { data, error } = await client.storage.from(PRODUCT_IMAGES_BUCKET).download(KEYS_PATH)
  if (error) {
    const message = 'message' in error ? String(error.message) : ''
    if (/not found|404|does not exist/i.test(message)) return { lastNumber: 0, keys: {} }
    throw error
  }
  const text = await data.text()
  if (!text.trim()) return { lastNumber: 0, keys: {} }
  const parsed = JSON.parse(text) as Partial<ProductKeysFile>
  return normalizeState(parsed)
}

async function getStateMutable(client: SupabaseClient): Promise<KeyState> {
  if (stateCache) return stateCache
  if (!stateLoadPromise) {
    stateLoadPromise = fetchStateFromStorage(client).then((state) => {
      stateCache = state
      return state
    })
  }
  return stateLoadPromise
}

async function persistState(client: SupabaseClient, state: KeyState): Promise<void> {
  stateCache = state
  const body = JSON.stringify(state, null, 2)
  const { error } = await client.storage.from(PRODUCT_IMAGES_BUCKET).upload(KEYS_PATH, body, {
    contentType: 'application/json',
    upsert: true,
    cacheControl: '60',
  })
  if (error) throw error
}

/** Raise the counter if the database already has higher keys (e.g. after migration). */
export async function syncProductKeyCounter(
  client: SupabaseClient,
  existingKeys: string[],
): Promise<void> {
  if (existingKeys.length === 0) return
  const state = await getStateMutable(client)
  const dbMax = maxFromKeyStrings(existingKeys)
  if (dbMax <= state.lastNumber) return
  state.lastNumber = dbMax
  await persistState(client, state)
}

function takeNextKey(state: KeyState): string {
  state.lastNumber += 1
  return formatProductKey(state.lastNumber)
}

/** Next display key (0001, 0002, …); never reuses numbers freed by delete. */
export async function allocateNextProductKey(
  client: SupabaseClient,
  productId?: string,
): Promise<string> {
  const state = await getStateMutable(client)
  if (productId && state.keys[productId]) return state.keys[productId]

  const key = takeNextKey(state)
  if (productId) state.keys[productId] = key
  await persistState(client, state)
  return key
}

/** Assign keys in storage when the DB has no product_key column. */
export async function applyStorageProductKeys<T extends { id: string; created_at: string }>(
  client: SupabaseClient,
  products: T[],
): Promise<(T & { product_key: string })[]> {
  const state = await getStateMutable(client)
  const sorted = [...products].sort((a, b) => {
    const t = a.created_at.localeCompare(b.created_at)
    return t !== 0 ? t : a.id.localeCompare(b.id)
  })

  let dirty = false
  for (const product of sorted) {
    if (!state.keys[product.id]) {
      state.keys[product.id] = takeNextKey(state)
      dirty = true
    }
  }

  if (dirty) await persistState(client, state)

  return products.map((product) => ({
    ...product,
    product_key: state.keys[product.id] ?? '????',
  }))
}

export async function removeStorageProductKey(client: SupabaseClient, productId: string): Promise<void> {
  const state = await getStateMutable(client)
  if (!(productId in state.keys)) return
  delete state.keys[productId]
  await persistState(client, state)
}
