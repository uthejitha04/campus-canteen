import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-xl", className)} aria-hidden />;
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && (
        <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-black/[0.04] text-ink-3">
          {icon}
        </div>
      )}
      <p className="text-[17px] font-semibold tracking-tight">{title}</p>
      {body && <p className="mt-1.5 max-w-xs text-[14px] leading-relaxed text-ink-3">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/**
 * User-facing error surface. Callers pass a friendly message — raw Postgres or
 * gateway errors are mapped in lib/errors.ts before they get here.
 */
export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger/[0.06] px-4 py-3"
    >
      <p className="flex-1 text-[14px] leading-relaxed text-ink-2">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-[14px] font-medium text-danger">
          Retry
        </button>
      )}
    </div>
  );
}
