import { MenuManager } from "@/components/admin/menu-manager";
import { demoCategories, demoCounters, demoMenuItems } from "@/lib/demo/fixtures";

export default function DemoAdminMenuPage() {
  return (
    <MenuManager
      counters={demoCounters}
      categories={demoCategories}
      items={demoMenuItems}
      demo
    />
  );
}
