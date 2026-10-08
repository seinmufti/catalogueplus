export function DatabaseSetupNotice() {
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
      <p className="font-semibold text-amber-950 dark:text-amber-100">Database setup required</p>
      <p className="mt-2 text-muted-foreground">
        Run <code className="text-xs">supabase/migrations/001_products.sql</code> in the Supabase
        SQL Editor, then refresh this page.
      </p>
    </div>
  )
}
