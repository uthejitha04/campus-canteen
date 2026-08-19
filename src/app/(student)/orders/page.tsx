import { supabaseServer } from "@/lib/supabase/server";
import { OrdersScreen } from "@/components/student/orders-screen";
import type { OrderWithItems } from "@/lib/types/database";

export const metadata = { title: "Orders · Campus Canteen" };

export default async function OrdersPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })
    .limit(50);

  return <OrdersScreen orders={(data ?? []) as OrderWithItems[]} />;
}
