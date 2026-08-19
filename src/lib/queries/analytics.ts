import { supabaseServer } from "@/lib/supabase/server";
import type { OrderWithItems } from "@/lib/types/database";

export interface DashboardData {
  todayOrders: number;
  todayRevenue: number;
  pending: number;
  completed: number;
  popular: { item_name: string; qty_sold: number; revenue: number }[];
  recent: OrderWithItems[];
  daily: { day: string; orders: number; revenue: number }[];
  monthly: { month: string; orders: number; revenue: number }[];
  trends: { hour_of_day: number; orders: number }[];
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** Everything the admin dashboard and analytics screens need, in one round trip. */
export async function getDashboard(): Promise<DashboardData> {
  const supabase = await supabaseServer();
  const since = startOfToday();

  const [todayResult, popular, recent, daily, monthly, trends] = await Promise.all([
    supabase
      .from("orders")
      .select("total_amount, status")
      .eq("payment_status", "paid")
      .gte("created_at", since),
    supabase.from("popular_items").select("*").limit(6),
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("daily_revenue").select("*").limit(14),
    supabase.from("monthly_revenue").select("*").limit(6),
    supabase.from("order_trends").select("*"),
  ]);

  const today = todayResult.data ?? [];

  return {
    todayOrders: today.length,
    todayRevenue: today.reduce((sum, o) => sum + Number(o.total_amount), 0),
    // "Pending" here means still in the kitchen, which is what staffing decisions hinge on.
    pending: today.filter((o) => o.status !== "picked_up").length,
    completed: today.filter((o) => o.status === "picked_up").length,
    popular: popular.data ?? [],
    recent: (recent.data ?? []) as OrderWithItems[],
    daily: (daily.data ?? []).map((d) => ({ ...d, revenue: Number(d.revenue) })),
    monthly: (monthly.data ?? []).map((m) => ({ ...m, revenue: Number(m.revenue) })),
    trends: trends.data ?? [],
  };
}
