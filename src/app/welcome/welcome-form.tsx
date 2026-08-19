"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ErrorNote } from "@/components/ui/feedback";

const field =
  "h-12 w-full rounded-2xl border border-hairline bg-white px-4 text-[16px] " +
  "placeholder:text-ink-4 focus:border-ink/20 focus:outline-none focus:ring-4 focus:ring-black/[0.04]";

export function WelcomeForm({ name }: { name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const supabase = supabaseBrowser();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { error: err } = await supabase
      .from("profiles")
      .update({
        student_id: String(form.get("student_id")).trim(),
        full_name: String(form.get("full_name")).trim(),
      })
      .eq("id", user.id);

    if (err) {
      setError(
        /duplicate|unique/i.test(err.message)
          ? "That student ID is already registered. Check it, or ask the canteen admin."
          : "We couldn't save that. Please try again.",
      );
      setBusy(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="glass-strong space-y-3 rounded-3xl p-6">
      <input
        name="full_name"
        required
        defaultValue={name}
        placeholder="Full name"
        className={field}
      />
      <input
        name="student_id"
        required
        autoFocus
        placeholder="Student ID / roll number"
        className={field}
      />

      {error && <ErrorNote message={error} />}

      <Button type="submit" size="lg" fullWidth loading={busy} className="mt-2">
        Continue
      </Button>

      <p className="pt-1 text-center text-[13px] leading-relaxed text-ink-3">
        This is set once. Ask the canteen admin if you need it corrected later.
      </p>
    </form>
  );
}
