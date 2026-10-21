"use client";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "@/components/ui/toast";
import { PlusIcon } from "lucide-react";

export const AddToCartButton = ({ productId, quantity = 1, size = "default" }: {
  productId: string;
  quantity?: number;
  size?: "default" | "lg";
}) => {
  const addItem = useCartStore((state) => state.addItem);
  const hasHydrated = useCartStore((state) => state.hasHydrated);

  const inCart = useCartStore((state) => state.items.find((item) => item.productId === productId)?.quantity ?? 0);

  return (
    <Button type="button" size={size} disabled={!hasHydrated || inCart + quantity > 999} onClick={() => {
      addItem(productId, quantity);
      toast.success("Added to your cart.");
    }}>
      <PlusIcon aria-hidden="true" />
      Add to Cart
    </Button>
  );
};
