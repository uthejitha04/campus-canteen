import Link from "next/link";
import { ChevronRight, Receipt } from "lucide-react";
import { EmptyState } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatINR } from "@/lib/utils";
import type { OrderWithItems } from "@/lib/types/database";

export function OrdersScreen({
  orders,
  basePath = "",
}: {
  orders: OrderWithItems[];
  basePath?: string;
}) {
  return (
    <main className="px-5 pt-6">
      <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.02em]">Orders</h1>

      {orders.length === 0 ? (
        <div className="card mt-6">
          <EmptyState
            icon={<Receipt className="size-6" />}
            title="No orders yet"
            body="Your next meal is waiting."
            action={
              <Link href={`${basePath}/menu`}>
                <Button>See today&apos;s menu</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`${basePath}/orders/${order.id}`}
                className="press card flex items-center gap-3 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-semibold tracking-tight tabular-nums">
                      #{order.order_number}
                    </span>
                    <StatusBadge order={order} />
                  </div>
                  <p className="mt-1 truncate text-[13px] text-ink-3">
                    {order.order_items.map((i) => `${i.quantity}× ${i.item_name}`).join(", ")}
                  </p>
                  <p className="mt-0.5 text-[12px] text-ink-4">
                    {formatDateTime(order.created_at)}
                  </p>
                </div>
                <span className="text-[15px] font-semibold tabular-nums">
                  {formatINR(order.total_amount)}
                </span>
                <ChevronRight className="size-5 shrink-0 text-ink-4" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
