import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types/database";

/** The signed-in profile, or null. Never throws. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile | null) ?? null;
}

const HOME_FOR: Record<UserRole, string> = {
  student: "/",
  staff: "/staff",
  admin: "/admin",
};

export function homeFor(role: UserRole) {
  return HOME_FOR[role];
}

/**
 * Server-side gate for a page. This is defence in depth — the database's RLS
 * policies are the real boundary; this just avoids rendering the wrong shell.
 */
export async function requireRole(...allowed: UserRole[]): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!profile.is_active) redirect("/login?error=disabled");
  if (!allowed.includes(profile.role)) redirect(homeFor(profile.role));
  // Google accounts arrive without a roll number; collect it once before
  // letting anyone order.
  if (profile.role === "student" && !profile.student_id) redirect("/welcome");
  return profile;
}
