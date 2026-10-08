/** URL segment for this shop (e.g. `/aksesuaratali`). Keep `vercel.json` redirects in sync. */
export const STORE_SLUG = 'aksesuaratali'

export const STORE_DISPLAY_NAME = 'Aksesuarat Ali'

export function cataloguePath(slug: string = STORE_SLUG): string {
  return `/${slug}`
}

export function adminPath(slug: string = STORE_SLUG): string {
  return `/${slug}/admin`
}

export function isKnownStoreSlug(slug: string | undefined): slug is string {
  return slug === STORE_SLUG
}
