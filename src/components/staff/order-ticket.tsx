"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn, formatINR, minutesAgo } from "@/lib/utils";
import {
  NEXT_STATUS,
  NEXT_STATUS_ACTION,
  type OrderStatus,
  type OrderWithItems,
} from "@/lib/types/database";

/**
 * One order, sized for a phone held in one hand in a busy kitchen: order
 * number large, items legible, a single unmistakable action button.
 */
export function OrderTicket({
  order,
  counterIds,
  onAdvance,
}: {
  order: OrderWithItems;
  counterIds: string[];
  /** Supplied by the demo so the button advances state without an API call. */
  onAdvance?: (orderId: string, status: OrderStatus) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = NEXT_STATUS[order.status];
  const action = NEXT_STATUS_ACTION[order.status];

  // An order can span counters. Ours are actionable; the rest are context.
  const mine = order.order_items.filter((i) => counterIds.includes(i.counter_id));
  const others = order.order_items.filter((i) => !counterIds.includes(i.counter_id));
  const items = counterIds.length === 0 ? order.order_items : mine;

  async function advance() {
    if (!next || busy) return;
    setBusy(true);
    setError(null);

    if (onAdvance) {
      onAdvance(order.id, next);
      setBusy(false);
      return;
    }

    const response = await fetch(`/api/orders/${order.id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: next, from: order.status }),
    }).catch(() => null);

    if (!response?.ok) {
      const message = await response?.json().catch(() => null);
      setError(message?.error ?? "Couldn't update. Check the connection and try again.");
      setBusy(false);
      return;
    }
    // The realtime subscription removes this card from the column.
    setBusy(false);
  }

  return (
    <article className="card overflow-hidden">
      <div className="flex items-baseline justify-between gap-3 px-4 pt-3.5">
        <span className="text-[26px] font-semibold leading-none tracking-[-0.02em] tabular-nums">
          #{order.order_number}
        </span>
        <span className="text-[13px] text-ink-3">{minutesAgo(order.created_at)}</span>
      </div>

      <ul className="mt-3 space-y-1.5 px-4">
        {items.map((item) => (
          <li key={item.id} className="flex items-baseline gap-2.5 text-[17px]">
            <span className="min-w-8 font-semibold tabular-nums">{item.quantity}×</span>
            <span className="min-w-0 flex-1 leading-snug">{item.item_name}</span>
          </li>
        ))}
        {others.length > 0 && (
          <li className="pt-1 text-[13px] leading-snug text-ink-3">
            + {others.map((i) => `${i.quantity}× ${i.item_name}`).join(", ")} at another counter
          </li>
        )}
      </ul>

      <div className="mt-3 flex items-center justify-between px-4 text-[15px]">
        <span className="text-ink-3">Total</span>
        <span className="font-semibold tabular-nums">{formatINR(order.total_amount)}</span>
      </div>

      {error && (
        <p role="alert" className="mt-2 px-4 text-[13px] text-danger">
          {error}
        </p>
      )}

      {next && action && (
        <div className="mt-3 p-3 pt-0">
          <Button
            size="xl"
            fullWidth
            loading={busy}
            onClick={advance}
            className={cn(
              "text-[17px] uppercase tracking-wide",
              order.status === "preparing" && "bg-mint hover:bg-mint/90",
            )}
          >
            {action}
          </Button>
        </div>
      )}
    </article>
  );
}
