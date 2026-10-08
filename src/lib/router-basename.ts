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
