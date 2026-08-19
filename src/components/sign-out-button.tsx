"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useCart } from "@/lib/store/cart";
import { Button } from "@/components/ui/button";

export function SignOutButton({ label = "Sign out" }: { label?: string }) {
  const router = useRouter();
  const clearCart = useCart((s) => s.clear);
  const [busy, setBusy] = useState(false);

  return (
    <Button
      variant="secondary"
      fullWidth
      loading={busy}
      onClick={async () => {
        setBusy(true);
        clearCart();
        await supabaseBrowser().auth.signOut();
        router.replace("/login");
        router.refresh();
      }}
    >
      {label}
    </Button>
  );
}
