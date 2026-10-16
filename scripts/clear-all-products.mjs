/**
 * Deletes every row in products and related storage (images).
 * Usage: node scripts/clear-all-products.mjs (needs ADMIN_EMAIL / ADMIN_PASSWORD)
 */
import { bucket, createAdminClient } from './lib/admin-client.mjs'

const client = await createAdminClient()

const { data: products, error: listError } = await client.from('products').select('id, image_path')
if (listError) {
  console.error('Could not list products:', listError.message)
  process.exit(1)
}

const rows = products ?? []
const imagePaths = rows.map((r) => r.image_path).filter(Boolean)

if (imagePaths.length > 0) {
  const { error: imgError } = await client.storage.from(bucket).remove(imagePaths)
  if (imgError) console.warn('Some images may remain:', imgError.message)
}

if (rows.length > 0) {
  const { error: delError } = await client.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delError) {
    console.error('Could not delete products:', delError.message)
    process.exit(1)
  }
}

console.log(`Removed ${rows.length} product(s).`)
