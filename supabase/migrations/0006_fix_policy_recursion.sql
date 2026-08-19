-- ============================================================
-- Fix: "infinite recursion detected in policy for relation orders"
--
-- The orders policy asked order_items which counters an order touches, while
-- the order_items policy asked orders who owns it. Each subquery re-entered
-- the other's RLS check, so Postgres never reached an answer.
--
-- The fix is to answer both questions through SECURITY DEFINER functions.
-- They read the tables directly, without re-triggering RLS, so the policies
-- stop depending on each other. The rules enforced are unchanged.
-- ============================================================

create or replace function order_student(p_order uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select student_id from orders where id = p_order
$$;

create or replace function order_counter_ids(p_order uuid) returns setof uuid
language sql stable security definer set search_path = public as $$
  select distinct counter_id from order_items where order_id = p_order
$$;

revoke all on function order_student(uuid) from public;
revoke all on function order_counter_ids(uuid) from public;
grant execute on function order_student(uuid) to authenticated;
grant execute on function order_counter_ids(uuid) to authenticated;

-- ---------- orders ----------
drop policy if exists orders_staff_read on orders;
create policy orders_staff_read on orders
  for select using (
    is_staff()
    and payment_status = 'paid'
    and exists (
      select 1 from order_counter_ids(orders.id) cid
      where cid in (select my_counter_ids())
    )
  );

drop policy if exists orders_staff_update on orders;
create policy orders_staff_update on orders
  for update using (
    is_staff()
    and exists (
      select 1 from order_counter_ids(orders.id) cid
      where cid in (select my_counter_ids())
    )
  ) with check (is_staff());

-- ---------- order_items ----------
drop policy if exists order_items_read on order_items;
create policy order_items_read on order_items
  for select using (
    order_student(order_id) = auth.uid()
    or (is_staff() and counter_id in (select my_counter_ids()))
    or is_admin()
  );

-- ---------- payments ----------
drop policy if exists payments_read on payments;
create policy payments_read on payments
  for select using (
    order_student(order_id) = auth.uid() or is_admin()
  );

-- ---------- status history ----------
drop policy if exists history_read on order_status_history;
create policy history_read on order_status_history
  for select using (
    order_student(order_id) = auth.uid() or is_staff()
  );
