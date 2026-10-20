import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { PlusIcon } from "lucide-react";

export const AddToCartButton = ({ productId }: { productId: string }) => {
  const addItem = useCartStore((state) => state.addItem);
  const hasHydrated = useCartStore((state) => state.hasHydrated);

  return (
    <Button disabled={!hasHydrated} onClick={() => addItem(productId)}>
      <PlusIcon aria-hidden="true" />
      Add to Cart
    </Button>
  );
};
