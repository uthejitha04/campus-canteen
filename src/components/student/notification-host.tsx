"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BellRing, X } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";

/**
 * Renders the single notification this product sends: "your order is ready".
 * Mounted once in the student shell so it fires on whatever screen they're on.
 */
export function NotificationHost({ userId }: { userId: string }) {
  const { toast, dismissToast, markRead } = useNotifications(userId);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismissToast, 8000);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3"
    >
      <Link
        href={toast.order_id ? `/orders/${toast.order_id}` : "/orders"}
        onClick={() => {
          void markRead(toast.id);
          dismissToast();
        }}
        className="glass-strong rise flex w-full max-w-md items-center gap-3 rounded-3xl px-4 py-3.5"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mint/15 text-mint">
          <BellRing className="size-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold tracking-tight">
            {toast.title}
          </span>
          <span className="block truncate text-[13px] text-ink-3">{toast.body}</span>
        </span>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={(event) => {
            event.preventDefault();
            dismissToast();
          }}
          className="press grid size-8 shrink-0 place-items-center rounded-full text-ink-3"
        >
          <X className="size-4" />
        </button>
      </Link>
    </div>
  );
}
