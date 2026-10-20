"use client";

import { CartItemSchema } from "@/features/cart/actions/schemas";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type CartStore = {
  items: CartItemSchema[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearItem: (productId: string) => void;
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
      // Decrements quantity by 1, once quantity hits 0 the product is automatically removed from the cart
      removeItem: (productId) =>
        set((state) => {
          const canClear = state.items.some(
            (item) => item.productId === productId && item.quantity <= 1,
          );

          return {
            items: canClear
              ? state.items.filter((item) => item.productId !== productId)
              : state.items.map((item) =>
                  item.productId === productId
                    ? { ...item, quantity: item.quantity - 1 }
                    : item,
                ),
          };
        }),
      clearItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "gunters-forge-cart",
      storage: createJSONStorage(() => localStorage),
      // Make sure that each page load checks localStorage before treating the cart as ready
      partialize: (state) => ({ items: state.items }),
      skipHydration: true,
      // Callback runs after restoration, the cart is only ready if hydration succeeds
      onRehydrateStorage: () => (state, error) => {
        if (!error) {
          state?.setHasHydrated(true);
        }
      },
    },
  ),
);
