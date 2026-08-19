import { FoodCard } from "@/components/student/food-card";
import { CartBar } from "@/components/student/cart-bar";
import { EmptyState } from "@/components/ui/feedback";
import type { MenuSection } from "@/lib/queries/menu";

export function MenuScreen({
  sections,
  basePath = "",
}: {
  sections: MenuSection[];
  basePath?: string;
}) {
  const visible = sections.filter((s) => s.items.length > 0);

  return (
    <main className="px-5 pt-6">
      <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.02em]">Menu</h1>
      <p className="mt-1 text-[15px] text-ink-3">Everything the canteen is serving today.</p>

      {visible.length === 0 ? (
        <div className="card mt-6">
          <EmptyState
            title="Today's menu hasn't been updated yet"
            body="The canteen adds items each morning. Check back shortly."
          />
        </div>
      ) : (
        <div className="mt-7 space-y-8">
          {visible.map(({ category, items }) => {
            const available = items.filter((i) => i.is_available).length;
            return (
              // scroll-mt clears the sticky header when jumping from home
              <section key={category.id} id={category.id} className="scroll-mt-20">
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 className="text-[19px] font-semibold tracking-tight">{category.name}</h2>
                  <span className="text-[13px] text-ink-3">
                    {available} of {items.length} available
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((item) => (
                    <FoodCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <CartBar basePath={basePath} />
    </main>
  );
}
