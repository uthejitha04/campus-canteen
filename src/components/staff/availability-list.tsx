"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { cn, formatINR } from "@/lib/utils";
import { ErrorNote } from "@/components/ui/feedback";
import type { MenuSection } from "@/lib/queries/menu";

export function AvailabilityList({
  sections,
  demo = false,
}: {
  sections: MenuSection[];
  /** Walkthrough mode: the toggle animates but nothing is written. */
  demo?: boolean;
}) {
  const [state, setState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      sections.flatMap((s) => s.items.map((i) => [i.id, i.is_available] as const)),
    ),
  );
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(id: string) {
    const next = !state[id];
    setPending(id);
    setError(null);
    // Optimistic: the kitchen needs the tap to feel instant.
    setState((prev) => ({ ...prev, [id]: next }));

    if (demo) {
      setPending(null);
      return;
    }

    const { error: err } = await supabaseBrowser()
      .from("menu_items")
      .update({ is_available: next })
      .eq("id", id);

    if (err) {
      setState((prev) => ({ ...prev, [id]: !next }));
      setError(friendlyError(err, "Couldn't update that item. It may belong to another counter."));
    }
    setPending(null);
  }

  return (
    <div className="space-y-6">
      {error && <ErrorNote message={error} />}

      {sections.map(({ category, items }) => (
        <section key={category.id}>
          <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-2">
            {category.name}
          </h2>
          <ul className="card divide-y divide-[color:var(--color-hairline)] overflow-hidden">
            {items.map((item) => {
              const available = state[item.id] ?? item.is_available;
              return (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-[16px] font-medium", !available && "text-ink-3")}>
                      {item.name}
                    </p>
                    <p className="text-[13px] text-ink-3 tabular-nums">{formatINR(item.price)}</p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={available}
                    aria-label={`${item.name} available`}
                    disabled={pending === item.id}
                    onClick={() => toggle(item.id)}
                    className={cn(
                      "press relative h-9 w-[60px] shrink-0 rounded-full transition-colors disabled:opacity-60",
                      available ? "bg-mint" : "bg-black/[0.12]",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 size-7 rounded-full bg-white shadow transition-transform",
                        available ? "translate-x-[27px]" : "translate-x-1",
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
