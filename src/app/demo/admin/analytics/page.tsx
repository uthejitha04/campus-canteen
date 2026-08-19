import { AnalyticsScreen } from "@/components/admin/analytics-screen";
import { demoDashboard } from "@/lib/demo/fixtures";

export default function DemoAnalyticsPage() {
  return <AnalyticsScreen data={demoDashboard} />;
}
