"use client";

import { LoadingSwap } from "@/components/loading-swap";
import { NotFound } from "@/components/not-found";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  createOrderAction,
  retryOrderCheckoutAction,
} from "@/features/orders/actions/actions";
import {
  OrderLoadError,
  OrderSkeleton,
} from "@/features/orders/components/order-states";
import { checkoutStorageKey } from "@/features/orders/lib/constants";
import { calculateOrderTotals } from "@/features/orders/lib/utils";
import { formatPrice } from "@/features/products/lib/formatters";
import { useCartStore } from "@/stores/cart-store";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  BanknoteIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  ShoppingBagIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { createOrderSchema } from "@/features/orders/actions/schemas";
import { readCartProductsAction } from "../actions/actions";
import { CartItem } from "./cart-item";

const checkoutFormSchema = createOrderSchema
  .pick({ paymentMethod: true, customerNotes: true })
  .extend({
    deliveryAddress: z
      .string()
      .trim()
      .min(1, "Enter a delivery address.")
      .max(1000, "Use 1,000 characters or fewer."),
  });

type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

export const CheckoutForm = ({
  customerName,
  customerEmail,
  stripeTestMode,
}: {
  customerName: string;
  customerEmail: string;
  stripeTestMode: boolean;
}) => {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const clearItem = useCartStore((state) => state.clearItem);
  const removePurchasedItems = useCartStore(
    (state) => state.removePurchasedItems,
  );
  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      paymentMethod: "cash_on_delivery",
      deliveryAddress: "",
      customerNotes: "",
    },
  });
  const method = useWatch({ control: form.control, name: "paymentMethod" });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  useLayoutEffect(() => {
    return () => {
      setPlacedOrderId(null);
      setPendingOrderId(null);
      setError(null);
    };
  }, []);
  const productIds = [...new Set(items.map((item) => item.productId))].sort();
  // Reuse drawer cache while checking current prices
  const {
    data,
    isPending,
    isFetching,
    isPlaceholderData,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["cart-products", productIds],
    enabled: hasHydrated && productIds.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 0,
    retry: false,
    queryFn: async () => {
      const response = await readCartProductsAction(productIds);
      if (!response) throw new Error("Couldn't load your cart.");
      return response;
    },
  });
  const products = new Map(
    (data ?? []).map((product) => [product.id, product]),
  );
  let totals = null;
  try {
    if (data)
      totals = calculateOrderTotals(
        items.map((item) => ({
          price: products.get(item.productId)?.price ?? 0,
          quantity: item.quantity,
        })),
      );
  } catch {
    totals = null;
  }
  const available =
    !!totals &&
    items.length > 0 &&
    items.every((item) => products.has(item.productId) && item.quantity <= 999);

  const submit = (values: CheckoutFormData) => {
    if (pending || !available || isFetching || isPlaceholderData || queryError)
      return;
    const payload = {
      cartItems: items.map((item) => ({ ...item })),
      ...values,
      customerNotes: values.customerNotes || null,
    };
    startTransition(async () => {
      setError(null);
      let attempt: { fingerprint: string; requestId: string; orderId?: string };
      try {
        // Retries use the same request ID to recover the existing order
        const fingerprint = JSON.stringify(payload);
        let previous = null;
        try {
          previous = JSON.parse(
            sessionStorage.getItem(checkoutStorageKey) ?? "null",
          );
        } catch {
          previous = null;
        }
        attempt =
          previous?.fingerprint === fingerprint
            ? previous
            : { fingerprint, requestId: crypto.randomUUID() };
        setPendingOrderId(attempt.orderId ?? null);
        sessionStorage.setItem(checkoutStorageKey, JSON.stringify(attempt));
        if (values.paymentMethod === "cash_on_delivery") {
          const response = await createOrderAction({
            ...payload,
            requestId: attempt.requestId,
          });
          if (response.error) throw new Error(response.message);
          sessionStorage.removeItem(checkoutStorageKey);
          setPlacedOrderId(response.orderId);
          removePurchasedItems(payload.cartItems);
          router.replace(`/orders/${response.orderId}`);
          return;
        }
        if (attempt.orderId) {
          const response = await retryOrderCheckoutAction(attempt.orderId);
          if (response.error || !response.url)
            throw new Error(
              response.error ? response.message : "Unable to open checkout.",
            );
          window.location.assign(response.url);
          return;
        }
        const request = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            paymentMethod: undefined,
            requestId: attempt.requestId,
          }),
        });
        const response = await request.json();
        // Check for an existing order ID to resume that one
        if (response.orderId) {
          attempt.orderId = response.orderId;
          setPendingOrderId(response.orderId);
          sessionStorage.setItem(checkoutStorageKey, JSON.stringify(attempt));
        }
        if (!request.ok || response.error || !response.url)
          throw new Error(response.message || "Unable to open checkout.");
        window.location.assign(response.url);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to place your order. Please try again.",
        );
      }
    });
  };

  if (placedOrderId)
    return (
      <NotFound
        title="Order placed"
        description="Your order is on its way to Gunter's queue."
        icon={<CheckCircle2Icon className="size-10" />}
      >
        <Button
          render={<Link href={`/orders/${placedOrderId}`} />}
          nativeButton={false}
        >
          View your order
        </Button>
      </NotFound>
    );
  if (!hasHydrated || (items.length > 0 && isPending)) return <OrderSkeleton />;
  if (!items.length)
    return (
      <NotFound
        title="Your cart is empty"
        description="Choose something from the forge before checking out."
        icon={<ShoppingBagIcon className="size-10" />}
      >
        <Button render={<Link href="/products" />} nativeButton={false}>
          Browse products
        </Button>
      </NotFound>
    );
  if (queryError && !data)
    return (
      <OrderLoadError
        description="We couldn't load your cart. Please try again."
        onRetry={refetch}
      />
    );

  return (
    <form noValidate onSubmit={form.handleSubmit(submit)}>
      <fieldset
        disabled={pending}
        className="grid min-w-0 gap-6 lg:grid-cols-2"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Delivery and payment</CardTitle>
            <CardDescription className="wrap-break-word">
              {customerName} · {customerEmail}
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-5">
            <Controller
              control={form.control}
              name="deliveryAddress"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel className="text-lg" htmlFor="checkout-address">
                    Delivery address
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="checkout-address"
                    autoComplete="street-address"
                    aria-required="true"
                    aria-invalid={!!fieldState.error}
                    aria-describedby={
                      fieldState.error ? "checkout-address-error" : undefined
                    }
                    placeholder="Street, city, state, and postal code"
                  />
                  {fieldState.error && (
                    <FieldError
                      id="checkout-address-error"
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="customerNotes"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel className="text-lg" htmlFor="checkout-notes">
                    Order notes (optional)
                  </FieldLabel>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    id="checkout-notes"
                    aria-invalid={!!fieldState.error}
                    aria-describedby={
                      fieldState.error ? "checkout-notes-error" : undefined
                    }
                    placeholder="Anything Gunter should know?"
                  />
                  {fieldState.error && (
                    <FieldError
                      id="checkout-notes-error"
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="paymentMethod"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel className="text-lg" id="checkout-payment-label">
                    Payment method
                  </FieldLabel>
                  <RadioGroup
                    name={field.name}
                    aria-labelledby="checkout-payment-label"
                    aria-invalid={!!fieldState.error}
                    aria-describedby={
                      fieldState.error ? "checkout-payment-error" : undefined
                    }
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                  >
                    {(
                      [
                        {
                          value: "cash_on_delivery",
                          label: "Cash on delivery",
                          description: "Pay when your order arrives.",
                          icon: BanknoteIcon,
                        },
                        {
                          value: "stripe",
                          label: "Card payment",
                          description: stripeTestMode
                            ? "Stripe test checkout. No real payment is collected."
                            : "Pay securely with Stripe.",
                          icon: CreditCardIcon,
                        },
                      ] as const
                    ).map(({ value, label, description, icon: Icon }) => (
                      <FieldLabel key={value} htmlFor={`payment-${value}`}>
                        <Field orientation="horizontal">
                          <Icon className="size-5" aria-hidden="true" />
                          <FieldContent>
                            <FieldTitle className="text-lg">{label}</FieldTitle>
                            <FieldDescription>{description}</FieldDescription>
                          </FieldContent>
                          <RadioGroupItem
                            value={value}
                            id={`payment-${value}`}
                          />
                        </Field>
                      </FieldLabel>
                    ))}
                  </RadioGroup>
                  {fieldState.error && (
                    <FieldError
                      id="checkout-payment-error"
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />
            {error && (
              <div role="alert" className="space-y-2 text-destructive">
                <p>{error}</p>
                {pendingOrderId && (
                  <Link
                    className="underline"
                    href={`/orders/${pendingOrderId}`}
                  >
                    View your order
                  </Link>
                )}
              </div>
            )}
            {queryError && (
              <div role="alert" className="space-y-2">
                <p className="text-destructive">
                  Unable to verify current prices.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isFetching}
                  onClick={() => void refetch()}
                >
                  Retry price check
                </Button>
              </div>
            )}
            {!available && (
              <p role="alert" className="text-destructive">
                Remove unavailable items and keep quantities between 1 and 999.
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              disabled={
                !available || isFetching || isPlaceholderData || !!queryError
              }
            >
              <LoadingSwap isLoading={pending}>
                {method === "stripe" ? "Continue to Stripe" : "Place order"}
              </LoadingSwap>
            </Button>
            <Button
              variant="ghost"
              render={<Link href="/products" />}
              nativeButton={false}
            >
              Continue shopping
            </Button>
          </CardContent>
        </Card>
        <Card className="order-first lg:order-last">
          <CardHeader>
            <CardTitle className="text-lg">Order summary</CardTitle>
            <CardDescription>
              Review your items before placing your order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {items.map((item, index) => {
                const product = products.get(item.productId);
                return product ? (
                  <CartItem
                    key={item.productId}
                    product={product}
                    index={index}
                  />
                ) : (
                  <li
                    key={item.productId}
                    className="flex items-center justify-between gap-3 py-4"
                  >
                    <span>
                      {isPlaceholderData
                        ? "Loading item…"
                        : "Product unavailable"}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => clearItem(item.productId)}
                    >
                      Remove
                    </Button>
                  </li>
                );
              })}
            </ul>
            {totals && (
              <dl className="space-y-2 border-t pt-4">
                <div className="flex justify-between gap-3 text-lg">
                  <dt>Subtotal</dt>
                  <dd>{formatPrice(totals.subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-3 text-lg">
                  <dt>Tax (5%)</dt>
                  <dd>{formatPrice(totals.tax)}</dd>
                </div>
                <div className="flex justify-between gap-3 text-2xl font-semibold">
                  <dt>Total</dt>
                  <dd>{formatPrice(totals.total)}</dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>
      </fieldset>
    </form>
  );
};
