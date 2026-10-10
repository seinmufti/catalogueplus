import {
  getCachedAdminPasswordHash,
  hashAdminPassword,
  loadAdminPasswordHash,
  persistAdminPasswordHash,
  setCachedAdminPasswordHash,
} from '@/lib/adminPasswordStorage'
import { supabase } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

const SESSION_KEY_PREFIX = 'catalogue-plus-admin-auth:'

function sessionKey(storeSlug: string): string {
  return `${SESSION_KEY_PREFIX}${storeSlug}`
}

/** Used only when no saved hash exists in storage. */
export function getBootstrapAdminPassword(): string {
  return import.meta.env.VITE_ADMIN_PASSWORD?.trim() || '1997'
}

export async function initAdminPassword(client: SupabaseClient | null): Promise<void> {
  if (!client) {
    setCachedAdminPasswordHash(null)
    return
  }
  await loadAdminPasswordHash(client)
}

/** Client-side gate only — not a substitute for server auth. */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const storedHash = getCachedAdminPasswordHash()
  if (storedHash) {
    return (await hashAdminPassword(password)) === storedHash
  }
  return password === getBootstrapAdminPassword()
}

export function isAdminAuthenticated(storeSlug: string): boolean {
  if (typeof sessionStorage === 'undefined') return false
  return sessionStorage.getItem(sessionKey(storeSlug)) === '1'
}

export function setAdminAuthenticated(storeSlug: string): void {
  sessionStorage.setItem(sessionKey(storeSlug), '1')
}

export type ChangeAdminPasswordResult =
  | { ok: true }
  | { ok: false; error: string }

export async function changeAdminPassword(
  oldPassword: string,
  newPassword: string,
): Promise<ChangeAdminPasswordResult> {
  if (!supabase) {
    return { ok: false, error: 'Supabase is not configured. Password cannot be saved.' }
  }

  const trimmedNew = newPassword.trim()
  if (!trimmedNew) {
    return { ok: false, error: 'New password cannot be empty.' }
  }
  if (trimmedNew.length < 4) {
    return { ok: false, error: 'New password must be at least 4 characters.' }
  }

  if (!(await verifyAdminPassword(oldPassword))) {
    return { ok: false, error: 'Current password is incorrect.' }
  }

  if (oldPassword === trimmedNew) {
    return { ok: false, error: 'Choose a different new password.' }
  }

  try {
    const hash = await hashAdminPassword(trimmedNew)
    await persistAdminPasswordHash(supabase, hash)
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not save the new password.'
    return { ok: false, error: message }
  }
}
