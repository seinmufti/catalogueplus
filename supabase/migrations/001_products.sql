-- Catalogue+ MVP schema (run in Supabase SQL Editor)
-- WARNING: open RLS — anyone with the anon key can read/write. Add auth before production.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  product_key text not null unique,
  name text not null unique,
  category text not null,
  quantity_in_carton integer not null check (quantity_in_carton >= 0),
  image_path text,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "products_select_anon"
  on public.products for select
  to anon, authenticated
  using (true);

create policy "products_insert_anon"
  on public.products for insert
  to anon, authenticated
  with check (true);

create policy "products_update_anon"
  on public.products for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "products_delete_anon"
  on public.products for delete
  to anon, authenticated
  using (true);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

create policy "product_images_select"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

create policy "product_images_insert"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'product-images');

create policy "product_images_update"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'product-images');

create policy "product_images_delete"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'product-images');
