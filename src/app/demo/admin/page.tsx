import { DashboardScreen } from "@/components/admin/dashboard-screen";
import { demoDashboard } from "@/lib/demo/fixtures";

export default function DemoAdminDashboard() {
  return <DashboardScreen data={demoDashboard} basePath="/demo" />;
}
