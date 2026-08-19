import "server-only";

import type { PaymentProvider } from "./provider";
import { createMockProvider } from "./mock";
import { createRazorpayProvider } from "./razorpay";

let provider: PaymentProvider | null = null;

export function paymentProvider(): PaymentProvider {
  if (!provider) {
    provider =
      process.env.PAYMENT_PROVIDER === "mock"
        ? createMockProvider()
        : createRazorpayProvider();
  }
  return provider;
}

export type { PaymentProvider, PaymentIntent } from "./provider";
