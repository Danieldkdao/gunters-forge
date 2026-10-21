"use client";

import Link from "next/link";
import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryStates } from "nuqs";
import { ArrowRightIcon, PackageIcon, RefreshCwIcon } from "lucide-react";
import { ListError, ListLoader, Sentinel } from "@/components/list-components";
import { NotFound } from "@/components/not-found";
import { SelectFilter } from "@/components/filter-components";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useInfiniteCursor } from "@/hooks/use-infinite-cursor";
import { formatPrice } from "@/features/products/lib/formatters";
import {
  readMyOrdersAction,
  readOrdersAction,
  readOrderQueueAction,
} from "../actions/actions";
import type { OrderListData } from "../server/queries";
import {
  formatOrderDate,
  formatOrderNumber,
  orderStatusLabels,
  paymentStatusLabels,
} from "../lib/formatters";
import { ordersSearchParams, orderStatusOptions } from "../lib/params";

export const OrdersFilters = ({ admin = false }: { admin?: boolean }) => {
  const [filters, setFilters] = useQueryStates(ordersSearchParams, {
    shallow: false,
  });
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap items-end gap-3">
      {admin && (
        <div className="min-w-40 flex-1 sm:flex-none">
          <p className="mb-1 text-muted-foreground">View</p>
          <SelectFilter
            value={filters.view}
            options={["all", "queue"]}
            format={(value) =>
              value === "queue" ? "Work queue" : "All orders"
            }
            onValueChange={(view) =>
              view && setFilters({ view, status: "all" })
            }
          />
        </div>
      )}
      <div className="min-w-40 flex-1 sm:flex-none">
        <p className="mb-1 text-muted-foreground">Status</p>
        <SelectFilter
          value={filters.status}
          options={
            admin && filters.view === "queue"
              ? ["all", "queued", "in_progress"]
              : orderStatusOptions
          }
          format={(value) =>
            value === "all" ? "All statuses" : orderStatusLabels[value]
          }
          onValueChange={(status) => status && setFilters({ status })}
        />
      </div>
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => startTransition(() => router.refresh())}
      >
        <RefreshCwIcon className={pending ? "animate-spin" : ""} />
        Refresh
      </Button>
    </div>
  );
};

type OrdersListProps = {
  initialOrders: OrderListData[];
  initialNextCursor: string | null;
  admin?: boolean;
};

// Retry remounts the list clearing errors and state
export const OrdersList = (props: OrdersListProps) => {
  const [retry, setRetry] = useState(0);
  return (
    <OrdersListContent
      key={retry}
      {...props}
      onRetry={() => setRetry((value) => value + 1)}
    />
  );
};

const OrdersListContent = ({
  initialOrders,
  initialNextCursor,
  admin = false,
  onRetry,
}: OrdersListProps & { onRetry: () => void }) => {
  const [filters] = useQueryStates(ordersSearchParams, { shallow: false });
  const fetchOrders = useCallback(
    (lastCursor: string | null) => {
      const action = admin
        ? filters.view === "queue"
          ? readOrderQueueAction
          : readOrdersAction
        : readMyOrdersAction;
      return action({
        lastCursor,
        status: filters.status === "all" ? undefined : filters.status,
      });
    },
    [admin, filters.status, filters.view],
  );
  const {
    items: orders,
    isPending,
    nextCursor,
    error,
    sentinelRef,
  } = useInfiniteCursor(initialOrders, initialNextCursor, fetchOrders, {
    customErrorMessage: "Couldn't load more orders. Try again.",
  });
  return (
    <div className="space-y-4">
      {orders.length ? (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-2xl font-semibold">
                    {formatOrderNumber(order.orderNumber)}
                  </span>
                  <Badge
                    variant={
                      order.status === "completed" ? "default" : "secondary"
                    }
                  >
                    {orderStatusLabels[order.status]}
                  </Badge>
                </CardTitle>
                <p className="text-lg text-muted-foreground">
                  {formatOrderDate(order.createdAt)}
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                {admin && (
                  <p className="wrap-break-word text-lg font-medium">
                    {order.customerName} · {order.customerEmail}
                  </p>
                )}
                <p className="text-muted-foreground text-lg">
                  {order.orderItems
                    .map((item) => `${item.quantity} × ${item.productName}`)
                    .join(", ")}
                </p>
                <div className="flex flex-wrap justify-between gap-2 text-lg">
                  <span>
                    {order.paymentMethod === "stripe"
                      ? "Card"
                      : "Cash on delivery"}{" "}
                    · {paymentStatusLabels[order.paymentStatus]}
                  </span>
                  <strong className="text-2xl tabular-nums">
                    {formatPrice(order.total)}
                  </strong>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant="outline"
                  render={
                    <Link
                      href={`${admin ? "/dashboard" : ""}/orders/${order.id}`}
                    />
                  }
                  nativeButton={false}
                >
                  {admin ? "Manage order" : "View order"}
                  <ArrowRightIcon />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <NotFound
          title="No orders found"
          description={
            admin
              ? "New orders will appear here. Try another status or view."
              : "Your orders will appear here once you place an order."
          }
          icon={<PackageIcon className="size-10" />}
        >
          {!admin && (
            <Button render={<Link href="/products" />} nativeButton={false}>
              Browse the shop
            </Button>
          )}
        </NotFound>
      )}
      <ListLoader loading={isPending} />
      <Sentinel ref={sentinelRef} show={!!nextCursor && !error} />
      <ListError error={error} />
      {error && (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
};
