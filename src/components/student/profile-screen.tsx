import { SignOutButton } from "@/components/sign-out-button";
import type { Profile } from "@/lib/types/database";

export function ProfileScreen({ profile, demo = false }: { profile: Profile; demo?: boolean }) {
  const rows = [
    ["Name", profile.full_name || "—"],
    ["Student ID", profile.student_id ?? "—"],
    ["College email", profile.email ?? "—"],
    ["Phone", profile.phone ?? "—"],
  ] as const;

  return (
    <main className="px-5 pt-6">
      <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.02em]">Profile</h1>

      <section className="card mt-6 divide-y divide-[color:var(--color-hairline)]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 px-4 py-3.5">
            <span className="text-[15px] text-ink-3">{label}</span>
            <span className="min-w-0 truncate text-[15px] font-medium">{value}</span>
          </div>
        ))}
      </section>

      <p className="mt-4 px-1 text-[13px] leading-relaxed text-ink-3">
        Need to correct these details? Ask the canteen administrator.
      </p>

      {!demo && (
        <div className="mt-6">
          <SignOutButton />
        </div>
      )}
    </main>
  );
}
