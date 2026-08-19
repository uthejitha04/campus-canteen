import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { FoodCard } from "@/components/student/food-card";
import { CartBar } from "@/components/student/cart-bar";
import { ActiveOrderCard } from "@/components/student/active-order-card";
import { EmptyState } from "@/components/ui/feedback";
import { greeting } from "@/lib/utils";
import type { MenuSection } from "@/lib/queries/menu";
import type { MenuItem, OrderWithItems } from "@/lib/types/database";

/**
 * The student home screen. Presentational so the live page and the signed-out
 * demo render exactly the same thing from different data sources.
 */
export function HomeScreen({
  firstName,
  sections,
  popular,
  activeOrder,
  basePath = "",
  live = true,
}: {
  firstName?: string;
  sections: MenuSection[];
  popular: MenuItem[];
  activeOrder: OrderWithItems | null;
  basePath?: string;
  live?: boolean;
}) {
  const categories = sections.filter((s) => s.items.length > 0);

  return (
    <main className="px-5 pt-6">
      <header className="rise">
        <p className="text-[15px] text-ink-3">
          {greeting()}
          {firstName ? `, ${firstName}` : ""} 👋
        </p>
        <h1 className="mt-1 text-[30px] font-semibold leading-tight tracking-[-0.02em]">
          What&apos;s for today?
        </h1>
      </header>

      {activeOrder && (
        <section className="mt-6">
          <ActiveOrderCard order={activeOrder} basePath={basePath} live={live} />
        </section>
      )}

      {categories.length > 0 && (
        <nav
          aria-label="Categories"
          className="no-scrollbar -mx-5 mt-7 flex gap-2 overflow-x-auto px-5"
        >
          {categories.map(({ category }) => (
            <Link
              key={category.id}
              href={`${basePath}/menu#${category.id}`}
              className="press shrink-0 rounded-full border border-hairline bg-white px-4 py-2 text-[14px] font-medium"
            >
              {category.name}
            </Link>
          ))}
        </nav>
      )}

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[19px] font-semibold tracking-tight">Popular today</h2>
          <Link
            href={`${basePath}/menu`}
            className="flex items-center text-[14px] font-medium text-ink-3"
          >
            Full menu <ChevronRight className="size-4" />
          </Link>
        </div>

        {popular.length === 0 ? (
          <div className="card">
            <EmptyState
              title="Today's menu hasn't been updated yet"
              body="Check back in a little while — the canteen is still setting up."
            />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {popular.map((item) => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <CartBar basePath={basePath} />
    </main>
  );
}
