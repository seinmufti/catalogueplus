/**
 * Creates Dummy Name (1)…(n) if missing. Usage: node scripts/seed-dummies.mjs [count]
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { bucket, createAdminClient, root_dir } from './lib/admin-client.mjs'

const count = Number.parseInt(process.argv[2] ?? '6', 10)
if (Number.isNaN(count) || count < 1) {
  console.error('Usage: node scripts/seed-dummies.mjs [count]')
  process.exit(1)
}

const client = await createAdminClient()
const imageBytes = readFileSync(path.join(root_dir, 'public', 'dummy-product.jpg'))

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
  }

  const { error: insErr } = await client.from('products').insert(row)
  if (insErr) {
    await client.storage.from(bucket).remove([objectPath])
    console.error(`Insert failed for ${name}:`, insErr.message)
    continue
  }
  names.add(name)
  created++
}

console.log(`Created ${created} dummy product(s) (${count} requested).`)
