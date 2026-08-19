import { supabaseServer } from "@/lib/supabase/server";
import {
  ORDER_FILTERS,
  OrdersTable,
  type OrderFilterKey,
} from "@/components/admin/orders-table";
import type { OrderWithItems } from "@/lib/types/database";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const active: OrderFilterKey = ORDER_FILTERS.find((f) => f.key === filter)?.key ?? "today";

  const supabase = await supabaseServer();
  let query = supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })
    .limit(200);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  if (active === "today") query = query.gte("created_at", startOfDay.toISOString());
  if (active === "pending") query = query.eq("payment_status", "paid").neq("status", "picked_up");
  if (active === "completed") query = query.eq("status", "picked_up");

  const { data } = await query;

  return <OrdersTable orders={(data ?? []) as OrderWithItems[]} active={active} />;
}
