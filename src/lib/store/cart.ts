"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  id: string;
  name: string;
  /** Display only. The server re-prices every line at checkout. */
  price: number;
  imageUrl: string | null;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  add: (item: Omit<CartLine, "quantity">) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const MAX_PER_ITEM = 20;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],

      add: (item) =>
        set((state) => {
          const existing = state.lines.find((l) => l.id === item.id);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.id === item.id
                  ? { ...l, quantity: Math.min(l.quantity + 1, MAX_PER_ITEM) }
                  : l,
              ),
            };
          }
          return { lines: [...state.lines, { ...item, quantity: 1 }] };
        }),

      setQuantity: (id, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.id !== id)
              : state.lines.map((l) =>
                  l.id === id ? { ...l, quantity: Math.min(quantity, MAX_PER_ITEM) } : l,
                ),
        })),

      remove: (id) => set((state) => ({ lines: state.lines.filter((l) => l.id !== id) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "canteen-cart" },
  ),
);

export const cartCount = (lines: CartLine[]) =>
  lines.reduce((n, l) => n + l.quantity, 0);

/** Indicative total for the cart UI. Authoritative total comes from the server. */
export const cartTotal = (lines: CartLine[]) =>
  lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
