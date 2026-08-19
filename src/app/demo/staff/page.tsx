import { StaffQueue } from "@/components/staff/staff-queue";
import { demoCompletedToday, demoCounters, demoQueue } from "@/lib/demo/fixtures";

export default function DemoStaffPage() {
  return (
    <StaffQueue
      // This account covers North Indian and Coffee & Juices, not South
      // Indian — so those lines show as another counter's work.
      counterIds={[demoCounters[0]!.id, demoCounters[2]!.id]}
      completedToday={demoCompletedToday}
      demoOrders={demoQueue}
    />
  );
}
