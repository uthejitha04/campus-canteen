# Campus Canteen

Order ahead, pay by UPI, collect by order number. Built for a single college of
roughly 500–700 students.

Three portals, one codebase:

| Portal      | Route    | Who      |
| ----------- | -------- | -------- |
| Student     | `/`      | students |
| Kitchen     | `/staff` | counter staff |
| Admin       | `/admin` | canteen administrator |

Stack: Next.js (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres,
Auth, Realtime, Storage) · Razorpay.

---

## Setup

### 1. Supabase

Create a project, then run the migrations **in order** in the SQL editor:

```
supabase/migrations/0001_schema.sql
supabase/migrations/0002_rls.sql
supabase/migrations/0003_analytics_realtime.sql
supabase/migrations/0004_storage.sql
supabase/seed.sql            -- optional sample menu
```

Then enable **Email** auth in Authentication → Providers.

### 2. Environment

```bash
cp .env.example .env.local
```

Fill in the Supabase URL, anon key and service-role key. For local development
without a payment account, set `PAYMENT_PROVIDER=mock` — the whole flow
(intent → signature → server-side verification) still runs, just against a local
stub. Switch to `razorpay` and add the real keys for production.

### 3. Run

```bash
npm install && npm run dev
```

### 4. Create the first admin

Sign up through the app, then promote that account once in the SQL editor:

```sql
update profiles set role = 'admin', student_id = null where email = 'you@college.edu';
```

From then on, staff accounts are created from **Admin → Staff** (no SQL needed).

---

## How the important parts work

**Prices are never trusted from the client.** Checkout calls the `create_order`
database function, which re-reads every item's price and availability from
`menu_items`, locks the rows, computes the total and snapshots the name and
price onto `order_items`. Later menu edits cannot rewrite an old receipt.

**An order becomes paid in exactly one place** — `POST /api/payments/verify` —
and only if the gateway's HMAC signature verifies server-side. The browser's
"success" callback is treated as a hint that verification should run, nothing
more. Until an order is `paid` it never appears on a kitchen screen.

**Status can only move forwards.** `received → preparing → ready → picked_up` is
enforced by a database trigger, not by the UI, and the update is conditional on
the expected current status, so two staff phones tapping the same button advance
the order once.

**Duplicate orders are prevented by an idempotency key** generated per checkout
attempt and unique per student. A double tap replays the key and gets the
original order back.

**Authorization lives in the database.** Row Level Security decides what every
role can read and write; `requireRole()` on the server only avoids rendering the
wrong shell. Staff see orders containing an item from their own counter, and may
change availability but not price.

**Counters are automatic.** A category belongs to a counter; a menu item
inherits its counter from its category via trigger. Students never pick a
counter. An order spanning counters shows each counter only its own lines, with
the rest listed as context.

**Notifications** are database rows written by the same trigger that sets
`ready`, streamed to the student over Realtime. Adding Web Push later is a
transport change on top of the existing `notifications` table, not a rewrite.

---

## Project layout

```
src/
  app/
    (student)/         home, menu, cart, orders, profile
    staff/             kitchen queue, availability
    admin/             dashboard, orders, menu, staff, analytics
    api/               orders, payment verification, staff admin
  components/          ui/, student/, staff/, admin/
  lib/
    supabase/          browser, server and service-role clients
    payments/          provider interface + razorpay/mock adapters
    queries/           server-side data access
    store/             cart
  hooks/               realtime subscriptions
supabase/migrations/   schema, RLS, analytics, storage
```

## Verification status

`npm run typecheck` and `npm run build` both pass. The login screen was checked
in a browser at 360 px and 375 px with no horizontal overflow. **The
authenticated flows have not been exercised against a live database** — that
needs a real Supabase project, which this machine has no credentials for. Run
the checklist in `TESTING.md` once your project is connected.
