import { tool } from "ai";
import z from "zod";
import type { OrderStatus, ProductCategory } from "@/db/shared";
import { confirmProductExistenceDb } from "@/features/products/server/product-reads";
import type { PlannerSnapshot } from "./planner-snapshot";

type PlannerOrderSummary = {
  orderRef: string;
  status: OrderStatus;
  currentPosition: number;
  hasManualPriority: boolean;
  waitingMinutes: number;
  totalQuantity: number;
  craftingTimeMinutes: number;
  categories: ProductCategory[];
};

export const createPlannerTools = ({
  snapshot,
  orderMap,
  orders,
}: {
  snapshot: PlannerSnapshot;
  orderMap: ReadonlyMap<string, PlannerSnapshot["orders"][number]>;
  orders: PlannerOrderSummary[];
}) => {
  const productMap = new Map(
    [...new Set(snapshot.items.map((item) => item.productId))].map(
      (id, index) => [`product-${index + 1}`, id],
    ),
  );
  const productRefs = new Map([...productMap].map(([ref, id]) => [id, ref]));
  const orderRefSchema = z.enum([...orderMap.keys()] as [string, ...string[]]);
  const productRefSchema = z.enum([...productMap.keys()] as [
    string,
    ...string[],
  ]);
  return {
    readOrders: tool({
      description:
        "Read frozen operational details for up to ten orders in the supplied snapshot. Contains no customer or payment data.",
      inputSchema: z
        .object({ orderRefs: z.array(orderRefSchema).min(1).max(10) })
        .strict(),
      execute: async ({ orderRefs }) =>
        orderRefs.map((orderRef) => {
          const order = orderMap.get(orderRef)!;
          return {
            ...orders.find((item) => item.orderRef === orderRef)!,
            items: snapshot.items
              .filter((item) => item.orderId === order.id)
              .map((item) => ({
                productRef: productRefs.get(item.productId)!,
                category: item.category,
                quantity: item.quantity,
                craftingTimeMinutes: item.craftingTimeMinutes,
              })),
          };
        }),
    }),
    // Prices stay locked to the snapshot, product reads remain current
    readProducts: tool({
      description:
        "Read public catalog context for up to ten product references belonging to the snapshot. Order item estimates remain authoritative.",
      inputSchema: z
        .object({ productRefs: z.array(productRefSchema).min(1).max(10) })
        .strict(),
      execute: async ({ productRefs }) =>
        Promise.all(
          productRefs.map(async (productRef) => {
            try {
              const product = await confirmProductExistenceDb(
                productMap.get(productRef)!,
              );
              return product
                ? {
                    productRef,
                    name: product.name.slice(0, 160),
                    category: product.category,
                    craftingTimeMinutes: product.craftingTimeMinutes,
                    isActive: product.isActive,
                  }
                : { productRef, unavailable: true };
            } catch {
              return { productRef, unavailable: true };
            }
          }),
        ),
    }),
  };
};
