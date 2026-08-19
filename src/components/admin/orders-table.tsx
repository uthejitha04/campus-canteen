import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/feedback";
import { cn, formatDateTime, formatINR } from "@/lib/utils";
import type { OrderWithItems } from "@/lib/types/database";

export const ORDER_FILTERS = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
] as const;

export type OrderFilterKey = (typeof ORDER_FILTERS)[number]["key"];

export function OrdersTable({
  orders,
  active,
  basePath = "",
}: {
  orders: OrderWithItems[];
  active: OrderFilterKey;
  basePath?: string;
}) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[26px] font-semibold tracking-[-0.02em]">Orders</h1>
      </header>

      <nav className="no-scrollbar flex gap-2 overflow-x-auto">
        {ORDER_FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`${basePath}/admin/orders?filter=${f.key}`}
            className={cn(
              "press shrink-0 rounded-full px-4 py-2 text-[14px] font-medium",
              active === f.key ? "bg-ink text-white" : "border border-hairline bg-white text-ink-2",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <div className="card">
          <EmptyState title="Nothing here" body="No orders match this filter yet." />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-[color:var(--color-hairline)]">
            {orders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3.5 text-[14px]"
              >
                <span className="w-16 font-semibold tabular-nums">#{order.order_number}</span>
                <span className="min-w-[12rem] flex-1 truncate text-ink-3">
                  {order.order_items.map((i) => `${i.quantity}× ${i.item_name}`).join(", ")}
                </span>
                <StatusBadge order={order} />
                <span className="w-32 text-right text-ink-3">
                  {formatDateTime(order.created_at)}
                </span>
                <span className="w-20 text-right font-semibold tabular-nums">
                  {formatINR(order.total_amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
