/** Customer-style label: category + product name (completion). */
export function productDisplayTitle(category: string, completion: string): string {
  const parts = [category.trim(), completion.trim()].filter(Boolean)
  return parts.join(' ')
}

/** Admin Name column: category + completion + brand. */
export function productAdminFullName(
  category: string,
  completion: string,
  brand: string,
): string {
  const parts = [category.trim(), completion.trim(), brand.trim()].filter(Boolean)
  return parts.join(' ')
}
