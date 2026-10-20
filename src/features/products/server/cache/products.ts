import { getGlobalTag, getIdTag } from "@/lib/data-cache";
import { revalidateTag } from "next/cache";

export const getGlobalProductTag = () => {
  return getGlobalTag("products");
};

export const getProductIdTag = (id: string) => {
  return getIdTag("products", id);
};

// Expire product tags to ensure mutations always force fresh data
export const revalidateProductCache = (id: string) => {
  revalidateTag(getGlobalProductTag(), { expire: 0 });
  revalidateTag(getProductIdTag(id), { expire: 0 });
};
