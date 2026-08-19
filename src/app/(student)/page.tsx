import { getProfile } from "@/lib/auth";
import { getMenu, getPopularItems } from "@/lib/queries/menu";
import { supabaseServer } from "@/lib/supabase/server";
import { HomeScreen } from "@/components/student/home-screen";
import type { OrderWithItems } from "@/lib/types/database";

export default async function HomePage() {
  const profile = await getProfile();
  const [sections, popular] = await Promise.all([getMenu(), getPopularItems()]);

  const supabase = await supabaseServer();
  const { data: active } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("payment_status", "paid")
    .neq("status", "picked_up")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <HomeScreen
      firstName={profile?.full_name?.split(" ")[0]}
      sections={sections}
      popular={popular}
      activeOrder={(active as OrderWithItems | null) ?? null}
    />
  );
}
