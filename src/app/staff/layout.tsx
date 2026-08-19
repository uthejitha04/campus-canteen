import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

export const metadata = { title: "Kitchen · Campus Canteen" };

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("staff", "admin");

  const supabase = await supabaseServer();
  const { data: assignments } = await supabase
    .from("staff_counters")
    .select("counter_id, counters(name)")
    .eq("staff_id", profile.id);

  const counterNames =
    (assignments ?? [])
      .map((a) => (a.counters as unknown as { name: string } | null)?.name)
      .filter(Boolean)
      .join(" · ") || "All counters";

  return (
    // Denser type and a fixed header: this screen is read across a kitchen,
    // not browsed.
    <div className="min-h-dvh bg-canvas">
      <header className="glass-strong sticky top-0 z-40 border-b border-hairline">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[18px] font-semibold tracking-tight">Kitchen</p>
            <p className="truncate text-[13px] text-ink-3">{counterNames}</p>
          </div>
          <nav className="flex items-center gap-1">
            <Link
              href="/staff"
              className="press rounded-xl px-3 py-2 text-[14px] font-medium text-ink-2"
            >
              Orders
            </Link>
            <Link
              href="/staff/menu"
              className="press rounded-xl px-3 py-2 text-[14px] font-medium text-ink-2"
            >
              Menu
            </Link>
          </nav>
          <div className="w-24">
            <SignOutButton label="Sign out" />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-5">{children}</div>
    </div>
  );
}
