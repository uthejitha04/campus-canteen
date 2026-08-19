-- ============================================================
-- Campus Canteen — complete database setup
-- Paste this whole file into the Supabase SQL editor and Run.
-- Safe to run once, on a fresh project.
-- ============================================================


-- ─────────────────────────────────────────────
-- 0001_schema.sql
-- ─────────────────────────────────────────────

-- ============================================================
-- Campus Canteen — core schema
-- ============================================================
create extension if not exists "pgcrypto";

-- ---------- enums ----------
create type user_role      as enum ('student', 'staff', 'admin');
create type order_status   as enum ('received', 'preparing', 'ready', 'picked_up');
create type payment_status as enum ('pending', 'paid', 'failed');

-- ---------- profiles ----------
-- One row per auth.users row. Role lives here and is the basis for all RLS.
create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        user_role   not null default 'student',
  full_name   text        not null default '',
  email       text        unique,
  phone       text        unique,
  student_id  text        unique,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint students_need_student_id
    check (role <> 'student' or student_id is not null)
);
create index profiles_role_idx on profiles (role) where is_active;

-- ---------- counters ----------
create table counters (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null unique,
  description text        not null default '',
  is_active   boolean     not null default true,
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now()
);

-- Which staff member works which counter (a staff member may cover several).
create table staff_counters (
  staff_id   uuid not null references profiles (id) on delete cascade,
  counter_id uuid not null references counters (id) on delete cascade,
  primary key (staff_id, counter_id)
);
create index staff_counters_counter_idx on staff_counters (counter_id);

-- ---------- categories ----------
-- A category belongs to exactly one counter; this is what lets us route
-- menu items to counters automatically, without asking the student.
create table categories (
  id         uuid primary key default gen_random_uuid(),
  counter_id uuid        not null references counters (id) on delete restrict,
  name       text        not null unique,
  sort_order int         not null default 0,
  is_active  boolean     not null default true,
  created_at timestamptz not null default now()
);
create index categories_counter_idx on categories (counter_id);

-- ---------- menu items ----------
create table menu_items (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid          not null references categories (id) on delete restrict,
  -- Denormalised from the category so an order item can be routed with one join.
  -- Kept in sync by trg_menu_items_counter below.
  counter_id   uuid          not null references counters (id) on delete restrict,
  name         text          not null,
  description  text          not null default '',
  price        numeric(10,2) not null check (price >= 0),
  image_url    text,
  is_available boolean       not null default true,
  -- Room for real quantity tracking later without a migration of the order flow.
  stock_qty    int           check (stock_qty is null or stock_qty >= 0),
  sort_order   int           not null default 0,
  is_archived  boolean       not null default false,
  created_at   timestamptz   not null default now(),
  updated_at   timestamptz   not null default now()
);
create index menu_items_category_idx  on menu_items (category_id) where not is_archived;
create index menu_items_counter_idx   on menu_items (counter_id)  where not is_archived;
create index menu_items_available_idx on menu_items (is_available) where not is_archived;

create or replace function set_menu_item_counter() returns trigger
language plpgsql as $$
begin
  select c.counter_id into new.counter_id from categories c where c.id = new.category_id;
  if new.counter_id is null then
    raise exception 'category % has no counter', new.category_id;
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger trg_menu_items_counter
  before insert or update of category_id on menu_items
  for each row execute function set_menu_item_counter();

-- Moving a category to another counter re-routes its items.
create or replace function sync_category_counter() returns trigger
language plpgsql as $$
begin
  if new.counter_id is distinct from old.counter_id then
    update menu_items set counter_id = new.counter_id where category_id = new.id;
  end if;
  return new;
end $$;

create trigger trg_categories_counter
  after update of counter_id on categories
  for each row execute function sync_category_counter();

-- ---------- orders ----------
-- Human-readable pickup number. Starts at 1001 so the first order is #1001.
create sequence order_number_seq start 1001;

create table orders (
  id              uuid           primary key default gen_random_uuid(),
  order_number    int            not null unique default nextval('order_number_seq'),
  student_id      uuid           not null references profiles (id) on delete restrict,
  status          order_status   not null default 'received',
  payment_status  payment_status not null default 'pending',
  total_amount    numeric(10,2)  not null check (total_amount >= 0),
  -- Guards against a double-tap on "Proceed to Payment" creating two orders.
  idempotency_key text           not null,
  note            text,
  placed_at       timestamptz,
  ready_at        timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz    not null default now(),
  updated_at      timestamptz    not null default now(),
  constraint orders_idempotency_unique unique (student_id, idempotency_key)
);
create index orders_student_idx on orders (student_id, created_at desc);
create index orders_status_idx  on orders (status) where payment_status = 'paid';
create index orders_created_idx on orders (created_at desc);

create table order_items (
  id           uuid          primary key default gen_random_uuid(),
  order_id     uuid          not null references orders (id) on delete cascade,
  menu_item_id uuid          references menu_items (id) on delete set null,
  counter_id   uuid          not null references counters (id) on delete restrict,
  -- Price and name are snapshotted: later menu edits must not rewrite history.
  item_name    text          not null,
  unit_price   numeric(10,2) not null check (unit_price >= 0),
  quantity     int           not null check (quantity > 0 and quantity <= 20),
  line_total   numeric(10,2) not null check (line_total >= 0)
);
create index order_items_order_idx   on order_items (order_id);
create index order_items_counter_idx on order_items (counter_id);

-- ---------- payments ----------
-- Only gateway identifiers and status. No card / VPA / instrument data.
create table payments (
  id                  uuid           primary key default gen_random_uuid(),
  order_id            uuid           not null references orders (id) on delete cascade,
  provider            text           not null default 'razorpay',
  provider_order_id   text,
  provider_payment_id text unique,
  amount              numeric(10,2)  not null check (amount >= 0),
  status              payment_status not null default 'pending',
  failure_reason      text,
  created_at          timestamptz    not null default now(),
  updated_at          timestamptz    not null default now(),
  -- One payment attempt record per order for the MVP; retries update it.
  constraint payments_order_unique unique (order_id)
);

-- ---------- audit trail ----------
create table order_status_history (
  id          uuid         primary key default gen_random_uuid(),
  order_id    uuid         not null references orders (id) on delete cascade,
  from_status order_status,
  to_status   order_status not null,
  changed_by  uuid         references profiles (id) on delete set null,
  created_at  timestamptz  not null default now()
);
create index order_status_history_order_idx on order_status_history (order_id, created_at);

-- ---------- notifications ----------
create table notifications (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references profiles (id) on delete cascade,
  order_id   uuid        references orders (id) on delete cascade,
  title      text        not null,
  body       text        not null,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, created_at desc);

-- ============================================================
-- Status transition guard
-- received -> preparing -> ready -> picked_up, forwards only.
-- ============================================================
create or replace function enforce_order_status_transition() returns trigger
language plpgsql as $$
declare
  ok boolean;
begin
  if new.status = old.status then
    new.updated_at := now();
    return new;
  end if;

  ok := (old.status, new.status) in (
    ('received',  'preparing'),
    ('preparing', 'ready'),
    ('ready',     'picked_up')
  );

  if not ok then
    raise exception 'invalid status transition % -> %', old.status, new.status
      using errcode = 'check_violation';
  end if;

  -- An order that is not paid for never enters the kitchen queue.
  if new.payment_status <> 'paid' then
    raise exception 'order % is not paid', old.order_number
      using errcode = 'check_violation';
  end if;

  if new.status = 'ready'     then new.ready_at     := now(); end if;
  if new.status = 'picked_up' then new.completed_at := now(); end if;
  new.updated_at := now();

  insert into order_status_history (order_id, from_status, to_status, changed_by)
  values (new.id, old.status, new.status, auth.uid());

  -- The one notification we send. Ready is the only status worth interrupting for.
  if new.status = 'ready' then
    insert into notifications (user_id, order_id, title, body)
    values (
      new.student_id, new.id,
      'Order #' || new.order_number || ' is ready',
      'Your order is ready for pickup at the canteen.'
    );
  end if;

  return new;
end $$;

create trigger trg_order_status_transition
  before update of status on orders
  for each row execute function enforce_order_status_transition();

-- Completed orders are immutable apart from the status trigger above.
create or replace function freeze_completed_orders() returns trigger
language plpgsql as $$
begin
  if old.status = 'picked_up' and new.status = 'picked_up' then
    if (new.total_amount, new.payment_status, new.student_id)
       is distinct from (old.total_amount, old.payment_status, old.student_id) then
      raise exception 'completed order % cannot be modified', old.order_number
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;

create trigger trg_orders_freeze
  before update on orders
  for each row execute function freeze_completed_orders();

-- ============================================================
-- New auth user -> profile
-- ============================================================
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, phone, full_name, student_id, role)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'student_id', ''),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────────────────────────────
-- 0002_rls.sql
-- ─────────────────────────────────────────────

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

-- ─────────────────────────────────────────────
-- 0003_analytics_realtime.sql
-- ─────────────────────────────────────────────

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

-- ─────────────────────────────────────────────
-- 0004_storage.sql
-- ─────────────────────────────────────────────

-- Public bucket for menu photos. Images are public (they are the menu);
-- only admins may write.
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

create policy "menu images are public"
  on storage.objects for select
  using (bucket_id = 'menu-images');

create policy "admins upload menu images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'menu-images' and is_admin());

create policy "admins replace menu images"
  on storage.objects for update to authenticated
  using (bucket_id = 'menu-images' and is_admin());

create policy "admins delete menu images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'menu-images' and is_admin());

-- ─────────────────────────────────────────────
-- 0005_google_signin.sql
-- ─────────────────────────────────────────────

-- ============================================================
-- Google sign-in support.
--
-- A Google account arrives with an email and nothing else, so a student's
-- roll number can no longer be required at the moment the profile is created.
-- It is collected once, on first sign-in, at /welcome — and it stays unique,
-- so it remains a valid way to log in and a reliable way for staff to
-- identify a student.
-- ============================================================

alter table profiles drop constraint if exists students_need_student_id;

-- Google gives us a display name and avatar; keep whichever we're handed.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, phone, full_name, student_id, role)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      ''
    ),
    nullif(new.raw_user_meta_data ->> 'student_id', ''),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end $$;

-- A student may set their own student ID exactly once. After that it is
-- fixed, so it cannot be swapped to impersonate someone else at the counter.
create or replace function guard_student_id() returns trigger
language plpgsql as $$
begin
  if old.student_id is not null
     and new.student_id is distinct from old.student_id
     and not is_admin() then
    raise exception 'your student ID cannot be changed — ask the canteen admin'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;

create trigger trg_profiles_student_id
  before update on profiles
  for each row execute function guard_student_id();

-- ─────────────────────────────────────────────
-- seed.sql
-- ─────────────────────────────────────────────

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
