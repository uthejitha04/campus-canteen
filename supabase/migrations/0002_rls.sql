-- ============================================================
-- Authorization. Every rule below is enforced by Postgres, so a
-- forged client request cannot reach data the role may not see.
-- ============================================================

-- SECURITY DEFINER so policies on `profiles` can call it without recursing
-- into their own RLS check.
create or replace function auth_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid() and is_active
$$;

create or replace function is_admin() returns boolean
language sql stable as $$ select auth_role() = 'admin' $$;

create or replace function is_staff() returns boolean
language sql stable as $$ select auth_role() in ('staff', 'admin') $$;

-- Counters the calling staff member is assigned to. An admin sees all.
create or replace function my_counter_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select c.id from counters c where is_admin()
  union
  select sc.counter_id from staff_counters sc where sc.staff_id = auth.uid()
$$;

alter table profiles             enable row level security;
alter table counters             enable row level security;
alter table staff_counters       enable row level security;
alter table categories           enable row level security;
alter table menu_items           enable row level security;
alter table orders               enable row level security;
alter table order_items          enable row level security;
alter table payments             enable row level security;
alter table order_status_history enable row level security;
alter table notifications        enable row level security;

-- ---------- profiles ----------
create policy profiles_self_read on profiles
  for select using (id = auth.uid() or is_staff());

create policy profiles_self_update on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- Only an admin may create or change staff/admin accounts or flip roles.
create policy profiles_admin_all on profiles
  for all using (is_admin()) with check (is_admin());

-- A student must not be able to promote themselves.
create or replace function guard_role_escalation() returns trigger
language plpgsql as $$
begin
  if new.role is distinct from old.role and not is_admin() then
    raise exception 'only an admin can change roles' using errcode = 'insufficient_privilege';
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger trg_profiles_role_guard
  before update on profiles
  for each row execute function guard_role_escalation();

-- ---------- catalogue (read: everyone signed in; write: admin) ----------
create policy counters_read on counters for select using (auth.uid() is not null);
create policy counters_admin on counters for all using (is_admin()) with check (is_admin());

create policy staff_counters_read  on staff_counters for select using (staff_id = auth.uid() or is_admin());
create policy staff_counters_admin on staff_counters for all using (is_admin()) with check (is_admin());

create policy categories_read  on categories for select using (auth.uid() is not null);
create policy categories_admin on categories for all using (is_admin()) with check (is_admin());

create policy menu_items_read  on menu_items for select using (auth.uid() is not null);
create policy menu_items_admin on menu_items for all using (is_admin()) with check (is_admin());

-- Staff may toggle availability, and only for their own counter.
-- (Column-level restriction is enforced by trg_menu_staff_columns below.)
create policy menu_items_staff_availability on menu_items
  for update using (is_staff() and counter_id in (select my_counter_ids()))
  with check (is_staff() and counter_id in (select my_counter_ids()));

create or replace function guard_staff_menu_edit() returns trigger
language plpgsql as $$
begin
  if is_admin() then
    new.updated_at := now();
    return new;
  end if;
  if (new.name, new.price, new.description, new.image_url, new.category_id, new.counter_id)
     is distinct from (old.name, old.price, old.description, old.image_url, old.category_id, old.counter_id) then
    raise exception 'staff may only change availability' using errcode = 'insufficient_privilege';
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger trg_menu_staff_columns
  before update on menu_items
  for each row execute function guard_staff_menu_edit();

-- ---------- orders ----------
create policy orders_student_read on orders
  for select using (student_id = auth.uid());

-- Staff see paid orders that contain at least one item from their counter.
create policy orders_staff_read on orders
  for select using (
    is_staff() and payment_status = 'paid' and exists (
      select 1 from order_items oi
      where oi.order_id = orders.id and oi.counter_id in (select my_counter_ids())
    )
  );

create policy orders_admin_read on orders for select using (is_admin());

-- Students never write orders directly — only through create_order(), which
-- prices the cart server-side. And they can never update one once placed.
create policy orders_staff_update on orders
  for update using (
    is_staff() and exists (
      select 1 from order_items oi
      where oi.order_id = orders.id and oi.counter_id in (select my_counter_ids())
    )
  ) with check (is_staff());

create policy order_items_read on order_items
  for select using (
    exists (select 1 from orders o where o.id = order_items.order_id and o.student_id = auth.uid())
    or (is_staff() and counter_id in (select my_counter_ids()))
    or is_admin()
  );

create policy payments_read on payments
  for select using (
    exists (select 1 from orders o where o.id = payments.order_id and o.student_id = auth.uid())
    or is_admin()
  );

create policy history_read on order_status_history
  for select using (
    exists (select 1 from orders o where o.id = order_status_history.order_id and o.student_id = auth.uid())
    or is_staff()
  );

-- ---------- notifications ----------
create policy notifications_own on notifications
  for select using (user_id = auth.uid());

create policy notifications_mark_read on notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- create_order — the only way a student may create an order.
-- Prices, availability and the total are all resolved from the
-- database; the client's numbers are never read.
-- ============================================================
create or replace function create_order(p_items jsonb, p_idempotency_key text)
returns table (order_id uuid, order_number int, total numeric)
language plpgsql security definer set search_path = public as $$
declare
  v_student uuid := auth.uid();
  v_order   orders%rowtype;
  v_total   numeric(10,2) := 0;
  v_item    jsonb;
  v_menu    menu_items%rowtype;
  v_qty     int;
begin
  if v_student is null then
    raise exception 'not authenticated' using errcode = 'insufficient_privilege';
  end if;
  if auth_role() <> 'student' then
    raise exception 'only students can place orders' using errcode = 'insufficient_privilege';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'cart is empty' using errcode = 'check_violation';
  end if;

  -- Replaying the same key returns the original order instead of a duplicate.
  select * into v_order from orders
   where student_id = v_student and idempotency_key = p_idempotency_key;
  if found then
    return query select v_order.id, v_order.order_number, v_order.total_amount;
    return;
  end if;

  insert into orders (student_id, total_amount, idempotency_key, placed_at)
  values (v_student, 0, p_idempotency_key, now())
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 20 then
      raise exception 'invalid quantity' using errcode = 'check_violation';
    end if;

    -- FOR UPDATE: two students checking out the last portion at the same
    -- moment serialise here rather than both succeeding.
    select * into v_menu from menu_items
     where id = (v_item ->> 'menu_item_id')::uuid and not is_archived
     for update;

    if not found then
      raise exception 'item no longer on the menu' using errcode = 'check_violation';
    end if;
    if not v_menu.is_available then
      raise exception '% is out of stock', v_menu.name using errcode = 'check_violation';
    end if;

    insert into order_items (order_id, menu_item_id, counter_id, item_name, unit_price, quantity, line_total)
    values (v_order.id, v_menu.id, v_menu.counter_id, v_menu.name, v_menu.price, v_qty, v_menu.price * v_qty);

    v_total := v_total + (v_menu.price * v_qty);
  end loop;

  update orders set total_amount = v_total, updated_at = now()
   where id = v_order.id
   returning * into v_order;

  return query select v_order.id, v_order.order_number, v_order.total_amount;
end $$;

revoke all on function create_order(jsonb, text) from public;
grant execute on function create_order(jsonb, text) to authenticated;

-- ============================================================
-- Login by student ID or phone.
-- Students think in terms of their roll number, so we let them sign in with
-- it. This resolves an identifier to the account email and nothing else — it
-- exposes no profile data and only ever matches an active account.
-- ============================================================
create or replace function resolve_login_identifier(p_identifier text)
returns text
language sql stable security definer set search_path = public as $$
  select email from profiles
   where is_active
     and (lower(email) = lower(p_identifier)
       or lower(student_id) = lower(p_identifier)
       or phone = p_identifier)
   limit 1
$$;

revoke all on function resolve_login_identifier(text) from public;
grant execute on function resolve_login_identifier(text) to anon, authenticated;
