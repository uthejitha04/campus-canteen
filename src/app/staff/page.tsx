import { requireRole } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { StaffQueue } from "@/components/staff/staff-queue";

export default async function StaffOrdersPage() {
  await requireRole("staff", "admin");

  const supabase = await supabaseServer();

  // Which counters this account covers. Used to grey out items another
  // counter is responsible for, so nothing is handed over twice.
  const { data: assignments } = await supabase.from("staff_counters").select("counter_id");
  const counterIds = (assignments ?? []).map((a) => a.counter_id);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data: completed } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("status", "picked_up")
    .gte("created_at", startOfDay.toISOString())
    .order("completed_at", { ascending: false })
    .limit(30);

  return <StaffQueue counterIds={counterIds} completedToday={completed ?? []} />;
}
