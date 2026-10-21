import { productCategories } from "@/db/shared";
import {
  createLoader,
  parseAsArrayOf,
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

export const productsFeaturedOptions = ["all", "featured", "standard"] as const;
export type ProductsFeaturedOption = (typeof productsFeaturedOptions)[number];

export const productsActiveOptions = ["all", "active", "inactive"] as const;
export type ProductsActiveOption = (typeof productsActiveOptions)[number];

export const productsSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  sortBy: parseAsStringEnum([...productsSortByOptions])
    .withDefault("recently_created")
    .withOptions({ clearOnDefault: true }),
  categories: parseAsArrayOf(parseAsStringEnum([...productCategories]))
    .withDefault([])
    .withOptions({ clearOnDefault: true }),
  featured: parseAsStringEnum([...productsFeaturedOptions])
    .withDefault("all")
    .withOptions({ clearOnDefault: true }),
  active: parseAsStringEnum([...productsActiveOptions])
    .withDefault("all")
    .withOptions({ clearOnDefault: true }),
};
export const loadProductsSearchParams = createLoader(productsSearchParams);
