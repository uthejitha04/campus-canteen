"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useOrder } from "@/hooks/use-order";
import { formatINR, cn } from "@/lib/utils";
import { STATUS_LABEL, type OrderWithItems } from "@/lib/types/database";

/** Compact live status strip shown on the home screen while an order is open. */
export function ActiveOrderCard({
  order: initial,
  basePath = "",
  live = true,
}: {
  order: OrderWithItems;
  basePath?: string;
  live?: boolean;
}) {
  const { order } = useOrder(initial.id, initial, live);
  const ready = order.status === "ready";

  return (
    <Link
      href={`${basePath}/orders/${order.id}`}
      className={cn(
        "press flex items-center gap-4 rounded-[22px] p-4 transition-colors",
        ready ? "bg-mint text-white" : "card",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className={cn("text-[13px]", ready ? "text-white/80" : "text-ink-3")}>
          Order #{order.order_number}
        </p>
        <p className="mt-0.5 text-[17px] font-semibold tracking-tight">
          {ready ? "Ready for pickup" : STATUS_LABEL[order.status]}
        </p>
      </div>
      <span className="text-[15px] font-semibold tabular-nums">
        {formatINR(order.total_amount)}
      </span>
      <ChevronRight className={cn("size-5", ready ? "text-white/70" : "text-ink-4")} />
    </Link>
  );
}
