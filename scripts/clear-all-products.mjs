/**
 * Deletes every row in products and related storage (images + config JSON).
 * Usage: node scripts/clear-all-products.mjs
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const envPath = path.join(root, '.env.local')

function readEnv(key) {
  const text = readFileSync(envPath, 'utf8')
  const line = text.split('\n').find((l) => l.startsWith(`${key}=`))
  if (!line) throw new Error(`Missing ${key} in .env.local`)
  return line.slice(key.length + 1).trim()
}

const url = readEnv('VITE_SUPABASE_URL')
const key = readEnv('VITE_SUPABASE_ANON_KEY')
const client = createClient(url, key)
const bucket = 'product-images'

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

for (const configPath of ['config/hidden-product-ids.json', 'config/product-keys.json']) {
  const body =
    configPath.includes('hidden') ? JSON.stringify({ ids: [] }) : JSON.stringify({ lastNumber: 0, keys: {} })
  await client.storage.from(bucket).upload(configPath, body, {
    contentType: 'application/json',
    upsert: true,
  })
}

console.log(`Removed ${rows.length} product(s).`)
