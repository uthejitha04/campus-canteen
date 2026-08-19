/**
 * Payment provider contract. The rest of the app only ever talks to this
 * interface, so swapping Razorpay for PhonePe/Cashfree is a one-file change.
 */

export interface CreateIntentInput {
  /** Our internal order id — used as the receipt reference. */
  orderId: string;
  orderNumber: number;
  /** Rupees. Converted to the provider's smallest unit inside the adapter. */
  amount: number;
}

export interface PaymentIntent {
  provider: string;
  providerOrderId: string;
  amountInPaise: number;
  currency: "INR";
  /** Publishable key the checkout widget needs. Never the secret. */
  publicKey: string;
}

export interface VerifyInput {
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}

export interface PaymentProvider {
  readonly name: string;
  createIntent(input: CreateIntentInput): Promise<PaymentIntent>;
  /**
   * Verifies the gateway signature. This is the ONLY thing that may mark an
   * order paid — a frontend "success" callback is never sufficient.
   */
  verify(input: VerifyInput): Promise<boolean>;
}
