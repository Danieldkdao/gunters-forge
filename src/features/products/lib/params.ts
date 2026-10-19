import { productCategories } from "@/db/shared";
import {
  createLoader,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

export const productsSortByOptions = [
  "recently_created",
  "oldest",
  "recently_updated",
  "price_high_to_low",
  "price_low_to_high",
] as const;
export type ProductsSortByOption = (typeof productsSortByOptions)[number];

export const productsSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  sortBy: parseAsStringEnum([...productsSortByOptions])
    .withDefault("recently_created")
    .withOptions({ clearOnDefault: true }),
  categories: parseAsArrayOf(parseAsStringEnum([...productCategories]))
    .withDefault([])
    .withOptions({ clearOnDefault: true }),
  featuredOnly: parseAsBoolean
    .withDefault(false)
    .withOptions({ clearOnDefault: true }),
};
export const loadProductsSearchParams = createLoader(productsSearchParams);
