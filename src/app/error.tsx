"use client";

import { Button } from "@/components/ui/button";

/**
 * Last-resort boundary. The underlying error is logged, never shown — students
 * get something they can act on instead of a stack trace.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-black/[0.04] text-2xl">
        😕
      </div>
      <h1 className="text-[22px] font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-1.5 text-[15px] leading-relaxed text-ink-3">
        We couldn&apos;t load this screen. Your orders and payments are unaffected.
      </p>
      <div className="mt-6 w-full">
        <Button fullWidth onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
