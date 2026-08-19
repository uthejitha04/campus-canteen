import { RevenueBars } from "@/components/admin/revenue-bars";
import { EmptyState } from "@/components/ui/feedback";
import { formatINR } from "@/lib/utils";
import type { DashboardData } from "@/lib/queries/analytics";

export function AnalyticsScreen({ data }: { data: DashboardData }) {
  const peakOrders = Math.max(...data.trends.map((t) => t.orders), 1);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[26px] font-semibold tracking-[-0.02em]">Analytics</h1>
        <p className="mt-0.5 text-[14px] text-ink-3">
          Enough to plan staffing and stock. Nothing more.
        </p>
      </header>

      <section className="card p-5">
        <h2 className="text-[15px] font-semibold tracking-tight">Daily revenue</h2>
        <div className="mt-4">
          <RevenueBars data={data.daily} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-[15px] font-semibold tracking-tight">Monthly revenue</h2>
          {data.monthly.length === 0 ? (
            <EmptyState title="No revenue recorded yet" />
          ) : (
            <ul className="mt-3 divide-y divide-[color:var(--color-hairline)]">
              {data.monthly.map((m) => (
                <li key={m.month} className="flex items-center justify-between py-2.5 text-[14px]">
                  <span>
                    {new Date(m.month).toLocaleDateString("en-IN", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-ink-3 tabular-nums">{m.orders} orders</span>
                  <span className="w-24 text-right font-semibold tabular-nums">
                    {formatINR(m.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <h2 className="text-[15px] font-semibold tracking-tight">When students order</h2>
          <p className="mt-0.5 text-[13px] text-ink-3">
            Orders by hour of day — this is where the queue used to form.
          </p>
          {data.trends.length === 0 ? (
            <EmptyState title="Not enough data yet" />
          ) : (
            <div className="mt-4 flex h-32 items-end gap-1">
              {data.trends.map((t) => (
                <div key={t.hour_of_day} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-ink/80"
                    style={{ height: `${Math.max((t.orders / peakOrders) * 100, 4)}%` }}
                    title={`${t.hour_of_day}:00 — ${t.orders} orders`}
                  />
                  <span className="text-[9px] text-ink-4 tabular-nums">{t.hour_of_day}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="card p-5">
        <h2 className="text-[15px] font-semibold tracking-tight">Most popular items</h2>
        {data.popular.length === 0 ? (
          <EmptyState title="No sales yet" />
        ) : (
          <ul className="mt-3 divide-y divide-[color:var(--color-hairline)]">
            {data.popular.map((item) => (
              <li key={item.item_name} className="flex items-center justify-between py-2.5 text-[14px]">
                <span className="min-w-0 flex-1 truncate">{item.item_name}</span>
                <span className="w-24 text-right text-ink-3 tabular-nums">{item.qty_sold} sold</span>
                <span className="w-24 text-right font-semibold tabular-nums">
                  {formatINR(Number(item.revenue))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
