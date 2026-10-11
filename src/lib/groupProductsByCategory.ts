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

function sortGroupsByOrder(
  entries: [string, Product[]][],
  categoryOrder?: string[],
): ProductCategoryGroup[] {
  const indexOf = (category: string) => {
    if (!categoryOrder?.length) return Number.MAX_SAFE_INTEGER
    const i = categoryOrder.indexOf(category)
    return i === -1 ? Number.MAX_SAFE_INTEGER : i
  }

  return entries
    .sort((a, b) => {
      const byOrder = indexOf(a[0]) - indexOf(b[0])
      if (byOrder !== 0) return byOrder
      return a[0].localeCompare(b[0], undefined, { sensitivity: 'base' })
    })
    .map(([category, groupProducts]) => ({ category, products: groupProducts }))
}

/** Group products by category; optional saved order for sections. Products sort by product_key within each group. */
export function groupProductsByCategory(
  products: Product[],
  categoryOrder?: string[],
): ProductCategoryGroup[] {
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

  return sortGroupsByOrder([...map.entries()], categoryOrder)
}
