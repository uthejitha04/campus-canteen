import { ProfileScreen } from "@/components/student/profile-screen";
import { demoProfile } from "@/lib/demo/fixtures";

export default function DemoProfilePage() {
  return <ProfileScreen profile={demoProfile} demo />;
}
