import { getGlobalTag, getIdTag } from "@/lib/data-cache";
import { revalidateTag } from "next/cache";

export const getGlobalProductTag = () => {
  return getGlobalTag("products");
};

export const getProductSlugTag = (slug: string) => {
  return getIdTag("products", slug);
};

// Expire product tags to ensure mutations always force fresh data
export const revalidateProductCache = (...slugs: string[]) => {
  revalidateTag(getGlobalProductTag(), { expire: 0 });
  for (const slug of new Set(slugs)) {
    revalidateTag(getProductSlugTag(slug), { expire: 0 });
  }
};
