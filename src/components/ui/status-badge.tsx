import { cn } from "@/lib/utils";
import { STATUS_LABEL, type Order, type OrderStatus } from "@/lib/types/database";

const TONE: Record<OrderStatus, string> = {
  received: "bg-black/[0.06] text-ink-2",
  preparing: "bg-amber/15 text-amber",
  ready: "bg-mint/15 text-mint",
  picked_up: "bg-black/[0.05] text-ink-3",
};

/** Payment state takes precedence — an unpaid order isn't in the queue at all. */
export function StatusBadge({ order }: { order: Pick<Order, "status" | "payment_status"> }) {
  if (order.payment_status !== "paid") {
    const failed = order.payment_status === "failed";
    return (
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[11px] font-medium",
          failed ? "bg-danger/12 text-danger" : "bg-black/[0.06] text-ink-3",
        )}
      >
        {failed ? "Payment failed" : "Payment pending"}
      </span>
    );
  }

  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", TONE[order.status])}>
      {STATUS_LABEL[order.status]}
    </span>
  );
}
