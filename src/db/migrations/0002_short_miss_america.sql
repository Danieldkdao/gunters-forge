CREATE TYPE "public"."product_categories" AS ENUM('weapons', 'armor', 'household', 'tools_supplies');--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"image" text,
	"category" "product_categories" NOT NULL,
	"price" integer NOT NULL,
	"crafting_time_minutes" integer NOT NULL,
	"display_order" integer NOT NULL,
	"is_active" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
