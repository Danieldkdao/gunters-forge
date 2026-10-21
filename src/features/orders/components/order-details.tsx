"use client";

import { DialogDrawer } from "@/components/dialog-drawer";
import { LoadingSwap } from "@/components/loading-swap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  formatPrice,
  formatProductCategory,
} from "@/features/products/lib/formatters";
import { useConfirm } from "@/hooks/use-confirm";
import { useCartStore } from "@/stores/cart-store";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  ClockIcon,
  PackageIcon,
  RefreshCwIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  cancelOrderAction,
  markCashPaymentReceivedAction,
  readOrderAction,
  retryOrderCheckoutAction,
  updateOrderAction,
  updateOrderDetailsAction,
} from "../actions/actions";
import { cancellableStatuses, checkoutStorageKey } from "../lib/constants";
import {
  formatOrderDate,
  formatOrderNumber,
  orderStatusLabels,
  paymentStatusLabels,
} from "../lib/formatters";
import type { OrderDetailsData } from "../server/queries";

export const OrderDetails = ({
  initialOrder,
  admin = false,
  paymentResult,
}: {
  initialOrder: OrderDetailsData;
  admin?: boolean;
  paymentResult?: "success" | "cancel";
}) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const removePurchasedItems = useCartStore(
    (state) => state.removePurchasedItems,
  );
  const {
    data: order,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["order", initialOrder.id],
    initialData: initialOrder,
    queryFn: async () => {
      const response = await readOrderAction(initialOrder.id);
      if (response.error) throw new Error(response.message);
      return response.data;
    },
    retry: false,
    // Only poll for active orders or cancelled Stripe orders awaiting a refund
    refetchInterval: (query) => {
      if (query.state.error || editing) return false;
      const current = query.state.data;
      return current &&
        ((current.status !== "completed" && current.status !== "cancelled") ||
          (current.status === "cancelled" &&
            current.paymentMethod === "stripe" &&
            ["paid", "partially_refunded"].includes(current.paymentStatus)))
        ? 10000
        : false;
    },
  });
  const { confirm, ConfirmationDialog } = useConfirm(
    "Cancel this order?",
    order.paymentMethod === "stripe" && order.paymentStatus !== "unpaid"
      ? "Gunter will stop work on this order and a refund will be requested for the remaining payment."
      : "This order will be removed from Gunter's work queue.",
  );

  // Use checkoutStorageKey to clear localStorage before removing quantities
  useEffect(() => {
    if (
      !hasHydrated ||
      (order.status !== "cancelled" && order.paymentStatus === "unpaid")
    )
      return;
    try {
      const attempt = JSON.parse(
        sessionStorage.getItem(checkoutStorageKey) ?? "null",
      );
      if (attempt?.orderId !== order.id) return;
      sessionStorage.removeItem(checkoutStorageKey);
      if (order.status !== "cancelled")
        removePurchasedItems(
          order.orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        );
    } catch {
      return;
    }
  }, [
    hasHydrated,
    order.id,
    order.orderItems,
    order.paymentStatus,
    order.status,
    removePurchasedItems,
  ]);

  const perform = (
    action: () => Promise<{ error: boolean; message?: string }>,
    onSuccess?: () => void,
  ) => {
    startTransition(async () => {
      try {
        const response = await action();
        if (response.error)
          toast.error(response.message ?? "Unable to update order.");
        else {
          toast.success(response.message ?? "Order updated.");
          onSuccess?.();
        }
      } catch {
        toast.error("Unable to update order. Please try again.");
      } finally {
        // Refresh the UI
        await refetch();
        router.refresh();
      }
    });
  };
  const nextStatus =
    order.status === "queued"
      ? "in_progress"
      : order.status === "in_progress"
        ? "ready"
        : order.status === "ready"
          ? "completed"
          : null;
  const nextLabel =
    order.status === "queued"
      ? "Start crafting"
      : order.status === "in_progress"
        ? "Mark ready"
        : "Complete order";
  const canEdit =
    order.status === "pending_payment" || order.status === "queued";
  const cancelledStripe =
    order.status === "cancelled" &&
    order.paymentMethod === "stripe" &&
    order.paymentStatus !== "refunded";
  const retryPayment = () =>
    startTransition(async () => {
      try {
        const response = await retryOrderCheckoutAction(order.id);
        if (response.error || !response.url)
          throw new Error(
            response.error ? response.message : "Unable to open checkout.",
          );
        window.location.assign(response.url);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Unable to open checkout.",
        );
        await refetch();
      }
    });

  return (
    <div className="min-w-0 space-y-6">
      <Button
        variant="ghost"
        render={<Link href={admin ? "/dashboard/orders" : "/orders"} />}
        nativeButton={false}
      >
        <ArrowLeftIcon />
        All orders
      </Button>
      {/* Wait for payment success confirmation from Stripe */}
      {paymentResult === "success" && order.paymentMethod === "stripe" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              {order.paymentStatus === "paid" ? (
                <CheckCircle2Icon className="size-5.5" />
              ) : (
                <ClockIcon className="size-5.5" />
              )}
              {order.paymentStatus === "refunded"
                ? "Payment refunded"
                : order.paymentStatus === "partially_refunded"
                  ? "Payment partially refunded"
                  : order.paymentStatus === "paid"
                    ? "Payment received"
                    : order.status === "cancelled"
                      ? "Order cancelled"
                      : "Confirming your payment"}
            </CardTitle>
            <CardDescription className="text-lg">
              {order.paymentStatus === "unpaid" && order.status !== "cancelled"
                ? "We're waiting for confirmation from Stripe. This page updates automatically; you don't need to pay again."
                : "Your latest order and payment information is shown below."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      {paymentResult === "cancel" && order.status === "pending_payment" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Checkout paused</CardTitle>
            <CardDescription className="text-lg">
              Your order is still awaiting payment. You can continue payment or
              cancel it below.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">
            {formatOrderNumber(order.orderNumber)}
          </h1>
          <p className="text-muted-foreground text-lg">
            Placed {formatOrderDate(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{orderStatusLabels[order.status]}</Badge>
          <Badge
            variant={order.paymentStatus === "paid" ? "default" : "secondary"}
          >
            {paymentStatusLabels[order.paymentStatus]}
          </Badge>
          <Button
            variant="outline"
            size="icon"
            aria-label="Refresh order"
            disabled={isFetching || pending}
            onClick={() => void refetch()}
          >
            <RefreshCwIcon className={isFetching ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-destructive">
          Could not refresh this order. The last loaded information is shown;
          use Refresh to try again.
        </p>
      )}
      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PackageIcon />
              Order items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {order.orderItems.map((item) => (
                <li key={item.id} className="flex gap-3 py-4 first:pt-0">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={item.productImageUrl}
                      alt={item.productName}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-medium">{item.productName}</p>
                    <p className="text-muted-foreground">
                      {formatProductCategory(item.category).label} · Quantity{" "}
                      {item.quantity}
                    </p>
                    <p className="text-muted-foreground">
                      {formatPrice(item.unitPrice)} each ·{" "}
                      {item.craftingTimeMinutes} min each
                    </p>
                  </div>
                  <span className="shrink-0 tabular-nums">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t pt-4">
              <div className="flex justify-between gap-3 text-lg">
                <dt>Subtotal</dt>
                <dd>{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-3 text-lg">
                <dt>Tax</dt>
                <dd>{formatPrice(order.total - order.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-3 text-2xl font-semibold">
                <dt>Total</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">At the forge</CardTitle>
            </CardHeader>
            <CardContent>
              {order.queuePosition ? (
                <p className="text-lg">
                  <strong>#{order.queuePosition.position}</strong> in
                  Gunter&apos;s queue · {order.queuePosition.ordersAhead}{" "}
                  {order.queuePosition.ordersAhead === 1 ? "order" : "orders"}{" "}
                  ahead.
                </p>
              ) : (
                <p className="text-lg">
                  {order.status === "pending_payment"
                    ? "Your order joins the queue once payment is confirmed."
                    : orderStatusLabels[order.status]}
                </p>
              )}
              <p className="text-muted-foreground text-lg">
                Estimated crafting time:{" "}
                {order.orderItems
                  .reduce(
                    (sum, item) =>
                      sum + item.quantity * item.craftingTimeMinutes,
                    0,
                  )
                  .toLocaleString()}{" "}
                minutes. Queue positions may change as Gunter prioritizes work.
              </p>
              <dl className="space-y-2 text-muted-foreground text-lg">
                {(
                  [
                    ["Queued", order.queuedAt],
                    ["Crafting started", order.startedAt],
                    ["Completed", order.completedAt],
                    ["Cancelled", order.cancelledAt],
                  ] as const
                ).map(
                  ([label, date]) =>
                    date && (
                      <div
                        key={label}
                        className="flex flex-wrap justify-between gap-x-3"
                      >
                        <dt>{label}</dt>
                        <dd>{formatOrderDate(date)}</dd>
                      </div>
                    ),
                )}
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Delivery and payment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium">{order.customerName}</p>
              <p className="text-lg wrap-break-word text-muted-foreground">
                {order.customerEmail}
              </p>
              <p className="text-lg whitespace-pre-wrap wrap-break-word">
                {order.deliveryAddress || "No delivery address provided."}
              </p>
              {order.customerNotes && (
                <div>
                  <p className="text-lg font-medium">Order notes</p>
                  <p className="text-lg whitespace-pre-wrap wrap-break-word text-muted-foreground">
                    {order.customerNotes}
                  </p>
                </div>
              )}
              <p className="text-lg">
                {order.paymentMethod === "stripe"
                  ? "Card payment"
                  : "Cash on delivery"}{" "}
                · {paymentStatusLabels[order.paymentStatus]}
              </p>
              {canEdit && (
                <DialogDrawer
                  trigger={
                    <Button variant="outline" disabled={pending}>
                      Edit delivery details
                    </Button>
                  }
                  open={editing}
                  onOpenChange={setEditing}
                  options={{
                    title: "Delivery details",
                    description: "You can edit these before crafting starts.",
                  }}
                >
                  <form
                    key={`${order.deliveryAddress}:${order.customerNotes}`}
                    className="space-y-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const fields = new FormData(event.currentTarget);
                      perform(
                        () =>
                          updateOrderDetailsAction(order.id, {
                            deliveryAddress: String(
                              fields.get("deliveryAddress"),
                            ).trim(),
                            customerNotes:
                              String(fields.get("customerNotes")).trim() ||
                              null,
                          }),
                        () => setEditing(false),
                      );
                    }}
                  >
                    <fieldset disabled={pending} className="space-y-4">
                      <Field>
                        <FieldLabel htmlFor="order-address">
                          Delivery address
                        </FieldLabel>
                        <Textarea
                          id="order-address"
                          name="deliveryAddress"
                          required
                          maxLength={1000}
                          defaultValue={order.deliveryAddress ?? ""}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="order-notes">
                          Order notes
                        </FieldLabel>
                        <Textarea
                          id="order-notes"
                          name="customerNotes"
                          maxLength={2000}
                          defaultValue={order.customerNotes ?? ""}
                        />
                      </Field>
                      <Button type="submit" className="w-full">
                        <LoadingSwap isLoading={pending}>
                          Save details
                        </LoadingSwap>
                      </Button>
                    </fieldset>
                  </form>
                </DialogDrawer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {admin ? "Manage order" : "Order actions"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <fieldset disabled={pending} className="flex flex-col gap-3">
                {!admin &&
                  paymentResult !== "success" &&
                  order.status === "pending_payment" &&
                  order.paymentMethod === "stripe" && (
                    <Button onClick={retryPayment}>
                      <LoadingSwap isLoading={pending}>
                        Continue payment
                      </LoadingSwap>
                    </Button>
                  )}
                {admin && nextStatus && (
                  <Button
                    disabled={
                      nextStatus === "completed" &&
                      order.paymentStatus !== "paid"
                    }
                    onClick={() =>
                      perform(() =>
                        updateOrderAction(order.id, { status: nextStatus }),
                      )
                    }
                  >
                    {nextLabel}
                  </Button>
                )}
                {admin &&
                  order.paymentMethod === "cash_on_delivery" &&
                  order.paymentStatus === "unpaid" &&
                  ["queued", "in_progress", "ready"].includes(order.status) && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        perform(() => markCashPaymentReceivedAction(order.id))
                      }
                    >
                      Record cash received
                    </Button>
                  )}
                {admin &&
                  order.status === "ready" &&
                  order.paymentStatus !== "paid" && (
                    <p className="text-muted-foreground">
                      Record payment before completing this order.
                    </p>
                  )}
                {admin && order.status === "queued" && (
                  <form
                    className="flex flex-wrap items-end gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const fields = new FormData(event.currentTarget);
                      perform(() =>
                        updateOrderAction(order.id, {
                          queueRank: Number(fields.get("queueRank")),
                        }),
                      );
                    }}
                  >
                    <Field className="min-w-0 flex-1">
                      <FieldLabel htmlFor="queue-rank">
                        Queue priority
                      </FieldLabel>
                      <Input
                        key={order.queueRank}
                        id="queue-rank"
                        name="queueRank"
                        type="number"
                        min={1}
                        max={2147483647}
                        step={1}
                        required
                        defaultValue={order.queueRank ?? order.orderNumber}
                      />
                    </Field>
                    <Button type="submit" variant="outline">
                      Save priority
                    </Button>
                    <p className="w-full text-muted-foreground">
                      Lower numbers come first among waiting orders.
                    </p>
                  </form>
                )}
                {cancellableStatuses.includes(order.status) && (
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (await confirm())
                        perform(() => cancelOrderAction(order.id));
                    }}
                  >
                    Cancel order
                  </Button>
                )}
                {cancelledStripe && (
                  <Button
                    variant="outline"
                    onClick={() => perform(() => cancelOrderAction(order.id))}
                  >
                    Recheck cancellation payment
                  </Button>
                )}
                {order.status === "completed" && (
                  <p className="text-lg text-muted-foreground">
                    This order has been fulfilled.
                  </p>
                )}
                {order.status === "cancelled" && (
                  <p className="text-lg text-muted-foreground">
                    This order is no longer in the work queue.
                    {order.paymentMethod === "stripe" &&
                    ["paid", "partially_refunded"].includes(order.paymentStatus)
                      ? " Refund processing may still be pending."
                      : ""}
                  </p>
                )}
                {pending && (
                  <p role="status" className="text-lg text-muted-foreground">
                    Updating order…
                  </p>
                )}
              </fieldset>
            </CardContent>
          </Card>
        </div>
      </div>
      {ConfirmationDialog}
    </div>
  );
};
