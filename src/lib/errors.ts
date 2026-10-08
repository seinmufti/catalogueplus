type ErrorLike = {
  message?: string
  code?: string
  details?: string
  hint?: string
}

export function isProductsTableMissingError(err: unknown): boolean {
  const e = err as ErrorLike
  if (e?.code === 'PGRST205') return true
  const message =
    err instanceof Error
      ? err.message
      : typeof e?.message === 'string'
        ? e.message
        : ''
  return message.includes("Could not find the table 'public.products'")
}

export function formatLoadError(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    return enrichMessage(err.message)
  }
  if (err && typeof err === 'object' && 'message' in err) {
    const e = err as ErrorLike
    if (typeof e.message === 'string') return enrichMessage(e.message)
  }
  return fallback
}

function enrichMessage(message: string): string {
  if (message.includes('A product with this name already exists')) {
    return message
  }
  if (message.includes("Could not find the table 'public.products'")) {
    return `${message} — run supabase/migrations/001_products.sql in the Supabase SQL Editor, then refresh.`
  }
  return message
}
