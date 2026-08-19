import { StaffManager } from "@/components/admin/staff-manager";
import { demoAssignments, demoCounters, demoStaff } from "@/lib/demo/fixtures";

export default function DemoAdminStaffPage() {
  return (
    <StaffManager
      staff={demoStaff}
      counters={demoCounters}
      assignments={demoAssignments}
      demo
    />
  );
}
