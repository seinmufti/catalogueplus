import { PRODUCT_IMAGES_BUCKET } from '@/lib/supabase'
import { categoryGroupLabel } from '@/lib/groupProductsByCategory'
import type { SupabaseClient } from '@supabase/supabase-js'

const ORDER_PATH = 'config/category-order.json'

type CategoryOrderFile = { categories: string[] }

let orderCache: string[] | null = null
let orderLoadPromise: Promise<string[] | null> | null = null
let persistQueue: Promise<void> = Promise.resolve()

async function fetchCategoryOrderFromStorage(client: SupabaseClient): Promise<string[] | null> {
  const { data, error } = await client.storage.from(PRODUCT_IMAGES_BUCKET).download(ORDER_PATH)
  if (error) {
    const message = 'message' in error ? String(error.message) : ''
    if (/not found|404|does not exist/i.test(message)) return null
    throw error
  }
  const text = await data.text()
  if (!text.trim()) return null
  const parsed = JSON.parse(text) as CategoryOrderFile
  const list = parsed.categories?.filter((c) => typeof c === 'string') ?? []
  return list.length > 0 ? list : null
}

async function writeCategoryOrder(client: SupabaseClient, categories: string[]): Promise<void> {
  const body = JSON.stringify({ categories })
  const { error } = await client.storage.from(PRODUCT_IMAGES_BUCKET).upload(ORDER_PATH, body, {
    contentType: 'application/json',
    upsert: true,
    cacheControl: '60',
  })
  if (error) throw error
}

export async function readCategoryOrder(client: SupabaseClient): Promise<string[] | null> {
  if (orderCache) return [...orderCache]
  if (!orderLoadPromise) {
    orderLoadPromise = fetchCategoryOrderFromStorage(client).then((order) => {
      orderCache = order
      return order
    })
  }
  const loaded = await orderLoadPromise
  return loaded ? [...loaded] : null
}

export function mergeCategoryOrderWithLabels(
  saved: string[] | null | undefined,
  productCategories: string[],
): string[] {
  const labels = [...new Set(productCategories.map((c) => categoryGroupLabel(c)))]
  if (labels.length === 0) return []

  if (!saved || saved.length === 0) {
    return labels.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  }

  const labelSet = new Set(labels)
  const ordered = saved.filter((c) => labelSet.has(c))
  const appended = labels
    .filter((c) => !saved.includes(c))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  return [...ordered, ...appended]
}

export type CategoryDropPlacement = 'before' | 'after'

export function moveItemInList<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return list
  if (fromIndex >= list.length || toIndex >= list.length) return list
  const next = [...list]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item!)
  return next
}

export function reorderCategoryList(
  order: string[],
  from: string,
  to: string,
  placement: CategoryDropPlacement = 'before',
): string[] {
  if (from === to) return order
  const fromIdx = order.indexOf(from)
  let toIdx = order.indexOf(to)
  if (fromIdx === -1 || toIdx === -1) return order
  const next = [...order]
  next.splice(fromIdx, 1)
  if (fromIdx < toIdx) toIdx -= 1
  if (placement === 'after') toIdx += 1
  next.splice(toIdx, 0, from)
  return next
}

export async function removeCategoryFromOrder(
  client: SupabaseClient,
  category: string,
): Promise<void> {
  const current = await readCategoryOrder(client)
  if (!current?.length) return
  const next = current.filter((c) => c !== category)
  if (next.length === current.length) return
  await saveCategoryOrder(client, next)
}

export async function saveCategoryOrder(client: SupabaseClient, categories: string[]): Promise<void> {
  orderCache = [...categories]
  const snapshot = [...categories]
  const task = persistQueue.then(() => writeCategoryOrder(client, snapshot))
  persistQueue = task.catch(() => {})
  await task
}

export function invalidateCategoryOrderCache(): void {
  orderCache = null
  orderLoadPromise = null
}
