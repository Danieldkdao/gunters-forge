import { Suspense } from "react";
import type { ParamsId, SearchParamsProps } from "@/lib/types";
import { isValidId } from "@/lib/utils";
import { NotFound } from "@/components/not-found";
import { readOrderAction } from "../actions/actions";
import { OrderDetails } from "./order-details";
import { OrderLoadError, OrderSkeleton } from "./order-states";

type OrderScreenProps = {
  params?: ParamsId<"orderId">["params"];
  searchParams?: SearchParamsProps["searchParams"];
  admin?: boolean;
  paymentResult?: "success" | "cancel";
};

export const OrderScreen = (props: OrderScreenProps) => (
  <Suspense fallback={<OrderSkeleton />}>
    <OrderContent {...props} />
  </Suspense>
);

const OrderContent = async ({
  params,
  searchParams,
  ...props
}: OrderScreenProps) => {
  const values = await (params ?? searchParams);
  const orderId = typeof values?.orderId === "string" ? values.orderId : "";
  if (!isValidId(orderId))
    return (
      <NotFound
        title="Order not found"
        description="Check the order link and try again."
      />
    );
  const response = await readOrderAction(orderId);
  if (response.error) return <OrderLoadError description={response.message} />;
  return <OrderDetails initialOrder={response.data} {...props} />;
};
