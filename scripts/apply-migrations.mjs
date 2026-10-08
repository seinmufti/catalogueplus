/**
 * Applies all supabase/migrations/*.sql in order via Management API.
 *
 * Usage (PowerShell):
 *   $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
 *   npm run supabase:migrate
 *
 * Optional: $env:SUPABASE_PROJECT_REF = "your-project-ref"
 * (otherwise parsed from VITE_SUPABASE_URL in .env.local)
 */
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const envPath = path.join(root, '.env.local')
const migrationsDir = path.join(root, 'supabase', 'migrations')

const token = process.env.SUPABASE_ACCESS_TOKEN
if (!token) {
  console.error(
    'Set SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)',
  )
  process.exit(1)
}

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ?? readEnvValue(envPath, 'VITE_SUPABASE_URL')
if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL in .env.local')
  process.exit(1)
}

const projectRef =
  process.env.SUPABASE_PROJECT_REF ??
  supabaseUrl.match(/^https:\/\/([^.]+)\.supabase\.co/)?.[1]
if (!projectRef) {
  console.error('Could not parse project ref from', supabaseUrl)
  process.exit(1)
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort()

for (const name of files) {
  const sql = readFileSync(path.join(migrationsDir, name), 'utf8')
  const queryRes = await fetch(
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

  if (!queryRes.ok) {
    console.error(`Migration ${name} failed:`, queryRes.status, await queryRes.text())
    process.exit(1)
  }

  console.log(`Applied ${name}`)
}

console.log('Done. Reload the Supabase schema cache if the dashboard still shows old columns.')

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
