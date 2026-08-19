import "server-only";

import crypto from "node:crypto";
import type { CreateIntentInput, PaymentIntent, PaymentProvider, VerifyInput } from "./provider";

/**
 * Local-development provider. It runs the real code path — intent, signature,
 * server-side verification — without a gateway account, so the whole order
 * flow can be tested end to end. Never selected unless PAYMENT_PROVIDER=mock.
 */
const SECRET = "mock_secret_do_not_use_in_production";

export function createMockProvider(): PaymentProvider {
  return {
    name: "mock",

    async createIntent({ orderId, amount }: CreateIntentInput): Promise<PaymentIntent> {
      return {
        provider: "mock",
        providerOrderId: `mock_order_${orderId}`,
        amountInPaise: Math.round(amount * 100),
        currency: "INR",
        publicKey: "mock_key",
      };
    },

    async verify({ providerOrderId, providerPaymentId, signature }: VerifyInput) {
      const expected = crypto
        .createHmac("sha256", SECRET)
        .update(`${providerOrderId}|${providerPaymentId}`)
        .digest("hex");
      return expected === signature;
    },
  };
}

/** Used by the mock checkout screen to produce a signature the server accepts. */
export function mockSignature(providerOrderId: string, providerPaymentId: string) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`${providerOrderId}|${providerPaymentId}`)
    .digest("hex");
}
