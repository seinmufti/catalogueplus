import { listProducts } from '@/lib/products'
import type { Product } from '@/types/product'

const DUMMY_NAME_PREFIX = 'Dummy Name'
const DUMMY_CATEGORY_PREFIX = 'Dummy Category'
const NUMBERED_SUFFIX = /\((\d+)\)$/

function maxDummyIndexFromProducts(products: Product[]): number {
  let max = 0
  for (const product of products) {
    if (product.name.startsWith(DUMMY_NAME_PREFIX)) {
      const numbered = product.name.match(NUMBERED_SUFFIX)
      if (numbered) {
        max = Math.max(max, Number.parseInt(numbered[1], 10))
      } else if (product.name === DUMMY_NAME_PREFIX) {
        max = Math.max(max, 1)
      }
    }
  }
  return max
}

export async function nextDummyProductFields(): Promise<{ category: string; name: string }> {
  const products = await listProducts()
  const next = maxDummyIndexFromProducts(products) + 1
  return {
    category: `${DUMMY_CATEGORY_PREFIX} (${next})`,
    name: `${DUMMY_NAME_PREFIX} (${next})`,
  }
}
