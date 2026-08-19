import { getDashboard } from "@/lib/queries/analytics";
import { DashboardScreen } from "@/components/admin/dashboard-screen";

export default async function AdminDashboard() {
  return <DashboardScreen data={await getDashboard()} />;
}
