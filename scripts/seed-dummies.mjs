/**
 * Creates Dummy Name (1)…(n) if missing. Usage: node scripts/seed-dummies.mjs [count]
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const count = Number.parseInt(process.argv[2] ?? '6', 10)
if (Number.isNaN(count) || count < 1) {
  console.error('Usage: node scripts/seed-dummies.mjs [count]')
  process.exit(1)
}

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const envText = readFileSync(path.join(root, '.env.local'), 'utf8')
function env(key) {
  const line = envText.split('\n').find((l) => l.startsWith(`${key}=`))
  if (!line) throw new Error(`Missing ${key}`)
  return line.slice(key.length + 1).trim()
}

const client = createClient(env('VITE_SUPABASE_URL'), env('VITE_SUPABASE_ANON_KEY'))
const bucket = 'product-images'

const imageBytes = readFileSync(path.join(root, 'public', 'dummy-product.jpg'))

const { data: existing } = await client.from('products').select('name')
const names = new Set((existing ?? []).map((r) => r.name.trim()))

let created = 0
for (let i = 1; i <= count; i++) {
  const name = `Dummy Name (${i})`
  const category = `Dummy Category (${i})`
  if (names.has(name)) continue

  const objectPath = `${crypto.randomUUID()}.jpg`
  const { error: upErr } = await client.storage.from(bucket).upload(objectPath, imageBytes, {
    contentType: 'image/jpeg',
    upsert: false,
  })
  if (upErr) {
    console.error(`Upload failed for ${name}:`, upErr.message)
    continue
  }

  const row = {
    name,
    category,
    quantity_in_carton: 99,
    image_path: objectPath,
    product_key: String(i).padStart(4, '0'),
  }

  let { error: insErr } = await client.from('products').insert(row)
  if (insErr?.message?.includes('product_key')) {
    const { product_key: _omit, ...withoutKey } = row
    ;({ error: insErr } = await client.from('products').insert(withoutKey))
  }
  if (insErr) {
    await client.storage.from(bucket).remove([objectPath])
    console.error(`Insert failed for ${name}:`, insErr.message)
    continue
  }
  names.add(name)
  created++
}

console.log(`Created ${created} dummy product(s) (${count} requested).`)
