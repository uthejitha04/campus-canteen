import Link from "next/link";
import { MetricCard } from "@/components/admin/metric-card";
import { RevenueBars } from "@/components/admin/revenue-bars";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/feedback";
import { formatDateTime, formatINR } from "@/lib/utils";
import type { DashboardData } from "@/lib/queries/analytics";

export function DashboardScreen({
  data,
  basePath = "",
}: {
  data: DashboardData;
  basePath?: string;
}) {
  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-[26px] font-semibold tracking-[-0.02em]">Dashboard</h1>
        <p className="mt-0.5 text-[14px] text-ink-3">Today at a glance.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Today's orders" value={String(data.todayOrders)} />
        <MetricCard label="Today's revenue" value={formatINR(data.todayRevenue)} accent />
        <MetricCard label="Pending" value={String(data.pending)} />
        <MetricCard label="Completed" value={String(data.completed)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="card p-5 lg:col-span-3">
          <h2 className="text-[15px] font-semibold tracking-tight">Revenue, last 14 days</h2>
          <div className="mt-4">
            <RevenueBars data={data.daily} />
          </div>
        </section>

        <section className="card p-5 lg:col-span-2">
          <h2 className="text-[15px] font-semibold tracking-tight">Popular items</h2>
          {data.popular.length === 0 ? (
            <EmptyState title="No sales yet" />
          ) : (
            <ol className="mt-3 space-y-2.5">
              {data.popular.map((item, index) => (
                <li key={item.item_name} className="flex items-baseline gap-3 text-[14px]">
                  <span className="w-4 text-ink-4 tabular-nums">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{item.item_name}</span>
                  <span className="text-ink-3 tabular-nums">{item.qty_sold} sold</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold tracking-tight">Recent orders</h2>
          <Link href={`${basePath}/admin/orders`} className="text-[14px] font-medium text-ink-3">
            View all
          </Link>
        </div>

        {data.recent.length === 0 ? (
          <EmptyState title="No orders yet" body="Orders will appear here as students place them." />
        ) : (
          <ul className="divide-y divide-[color:var(--color-hairline)]">
            {data.recent.map((order) => (
              <li key={order.id} className="flex items-center gap-3 py-3 text-[14px]">
                <span className="w-16 font-semibold tabular-nums">#{order.order_number}</span>
                <span className="min-w-0 flex-1 truncate text-ink-3">
                  {order.order_items.map((i) => `${i.quantity}× ${i.item_name}`).join(", ")}
                </span>
                <StatusBadge order={order} />
                <span className="hidden w-32 text-right text-ink-3 sm:block">
                  {formatDateTime(order.created_at)}
                </span>
                <span className="w-20 text-right font-semibold tabular-nums">
                  {formatINR(order.total_amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
