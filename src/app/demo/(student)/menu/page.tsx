import { MenuScreen } from "@/components/student/menu-screen";
import { demoSections } from "@/lib/demo/fixtures";

export default function DemoMenuPage() {
  return <MenuScreen sections={demoSections} basePath="/demo" />;
}
