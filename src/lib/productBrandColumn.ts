import { isBrandColumnMissingError } from '@/lib/productBrand'
import type { SupabaseClient } from '@supabase/supabase-js'

let brandColumnCache: boolean | null = null

export function clearBrandColumnCache(): void {
  brandColumnCache = null
}

export async function hasBrandColumn(client: SupabaseClient): Promise<boolean> {
  if (brandColumnCache !== null) return brandColumnCache
  const { error } = await client.from('products').select('brand').limit(1)
  if (!error) {
    brandColumnCache = true
    return true
  }
  if (isBrandColumnMissingError(error)) {
    brandColumnCache = false
    return false
  }
  throw error
}
