import { OrdersScreen } from "@/features/orders/components/orders-screen";
import type { SearchParamsProps } from "@/lib/types";

export default function OrdersPage(props: SearchParamsProps) {
  return <OrdersScreen {...props} />;
}
