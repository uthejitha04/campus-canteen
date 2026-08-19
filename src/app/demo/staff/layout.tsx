import Link from "next/link";
import { DemoBar } from "@/components/demo/demo-bar";

export default function DemoStaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <DemoBar portal="Kitchen" />
      <header className="glass-strong sticky top-[49px] z-40 border-b border-hairline">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[18px] font-semibold tracking-tight">Kitchen</p>
            <p className="truncate text-[13px] text-ink-3">North Indian · Coffee &amp; Juices</p>
          </div>
          <nav className="flex items-center gap-1">
            <Link
              href="/demo/staff"
              className="press rounded-xl px-3 py-2 text-[14px] font-medium text-ink-2"
            >
              Orders
            </Link>
            <Link
              href="/demo/staff/menu"
              className="press rounded-xl px-3 py-2 text-[14px] font-medium text-ink-2"
            >
              Menu
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-5">{children}</div>
    </div>
  );
}
