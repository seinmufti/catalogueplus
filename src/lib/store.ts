/** URL segment for this shop (e.g. `/aksesuaratali`). Keep `vercel.json` redirects in sync. */
export const STORE_SLUG = 'aksesuaratali'

export const STORE_DISPLAY_NAME = 'Aksesuarat Ali'

export type StoreWhatsAppLine = { display: string; url: string }

export const STORE_WHATSAPP_LINES: StoreWhatsAppLine[] = [
  { display: '+964 750 740 8282', url: 'https://wa.me/9647507408282' },
  { display: '+964 772 740 8282', url: 'https://wa.me/9647727408282' },
]

export const STORE_TIKTOK_URL = 'https://www.tiktok.com/@aksesuaratali01'
export const STORE_TIKTOK_HANDLE = '@aksesuaratali01'

export function cataloguePath(slug: string = STORE_SLUG): string {
  return `/${slug}`
}

export function adminPath(slug: string = STORE_SLUG): string {
  return `/${slug}/admin`
}

export function isKnownStoreSlug(slug: string | undefined): slug is string {
  return slug === STORE_SLUG
}
