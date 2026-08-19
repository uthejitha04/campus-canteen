-- ============================================================
-- Analytics views (admin-only, enforced by the underlying tables)
-- and realtime publication.
-- ============================================================

-- Revenue counts an order once it is paid; refunds are out of MVP scope.
create or replace view daily_revenue
with (security_invoker = true) as
select
  (created_at at time zone 'Asia/Kolkata')::date as day,
  count(*)                                       as orders,
  coalesce(sum(total_amount), 0)                 as revenue
from orders
where payment_status = 'paid'
group by 1
order by 1 desc;

create or replace view monthly_revenue
with (security_invoker = true) as
select
  date_trunc('month', created_at at time zone 'Asia/Kolkata')::date as month,
  count(*)                                                          as orders,
  coalesce(sum(total_amount), 0)                                    as revenue
from orders
where payment_status = 'paid'
group by 1
order by 1 desc;

create or replace view popular_items
with (security_invoker = true) as
select
  oi.item_name,
  sum(oi.quantity)   as qty_sold,
  sum(oi.line_total) as revenue
from order_items oi
join orders o on o.id = oi.order_id
where o.payment_status = 'paid'
group by 1
order by qty_sold desc;

-- Hourly distribution — tells the canteen where the real peak is.
create or replace view order_trends
with (security_invoker = true) as
select
  extract(hour from created_at at time zone 'Asia/Kolkata')::int as hour_of_day,
  count(*)                                                       as orders
from orders
where payment_status = 'paid'
group by 1
order by 1;

-- ---------- realtime ----------
-- Students subscribe to their own order; staff to the live queue.
-- RLS still applies to realtime payloads.
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;
alter publication supabase_realtime add table menu_items;
alter publication supabase_realtime add table notifications;

-- Realtime needs the old row to evaluate RLS on updates.
alter table orders     replica identity full;
alter table menu_items replica identity full;
