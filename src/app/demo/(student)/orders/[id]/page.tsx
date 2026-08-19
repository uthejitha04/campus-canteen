import { notFound } from "next/navigation";
import { OrderTracker } from "@/components/student/order-tracker";
import { demoStudentOrders } from "@/lib/demo/fixtures";

export default async function DemoOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = demoStudentOrders.find((o) => o.id === id);
  if (!order) notFound();

  return <OrderTracker initial={order} basePath="/demo" live={false} />;
}
