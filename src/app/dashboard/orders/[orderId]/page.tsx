import { OrderScreen } from "@/features/orders/components/order-screen";
import type { ParamsId } from "@/lib/types";

export default function OrderPage(props: ParamsId<"orderId">) {
  return <OrderScreen params={props.params} admin />;
}
