"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { cartCount, cartTotal, useCart } from "@/lib/store/cart";
import { formatINR } from "@/lib/utils";

/**
 * Floating cart summary. Sits just above the tab bar and only appears when
 * there is something in the cart, so the browsing screens stay quiet.
 */
export function CartBar({ basePath = "" }: { basePath?: string }) {
  const lines = useCart((s) => s.lines);
  const pathname = usePathname();

  const count = cartCount(lines);
  if (count === 0 || pathname === `${basePath}/cart`) return null;

  return (
    <div className="fixed inset-x-0 bottom-[86px] z-30 flex justify-center px-4">
      <Link
        href={`${basePath}/cart`}
        className="press rise flex w-full max-w-md items-center gap-3 rounded-[22px] bg-ink px-4 py-3.5 text-white shadow-lg"
      >
        <span className="relative grid size-9 place-items-center rounded-full bg-white/15">
          <ShoppingBag className="size-[18px]" />
        </span>
        <span className="flex-1 text-[15px] font-medium">
          {count} {count === 1 ? "item" : "items"}
        </span>
        <span className="text-[15px] font-semibold tabular-nums">{formatINR(cartTotal(lines))}</span>
      </Link>
    </div>
  );
}
