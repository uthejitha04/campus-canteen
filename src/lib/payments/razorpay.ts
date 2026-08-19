import "server-only";

import crypto from "node:crypto";
import Razorpay from "razorpay";
import type { CreateIntentInput, PaymentIntent, PaymentProvider, VerifyInput } from "./provider";

export function createRazorpayProvider(): PaymentProvider {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys are not configured");
  }

  const client = new Razorpay({ key_id: keyId, key_secret: keySecret });

  return {
    name: "razorpay",

    async createIntent({ orderId, orderNumber, amount }: CreateIntentInput): Promise<PaymentIntent> {
      const amountInPaise = Math.round(amount * 100);
      const rzpOrder = await client.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: orderId,
        notes: { order_number: String(orderNumber) },
      });

      return {
        provider: "razorpay",
        providerOrderId: rzpOrder.id,
        amountInPaise,
        currency: "INR",
        publicKey: keyId,
      };
    },

    async verify({ providerOrderId, providerPaymentId, signature }: VerifyInput) {
      const expected = crypto
        .createHmac("sha256", keySecret)
        .update(`${providerOrderId}|${providerPaymentId}`)
        .digest("hex");

      const a = Buffer.from(expected, "utf8");
      const b = Buffer.from(signature, "utf8");
      // Length check first: timingSafeEqual throws on a length mismatch.
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    },
  };
}
