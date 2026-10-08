import { isProductKeyColumnMissingError } from '@/lib/productKey'
import type { SupabaseClient } from '@supabase/supabase-js'

let productKeyColumnCache: boolean | null = null

export async function hasProductKeyColumn(client: SupabaseClient): Promise<boolean> {
  if (productKeyColumnCache !== null) return productKeyColumnCache
  const { error } = await client.from('products').select('product_key').limit(1)
  if (!error) {
    productKeyColumnCache = true
    return true
  }
  if (isProductKeyColumnMissingError(error)) {
    productKeyColumnCache = false
    return false
  }
  throw error
}
