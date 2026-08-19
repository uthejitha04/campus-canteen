import { supabaseServer } from "@/lib/supabase/server";
import { StaffManager } from "@/components/admin/staff-manager";
import type { Counter, Profile } from "@/lib/types/database";

export default async function AdminStaffPage() {
  const supabase = await supabaseServer();

  const [{ data: staff }, { data: counters }, { data: assignments }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "staff").order("full_name"),
    supabase.from("counters").select("*").order("sort_order"),
    supabase.from("staff_counters").select("*"),
  ]);

  return (
    <StaffManager
      staff={(staff ?? []) as Profile[]}
      counters={(counters ?? []) as Counter[]}
      assignments={assignments ?? []}
    />
  );
}
