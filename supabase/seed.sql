-- Counters and starter categories.
-- The menu itself is managed from the admin portal; these rows just give the
-- three counters and a category each so items have somewhere to land.
-- Safe to re-run.

insert into counters (name, description, sort_order) values
  ('North Indian',     'North Indian meals and breads',   1),
  ('South Indian',     'South Indian meals and tiffin',   2),
  ('Coffee & Juices',  'Hot drinks, cold drinks, juices', 3)
on conflict (name) do nothing;

insert into categories (counter_id, name, sort_order)
select c.id, v.name, v.sort_order from (values
  ('North Indian',    'North Indian', 1),
  ('South Indian',    'South Indian', 2),
  ('Coffee & Juices', 'Beverages',    3)
) as v(counter, name, sort_order)
join counters c on c.name = v.counter
on conflict (name) do nothing;
