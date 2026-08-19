import { OrdersScreen } from "@/components/student/orders-screen";
import { demoStudentOrders } from "@/lib/demo/fixtures";

export default function DemoOrdersPage() {
  return <OrdersScreen orders={demoStudentOrders} basePath="/demo" />;
}
