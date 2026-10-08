/** Empty field → 0 (optional qty). Invalid input → null. */
export function parseOptionalCartonQuantity(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return 0
  const qty = Number.parseInt(trimmed, 10)
  if (Number.isNaN(qty) || qty < 0) return null
  return qty
}
