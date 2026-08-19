"use client";

import Image from "next/image";
import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/store/cart";
import { cn, formatINR } from "@/lib/utils";
import type { MenuItem } from "@/lib/types/database";

export function FoodCard({ item }: { item: MenuItem }) {
  const add = useCart((s) => s.add);
  const [justAdded, setJustAdded] = useState(false);
  const soldOut = !item.is_available;

  function handleAdd() {
    if (soldOut) return;
    add({ id: item.id, name: item.name, price: item.price, imageUrl: item.image_url });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 900);
  }

  return (
    <article
      className={cn(
        "card flex gap-3.5 p-3 transition-opacity",
        soldOut && "opacity-55",
      )}
    >
      <div className="relative size-[86px] shrink-0 overflow-hidden rounded-2xl bg-black/[0.04]">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt=""
            fill
            sizes="86px"
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <span className="grid h-full place-items-center text-2xl" aria-hidden>
            🍛
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold tracking-tight">{item.name}</h3>
          {item.description && (
            <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-3">
              {item.description}
            </p>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-[15px] font-semibold tabular-nums">
            {formatINR(item.price)}
          </span>

          {soldOut ? (
            <span className="rounded-full bg-black/[0.05] px-2.5 py-1 text-[11px] font-medium text-ink-3">
              Out of stock
            </span>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              aria-label={`Add ${item.name} to cart`}
              className={cn(
                "press grid size-9 place-items-center rounded-full text-white transition-colors",
                justAdded ? "bg-mint" : "bg-ink",
              )}
            >
              {justAdded ? <Check className="size-4" /> : <Plus className="size-[18px]" />}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
