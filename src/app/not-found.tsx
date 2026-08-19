import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-[22px] font-semibold tracking-tight">We couldn&apos;t find that</h1>
      <p className="mt-1.5 text-[15px] text-ink-3">
        The page or order you&apos;re looking for isn&apos;t here.
      </p>
      <Link href="/" className="mt-6 w-full">
        <Button fullWidth>Back to the menu</Button>
      </Link>
    </main>
  );
}
