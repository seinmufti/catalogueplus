import { PRODUCT_IMAGES_BUCKET } from '@/lib/supabase'
import { sha256HexSync } from '@/lib/sha256'
import type { SupabaseClient } from '@supabase/supabase-js'

const PASSWORD_PATH = 'config/admin-password.json'
const HASH_SESSION_KEY = 'catalogue-plus-admin-password-hash'
const HASH_SESSION_NONE = '__none__'
const FETCH_TIMEOUT_MS = 8_000

type PasswordFile = { hash: string }

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashAdminPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password)
  if (globalThis.crypto?.subtle) {
    try {
      const digest = await crypto.subtle.digest('SHA-256', data)
      return bytesToHex(new Uint8Array(digest))
    } catch {
      // Insecure context or blocked subtle — use sync fallback.
    }
  }
  return sha256HexSync(data)
}

function writeSessionHashCache(hash: string | null): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(HASH_SESSION_KEY, hash ?? HASH_SESSION_NONE)
}

/** Returns true when a session cache entry was applied. */
export function hydrateAdminPasswordHashFromSession(): boolean {
  if (typeof sessionStorage === 'undefined') return false
  const raw = sessionStorage.getItem(HASH_SESSION_KEY)
  if (raw === null) return false
  cachedHash = raw === HASH_SESSION_NONE ? null : raw
  return true
}

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms)
      }),
    ])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

async function fetchPasswordHash(client: SupabaseClient): Promise<string | null> {
  const { data, error } = await withTimeout(
    client.storage.from(PRODUCT_IMAGES_BUCKET).download(PASSWORD_PATH),
    FETCH_TIMEOUT_MS,
    'Password config load timed out',
  )
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
let loadPromise: Promise<string | null> | null = null

/** `undefined` = not loaded yet. */
export function getCachedAdminPasswordHash(): string | null | undefined {
  return cachedHash
}

export function setCachedAdminPasswordHash(hash: string | null): void {
  cachedHash = hash
  writeSessionHashCache(hash)
}

export async function loadAdminPasswordHash(client: SupabaseClient): Promise<string | null> {
  if (cachedHash !== undefined) return cachedHash
  if (!loadPromise) {
    loadPromise = (async () => {
      const hash = await fetchPasswordHash(client)
      cachedHash = hash
      writeSessionHashCache(hash)
      return hash
    })().finally(() => {
      loadPromise = null
    })
  }
  return loadPromise
}

export async function persistAdminPasswordHash(
  client: SupabaseClient,
  hash: string,
): Promise<void> {
  await writePasswordHash(client, hash)
  cachedHash = hash
  writeSessionHashCache(hash)
}
