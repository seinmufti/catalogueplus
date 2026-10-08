/** Display ID format: 0001, 0002, … */
export function formatProductKey(n: number): string {
  return String(n).padStart(4, '0')
}

export function parseProductKey(key: string): number | null {
  if (!/^\d{4}$/.test(key)) return null
  return Number.parseInt(key, 10)
}

export function isProductKeyColumnMissingError(err: unknown): boolean {
  const message =
    err instanceof Error
      ? err.message
      : typeof (err as { message?: string })?.message === 'string'
        ? (err as { message: string }).message
        : ''
  return (
    /product_key.*does not exist|column.*product_key|Could not find the 'product_key' column/i.test(
      message,
    )
  )
}
