"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UtensilsCrossed, Receipt, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/orders", label: "Orders", icon: Receipt },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav({ basePath = "" }: { basePath?: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-3 safe-bottom"
    >
      <div className="glass-strong flex w-full max-w-md items-center gap-1 rounded-[26px] p-1.5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const path = href === "/" ? basePath || "/" : `${basePath}${href}`;
          const active = href === "/" ? pathname === path : pathname.startsWith(path);
          return (
            <Link
              key={href}
              href={path}
              aria-current={active ? "page" : undefined}
              className={cn(
                "press flex flex-1 flex-col items-center gap-1 rounded-[20px] py-2 text-[11px] font-medium",
                active ? "bg-white text-ink shadow-sm" : "text-ink-3",
              )}
            >
              <Icon className="size-[21px]" strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
