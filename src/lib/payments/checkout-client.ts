"use client";

import type { PaymentIntent } from "./provider";

export interface GatewayResult {
  providerPaymentId: string;
  signature: string;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("network"));
    document.body.appendChild(script);
  });
}

/**
 * Opens the UPI checkout and resolves with what the gateway returned. Nothing
 * here decides whether the order is paid — the result is handed to the server
 * for signature verification.
 */
export async function openCheckout(
  intent: PaymentIntent,
  context: { orderNumber: number; name: string; email: string | null },
): Promise<GatewayResult> {
  if (intent.provider === "mock") {
    const response = await fetch("/api/payments/mock", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ providerOrderId: intent.providerOrderId }),
    });
    if (!response.ok) throw new Error("mock checkout failed");
    return (await response.json()) as GatewayResult;
  }

  await loadRazorpayScript();

  return new Promise<GatewayResult>((resolve, reject) => {
    const razorpay = new window.Razorpay!({
      key: intent.publicKey,
      amount: intent.amountInPaise,
      currency: intent.currency,
      name: "Campus Canteen",
      description: `Order #${context.orderNumber}`,
      order_id: intent.providerOrderId,
      // UPI first — that is how everyone on campus actually pays.
      config: { display: { blocks: {}, sequence: ["block.upi"], preferences: { show_default_blocks: true } } },
      prefill: { name: context.name, email: context.email ?? undefined },
      theme: { color: "#ff6b35" },
      modal: {
        ondismiss: () => reject(new Error("cancelled")),
      },
      handler: (response: Record<string, string>) =>
        resolve({
          providerPaymentId: response.razorpay_payment_id!,
          signature: response.razorpay_signature!,
        }),
    });

    razorpay.open();
  });
}
