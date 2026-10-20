import Image from "next/image";
import { ReadCartProductsAction } from "../actions/actions";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@/features/products/lib/formatters";
import { Button } from "@/components/ui/button";
import { Trash2Icon, MinusIcon, PlusIcon } from "lucide-react";

export const CartItem = ({
  product,
  index,
}: {
  product: ReadCartProductsAction[number];
  index: number;
}) => {
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearItem = useCartStore((state) => state.clearItem);
  const hasHydrated = useCartStore((state) => state.hasHydrated);

  if (!hasHydrated) return null;

  const quantity =
    items.find((item) => item.productId === product.id)?.quantity ?? 0;

  return (
    <li
      key={product.id}
      className="flex gap-3 py-5 first:pt-0 sm:gap-4 animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300 motion-reduce:animate-none"
      style={{
        // Add stagger animation delay cap to prevent long lists of items from being delayed indefinitely
        animationDelay: `${Math.min(index, 8) * 50}ms`,
      }}
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-lg wrap-break-word font-semibold">
              {product.name}
            </h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            aria-label={`Remove ${product.name}`}
            onClick={() => clearItem(product.id)}
          >
            <Trash2Icon aria-hidden="true" />
          </Button>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center rounded-md border">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Decrease ${product.name} quantity`}
              onClick={() => removeItem(product.id)}
            >
              <MinusIcon aria-hidden="true" />
            </Button>
            <span className="min-w-8 px-1 text-center font-medium tabular-nums">
              {quantity}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Increase ${product.name} quantity`}
              onClick={() => addItem(product.id)}
            >
              <PlusIcon aria-hidden="true" />
            </Button>
          </div>
          <div className="text-right">
            <p className="font-semibold text-lg tabular-nums">
              {formatPrice(product.price * quantity)}
            </p>
            <p className="text-base text-muted-foreground">
              {formatPrice(product.price)} each
            </p>
          </div>
        </div>
      </div>
    </li>
  );
};
