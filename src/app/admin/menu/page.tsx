import { supabaseServer } from "@/lib/supabase/server";
import { MenuManager } from "@/components/admin/menu-manager";
import type { Category, Counter, MenuItem } from "@/lib/types/database";

export default async function AdminMenuPage() {
  const supabase = await supabaseServer();

  const [{ data: counters }, { data: categories }, { data: items }] = await Promise.all([
    supabase.from("counters").select("*").order("sort_order"),
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("menu_items").select("*").eq("is_archived", false).order("sort_order"),
  ]);

  return (
    <MenuManager
      counters={(counters ?? []) as Counter[]}
      categories={(categories ?? []) as Category[]}
      items={(items ?? []) as MenuItem[]}
    />
  );
}
