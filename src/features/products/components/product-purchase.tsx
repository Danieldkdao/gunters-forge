"use client";

import Link from "next/link";
import { useState } from "react";
import { AddToCartButton } from "@/features/cart/components/add-to-cart-button";
import { formatPrice } from "../lib/formatters";
import { useCartStore } from "@/stores/cart-store";
import { ProductQuantity } from "./product-quantity";
import { cn } from "@/lib/utils";

export const ProductPurchase = ({
  productId,
  name,
  price,
  className,
}: {
  productId: string;
  name: string;
  price: number;
  className?: string;
}) => {
  const [quantity, setQuantity] = useState(1);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const inCart = useCartStore(
    (state) =>
      state.items.find((item) => item.productId === productId)?.quantity ?? 0,
  );
  const remaining = 999 - inCart;
  return (
    <div className={cn("space-y-4 border-t pt-6", className)}>
      <p className="text-lg font-medium">Quantity</p>
      <div className="flex flex-wrap items-center gap-3">
        <ProductQuantity
          label={name}
          quantity={quantity}
          size="lg"
          max={remaining}
          disabled={!hasHydrated}
          onDecrement={() => setQuantity((value) => Math.max(1, value - 1))}
          onIncrement={() =>
            setQuantity((value) => Math.min(remaining, value + 1))
          }
        />
        <AddToCartButton productId={productId} quantity={quantity} size="lg" />
      </div>
      <p className="text-lg font-semibold tabular-nums">
        Item total: {formatPrice(price * quantity)}
      </p>
      {hasHydrated && inCart > 0 && (
        <p className="text-base text-muted-foreground">
          {inCart.toLocaleString("en-US")} in your cart.{" "}
          <Link href="/checkout" className="underline underline-offset-4">
            Go to checkout
          </Link>
        </p>
      )}
      {hasHydrated && quantity > remaining && (
        <p role="status" className="text-base text-muted-foreground">
          You can have up to 999 of this product in your cart. Reduce the
          quantity or update your cart.
        </p>
      )}
    </div>
  );
};
