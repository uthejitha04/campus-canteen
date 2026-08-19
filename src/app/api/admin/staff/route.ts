import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { friendlyError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(80),
  password: z.string().min(8).max(72),
  counterIds: z.array(z.string().uuid()).min(1),
});

const updateSchema = z.object({
  staffId: z.string().uuid(),
  isActive: z.boolean(),
});

/** Confirms the caller is an admin. Reads go through RLS, not the service role. */
async function requireAdmin() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  return data?.role === "admin" && data.is_active ? user : null;
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "You don't have access to do that." }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the staff details and try again." }, { status: 400 });
  }
  const { email, fullName, password, counterIds } = parsed.data;

  const admin = supabaseAdmin();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error || !created.user) {
    return NextResponse.json({ error: friendlyError(error) }, { status: 409 });
  }

  // The signup trigger created a `student` profile; promote it.
  await admin
    .from("profiles")
    .update({ role: "staff", full_name: fullName, student_id: null })
    .eq("id", created.user.id);

  await admin
    .from("staff_counters")
    .insert(counterIds.map((counter_id) => ({ staff_id: created.user!.id, counter_id })));

  return NextResponse.json({ id: created.user.id });
}

/** Enable or disable a staff account. Accounts are never hard-deleted. */
export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "You don't have access to do that." }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { error } = await admin
    .from("profiles")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.staffId)
    .eq("role", "staff");

  if (error) {
    return NextResponse.json({ error: friendlyError(error) }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
