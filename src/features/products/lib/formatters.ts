import { ProductCategory } from "@/db/shared";
import { ArmchairIcon, HammerIcon, ShieldIcon, SwordsIcon } from "lucide-react";
import {
  ProductsActiveOption,
  ProductsFeaturedOption,
  ProductsSortByOption,
} from "./params";

export const formatProductCategory = (category: ProductCategory) => {
  switch (category) {
    case "armor":
      return {
        label: "Armor",
        icon: ShieldIcon,
      };
    case "household":
      return {
        label: "Household",
        icon: ArmchairIcon,
      };
    case "tools_supplies":
      return {
        label: "Tools & Supplies",
        icon: HammerIcon,
      };
    case "weapons":
      return {
        label: "Weapons",
        icon: SwordsIcon,
      };
    default:
      throw new Error(`Unknown category: ${category satisfies never}`);
  }
};

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price / 100);
};

export const formatProductSortByOption = (option: ProductsSortByOption) => {
  switch (option) {
    case "oldest":
      return "Oldest";
    case "price_high_to_low":
      return "Price - High to Low";
    case "price_low_to_high":
      return "Price - Low to High";
    case "recently_created":
      return "Recently Created";
    case "recently_updated":
      return "Recently Updated";
    default:
      throw new Error(
        `Unknown product sort by option: ${option satisfies never}`,
      );
  }
};

export const formatProductFeaturedOption = (option: ProductsFeaturedOption) => {
  switch (option) {
    case "all":
      return "All";
    case "featured":
      return "Featured";
    case "standard":
      return "Standard";
    default:
      throw new Error(
        `Unknown product featured option: ${option satisfies never}`,
      );
  }
};

export const formatProductActiveOption = (option: ProductsActiveOption) => {
  switch (option) {
    case "all":
      return "All";
    case "active":
      return "Active";
    case "inactive":
      return "Inactive";
    default:
      throw new Error(
        `Unknown product active option: ${option satisfies never}`,
      );
  }
};
