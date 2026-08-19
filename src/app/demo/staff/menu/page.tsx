import { AvailabilityList } from "@/components/staff/availability-list";
import { demoSections } from "@/lib/demo/fixtures";

export default function DemoStaffMenuPage() {
  return (
    <div>
      <h1 className="text-[22px] font-semibold tracking-tight">Menu availability</h1>
      <p className="mt-1 text-[14px] text-ink-3">
        Turn an item off the moment it runs out — students can&apos;t order it after that.
      </p>
      <div className="mt-5">
        <AvailabilityList sections={demoSections} demo />
      </div>
    </div>
  );
}
