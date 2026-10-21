import { Suspense } from "react";
import type { SearchParamsProps } from "@/lib/types";
import { readMyOrdersAction, readOrdersAction, readOrderQueueAction } from "../actions/actions";
import { loadOrdersSearchParams } from "../lib/params";
import { OrdersFilters, OrdersList } from "./orders-list";
import { OrderLoadError, OrderSkeleton } from "./order-states";

export const OrdersScreen = ({ admin = false, ...props }: SearchParamsProps & { admin?: boolean }) => (
  <div className="min-w-0 space-y-6">
    <div>
      <h1 className="text-3xl font-semibold">{admin ? "Orders" : "Your orders"}</h1>
      <p className="text-lg text-muted-foreground">{admin ? "Manage incoming orders and decide what to forge next." : "Track your place in the forge and manage your orders."}</p>
    </div>
    <Suspense fallback={<OrderSkeleton rows={4} />}>
      <OrdersContent {...props} admin={admin} />
    </Suspense>
  </div>
);

const OrdersContent = async ({ searchParams, admin }: SearchParamsProps & { admin: boolean }) => {
  const filters = await loadOrdersSearchParams(searchParams);
  const action = admin ? filters.view === "queue" ? readOrderQueueAction : readOrdersAction : readMyOrdersAction;
  const response = await action({ status: filters.status === "all" ? undefined : filters.status });
  return <div className="space-y-4">
    <OrdersFilters admin={admin} />
    {response ? <OrdersList key={response.key} initialOrders={response.data} initialNextCursor={response.nextCursor} admin={admin} />
      : <OrderLoadError />}
  </div>;
};
