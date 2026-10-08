import { publicAssetPath } from '@/lib/router-basename'
import { createProduct, listProducts } from '@/lib/products'
import type { Product } from '@/types/product'

export const DUMMY_PRODUCT_COUNT = 6

const DUMMY_NAME_PREFIX = 'Dummy Name'
const DUMMY_CATEGORY_PREFIX = 'Dummy Category'
const DUMMY_PRODUCT_IMAGE_URL = publicAssetPath('/dummy-product.jpg')
const NUMBERED_SUFFIX = /\((\d+)\)$/
const DUPLICATE_NAME_MESSAGE = 'A product with this name already exists.'

let ensureInFlight: Promise<{ created: number; skipped: number }> | null = null

export async function loadDummyProductImage(): Promise<File> {
  const res = await fetch(DUMMY_PRODUCT_IMAGE_URL)
  if (!res.ok) throw new Error('Could not load dummy image.')
  const blob = await res.blob()
  return new File([blob], 'dummy-product.jpg', { type: blob.type || 'image/jpeg' })
}

function isDuplicateNameError(err: unknown): boolean {
  return err instanceof Error && err.message.includes(DUPLICATE_NAME_MESSAGE)
}

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

export function dummyFieldsForIndex(index: number): { category: string; name: string } {
  return {
    category: `${DUMMY_CATEGORY_PREFIX} (${index})`,
    name: `${DUMMY_NAME_PREFIX} (${index})`,
  }
}

function hasAllDummyProducts(products: Product[], count: number): boolean {
  const names = new Set(products.map((p) => p.name.trim()))
  for (let i = 1; i <= count; i++) {
    if (!names.has(dummyFieldsForIndex(i).name)) return false
  }
  return true
}

export async function nextDummyProductFields(): Promise<{ category: string; name: string }> {
  const products = await listProducts()
  const next = maxDummyIndexFromProducts(products) + 1
  return dummyFieldsForIndex(next)
}

async function runEnsureDummyProducts(
  count: number,
): Promise<{ created: number; skipped: number }> {
  const products = await listProducts()
  if (hasAllDummyProducts(products, count)) {
    return { created: 0, skipped: count }
  }

  const existingNames = new Set(products.map((p) => p.name.trim()))
  const image = await loadDummyProductImage()

  let created = 0
  let skipped = 0

  for (let i = 1; i <= count; i++) {
    const { name, category } = dummyFieldsForIndex(i)
    if (existingNames.has(name)) {
      skipped++
      continue
    }

    try {
      await createProduct({
        name,
        category,
        brand: '',
        quantityInCarton: 99,
        image,
      })
      existingNames.add(name)
      created++
    } catch (err) {
      if (isDuplicateNameError(err)) {
        existingNames.add(name)
        skipped++
        continue
      }
      throw err
    }
  }

  return { created, skipped }
}

/** Creates Dummy Name (1)…(count) when missing. Concurrent calls share one run. */
export async function ensureDummyProducts(
  count: number = DUMMY_PRODUCT_COUNT,
): Promise<{ created: number; skipped: number }> {
  if (!ensureInFlight) {
    ensureInFlight = runEnsureDummyProducts(count).finally(() => {
      ensureInFlight = null
    })
  }
  return ensureInFlight
}
