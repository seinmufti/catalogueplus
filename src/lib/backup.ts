import { zipSync } from 'fflate'
import { getPublicImageUrl, listProducts } from '@/lib/products'
import type { Product } from '@/types/product'

export type BackupProductRecord = {
  id: string
  product_key: string
  name: string
  category: string
  brand: string
  quantity_in_carton: number
  hidden: boolean
  created_at: string
  image_file: string | null
}

export type CatalogueBackupJson = {
  exported_at: string
  store: 'Aksesuarat Ali'
  products: BackupProductRecord[]
}

function imageExtension(imagePath: string | null): string {
  if (!imagePath) return '.jpg'
  const ext = imagePath.split('.').pop()?.toLowerCase()
  if (ext && /^[a-z0-9]+$/.test(ext)) return `.${ext}`
  return '.jpg'
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

const IMAGE_DOWNLOAD_CONCURRENCY = 6

export type BackupResult = { failedImages: string[] }

export async function downloadCatalogueBackup(): Promise<BackupResult> {
  const products = await listProducts()
  const zipEntries: Record<string, Uint8Array> = {}
  const failedImages: string[] = []

  const imageFileFor = (product: Product) =>
    product.image_path ? `images/${product.id}${imageExtension(product.image_path)}` : null

  const backupProducts: BackupProductRecord[] = products.map((product) =>
    toBackupRecord(product, imageFileFor(product)),
  )

  const withImages = products.filter((p) => p.image_path)
  let next = 0
  const worker = async () => {
    while (next < withImages.length) {
      const product = withImages[next++]!
      const imageUrl = getPublicImageUrl(product.image_path)
      const imageFile = imageFileFor(product)!
      try {
        if (!imageUrl) throw new Error('No image URL')
        const res = await fetch(imageUrl)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        zipEntries[imageFile] = new Uint8Array(await res.arrayBuffer())
      } catch {
        failedImages.push(product.name)
      }
    }
  }
  await Promise.all(Array.from({ length: IMAGE_DOWNLOAD_CONCURRENCY }, worker))

  const manifest: CatalogueBackupJson = {
    exported_at: new Date().toISOString(),
    store: 'Aksesuarat Ali',
    products: backupProducts,
  }

  zipEntries['products.json'] = new TextEncoder().encode(
    JSON.stringify(manifest, null, 2),
  )

  const zipped = zipSync(zipEntries)
  const blob = new Blob([new Uint8Array(zipped)], { type: 'application/zip' })
  const date = new Date().toISOString().slice(0, 10)
  downloadBlob(blob, `catalogue-plus-backup-${date}.zip`)
  return { failedImages }
}

function toBackupRecord(product: Product, imageFile: string | null): BackupProductRecord {
  return {
    id: product.id,
    product_key: product.product_key,
    name: product.name,
    category: product.category,
    brand: product.brand,
    quantity_in_carton: product.quantity_in_carton,
    hidden: product.hidden,
    created_at: product.created_at,
    image_file: imageFile,
  }
}
