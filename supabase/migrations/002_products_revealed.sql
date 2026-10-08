-- Add customer visibility toggle (run in Supabase SQL Editor if 001 already applied)

alter table public.products
  add column if not exists revealed boolean not null default true;
