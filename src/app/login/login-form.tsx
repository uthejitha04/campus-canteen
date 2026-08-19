"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ErrorNote } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";
/** Password sign-in by email or roll number; phone is testing-only. */
type Method = "email" | "student_id" | "phone";

const field =
  "h-12 w-full rounded-2xl border border-hairline bg-white px-4 text-[16px] " +
  "placeholder:text-ink-4 focus:border-ink/20 focus:outline-none focus:ring-4 focus:ring-black/[0.04]";

const ERROR_FOR: Record<string, string> = {
  disabled: "This account has been disabled. Contact the canteen admin.",
  auth: "We couldn't complete that sign-in. Please try again.",
};

/**
 * Phone sign-in is a testing affordance, not a student login: Supabase only
 * accepts a code for numbers whitelisted in its dashboard, and covering every
 * student would mean paying an SMS provider per message.
 *
 * So the Phone tab appears only when this is set, and it then shows and
 * pre-fills the fixed code. Leave it unset in production — both because the
 * option would be broken for students, and because a visible code lets anyone
 * who knows a number sign in as that person.
 */
const TEST_OTP = process.env.NEXT_PUBLIC_TEST_OTP;

const SIGN_IN_METHODS: Method[] = TEST_OTP
  ? ["email", "student_id", "phone"]
  : ["email", "student_id"];

const METHOD_LABEL: Record<Method, string> = {
  email: "Email",
  student_id: "Student ID",
  phone: "Phone",
};

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>("signin");
  const [method, setMethod] = useState<Method>("email");
  const [busy, setBusy] = useState(false);
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    ERROR_FOR[params.get("error") ?? ""] ?? null,
  );

  const next = params.get("next") ?? "/";

  async function handleSignIn(form: FormData) {
    const supabase = supabaseBrowser();
    const identifier = String(form.get("identifier") ?? "").trim();

    // Supabase authenticates against an email, so a student ID is resolved to
    // the account's email first. Students never have to know that.
    let email = identifier;
    if (method === "student_id" || !identifier.includes("@")) {
      const { data } = await supabase.rpc("resolve_login_identifier", {
        p_identifier: identifier,
      });
      if (!data) {
        setError(
          method === "student_id"
            ? "We couldn't find an account with that student ID."
            : "We couldn't find an account with those details.",
        );
        return;
      }
      email = data;
    }

    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password: String(form.get("password") ?? ""),
    });

    if (err) {
      setError("Those details didn't match. Please check and try again.");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  /**
   * Phone step one: request the code. Supabase sends a real SMS in production;
   * numbers listed as test numbers in the dashboard get their fixed code
   * without any SMS being sent.
   */
  async function sendCode(form: FormData) {
    const raw = String(form.get("phone") ?? "").trim();
    // Supabase expects E.164. Assume India when no country code is given.
    const phone = raw.startsWith("+") ? raw : `+91${raw.replace(/\D/g, "")}`;

    const { error: err } = await supabaseBrowser().auth.signInWithOtp({ phone });
    if (err) {
      setError("We couldn't send the code. Check the number and try again.");
      return;
    }
    setOtpSentTo(phone);
  }

  /** Phone step two: verify it. */
  async function verifyCode(form: FormData) {
    const { error: err } = await supabaseBrowser().auth.verifyOtp({
      phone: otpSentTo!,
      token: String(form.get("code") ?? "").trim(),
      type: "sms",
    });

    if (err) {
      setError("That code wasn't right. Check it, or request a new one.");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  async function handleSignUp(form: FormData) {
    // Any email works — plenty of students won't have a college address, so
    // there is deliberately no domain restriction here.
    const { error: err } = await supabaseBrowser().auth.signUp({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
      options: {
        data: {
          full_name: String(form.get("full_name") ?? "").trim(),
          student_id: String(form.get("student_id") ?? "").trim(),
        },
      },
    });

    if (err) {
      setError(
        /already/i.test(err.message)
          ? "An account with this email already exists. Try signing in."
          : "We couldn't create your account. Please try again.",
      );
      return;
    }
    router.replace("/");
    router.refresh();
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    const form = new FormData(event.currentTarget);
    try {
      if (mode === "signup") await handleSignUp(form);
      else if (method === "phone") await (otpSentTo ? verifyCode(form) : sendCode(form));
      else await handleSignIn(form);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass-strong rounded-3xl p-6">
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-black/[0.04] p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={cn(
              "press h-9 rounded-xl text-[14px] font-medium transition-colors",
              mode === m ? "bg-white text-ink shadow-sm" : "text-ink-3",
            )}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      {mode === "signin" && (
        <div className="mb-4 flex gap-1.5">
          {SIGN_IN_METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMethod(m);
                setError(null);
                setOtpSentTo(null);
              }}
              className={cn(
                "press rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                method === m ? "bg-ink text-white" : "border border-hairline bg-white text-ink-2",
              )}
            >
              {METHOD_LABEL[m]}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        {mode === "signup" ? (
          <>
            <input name="full_name" required placeholder="Full name" className={field} />
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="Email address"
              className={field}
            />
            <input
              name="student_id"
              required
              placeholder="Student ID / roll number"
              className={field}
            />
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Password (min 8 characters)"
              className={field}
            />
            <p className="px-1 text-[13px] leading-relaxed text-ink-3">
              Any email works — college or personal. Your student ID is how staff identify you.
            </p>
          </>
        ) : method === "phone" ? (
          otpSentTo ? (
            <>
              <p className="text-[14px] leading-relaxed text-ink-3">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-ink-2">{otpSentTo}</span>.
              </p>
              <input
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                defaultValue={TEST_OTP ?? ""}
                placeholder="Enter the code"
                className={cn(field, "tracking-[0.35em]")}
              />

              {TEST_OTP && (
                <p className="rounded-xl bg-amber/10 px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-2">
                  Testing mode — the code is{" "}
                  <span className="font-semibold tabular-nums">{TEST_OTP}</span>. No SMS is sent.
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setOtpSentTo(null);
                  setError(null);
                }}
                className="text-[13px] font-medium text-ink-3"
              >
                Use a different number
              </button>
            </>
          ) : (
            <input
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder="Phone number, e.g. 9876543210"
              className={field}
            />
          )
        ) : (
          <>
            <input
              name="identifier"
              required
              inputMode={method === "email" ? "email" : "text"}
              autoComplete="username"
              placeholder={
                method === "email" ? "Email address" : "Student ID / roll number"
              }
              className={field}
            />
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Password"
              className={field}
            />
          </>
        )}

        {error && <ErrorNote message={error} />}

        <Button type="submit" size="lg" fullWidth loading={busy} className="mt-2">
          {mode === "signup"
            ? "Create account"
            : method === "phone"
              ? otpSentTo
                ? "Verify code"
                : "Send code"
              : "Sign in"}
        </Button>
      </form>

      <p className="mt-5 text-center text-[13px] leading-relaxed text-ink-3">
        Just want a look?{" "}
        <Link href="/demo" className="font-medium text-ink underline">
          Explore the demo
        </Link>
      </p>
      <p className="mt-2 text-center text-[13px] leading-relaxed text-ink-3">
        Staff and admin accounts are created by the canteen administrator.
      </p>
    </div>
  );
}

