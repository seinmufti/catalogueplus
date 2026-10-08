-- Human-readable product keys (0001, 0002, …) shown in admin as ID.

alter table public.products
  add column if not exists product_key text;

with numbered as (
  select
    id,
    lpad((row_number() over (order by created_at asc, id asc))::text, 4, '0') as next_key
  from public.products
  where product_key is null
)
update public.products p
set product_key = n.next_key
from numbered n
where p.id = n.id;

alter table public.products
  alter column product_key set not null;

create unique index if not exists products_product_key_unique on public.products (product_key);

notify pgrst, 'reload schema';
