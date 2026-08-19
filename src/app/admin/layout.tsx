import { requireRole } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { SignOutButton } from "@/components/sign-out-button";

export const metadata = { title: "Admin · Campus Canteen" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("admin");

  return (
    <div className="min-h-dvh md:flex">
      {/* Sidebar on desktop, a scrolling tab strip on phones. */}
      <aside className="glass sticky top-0 z-40 border-b border-hairline md:h-dvh md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center gap-3 px-4 py-3.5 md:block">
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-semibold tracking-tight">Campus Canteen</p>
            <p className="truncate text-[13px] text-ink-3">{profile.full_name || "Administrator"}</p>
          </div>
        </div>
        <AdminNav />
        <div className="hidden px-3 pb-4 md:block">
          <SignOutButton />
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
