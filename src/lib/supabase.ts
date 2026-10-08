import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(url && anonKey)

function missingConfigMessage(): string {
  if (url && !anonKey) {
    return 'Missing VITE_SUPABASE_ANON_KEY (publishable key from Project Settings → API).'
  }
  if (anonKey && !url) {
    return 'Missing VITE_SUPABASE_URL (Project Settings → API → Project URL, e.g. https://xxxx.supabase.co). Or run: npm run supabase:wire with SUPABASE_ACCESS_TOKEN set.'
  }
  return 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. See README or run npm run supabase:wire.'
}

export const supabaseConfigError = supabaseConfigured ? null : missingConfigMessage()

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url!, anonKey!)
  : null

export const PRODUCT_IMAGES_BUCKET = 'product-images'
