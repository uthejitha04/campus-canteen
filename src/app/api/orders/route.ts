import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { paymentProvider } from "@/lib/payments";
import { friendlyError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        menu_item_id: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(30),
  // Generated once per checkout attempt on the client. A double-tap replays the
  // same key and gets the same order back instead of creating a second one.
  idempotencyKey: z.string().min(8).max(64),
});

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
    return NextResponse.json({ error: "That cart doesn't look right." }, { status: 400 });
  }
  const { items, idempotencyKey } = parsed.data;

  // create_order() re-prices every line from menu_items and rejects anything
  // unavailable. Client-supplied prices are never read.
  const { data, error } = await supabase.rpc("create_order", {
    p_items: items,
    p_idempotency_key: idempotencyKey,
  });

  if (error || !data?.[0]) {
    return NextResponse.json({ error: friendlyError(error) }, { status: 409 });
  }

  const { order_id: orderId, order_number: orderNumber, total } = data[0];
  const amount = Number(total);

  try {
    const provider = paymentProvider();
    const intent = await provider.createIntent({ orderId, orderNumber, amount });

    // Payment rows are written with the service role: the student must never be
    // able to author their own payment record.
    const admin = supabaseAdmin();
    await admin.from("payments").upsert(
      {
        order_id: orderId,
        provider: intent.provider,
        provider_order_id: intent.providerOrderId,
        amount,
        status: "pending",
      },
      { onConflict: "order_id" },
    );

    return NextResponse.json({ orderId, orderNumber, amount, intent });
  } catch (err) {
    return NextResponse.json(
      { error: friendlyError(err, "We couldn't start the payment. Please try again.") },
      { status: 502 },
    );
  }
}
