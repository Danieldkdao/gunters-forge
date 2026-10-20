"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/features/products/lib/formatters";
import { useIsMobile } from "@/hooks/use-mobile";
import type { SetterType } from "@/lib/types";
import { useCartStore } from "@/stores/cart-store";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  RefreshCwIcon,
  ShoppingBagIcon,
  Trash2Icon,
} from "lucide-react";
import { useState, type ReactElement } from "react";
import { readCartProductsAction } from "../actions/actions";
import { CartItem } from "./cart-item";

const CartItemsSkeleton = () => (
  <div className="space-y-5" aria-hidden="true">
    {Array.from({ length: 3 }, (_, index) => (
      <div key={index} className="flex gap-4">
        <Skeleton className="size-20 shrink-0 rounded-lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex justify-between gap-3">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const CartDrawer = ({
  children,
  open,
  onOpenChange,
}: {
  children?: ReactElement;
  open?: boolean;
  onOpenChange?: SetterType<boolean>;
}) => {
  const items = useCartStore((state) => state.items);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const openToUse = open ?? isOpen;
  const onOpenChangeToUse = onOpenChange ?? setIsOpen;
  // Sort product IDs so that quantity and item order changes reuse the same query
  const productIds = [...new Set(items.map((item) => item.productId))].sort();

  const {
    data,
    isPending,
    isFetching,
    isPlaceholderData,
    isSuccess,
    error,
    refetch,
  } = useQuery({
    queryKey: ["cart-products", productIds],
    enabled: openToUse && hasHydrated && productIds.length > 0,
    // Keep existing product data while fetching changed data to prevent shifts in the UI
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await readCartProductsAction(productIds);

      if (!response) {
        throw new Error("Failed to load your cart products.");
      }

      return response;
    },
  });

  const productsById = new Map(
    (data ?? []).map((product) => [product.id, product]),
  );

  const isEmpty = hasHydrated && items.length === 0;
  const isLoading =
    !hasHydrated || (!isEmpty && isPending && data === undefined);
  // Only show error when there is no data
  const hasError = !isEmpty && !!error && data === undefined;

  // Previous data does not confirm availability for current product data
  const hasConfirmedProducts = isSuccess && !isPlaceholderData;

  const hasUnavailableProducts =
    !isEmpty &&
    hasConfirmedProducts &&
    items.some((item) => {
      const product = productsById.get(item.productId);
      return !product || !product.isActive;
    });

  const subtotal = items.reduce((total, item) => {
    const product = productsById.get(item.productId);
    return total + (product?.price ?? 0) * item.quantity;
  }, 0);

  const canCheckout =
    !isEmpty && hasConfirmedProducts && !isFetching && !hasUnavailableProducts;

  return (
    <Drawer
      open={openToUse}
      onOpenChange={onOpenChangeToUse}
      showSwipeHandle={isMobile}
      swipeDirection={isMobile ? "down" : "right"}
    >
      {children && <DrawerTrigger render={children} />}
      <DrawerContent className="data-[swipe-axis=x]:sm:[--drawer-content-width:30rem]">
        <DrawerHeader className="gap-2 border-b pb-4">
          <DrawerTitle>Your Cart</DrawerTitle>
          <DrawerDescription>
            A few fine additions to your next adventure.
          </DrawerDescription>
        </DrawerHeader>
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <span role="status" className="sr-only">
                Loading your cart…
              </span>
              <CartItemsSkeleton />
            </>
          ) : isEmpty ? (
            <div className="flex-1 h-full flex flex-col items-center justify-center">
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-4 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                  <ShoppingBagIcon
                    className="size-8 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-xl font-semibold">Your cart is empty</h3>
                <p className="max-w-64 text-lg text-muted-foreground">
                  Add something from the forge to get started.
                </p>
                <DrawerClose
                  render={<Button variant="outline" />}
                  className="mt-2"
                >
                  Continue browsing
                </DrawerClose>
              </div>
            </div>
          ) : hasError ? (
            <div className="flex-1 h-full flex flex-col items-center justify-center">
              <div
                role="alert"
                className="flex min-h-64 flex-col items-center justify-center gap-3 px-4 text-center"
              >
                <AlertCircleIcon
                  className="size-10 text-destructive"
                  aria-hidden="true"
                />
                <h3 className="text-xl font-semibold">
                  Couldn&apos;t load your cart
                </h3>
                <p className="max-w-64 text-lg text-muted-foreground">
                  Your saved items are still here. Try loading their details
                  again.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isFetching}
                  onClick={() => void refetch()}
                >
                  <RefreshCwIcon
                    className={isFetching ? "animate-spin" : ""}
                    aria-hidden="true"
                  />
                  {isFetching ? "Retrying…" : "Try again"}
                </Button>
              </div>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((item, index) => {
                const product = productsById.get(item.productId);

                // A newly added product might not exist in the placeholder data yet
                // Wait for the data to load before confirming the result
                if (!product && !hasConfirmedProducts) {
                  return (
                    <li
                      key={item.productId}
                      className="flex gap-4 py-5 first:pt-0"
                    >
                      <Skeleton className="size-20 shrink-0 rounded-lg" />
                      <div className="flex flex-1 flex-col gap-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </li>
                  );
                }

                if (!product) {
                  return (
                    <li
                      key={item.productId}
                      className="flex items-center gap-3 py-5 first:pt-0"
                    >
                      <div className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <ShoppingBagIcon
                          className="size-6 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">Product unavailable</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                        </p>
                        <p className="mt-1 text-sm text-destructive">
                          Remove this item to continue.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove unavailable item"
                      >
                        <Trash2Icon aria-hidden="true" />
                      </Button>
                    </li>
                  );
                }

                return (
                  <CartItem
                    key={item.productId}
                    product={product}
                    index={index}
                  />
                );
              })}
            </ul>
          )}
        </div>
        <DrawerFooter className="shrink-0 gap-3 border-t bg-popover pt-2">
          <div className="flex items-center justify-between gap-4">
            <span className="font-medium text-lg">Subtotal</span>
            {isLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <span className="text-xl font-semibold tabular-nums">
                {hasError || hasUnavailableProducts
                  ? "—"
                  : formatPrice(subtotal)}
              </span>
            )}
          </div>
          {hasUnavailableProducts && (
            <p className="text-base text-destructive">
              Some items are no longer available. Remove them before checkout.
            </p>
          )}
          <Button type="button" className="h-11 w-full" disabled={!canCheckout}>
            Checkout
            <ArrowRightIcon aria-hidden="true" />
          </Button>
          <DrawerClose
            render={<Button variant="outline" className="h-11 w-full" />}
          >
            Continue shopping
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
