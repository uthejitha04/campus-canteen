"use client";

import Link from "next/link";
import { ChevronLeft, WifiOff } from "lucide-react";
import { useOrder } from "@/hooks/use-order";
import { StatusTrack } from "./status-track";
import { cn, formatDateTime, formatINR } from "@/lib/utils";
import type { OrderWithItems } from "@/lib/types/database";

export function OrderTracker({
  initial,
  justPlaced,
  basePath = "",
  live = true,
}: {
  initial: OrderWithItems;
  justPlaced?: boolean;
  basePath?: string;
  live?: boolean;
}) {
  const { order, connection } = useOrder(initial.id, initial, live);
  const ready = order.status === "ready";

  return (
    <main className="px-5 pt-4">
      <Link
        href={`${basePath}/orders`}
        className="press -ml-2 inline-flex items-center gap-1 py-2 pr-3 text-[15px] text-ink-3"
      >
        <ChevronLeft className="size-5" /> Orders
      </Link>

      {/* The pickup number is the single most important thing on this screen. */}
      <section
        className={cn(
          "rise mt-2 rounded-[28px] px-6 py-8 text-center",
          ready ? "bg-mint text-white" : "card",
        )}
      >
        <p className={cn("text-[13px] font-medium uppercase tracking-[0.14em]", ready ? "text-white/75" : "text-ink-3")}>
          Order
        </p>
        <p className="mt-1 text-[52px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
          #{order.order_number}
        </p>
        <p className={cn("mt-3 text-[17px] font-semibold tracking-tight", ready ? "text-white" : "text-ink-2")}>
          {ready ? "Your order is ready for pickup." : STATUS_HEADLINE[order.status]}
        </p>
        <p className={cn("mt-1 text-[15px] tabular-nums", ready ? "text-white/80" : "text-ink-3")}>
          {formatINR(order.total_amount)}
        </p>
      </section>

      {justPlaced && !ready && (
        <p className="mt-3 text-center text-[13px] leading-relaxed text-ink-3">
          Show this number at the pickup counter. We&apos;ll notify you when it&apos;s ready.
        </p>
      )}

      {connection === "offline" && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-amber/10 px-4 py-3 text-[13px] text-ink-2">
          <WifiOff className="size-4 shrink-0 text-amber" />
          Live updates paused. Reopen this screen to refresh.
        </div>
      )}

      <section className="card mt-5 p-5">
        <StatusTrack status={order.status} />
      </section>

      <section className="card mt-4 p-5">
        <h2 className="text-[15px] font-semibold tracking-tight">Receipt</h2>
        <ul className="mt-3 space-y-2.5">
          {order.order_items.map((item) => (
            <li key={item.id} className="flex items-baseline gap-3 text-[15px]">
              <span className="w-8 shrink-0 text-ink-3 tabular-nums">{item.quantity}×</span>
              <span className="min-w-0 flex-1 truncate">{item.item_name}</span>
              <span className="tabular-nums">{formatINR(item.line_total)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3">
          <span className="text-[15px] font-semibold">Total paid</span>
          <span className="text-[15px] font-semibold tabular-nums">
            {formatINR(order.total_amount)}
          </span>
        </div>
        <p className="mt-3 text-[12px] text-ink-3">
          Placed {formatDateTime(order.created_at)}
        </p>
      </section>

      {/* Orders can't be cancelled, so the useful thing to offer is the exact
          detail staff will ask for if something went wrong. */}
      <p className="mt-4 px-2 text-center text-[13px] leading-relaxed text-ink-3">
        Ordered by mistake or paid twice? Orders can&apos;t be cancelled in the app — please show
        order <span className="font-medium text-ink-2">#{order.order_number}</span> to the canteen
        staff and they&apos;ll sort it out.
      </p>
    </main>
  );
}

const STATUS_HEADLINE = {
  received: "We've got your order.",
  preparing: "Your food is being prepared.",
  ready: "Your order is ready for pickup.",
  picked_up: "Picked up. Enjoy!",
} as const;
