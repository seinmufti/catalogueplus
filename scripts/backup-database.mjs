/**
 * Saves a zip of everything in the database: products rows, category order, the old config/*.json
 * files (if still present) and the original product images. Read-only; uses public access.
 * Usage: node scripts/backup-database.mjs [outputDir]   (default: ./backups)
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { zipSync } from 'fflate'
import { createClient } from '@supabase/supabase-js'
import { bucket, readEnv, root_dir } from './lib/admin-client.mjs'

const baseUrl = readEnv('VITE_SUPABASE_URL')
const client = createClient(baseUrl, readEnv('VITE_SUPABASE_ANON_KEY'))
const publicUrl = (p) => `${baseUrl}/storage/v1/object/public/${bucket}/${p}`
const text = (value) => new TextEncoder().encode(JSON.stringify(value, null, 2))

const entries = {}
const notes = []

const { data: products, error } = await client.from('products').select('*').order('created_at')
if (error) {
  console.error('Could not read products:', error.message)
  process.exit(1)
}
entries['products.json'] = text(products)

const { data: order, error: orderError } = await client.from('category_order').select('*').order('position')
if (!orderError) entries['category_order.json'] = text(order)
else notes.push(`category_order table not readable (${orderError.message})`)

for (const name of ['product-keys', 'product-brands', 'hidden-product-ids', 'category-order']) {
  const res = await fetch(publicUrl(`config/${name}.json`))
  if (res.ok) entries[`config/${name}.json`] = new Uint8Array(await res.arrayBuffer())
}

const imagePaths = [...new Set(products.map((p) => p.image_path).filter(Boolean))]
let next = 0
let failed = 0
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (next < imagePaths.length) {
      const imagePath = imagePaths[next++]
      try {
        const res = await fetch(publicUrl(imagePath))
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        entries[`images/${imagePath}`] = new Uint8Array(await res.arrayBuffer())
      } catch {
        failed++
        notes.push(`image failed: ${imagePath}`)
      }
    }
  }),
)

entries['backup-info.json'] = text({
  exported_at: new Date().toISOString(),
  products: products.length,
  images: imagePaths.length - failed,
  images_failed: failed,
  notes,
})

const outDir = path.resolve(root_dir, process.argv[2] ?? 'backups')
mkdirSync(outDir, { recursive: true })
const file = path.join(outDir, `catalogue-plus-database-${new Date().toISOString().slice(0, 10)}.zip`)
writeFileSync(file, zipSync(entries))
console.log(`${file}\n${products.length} products, ${imagePaths.length - failed}/${imagePaths.length} images`)
