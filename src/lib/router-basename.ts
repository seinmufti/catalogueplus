/** When Catalogue+ is proxied under nordlyssolutions.com/catalogueplus. */
export const NORDLYS_CATALOGUEPLUS_BASENAME = '/catalogueplus'

export function getRouterBasename(): string {
  if (typeof window === 'undefined') return ''

  const { hostname, pathname } = window.location
  if (hostname === 'nordlyssolutions.com' || hostname === 'www.nordlyssolutions.com') {
    return NORDLYS_CATALOGUEPLUS_BASENAME
  }

  if (
    pathname === NORDLYS_CATALOGUEPLUS_BASENAME ||
    pathname.startsWith(`${NORDLYS_CATALOGUEPLUS_BASENAME}/`)
  ) {
    return NORDLYS_CATALOGUEPLUS_BASENAME
  }

  return ''
}

/** Root public files (e.g. /aksesuarat-ali-logo.png) when proxied under /catalogueplus. */
export function publicAssetPath(path: string): string {
  const base = getRouterBasename()
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}
