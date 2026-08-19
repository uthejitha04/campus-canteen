"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Notification } from "@/lib/types/database";

/**
 * In-app notification stream. Rows are written by the database when an order
 * turns `ready` — the only event worth interrupting a student for.
 *
 * The same rows are the delivery record a Web Push worker would read later, so
 * adding push is a transport change, not a rewrite.
 */
export function useNotifications(userId: string | undefined) {
  const [items, setItems] = useState<Notification[]>([]);
  const [toast, setToast] = useState<Notification | null>(null);

  useEffect(() => {
    if (!userId) return;
    const supabase = supabaseBrowser();
    let cancelled = false;

    void supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (!cancelled && data) setItems(data as Notification[]);
      });

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const notification = payload.new as Notification;
          setItems((prev) => [notification, ...prev]);
          setToast(notification);
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate?.(120);
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const dismissToast = useCallback(() => setToast(null), []);

  const markRead = useCallback(async (id: string) => {
    const supabase = supabaseBrowser();
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
    );
  }, []);

  return { items, toast, dismissToast, markRead, unread: items.filter((n) => !n.read_at).length };
}
