import { getGlobalTag, getIdTag, getUserResourceTag } from "@/lib/data-cache";
import { revalidateTag } from "next/cache";

export const getOrderGlobalTag = () => {
  return getGlobalTag("orders");
};

export const getOrderIdTag = (id: string) => {
  return getIdTag("orders", id);
};

export const getUserOrderTag = (userId: string) => {
  return getUserResourceTag(userId, "orders");
};

export const revalidateOrderCache = (userId: string, id: string) => {
  revalidateTag(getOrderGlobalTag(), { expire: 0 });
  revalidateTag(getOrderIdTag(id), { expire: 0 });
  revalidateTag(getUserOrderTag(userId), { expire: 0 });
};
