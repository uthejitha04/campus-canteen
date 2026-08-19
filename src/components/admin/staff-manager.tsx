"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorNote } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import type { Counter, Profile } from "@/lib/types/database";

const field =
  "h-11 w-full rounded-xl border border-hairline bg-white px-3.5 text-[15px] " +
  "placeholder:text-ink-4 focus:border-ink/20 focus:outline-none";

const DEMO_NOTE = "This is the demo — changes aren't saved. Sign in as an admin to manage staff.";

export function StaffManager({
  staff,
  counters,
  assignments,
  demo = false,
}: {
  staff: Profile[];
  counters: Counter[];
  assignments: { staff_id: string; counter_id: string }[];
  /** Walkthrough mode: every screen and dialog opens, nothing is written. */
  demo?: boolean;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setActive(member: Profile, isActive: boolean) {
    if (demo) {
      setError(DEMO_NOTE);
      return;
    }
    setPending(member.id);
    setError(null);

    const response = await fetch("/api/admin/staff", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ staffId: member.id, isActive }),
    }).catch(() => null);

    if (!response?.ok) {
      setError("We couldn't update that account. Please try again.");
    } else {
      router.refresh();
    }
    setPending(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em]">Staff</h1>
          <p className="mt-0.5 text-[14px] text-ink-3">
            Staff only see orders from the counters they&apos;re assigned to.
          </p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus className="size-4" /> Add staff
        </Button>
      </header>

      {error && <ErrorNote message={error} />}

      {staff.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Users className="size-6" />}
            title="No staff accounts yet"
            body="Add the people who will work the counters."
            action={<Button onClick={() => setAdding(true)}>Add staff</Button>}
          />
        </div>
      ) : (
        <ul className="card divide-y divide-[color:var(--color-hairline)] overflow-hidden">
          {staff.map((member) => {
            const theirCounters = assignments
              .filter((a) => a.staff_id === member.id)
              .map((a) => counters.find((c) => c.id === a.counter_id)?.name)
              .filter(Boolean);

            return (
              <li key={member.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-[15px] font-medium", !member.is_active && "text-ink-3")}>
                    {member.full_name || "Unnamed"}
                  </p>
                  <p className="truncate text-[13px] text-ink-3">
                    {member.email} · {theirCounters.join(", ") || "No counter assigned"}
                  </p>
                </div>

                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    member.is_active ? "bg-mint/15 text-mint" : "bg-black/[0.06] text-ink-3",
                  )}
                >
                  {member.is_active ? "Enabled" : "Disabled"}
                </span>

                <Button
                  size="sm"
                  variant={member.is_active ? "secondary" : "primary"}
                  loading={pending === member.id}
                  onClick={() => setActive(member, !member.is_active)}
                >
                  {member.is_active ? "Disable" : "Enable"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {adding && (
        <AddStaffDialog
          counters={counters}
          demo={demo}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function AddStaffDialog({
  counters,
  onClose,
  onSaved,
  demo,
}: {
  counters: Counter[];
  onClose: () => void;
  onSaved: () => void;
  demo: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (demo) {
      setError(DEMO_NOTE);
      return;
    }
    setBusy(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const counterIds = form.getAll("counter_ids").map(String);
    if (counterIds.length === 0) {
      setError("Assign at least one counter.");
      setBusy(false);
      return;
    }

    const response = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fullName: String(form.get("full_name")).trim(),
        email: String(form.get("email")).trim(),
        password: String(form.get("password")),
        counterIds,
      }),
    }).catch(() => null);

    const body = await response?.json().catch(() => null);
    if (!response?.ok) {
      setError(body?.error ?? "We couldn't create that account.");
      setBusy(false);
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 sm:items-center sm:p-6">
      <div className="glass-strong rise max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl p-6 sm:rounded-3xl">
        <h2 className="mb-4 text-[19px] font-semibold tracking-tight">Add staff</h2>

        <form onSubmit={save} className="space-y-3">
          <input name="full_name" required placeholder="Full name" className={field} />
          <input name="email" type="email" required placeholder="Email" className={field} />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Temporary password (min 8 characters)"
            className={field}
          />

          <fieldset>
            <legend className="mb-1.5 text-[13px] text-ink-3">Counters</legend>
            <div className="space-y-1.5">
              {counters.map((counter) => (
                <label key={counter.id} className="flex items-center gap-2.5 text-[15px]">
                  <input type="checkbox" name="counter_ids" value={counter.id} className="size-4" />
                  {counter.name}
                </label>
              ))}
            </div>
          </fieldset>

          {error && <ErrorNote message={error} />}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" fullWidth loading={busy}>
              Create account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
