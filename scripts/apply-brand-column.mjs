/**
 * Adds products.brand only (005 migration). Same auth as supabase:migrate.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const envPath = path.join(root, '.env.local')
const sqlPath = path.join(root, 'supabase', 'migrations', '005_products_brand.sql')

const token = process.env.SUPABASE_ACCESS_TOKEN
if (!token) {
  console.error('Set SUPABASE_ACCESS_TOKEN, then run: npm run supabase:brand')
  process.exit(1)
}

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ?? readEnvValue(envPath, 'VITE_SUPABASE_URL')
const projectRef =
  process.env.SUPABASE_PROJECT_REF ??
  supabaseUrl?.match(/^https:\/\/([^.]+)\.supabase\.co/)?.[1]

if (!projectRef) {
  console.error('Missing or invalid VITE_SUPABASE_URL in .env.local')
  process.exit(1)
}

const sql = readFileSync(sqlPath, 'utf8')
const res = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  },
)

if (!res.ok) {
  console.error('Failed:', res.status, await res.text())
  process.exit(1)
}

console.log('Applied 005_products_brand.sql (brand column + schema reload).')

function readEnvValue(filePath, key) {
  try {
    const text = readFileSync(filePath, 'utf8')
    const line = text.split('\n').find((l) => l.startsWith(`${key}=`))
    if (!line) return null
    return line.slice(key.length + 1).trim()
  } catch {
    return null
  }
}
