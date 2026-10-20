"use client";

import z from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const cartItemSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().positive().min(1),
});
export type CartItemSchema = z.infer<typeof cartItemSchema>;

type CartStore = {
  items: CartItemSchema[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      addItem: (productId) =>
        set((state) => {
          const exists = state.items.some(
            (item) => item.productId === productId,
          );

          return {
            items: exists
              ? state.items.map((item) =>
                  item.productId === productId
                    ? { ...item, quantity: item.quantity + 1 }
                    : item,
                )
              : [...state.items, { productId, quantity: 1 }],
          };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "gunters-forge-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      skipHydration: true,
      onRehydrateStorage: (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
