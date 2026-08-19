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
