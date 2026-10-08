/** Customer-style label: category + product name (completion). */
export function productDisplayTitle(category: string, completion: string): string {
  const parts = [category.trim(), completion.trim()].filter(Boolean)
  return parts.join(' ')
}
