/**
 * Discovers cloud project URL via Supabase Management API, writes .env.local, runs 001 migration.
 *
 * Usage (PowerShell):
 *   $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
 *   npm run supabase:wire
 *
 * Optional: $env:SUPABASE_PROJECT_REF = "abcdefghijklmnop"
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const envPath = path.join(root, '.env.local')
const migrationPaths = [
  path.join(root, 'supabase', 'migrations', '001_products.sql'),
  path.join(root, 'supabase', 'migrations', '002_products_revealed.sql'),
  path.join(root, 'supabase', 'migrations', '003_products_unique_name.sql'),
  path.join(root, 'supabase', 'migrations', '004_product_key.sql'),
]

const token = process.env.SUPABASE_ACCESS_TOKEN
if (!token) {
  console.error(
    'Set SUPABASE_ACCESS_TOKEN (Personal Access Token from https://supabase.com/dashboard/account/tokens)',
  )
  process.exit(1)
}

const publishableKey =
  process.env.VITE_SUPABASE_ANON_KEY ??
  readEnvValue(envPath, 'VITE_SUPABASE_ANON_KEY') ??
  ''

if (!publishableKey) {
  console.error('Missing publishable key in .env.local or VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const projectsRes = await fetch('https://api.supabase.com/v1/projects', {
  headers: { Authorization: `Bearer ${token}` },
})
if (!projectsRes.ok) {
  console.error('List projects failed:', projectsRes.status, await projectsRes.text())
  process.exit(1)
}

/** @type {Array<{ id: string; ref: string; name: string }>} */
const projects = await projectsRes.json()
if (!projects.length) {
  console.error('No Supabase projects on this account.')
  process.exit(1)
}

const preferredRef = process.env.SUPABASE_PROJECT_REF
const project =
  projects.find((p) => p.ref === preferredRef || p.id === preferredRef) ??
  (projects.length === 1 ? projects[0] : null)

if (!project) {
  console.error('Multiple projects — set SUPABASE_PROJECT_REF to one of:')
  for (const p of projects) console.error(`  ${p.ref}  (${p.name})`)
  process.exit(1)
}

const supabaseUrl = `https://${project.ref}.supabase.co`
writeEnvLocal(envPath, supabaseUrl, publishableKey)
console.log('Wrote .env.local →', supabaseUrl)

for (const migrationPath of migrationPaths) {
  const name = path.basename(migrationPath)
  const sql = readFileSync(migrationPath, 'utf8')
  const queryRes = await fetch(
    `https://api.supabase.com/v1/projects/${project.ref}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    },
  )

  if (!queryRes.ok) {
    console.error(`Migration ${name} failed:`, queryRes.status, await queryRes.text())
    console.error('URL and key are in .env.local — you can run the SQL manually in the dashboard.')
    process.exit(1)
  }

  console.log(`Applied ${name}`)
}
console.log('Restart npm run dev if it is already running.')

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

function writeEnvLocal(filePath, url, anonKey) {
  const body = `VITE_SUPABASE_URL=${url}
VITE_SUPABASE_ANON_KEY=${anonKey}
`
  writeFileSync(filePath, body, 'utf8')
}
