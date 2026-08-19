import { supabaseServer } from "@/lib/supabase/server";
import type { Category, MenuItem } from "@/lib/types/database";

export interface MenuSection {
  category: Category;
  items: MenuItem[];
}

/**
 * Today's menu, grouped by category. Counter routing is already baked into
 * each item, so the student never has to think about which counter to use.
 */
export async function getMenu(): Promise<MenuSection[]> {
  const supabase = await supabaseServer();

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
    supabase
      .from("menu_items")
      .select("*")
      .eq("is_archived", false)
      .order("sort_order"),
  ]);

  return (categories ?? []).map((category) => ({
    category: category as Category,
    items: ((items ?? []) as MenuItem[]).filter((i) => i.category_id === category.id),
  }));
}

/** Best sellers, used for the "Popular today" rail on the home screen. */
export async function getPopularItems(limit = 6): Promise<MenuItem[]> {
  const supabase = await supabaseServer();

  const { data: popular } = await supabase
    .from("popular_items")
    .select("item_name, qty_sold")
    .limit(limit);

  const { data: items } = await supabase
    .from("menu_items")
    .select("*")
    .eq("is_archived", false)
    .eq("is_available", true);

  const menu = (items ?? []) as MenuItem[];
  if (!popular?.length) return menu.slice(0, limit);

  const ranked = popular
    .map((p) => menu.find((m) => m.name === p.item_name))
    .filter((m): m is MenuItem => Boolean(m));

  // Pad with anything else on the menu so a brand-new install isn't empty.
  return [...ranked, ...menu.filter((m) => !ranked.includes(m))].slice(0, limit);
}
