import { AdminNav } from "@/components/admin/admin-nav";
import { DemoBar } from "@/components/demo/demo-bar";

export default function DemoAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBar portal="Admin" />
      <div className="min-h-dvh md:flex">
      <aside className="glass sticky top-[49px] z-40 border-b border-hairline md:h-dvh md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="px-4 py-3.5">
          <p className="text-[16px] font-semibold tracking-tight">Campus Canteen</p>
          <p className="truncate text-[13px] text-ink-3">Administrator</p>
        </div>
        <AdminNav basePath="/demo" />
      </aside>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </>
  );
}
