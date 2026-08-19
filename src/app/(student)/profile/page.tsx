import { getProfile } from "@/lib/auth";
import { ProfileScreen } from "@/components/student/profile-screen";

export const metadata = { title: "Profile · Campus Canteen" };

export default async function ProfilePage() {
  const profile = await getProfile();
  if (!profile) return null;

  return <ProfileScreen profile={profile} />;
}
