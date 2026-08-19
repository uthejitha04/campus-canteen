-- ============================================================
-- Counters, categories and the opening menu.
-- Everything here is editable from the admin portal afterwards —
-- prices, names, photos, availability, categories.
-- Safe to re-run.
-- ============================================================

insert into counters (name, description, sort_order) values
  ('North Indian',    'Chinese',                          1),
  ('South Indian',    'Dosa, tiffin, rice and biryani',   2),
  ('Coffee & Juices', 'Drinks, snacks and desserts',      3)
on conflict (name) do nothing;

insert into categories (counter_id, name, sort_order)
select c.id, v.name, v.sort_order from (values
  ('South Indian',    'South Indian', 1),
  ('South Indian',    'Rice & Biryani', 2),
  ('North Indian',    'Chinese',      3),
  ('Coffee & Juices', 'Snacks',       4),
  ('Coffee & Juices', 'Beverages',    5)
) as v(counter, name, sort_order)
join counters c on c.name = v.counter
on conflict (name) do nothing;

insert into menu_items (category_id, counter_id, name, price, is_available, sort_order)
select cat.id, cat.counter_id, v.name, v.price, true, v.sort_order
from (values
  -- South Indian counter
  ('South Indian',   'Dosa',                    50.00, 1),
  ('South Indian',   'Masala Dosa',             50.00, 2),
  ('South Indian',   'Karam Dosa',              60.00, 3),
  ('South Indian',   'Bonda',                   50.00, 4),
  ('South Indian',   'Sambar Rice',             70.00, 5),
  -- South Indian counter (rice plates and biryani)
  ('Rice & Biryani', 'Non-Veg Biryani',        120.00, 1),
  ('Rice & Biryani', 'Veg Pulao',               80.00, 2),
  -- North Indian counter
  ('Chinese',        'Manchurian',              80.00, 1),
  ('Chinese',        'Veg Noodles',             70.00, 2),
  ('Chinese',        'Chicken Noodles',         80.00, 3),
  ('Chinese',        'Egg Fried Rice',          80.00, 4),
  -- Coffee & Juices counter
  ('Snacks',         'Maggie',                  40.00, 1),
  ('Snacks',         'Pizza',                   60.00, 2),
  ('Snacks',         'French Fries',            60.00, 3),
  ('Snacks',         'Brownie with Ice Cream',  70.00, 4),
  ('Snacks',         'Lays',                    20.00, 5),
  ('Snacks',         'Too Yumm',                20.00, 6),
  ('Snacks',         'Hide & Seek',             20.00, 7),
  ('Snacks',         'Jim Jam',                 20.00, 8),
  ('Beverages',      'Coffee',                  20.00, 1),
  ('Beverages',      'Tea',                     20.00, 2),
  ('Beverages',      'Diet Coke',               50.00, 3),
  ('Beverages',      'Pepsi',                   20.00, 4),
  ('Beverages',      '7Up',                     20.00, 5),
  ('Beverages',      'Mirinda',                 20.00, 6)
) as v(category, name, price, sort_order)
join categories cat on cat.name = v.category
where not exists (select 1 from menu_items m where m.name = v.name);
