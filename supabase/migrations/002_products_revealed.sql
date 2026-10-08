-- Hide state is stored in Storage (config/hidden-product-ids.json), not in products.
-- Run this only if an older schema added `revealed` and you want to remove it.

alter table public.products drop column if exists revealed;

notify pgrst, 'reload schema';
