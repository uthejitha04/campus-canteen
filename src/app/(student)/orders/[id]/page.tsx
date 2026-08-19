import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { OrderTracker } from "@/components/student/order-tracker";
import type { OrderWithItems } from "@/lib/types/database";

export const metadata = { title: "Order · Campus Canteen" };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const { id } = await params;
  const { placed } = await searchParams;

  const supabase = await supabaseServer();
  // RLS restricts this to the student's own orders — no ownership check needed.
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return <OrderTracker initial={data as OrderWithItems} justPlaced={placed === "1"} />;
}
