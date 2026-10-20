import { ProductCategory } from "@/db/shared";
import { ArmchairIcon, HammerIcon, ShieldIcon, SwordsIcon } from "lucide-react";

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
