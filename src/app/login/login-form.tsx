"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ErrorNote } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";
/** The two password-based ways in. Google is the third option, above these. */
type Method = "email" | "student_id";

const field =
  "h-12 w-full rounded-2xl border border-hairline bg-white px-4 text-[16px] " +
  "placeholder:text-ink-4 focus:border-ink/20 focus:outline-none focus:ring-4 focus:ring-black/[0.04]";

const ERROR_FOR: Record<string, string> = {
  disabled: "This account has been disabled. Contact the canteen admin.",
  auth: "We couldn't complete that sign-in. Please try again.",
};

const METHOD_LABEL: Record<Method, string> = {
  email: "Email",
  student_id: "Student ID",
};

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>("signin");
  const [method, setMethod] = useState<Method>("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    ERROR_FOR[params.get("error") ?? ""] ?? null,
  );

  const next = params.get("next") ?? "/";

  async function signInWithGoogle() {
    setBusy(true);
    setError(null);

    const { error: err } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (err) {
      setError("We couldn't reach Google. Please try again.");
      setBusy(false);
    }
    // On success the browser leaves for Google, so there is nothing else to do.
  }

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
      await (mode === "signup" ? handleSignUp(form) : handleSignIn(form));
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

      <Button variant="secondary" size="lg" fullWidth disabled={busy} onClick={signInWithGoogle}>
        <GoogleMark />
        Continue with Google
      </Button>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-[color:var(--color-hairline)]" />
        <span className="text-[12px] uppercase tracking-[0.1em] text-ink-3">or</span>
        <span className="h-px flex-1 bg-[color:var(--color-hairline)]" />
      </div>

      {mode === "signin" && (
        <div className="mb-4 flex gap-1.5">
          {(["email", "student_id"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMethod(m);
                setError(null);
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
          {mode === "signup" ? "Create account" : "Sign in"}
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

/** Google's mark, inlined — the CSP blocks remote images. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" className="size-[18px]" aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
