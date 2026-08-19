import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { NEXT_STATUS, type OrderStatus } from "@/lib/types/database";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  status: z.enum(["preparing", "ready", "picked_up"]),
  /** The status the client believed the order was in — guards double taps. */
  from: z.enum(["received", "preparing", "ready"]),
});

/**
 * Staff-only status advance. Authority comes from RLS (staff may only touch
 * orders containing an item from their counter) plus the database trigger that
 * rejects any transition other than the single legal next step.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status change." }, { status: 400 });
  }
  const { status, from } = parsed.data;

  if (NEXT_STATUS[from as OrderStatus] !== status) {
    return NextResponse.json({ error: "That status change isn't allowed." }, { status: 409 });
  }

  // Conditional on the expected current status, so two staff phones tapping the
  // same button only advance the order once.
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .eq("status", from)
    .select("id, order_number, status")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: friendlyError(error) }, { status: 409 });
  }
  if (!data) {
    return NextResponse.json(
      { error: "This order was already updated by someone else." },
      { status: 409 },
    );
  }

  return NextResponse.json(data);
}
