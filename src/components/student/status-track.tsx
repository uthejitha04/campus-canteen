import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_FLOW, STATUS_LABEL, type OrderStatus } from "@/lib/types/database";

/**
 * The four-step pickup track. Completed steps are ticked, the current step is
 * filled and labelled in colour, upcoming steps stay hollow — so the state is
 * readable at arm's length while walking to the counter.
 */
export function StatusTrack({ status }: { status: OrderStatus }) {
  const currentIndex = ORDER_FLOW.indexOf(status);

  return (
    <ol className="space-y-0">
      {ORDER_FLOW.map((step, index) => {
        const done = index < currentIndex;
        const current = index === currentIndex;
        const last = index === ORDER_FLOW.length - 1;

        return (
          <li key={step} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors",
                  done && "border-mint bg-mint text-white",
                  current && "border-accent bg-accent text-white",
                  !done && !current && "border-ink-4/60 bg-white",
                )}
              >
                {done ? (
                  <Check className="size-3.5" strokeWidth={3} />
                ) : current ? (
                  <span className="size-2 rounded-full bg-white" />
                ) : null}
              </span>
              {!last && (
                <span
                  className={cn(
                    "w-0.5 flex-1 rounded-full",
                    done ? "bg-mint" : "bg-ink-4/35",
                  )}
                />
              )}
            </div>

            <div className={cn("pb-6", last && "pb-0")}>
              <p
                className={cn(
                  "text-[15px] leading-6",
                  current ? "font-semibold text-ink" : done ? "text-ink-2" : "text-ink-3",
                )}
              >
                {STATUS_LABEL[step]}
              </p>
              {current && (
                <p className="mt-0.5 text-[13px] text-ink-3">{CAPTION[step]}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const CAPTION: Record<OrderStatus, string> = {
  received: "The canteen has your order.",
  preparing: "Your food is being made.",
  ready: "Collect it from the pickup counter.",
  picked_up: "Enjoy your meal.",
};
