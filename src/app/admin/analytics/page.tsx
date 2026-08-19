import { getDashboard } from "@/lib/queries/analytics";
import { AnalyticsScreen } from "@/components/admin/analytics-screen";

export default async function AnalyticsPage() {
  return <AnalyticsScreen data={await getDashboard()} />;
}
