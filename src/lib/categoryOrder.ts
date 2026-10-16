import { categoryGroupLabel } from '@/lib/groupProductsByCategory'
import type { SupabaseClient } from '@supabase/supabase-js'

/** Saved category order from the `category_order` table, or null when none is saved yet. */
export async function readCategoryOrder(client: SupabaseClient): Promise<string[] | null> {
  const { data, error } = await client
    .from('category_order')
    .select('category')
    .order('position', { ascending: true })
  if (error) throw error
  const list = (data ?? []).map((row) => row.category as string)
  return list.length > 0 ? list : null
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
  const { error } = await client.from('category_order').delete().eq('category', category)
  if (error) throw error
}

export async function saveCategoryOrder(client: SupabaseClient, categories: string[]): Promise<void> {
  if (categories.length === 0) return
  const { error: upsertError } = await client
    .from('category_order')
    .upsert(categories.map((category, position) => ({ category, position })))
  if (upsertError) throw upsertError

  const quoted = categories.map((c) => `"${c.replaceAll('"', '""')}"`).join(',')
  const { error: pruneError } = await client
    .from('category_order')
    .delete()
    .not('category', 'in', `(${quoted})`)
  if (pruneError) throw pruneError
}
