"use client";

import { useCartStore } from "@/stores/cart-store";
import { useEffect } from "react";

export const CartHydration = () => {
  // Restore the browser storage manually because we disabled automatic store hydration
  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  return null;
};
