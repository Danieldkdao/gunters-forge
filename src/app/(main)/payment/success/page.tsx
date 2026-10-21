import { OrderScreen } from "@/features/orders/components/order-screen";
import type { SearchParamsProps } from "@/lib/types";

export default function PaymentPage(props: SearchParamsProps) {
  return (
    <OrderScreen searchParams={props.searchParams} paymentResult="success" />
  );
}
