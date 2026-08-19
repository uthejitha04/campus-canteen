import { BottomNav } from "@/components/student/bottom-nav";
import { DemoBar } from "@/components/demo/demo-bar";

export default function DemoStudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBar portal="Student" />
      <div className="mx-auto min-h-dvh w-full max-w-2xl">
        <div className="pb-28">{children}</div>
        <BottomNav basePath="/demo" />
      </div>
    </>
  );
}
