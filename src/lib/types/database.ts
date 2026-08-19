/**
 * Hand-maintained mirror of supabase/migrations. Regenerate with:
 *   npx supabase gen types typescript --project-id <id> > src/lib/types/database.ts
 */

export type UserRole = "student" | "staff" | "admin";
export type OrderStatus = "received" | "preparing" | "ready" | "picked_up";
export type PaymentStatus = "pending" | "paid" | "failed";

export const ORDER_FLOW: OrderStatus[] = ["received", "preparing", "ready", "picked_up"];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  received: "Received",
  preparing: "Preparing",
  ready: "Ready",
  picked_up: "Picked Up",
};

/** The single forward transition allowed from each status. */
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  received: "preparing",
  preparing: "ready",
  ready: "picked_up",
};

export const NEXT_STATUS_ACTION: Partial<Record<OrderStatus, string>> = {
  received: "Start preparing",
  preparing: "Mark ready",
  ready: "Mark picked up",
};

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string;
  email: string | null;
  phone: string | null;
  student_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type Counter = {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
}

export type Category = {
  id: string;
  counter_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export type MenuItem = {
  id: string;
  category_id: string;
  counter_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
  stock_qty: number | null;
  sort_order: number;
  is_archived: boolean;
}

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  counter_id: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export type Order = {
  id: string;
  order_number: number;
  student_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount: number;
  note: string | null;
  placed_at: string | null;
  ready_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export type Notification = {
  id: string;
  user_id: string;
  order_id: string | null;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export type Payment = {
  id: string;
  order_id: string;
  provider: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  amount: number;
  status: PaymentStatus;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type StaffCounter = {
  staff_id: string;
  counter_id: string;
}

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

/** Writable shape of a table: everything optional except what the DB can't default. */
type Table<
  Row,
  Required extends keyof Row = never,
  Rels extends Relationship[] = [],
> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: Rels;
};

type View<Row> = { Row: Row; Relationships: [] };

/**
 * Schema shape consumed by the typed Supabase clients. It mirrors what
 * `supabase gen types` emits, so regenerating it is a drop-in replacement.
 */
export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, "id">;
      counters: Table<Counter, "name">;
      categories: Table<Category, "name" | "counter_id">;
      menu_items: Table<MenuItem, "name" | "price" | "category_id" | "counter_id">;
      orders: Table<Order>;
      order_items: Table<
        OrderItem,
        never,
        [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ]
      >;
      notifications: Table<Notification>;
      payments: Table<Payment, "order_id" | "amount">;
      staff_counters: Table<
        StaffCounter,
        "staff_id" | "counter_id",
        [
          {
            foreignKeyName: "staff_counters_counter_id_fkey";
            columns: ["counter_id"];
            isOneToOne: false;
            referencedRelation: "counters";
            referencedColumns: ["id"];
          },
        ]
      >;
    };
    Views: {
      daily_revenue: View<{ day: string; orders: number; revenue: number }>;
      monthly_revenue: View<{ month: string; orders: number; revenue: number }>;
      popular_items: View<{ item_name: string; qty_sold: number; revenue: number }>;
      order_trends: View<{ hour_of_day: number; orders: number }>;
    };
    Functions: {
      create_order: {
        Args: { p_items: { menu_item_id: string; quantity: number }[]; p_idempotency_key: string };
        Returns: { order_id: string; order_number: number; total: number }[];
      };
      resolve_login_identifier: { Args: { p_identifier: string }; Returns: string };
    };
    Enums: { user_role: UserRole; order_status: OrderStatus; payment_status: PaymentStatus };
    CompositeTypes: Record<never, never>;
  };
};
