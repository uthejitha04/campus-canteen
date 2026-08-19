export const metadata = {
  title: "Demo · Campus Canteen",
  // A walkthrough of sample data should never be indexed as the real app.
  robots: { index: false, follow: false },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh">{children}</div>;
}
