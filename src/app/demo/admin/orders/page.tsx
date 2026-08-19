import {
  ORDER_FILTERS,
  OrdersTable,
  type OrderFilterKey,
} from "@/components/admin/orders-table";
import { demoCompletedToday, demoQueue } from "@/lib/demo/fixtures";

const ALL = [...demoQueue, ...demoCompletedToday].sort((a, b) =>
  b.created_at.localeCompare(a.created_at),
);

export default async function DemoAdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const active: OrderFilterKey = ORDER_FILTERS.find((f) => f.key === filter)?.key ?? "today";

  const orders =
    active === "pending"
      ? ALL.filter((o) => o.status !== "picked_up")
      : active === "completed"
        ? ALL.filter((o) => o.status === "picked_up")
        : ALL;

  return <OrdersTable orders={orders} active={active} basePath="/demo" />;
}
