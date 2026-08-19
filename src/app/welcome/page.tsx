import { redirect } from "next/navigation";
import { getProfile, homeFor } from "@/lib/auth";
import { WelcomeForm } from "./welcome-form";

export const metadata = { title: "One last thing · Campus Canteen" };

/**
 * Shown once, after a Google sign-in, to collect the student ID that a Google
 * account doesn't carry. Staff use it at the counter, and it doubles as a way
 * to sign in later.
 */
export default async function WelcomePage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "student") redirect(homeFor(profile.role));
  if (profile.student_id) redirect("/");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="rise">
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">
          One last thing
        </h1>
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink-3">
          Add your student ID so the canteen can match orders to you. You&apos;ll be able to
          sign in with it too.
        </p>

        <div className="mt-7">
          <WelcomeForm name={profile.full_name} />
        </div>
      </div>
    </main>
  );
}
