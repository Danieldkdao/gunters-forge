"use client";

import { useCartStore } from "@/stores/cart-store";
import { useEffect } from "react";

export const CartHydration = () => {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  return null;
};
