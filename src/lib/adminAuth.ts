const SESSION_KEY_PREFIX = 'catalogue-plus-admin-auth:'

function sessionKey(storeSlug: string): string {
  return `${SESSION_KEY_PREFIX}${storeSlug}`
}

/** Client-side gate only — not a substitute for server auth. */
export function getAdminPassword(): string {
  return import.meta.env.VITE_ADMIN_PASSWORD?.trim() || '1997'
}

export function isAdminAuthenticated(storeSlug: string): boolean {
  if (typeof sessionStorage === 'undefined') return false
  return sessionStorage.getItem(sessionKey(storeSlug)) === '1'
}

export function setAdminAuthenticated(storeSlug: string): void {
  sessionStorage.setItem(sessionKey(storeSlug), '1')
}

export function verifyAdminPassword(password: string): boolean {
  return password === getAdminPassword()
}
