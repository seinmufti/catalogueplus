import type { Product } from '@/types/product'

export type ProductCategoryGroup = {
  category: string
  products: Product[]
}

const UNCATEGORISED_LABEL = 'Uncategorised'

export function categoryGroupLabel(category: string): string {
  const trimmed = category.trim()
  return trimmed.length > 0 ? trimmed : UNCATEGORISED_LABEL
}

/** Group products by category (catalogue section), sorted A–Z; products keep product_key order within each group. */
export function groupProductsByCategory(products: Product[]): ProductCategoryGroup[] {
  const map = new Map<string, Product[]>()

  for (const product of products) {
    const label = categoryGroupLabel(product.category)
    const list = map.get(label) ?? []
    list.push(product)
    map.set(label, list)
  }

  for (const list of map.values()) {
    list.sort((a, b) => a.product_key.localeCompare(b.product_key))
  }

  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: 'base' }))
    .map(([category, groupProducts]) => ({ category, products: groupProducts }))
}
