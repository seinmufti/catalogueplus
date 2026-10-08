export function isBrandColumnMissingError(err: unknown): boolean {
  const message =
    err instanceof Error
      ? err.message
      : typeof (err as { message?: string })?.message === 'string'
        ? (err as { message: string }).message
        : ''
  return /Could not find the 'brand' column|column.*brand|brand.*schema cache/i.test(message)
}
