import { zipSync } from 'fflate'
import { getPublicImageUrl, listProducts } from '@/lib/products'
import type { Product } from '@/types/product'

export type BackupProductRecord = {
  id: string
  product_key: string
  name: string
  category: string
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

export async function downloadCatalogueBackup(): Promise<void> {
  const products = await listProducts()
  const zipEntries: Record<string, Uint8Array> = {}
  const backupProducts: BackupProductRecord[] = []

  for (const product of products) {
    const imageFile = product.image_path
      ? `images/${product.id}${imageExtension(product.image_path)}`
      : null

    if (imageFile && product.image_path) {
      const imageUrl = getPublicImageUrl(product.image_path)
      if (imageUrl) {
        const res = await fetch(imageUrl)
        if (!res.ok) throw new Error(`Failed to download image for ${product.name}.`)
        zipEntries[imageFile] = new Uint8Array(await res.arrayBuffer())
      }
    }

    backupProducts.push(toBackupRecord(product, imageFile))
  }

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
}

function toBackupRecord(product: Product, imageFile: string | null): BackupProductRecord {
  return {
    id: product.id,
    product_key: product.product_key,
    name: product.name,
    category: product.category,
    quantity_in_carton: product.quantity_in_carton,
    hidden: product.hidden,
    created_at: product.created_at,
    image_file: imageFile,
  }
}
