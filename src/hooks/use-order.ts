"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { OrderWithItems } from "@/lib/types/database";
import type { ConnectionState } from "./use-realtime-orders";

/**
 * A single order, kept live. Seeded from the server render so the tracking
 * screen paints instantly and never flashes a spinner on navigation.
 */
export function useOrder(orderId: string, initial: OrderWithItems, live = true) {
  const [order, setOrder] = useState(initial);
  const [connection, setConnection] = useState<ConnectionState>("connecting");

  useEffect(() => {
    // The signed-out demo renders the same component against fixtures.
    if (!live) {
      setConnection("live");
      return;
    }

    const supabase = supabaseBrowser();
    let cancelled = false;

    async function refresh() {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", orderId)
        .single();
      if (!cancelled && data) setOrder(data as OrderWithItems);
    }

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        () => void refresh(),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnection("live");
          // Catch anything missed while the socket was down.
          void refresh();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnection("offline");
        }
      });

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [orderId, live]);

  return { order, connection };
}
