import { supabase } from '@/lib/supabase'

export const MIN_ADMIN_PASSWORD_LENGTH = 8

export type AuthResult = { ok: true } | { ok: false; error: string }

function notConfigured(): AuthResult {
  return { ok: false, error: 'Supabase is not configured.' }
}

export async function signInAdmin(email: string, password: string): Promise<AuthResult> {
  if (!supabase) return notConfigured()
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
  if (error) {
    return {
      ok: false,
      error: /invalid login/i.test(error.message) ? 'Incorrect email or password.' : error.message,
    }
  }
  return { ok: true }
}

export async function signOutAdmin(): Promise<void> {
  await supabase?.auth.signOut()
}

export async function sendPasswordResetEmail(email: string): Promise<AuthResult> {
  if (!supabase) return notConfigured()
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: window.location.href,
  })
  return error ? { ok: false, error: error.message } : { ok: true }
}

/** Sets a new password for the signed-in user (also used after following a reset email). */
export async function setAdminPassword(newPassword: string): Promise<AuthResult> {
  if (!supabase) return notConfigured()
  if (newPassword.length < MIN_ADMIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `New password must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters.`,
    }
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function changeAdminPassword(
  oldPassword: string,
  newPassword: string,
): Promise<AuthResult> {
  if (!supabase) return notConfigured()
  if (oldPassword === newPassword) {
    return { ok: false, error: 'Choose a different new password.' }
  }

  const { data } = await supabase.auth.getUser()
  const email = data.user?.email
  if (!email) return { ok: false, error: 'You are not signed in.' }

  const verified = await signInAdmin(email, oldPassword)
  if (!verified.ok) return { ok: false, error: 'Current password is incorrect.' }

  return setAdminPassword(newPassword)
}
