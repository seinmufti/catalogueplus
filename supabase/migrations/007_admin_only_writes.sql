-- Only the signed-in admin (Supabase Auth user) can change data. Everyone can still read products.
-- Disable "Allow new users to sign up" in Supabase Auth settings so nobody else can become "authenticated".
-- Run this AFTER you have confirmed the admin login works.

-- products
drop policy if exists "products_insert_anon" on public.products;
drop policy if exists "products_update_anon" on public.products;
drop policy if exists "products_delete_anon" on public.products;
drop policy if exists "products_select_anon" on public.products;
drop policy if exists "products_select" on public.products;
drop policy if exists "products_write_admin" on public.products;

create policy "products_select"
  on public.products for select
  to anon, authenticated
  using (true);

create policy "products_write_admin"
  on public.products for all
  to authenticated
  using (true)
  with check (true);

-- storage: files in the public bucket are served by URL without any policy, so only admins need access
drop policy if exists "product_images_select" on storage.objects;
drop policy if exists "product_images_insert" on storage.objects;
drop policy if exists "product_images_update" on storage.objects;
drop policy if exists "product_images_delete" on storage.objects;
drop policy if exists "product_images_admin" on storage.objects;

create policy "product_images_admin"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

notify pgrst, 'reload schema';
