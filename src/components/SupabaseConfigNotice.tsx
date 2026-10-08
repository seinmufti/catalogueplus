import { supabaseConfigError } from '@/lib/supabase'

export function SupabaseConfigNotice() {
  return (
    <div className="mx-auto max-w-lg rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm">
      <p className="font-semibold text-destructive">Supabase not configured</p>
      <p className="mt-2 text-muted-foreground">{supabaseConfigError}</p>
    </div>
  )
}
