import Link from "next/link";
import { LayoutGrid, ChefHat, Smartphone, ArrowRight } from "lucide-react";

export const metadata = {
  title: "All portals · Campus Canteen",
  robots: { index: false, follow: false },
};

const PORTALS = [
  {
    href: "/demo",
    label: "Student",
    icon: Smartphone,
    who: "What a student sees on their phone",
    detail: "Menu, cart, UPI checkout, live order tracking, order history.",
  },
  {
    href: "/demo/staff",
    label: "Kitchen",
    icon: ChefHat,
    who: "What the counter staff sees",
    detail: "Live order queue, big status buttons, out-of-stock switches.",
  },
  {
    href: "/demo/admin",
    label: "Admin",
    icon: LayoutGrid,
    who: "What you see as the canteen admin",
    detail: "Menu and prices, staff accounts, orders, revenue and analytics.",
  },
] as const;

/**
 * One entry point into all three portals, for review and demos. It is not part
 * of the product: in real use a person only ever has one role, and the portals
 * stay strictly separate.
 */
export default function PortalsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14">
      <header className="rise">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-3">
          Campus Canteen
        </p>
        <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-[-0.02em]">
          All three portals
        </h1>
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-ink-3">
          Sample data, no sign-in needed. Open any portal and use it as that person would.
        </p>
      </header>

      <div className="mt-9 grid gap-3">
        {PORTALS.map(({ href, label, icon: Icon, who, detail }) => (
          <Link
            key={href}
            href={href}
            className="press card group flex items-center gap-4 p-5"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-black/[0.04] text-ink-2">
              <Icon className="size-[22px]" strokeWidth={1.8} />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-[18px] font-semibold tracking-tight">{label}</span>
              <span className="mt-0.5 block text-[14px] text-ink-2">{who}</span>
              <span className="mt-1 block text-[13px] leading-relaxed text-ink-3">{detail}</span>
            </span>

            <ArrowRight className="size-5 shrink-0 text-ink-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>

      <p className="mt-8 rounded-2xl border border-hairline bg-white/60 px-5 py-4 text-[13px] leading-relaxed text-ink-3">
        This page exists only for reviewing the app. In real use nobody sees this: a student
        who opens the kitchen or admin address is turned away, and the database refuses the
        data even if they get past the screen.
      </p>

      <p className="mt-6 text-center text-[14px] text-ink-3">
        <Link href="/login" className="font-medium text-ink underline">
          Go to the real sign-in
        </Link>
      </p>
    </main>
  );
}
