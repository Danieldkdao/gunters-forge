import { productCategories } from "@/db/shared";
import { generateSlug } from "@/lib/utils";
import z from "zod";
import {
  productsActiveOptions,
  productsFeaturedOptions,
  productsSortByOptions,
} from "../lib/params";
import {
  createCursorPaginationSchema,
  isoTimestampSchema,
} from "@/lib/schemas";

export const productsCursorPaginationSchema = createCursorPaginationSchema(
  z.object({
    id: z.uuid(),
    marker: z.union([isoTimestampSchema, z.number().int().positive().min(1)]),
  }),
);

export const readProductsOptionsSchema = z.object({
  search: z.string().trim().default(""),
  sortBy: z.enum(productsSortByOptions).default("recently_created"),
  categories: z.array(z.enum(productCategories)).default([]),
  featured: z.enum(productsFeaturedOptions).default("all"),
  active: z.enum(productsActiveOptions).default("all"),
  lastCursor: z.base64url().nullable().default(null).optional(),
});
export type ReadProductsOptionsSchema = z.infer<
  typeof readProductsOptionsSchema
>;

export const createProductSchema = z.object({
  name: z.string().trim().min(1, { error: "Please enter a product name." }),
  slug: z
    .string()
    .trim()
    .min(1, { error: "Please enter a product slug." })
    .toLowerCase()
    .transform((input) => generateSlug(input)),
  description: z
    .string()
    .trim()
    .min(1, { error: "Please enter a product description." }),
  imageUrl: z.url("Please enter a valid image URL."),
  category: z.enum(productCategories),
  price: z
    .number({ error: "Please enter a number." })
    .positive({ error: "Please enter a positive number." })
    .min(1, { error: "Please enter a number greater than 1." }),
  craftingTimeMinutes: z
    .number({ error: "Please enter a number." })
    .int({ error: "Please enter an integer." })
    .positive({ error: "Please enter a positive integer." })
    .min(1, { error: "Please enter a positive integer greater than 1." }),
  featured: z.boolean(),
  isActive: z.boolean(),
});
export type CreateProductSchema = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();
export type UpdateProductSchema = z.infer<typeof updateProductSchema>;
