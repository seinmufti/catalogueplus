import { PRODUCT_IMAGES_BUCKET } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

const PASSWORD_PATH = 'config/admin-password.json'

type PasswordFile = { hash: string }

export async function hashAdminPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function fetchPasswordHash(client: SupabaseClient): Promise<string | null> {
  const { data, error } = await client.storage.from(PRODUCT_IMAGES_BUCKET).download(PASSWORD_PATH)
  if (error) {
    const message = 'message' in error ? String(error.message) : ''
    if (/not found|404|does not exist/i.test(message)) return null
    throw error
  }
  const text = await data.text()
  if (!text.trim()) return null
  const parsed = JSON.parse(text) as PasswordFile
  return typeof parsed.hash === 'string' && parsed.hash ? parsed.hash : null
}

async function writePasswordHash(client: SupabaseClient, hash: string): Promise<void> {
  const body = JSON.stringify({ hash } satisfies PasswordFile)
  const { error } = await client.storage.from(PRODUCT_IMAGES_BUCKET).upload(PASSWORD_PATH, body, {
    contentType: 'application/json',
    upsert: true,
    cacheControl: '60',
  })
  if (error) throw error
}

let cachedHash: string | null | undefined

/** `undefined` = not loaded yet. */
export function getCachedAdminPasswordHash(): string | null | undefined {
  return cachedHash
}

export function setCachedAdminPasswordHash(hash: string | null): void {
  cachedHash = hash
}

export async function loadAdminPasswordHash(client: SupabaseClient): Promise<string | null> {
  const hash = await fetchPasswordHash(client)
  cachedHash = hash
  return hash
}

export async function persistAdminPasswordHash(
  client: SupabaseClient,
  hash: string,
): Promise<void> {
  await writePasswordHash(client, hash)
  cachedHash = hash
}
