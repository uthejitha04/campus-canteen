import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · Campus Canteen" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="rise">
        <div className="mb-9">
          <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-ink text-lg text-white">
            🍽
          </div>
          <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.02em]">
            Campus Canteen
          </h1>
          <p className="mt-1.5 text-[15px] text-ink-3">Order ahead. Skip the queue.</p>
        </div>

        <Suspense fallback={<div className="shimmer h-72 rounded-3xl" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
