import { formatINR } from "@/lib/utils";

/**
 * Deliberately a plain bar strip rather than a charting library: it answers
 * "are we up or down this week" and adds no JavaScript to the page.
 */
export function RevenueBars({
  data,
}: {
  data: { day: string; revenue: number; orders: number }[];
}) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-[14px] text-ink-3">No revenue recorded yet.</p>;
  }

  const series = [...data].reverse();
  const max = Math.max(...series.map((d) => d.revenue), 1);

  return (
    <div>
      <div className="flex h-36 items-end gap-1.5">
        {series.map((d) => (
          <div key={d.day} className="group flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span className="text-[10px] text-ink-4 tabular-nums opacity-0 transition-opacity group-hover:opacity-100">
              {formatINR(d.revenue)}
            </span>
            <div
              className="w-full rounded-t-md bg-accent/85 transition-colors group-hover:bg-accent"
              style={{ height: `${Math.max((d.revenue / max) * 100, 3)}%` }}
              title={`${d.day}: ${formatINR(d.revenue)} across ${d.orders} orders`}
            />
          </div>
        ))}
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-ink-4">
        <span>{new Date(series[0]!.day).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
        <span>
          {new Date(series[series.length - 1]!.day).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>
    </div>
  );
}
