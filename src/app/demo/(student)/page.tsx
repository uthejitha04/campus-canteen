import { HomeScreen } from "@/components/student/home-screen";
import {
  demoActiveOrder,
  demoMenuItems,
  demoProfile,
  demoSections,
} from "@/lib/demo/fixtures";

export default function DemoHomePage() {
  return (
    <HomeScreen
      firstName={demoProfile.full_name.split(" ")[0]}
      sections={demoSections}
      popular={demoMenuItems.filter((i) => i.is_available).slice(0, 6)}
      activeOrder={demoActiveOrder}
      basePath="/demo"
      live={false}
    />
  );
}
