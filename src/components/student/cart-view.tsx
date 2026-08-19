"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { cartTotal, useCart } from "@/lib/store/cart";
import { openCheckout } from "@/lib/payments/checkout-client";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorNote } from "@/components/ui/feedback";
import { formatINR } from "@/lib/utils";

type Phase = "idle" | "creating" | "paying" | "verifying";

const PHASE_LABEL: Record<Phase, string> = {
  idle: "Proceed to payment",
  creating: "Creating your order…",
  paying: "Waiting for payment…",
  verifying: "Confirming payment…",
};

export function CartView({
  student,
  basePath = "",
  demo = false,
}: {
  student: { name: string; email: string | null };
  basePath?: string;
  /** Walkthrough mode: everything renders, but no order or payment is created. */
  demo?: boolean;
}) {
  const router = useRouter();
  const { lines, setQuantity, remove, clear } = useCart();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  // One key per checkout attempt. Re-used across retries of the same cart so a
  // second tap can never produce a second order.
  const idempotencyKey = useRef<string>(crypto.randomUUID());
  const total = cartTotal(lines);

  async function checkout() {
    if (phase !== "idle") return;
    setError(null);

    if (demo) {
      setError("This is the demo — checkout is disabled. Sign in to place a real order.");
      return;
    }

    setPhase("creating");

    try {
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ menu_item_id: l.id, quantity: l.quantity })),
          idempotencyKey: idempotencyKey.current,
        }),
      });

      const order = await orderResponse.json();
      if (!orderResponse.ok) {
        setError(order.error ?? "We couldn't create your order.");
        setPhase("idle");
        return;
      }

      setPhase("paying");
      let gateway;
      try {
        gateway = await openCheckout(order.intent, {
          orderNumber: order.orderNumber,
          ...student,
        });
      } catch (err) {
        setError(
          (err as Error).message === "cancelled"
            ? "Payment was cancelled. Your order is saved — you can pay again."
            : "We couldn't open the payment screen. Check your connection and try again.",
        );
        setPhase("idle");
        return;
      }

      setPhase("verifying");
      const verifyResponse = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderId: order.orderId,
          providerOrderId: order.intent.providerOrderId,
          ...gateway,
        }),
      });

      const verified = await verifyResponse.json();
      if (!verifyResponse.ok) {
        setError(verified.error ?? "We couldn't confirm your payment.");
        setPhase("idle");
        return;
      }

      clear();
      // Fresh key, so the next cart is a genuinely new order.
      idempotencyKey.current = crypto.randomUUID();
      router.replace(`${basePath}/orders/${order.orderId}?placed=1`);
      router.refresh();
    } catch {
      setError("You appear to be offline. Check your connection and try again.");
      setPhase("idle");
    }
  }

  if (lines.length === 0) {
    return (
      <div className="card mt-6">
        <EmptyState
          icon={<ShoppingBag className="size-6" />}
          title="Your cart is empty"
          body="Add something from today's menu and skip the queue."
          action={
            <Button onClick={() => router.push(`${basePath}/menu`)}>
              Browse the menu
            </Button>
          }
        />
      </div>
    );
  }

  const busy = phase !== "idle";

  return (
    <>
      <ul className="mt-6 space-y-3">
        {lines.map((line) => (
          <li key={line.id} className="card flex items-center gap-3 p-3.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold tracking-tight">{line.name}</p>
              <p className="mt-0.5 text-[13px] text-ink-3 tabular-nums">
                {formatINR(line.price)} each
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-full border border-hairline p-1">
              <button
                type="button"
                aria-label={`Decrease ${line.name}`}
                disabled={busy}
                onClick={() => setQuantity(line.id, line.quantity - 1)}
                className="press grid size-8 place-items-center rounded-full text-ink-2 disabled:opacity-40"
              >
                {line.quantity === 1 ? <Trash2 className="size-4" /> : <Minus className="size-4" />}
              </button>
              <span className="w-6 text-center text-[15px] font-semibold tabular-nums">
                {line.quantity}
              </span>
              <button
                type="button"
                aria-label={`Increase ${line.name}`}
                disabled={busy || line.quantity >= 20}
                onClick={() => setQuantity(line.id, line.quantity + 1)}
                className="press grid size-8 place-items-center rounded-full text-ink-2 disabled:opacity-40"
              >
                <Plus className="size-4" />
              </button>
            </div>

            <span className="w-16 shrink-0 text-right text-[15px] font-semibold tabular-nums">
              {formatINR(line.price * line.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="card mt-4 p-4">
        <div className="flex items-center justify-between text-[15px]">
          <span className="text-ink-3">Subtotal</span>
          <span className="tabular-nums">{formatINR(total)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
          <span className="text-[17px] font-semibold tracking-tight">Total</span>
          <span className="text-[17px] font-semibold tabular-nums">{formatINR(total)}</span>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-ink-3">
          The final amount is calculated by the canteen when your order is created.
        </p>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorNote message={error} />
          <p className="mt-2 text-center text-[13px] text-ink-3">
            Charged but no order?{" "}
            <Link href={`${basePath}/orders`} className="font-medium text-ink underline">
              Check your orders
            </Link>{" "}
            before paying again.
          </p>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-[86px] z-30 flex justify-center px-4">
        <div className="w-full max-w-md">
          <Button size="lg" fullWidth loading={busy} onClick={checkout}>
            {phase === "idle" ? `Pay ${formatINR(total)} with UPI` : PHASE_LABEL[phase]}
          </Button>
        </div>
      </div>
    </>
  );
}
