"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutGrid, Receipt, UtensilsCrossed, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutGrid },
  { href: "/admin/orders", label: "Orders", icon: Receipt },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/staff", label: "Staff", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
] as const;

export function AdminNav({ basePath = "" }: { basePath?: string }) {
  const pathname = usePathname();

  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:pb-0">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const path = `${basePath}${href}`;
        const active = href === "/admin" ? pathname === path : pathname.startsWith(path);
        return (
          <Link
            key={href}
            href={path}
            aria-current={active ? "page" : undefined}
            className={cn(
              "press flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] font-medium",
              active ? "bg-ink text-white" : "text-ink-2 hover:bg-black/[0.04]",
            )}
          >
            <Icon className="size-[18px]" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
