"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { OrderWithItems } from "@/lib/types/database";

export type ConnectionState = "connecting" | "live" | "offline";

type Scope =
  | { kind: "student"; studentId: string }
  | { kind: "queue" }
  /** Signed-out walkthrough: same component, fixture rows, no subscription. */
  | { kind: "demo"; seed: OrderWithItems[] };

const SELECT = "*, order_items(*)";

/**
 * Live order list. Realtime carries the change event; the row itself is
 * re-fetched through RLS so a client can never receive an order it may not see.
 */
export function useRealtimeOrders(scope: Scope) {
  const [orders, setOrders] = useState<OrderWithItems[] | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [error, setError] = useState<string | null>(null);
  const scopeRef = useRef(scope);
  scopeRef.current = scope;

  useEffect(() => {
    if (scopeRef.current.kind === "demo") {
      setOrders(scopeRef.current.seed);
      setConnection("live");
      return;
    }

    const supabase = supabaseBrowser();
    let cancelled = false;

    async function load() {
      if (scopeRef.current.kind === "demo") return;

      const query = supabase
        .from("orders")
        .select(SELECT)
        .order("created_at", { ascending: false });

      const { data, error: err } =
        scopeRef.current.kind === "student"
          ? await query.eq("student_id", scopeRef.current.studentId)
          : await query.eq("payment_status", "paid").neq("status", "picked_up");

      if (cancelled) return;
      if (err) {
        setError("We couldn't load your orders. Pull to refresh.");
        return;
      }
      setError(null);
      setOrders((data ?? []) as OrderWithItems[]);
    }

    void load();

    const channel = supabase
      .channel(`orders-${scope.kind}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        void load();
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setConnection("live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setConnection("offline");
      });

    // A tab that slept through a status change reconciles on focus.
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      void supabase.removeChannel(channel);
    };
  }, [scope.kind, scope.kind === "student" ? scope.studentId : ""]);

  return { orders, connection, error };
}
