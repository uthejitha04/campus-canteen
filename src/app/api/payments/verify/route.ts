import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { paymentProvider } from "@/lib/payments";
import { friendlyError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  orderId: z.string().uuid(),
  providerOrderId: z.string().min(1),
  providerPaymentId: z.string().min(1),
  signature: z.string().min(1),
});

/**
 * The only place an order becomes `paid`. The decision rests entirely on the
 * gateway signature checked here on the server — the browser's "success"
 * callback is treated as an untrusted hint that verification should run.
 */
export async function POST(request: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment confirmation." }, { status: 400 });
  }
  const { orderId, providerOrderId, providerPaymentId, signature } = parsed.data;

  const admin = supabaseAdmin();

  const { data: order } = await admin
    .from("orders")
    .select("id, order_number, student_id, payment_status, total_amount")
    .eq("id", orderId)
    .single();

  if (!order || order.student_id !== user.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // Replayed confirmation (double callback, refresh mid-redirect): report the
  // existing outcome rather than paying or failing twice.
  if (order.payment_status === "paid") {
    return NextResponse.json({ status: "paid", orderNumber: order.order_number });
  }

  const { data: payment } = await admin
    .from("payments")
    .select("provider_order_id, amount")
    .eq("order_id", orderId)
    .single();

  // The provider order id must be the one we minted for this order.
  if (!payment || payment.provider_order_id !== providerOrderId) {
    return NextResponse.json({ error: "Payment reference mismatch." }, { status: 400 });
  }

  let valid = false;
  try {
    valid = await paymentProvider().verify({ providerOrderId, providerPaymentId, signature });
  } catch (err) {
    return NextResponse.json({ error: friendlyError(err) }, { status: 502 });
  }

  if (!valid) {
    await admin
      .from("payments")
      .update({
        status: "failed",
        provider_payment_id: providerPaymentId,
        failure_reason: "signature_mismatch",
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId);
    await admin.from("orders").update({ payment_status: "failed" }).eq("id", orderId);

    return NextResponse.json(
      {
        error:
          "Something went wrong while confirming your payment. If money was deducted, show this screen to the canteen staff.",
      },
      { status: 402 },
    );
  }

  await admin
    .from("payments")
    .update({
      status: "paid",
      provider_payment_id: providerPaymentId,
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", orderId);

  // Only now does the order enter the kitchen queue and appear on staff screens.
  await admin
    .from("orders")
    .update({ payment_status: "paid", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  return NextResponse.json({ status: "paid", orderNumber: order.order_number });
}
