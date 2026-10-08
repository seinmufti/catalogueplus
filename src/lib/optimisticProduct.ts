import type { Product } from '@/types/product'

export const OPTIMISTIC_ID_PREFIX = 'optimistic:'

export function isOptimisticProductId(id: string): boolean {
  return id.startsWith(OPTIMISTIC_ID_PREFIX)
}

export function createOptimisticProductId(): string {
  return `${OPTIMISTIC_ID_PREFIX}${crypto.randomUUID()}`
}

export function estimateNextProductKey(products: Product[]): string {
  let max = 0
  for (const p of products) {
    const n = Number.parseInt(p.product_key, 10)
    if (!Number.isNaN(n)) max = Math.max(max, n)
  }
  return String(max + 1).padStart(4, '0')
}

export function sortProductsByKey(products: Product[]): Product[] {
  return [...products].sort((a, b) => a.product_key.localeCompare(b.product_key))
}

export function insertProductSorted(products: Product[], product: Product): Product[] {
  return sortProductsByKey([...products, product])
}
