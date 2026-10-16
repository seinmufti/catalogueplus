/**
 * Supabase client signed in as the admin user, for maintenance scripts.
 *
 * Usage (PowerShell):
 *   $env:ADMIN_EMAIL = "you@example.com"
 *   $env:ADMIN_PASSWORD = "your password"
 *   node scripts/<script>.mjs
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))))
const envText = readFileSync(path.join(root, '.env.local'), 'utf8')

export function readEnv(key) {
  const line = envText.split('\n').find((l) => l.startsWith(`${key}=`))
  if (!line) throw new Error(`Missing ${key} in .env.local`)
  return line.slice(key.length + 1).trim()
}

export const root_dir = root
export const bucket = 'product-images'

export async function createAdminClient() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (the admin login) in your shell first.')
    process.exit(1)
  }
  const client = createClient(readEnv('VITE_SUPABASE_URL'), readEnv('VITE_SUPABASE_ANON_KEY'))
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) {
    console.error('Admin sign-in failed:', error.message)
    process.exit(1)
  }
  return client
}
