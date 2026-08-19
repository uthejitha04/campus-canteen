import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={cn("card p-4", accent && "bg-ink text-white border-transparent")}>
      <p className={cn("text-[13px]", accent ? "text-white/70" : "text-ink-3")}>{label}</p>
      <p className="mt-1.5 text-[26px] font-semibold leading-none tracking-[-0.02em] tabular-nums">
        {value}
      </p>
    </div>
  );
}
