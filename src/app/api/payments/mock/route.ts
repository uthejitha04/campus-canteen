import { NextResponse } from "next/server";
import { z } from "zod";
import { mockSignature } from "@/lib/payments/mock";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ providerOrderId: z.string().min(1) });

/**
 * Stands in for the gateway callback when PAYMENT_PROVIDER=mock, so the whole
 * flow (intent → signature → server verification) can be exercised locally.
 * Refuses to run in any other configuration.
 */
export async function POST(request: Request) {
  if (process.env.PAYMENT_PROVIDER !== "mock") {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const providerPaymentId = `mock_pay_${crypto.randomUUID()}`;
  return NextResponse.json({
    providerPaymentId,
    signature: mockSignature(parsed.data.providerOrderId, providerPaymentId),
  });
}
