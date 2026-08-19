"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const PORTALS = [
  { href: "/demo", label: "Student" },
  { href: "/demo/staff", label: "Kitchen" },
  { href: "/demo/admin", label: "Admin" },
] as const;

/**
 * Demo-only chrome. The switcher exists so the whole product can be reviewed
 * in one sitting — no real account can move between portals, and this bar is
 * never rendered outside /demo.
 */
export function DemoBar({ portal }: { portal: "Student" | "Kitchen" | "Admin" }) {
  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-ink text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
        <Link
          href="/portals"
          className="press rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] hover:bg-white/25"
        >
          Demo
        </Link>
        <span className="hidden text-[13px] text-white/70 sm:block">
          Sample data. Nothing is saved.
        </span>

        <nav aria-label="Demo portals" className="ml-auto flex items-center gap-1">
          {PORTALS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={label === portal ? "page" : undefined}
              className={cn(
                "press rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                label === portal ? "bg-white text-ink" : "text-white/75 hover:bg-white/10",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
