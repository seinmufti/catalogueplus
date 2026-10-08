-- Product brand (creatable in admin, same pattern as category)
alter table public.products
  add column if not exists brand text not null default '';

-- Refresh PostgREST schema cache (fixes "column not in schema cache")
notify pgrst, 'reload schema';
