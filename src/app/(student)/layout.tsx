import { requireRole } from "@/lib/auth";
import { BottomNav } from "@/components/student/bottom-nav";
import { NotificationHost } from "@/components/student/notification-host";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("student");

  return (
    <div className="mx-auto min-h-dvh w-full max-w-2xl">
      <NotificationHost userId={profile.id} />
      {/* pb clears the floating tab bar on every viewport */}
      <div className="pb-28">{children}</div>
      <BottomNav />
    </div>
  );
}
