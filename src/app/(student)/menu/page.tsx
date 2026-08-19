import { getMenu } from "@/lib/queries/menu";
import { MenuScreen } from "@/components/student/menu-screen";

export const metadata = { title: "Menu · Campus Canteen" };

export default async function MenuPage() {
  return <MenuScreen sections={await getMenu()} />;
}
