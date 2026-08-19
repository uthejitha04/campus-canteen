"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";

let cached: ReturnType<typeof createBrowserClient<Database>> | null = null;

/** Browser Supabase client. Uses the anon key — every read goes through RLS. */
export function supabaseBrowser() {
  cached ??= createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return cached;
}
