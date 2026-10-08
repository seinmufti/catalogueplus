-- Unique product names (exact match after trim on insert). Resolve duplicates before running.

create unique index if not exists products_name_unique on public.products (name);
