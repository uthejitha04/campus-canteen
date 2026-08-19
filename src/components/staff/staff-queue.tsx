"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Wifi, WifiOff } from "lucide-react";
import { useRealtimeOrders } from "@/hooks/use-realtime-orders";
import { OrderTicket } from "./order-ticket";
import { Skeleton, EmptyState, ErrorNote } from "@/components/ui/feedback";
import { cn, formatINR } from "@/lib/utils";
import type { OrderStatus, OrderWithItems } from "@/lib/types/database";

const COLUMNS: { status: OrderStatus; label: string; accent: string }[] = [
  { status: "received", label: "New", accent: "bg-accent" },
  { status: "preparing", label: "Preparing", accent: "bg-amber" },
  { status: "ready", label: "Ready", accent: "bg-mint" },
];

export function StaffQueue({
  counterIds,
  completedToday,
  demoOrders,
}: {
  counterIds: string[];
  completedToday: OrderWithItems[];
  /** Walkthrough mode: fixture rows, advanced locally instead of via the API. */
  demoOrders?: OrderWithItems[];
}) {
  const live = useRealtimeOrders(
    demoOrders ? { kind: "demo", seed: demoOrders } : { kind: "queue" },
  );
  const [localOrders, setLocalOrders] = useState<OrderWithItems[] | null>(
    demoOrders ?? null,
  );
  const [showCompleted, setShowCompleted] = useState(false);

  const orders = demoOrders ? localOrders : live.orders;
  const { connection, error } = live;

  // In the demo the button still works — the card just moves locally.
  const advanceLocally = (orderId: string, status: OrderStatus) =>
    setLocalOrders((prev) =>
      (prev ?? []).map((o) => (o.id === orderId ? { ...o, status } : o)),
    );

  const grouped = useMemo(() => {
    const map: Record<OrderStatus, OrderWithItems[]> = {
      received: [],
      preparing: [],
      ready: [],
      picked_up: [],
    };
    // Oldest first inside a column — whoever has waited longest is at the top.
    for (const order of orders ?? []) map[order.status].push(order);
    for (const key of Object.keys(map) as OrderStatus[]) {
      map[key].sort((a, b) => a.created_at.localeCompare(b.created_at));
    }
    return map;
  }, [orders]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px] text-ink-3">
          {connection === "live" ? (
            <>
              <Wifi className="size-4 text-mint" /> Live
            </>
          ) : connection === "offline" ? (
            <>
              <WifiOff className="size-4 text-danger" /> Reconnecting…
            </>
          ) : (
            <>Connecting…</>
          )}
        </div>
        <button
          onClick={() => setShowCompleted((v) => !v)}
          className="press rounded-xl border border-hairline bg-white px-3 py-2 text-[14px] font-medium"
        >
          {showCompleted ? "Back to queue" : `Today's completed (${completedToday.length})`}
        </button>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorNote message={error} onRetry={() => window.location.reload()} />
        </div>
      )}

      {showCompleted ? (
        <section>
          {completedToday.length === 0 ? (
            <EmptyState title="Nothing completed yet today" />
          ) : (
            <ul className="space-y-2">
              {completedToday.map((order) => (
                <li
                  key={order.id}
                  className="card flex items-center gap-3 px-4 py-3 text-[15px]"
                >
                  <CheckCircle2 className="size-5 shrink-0 text-mint" />
                  <span className="font-semibold tabular-nums">#{order.order_number}</span>
                  <span className="min-w-0 flex-1 truncate text-ink-3">
                    {order.order_items.map((i) => `${i.quantity}× ${i.item_name}`).join(", ")}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatINR(order.total_amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUMNS.map(({ status, label, accent }) => {
            const list = grouped[status];
            return (
              <section key={status} className="min-w-0">
                <div className="mb-2.5 flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", accent)} />
                  <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-2">
                    {label}
                  </h2>
                  <span className="text-[13px] text-ink-3 tabular-nums">{list.length}</span>
                </div>

                <div className="space-y-3">
                  {orders === null ? (
                    <>
                      <Skeleton className="h-40" />
                      <Skeleton className="h-40" />
                    </>
                  ) : list.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-hairline py-10 text-center text-[14px] text-ink-3">
                      {status === "received" ? "No new orders." : "You're all caught up."}
                    </div>
                  ) : (
                    list.map((order) => (
                      <OrderTicket
                        key={order.id}
                        order={order}
                        counterIds={counterIds}
                        onAdvance={demoOrders ? advanceLocally : undefined}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
