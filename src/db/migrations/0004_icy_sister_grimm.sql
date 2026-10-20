ALTER TABLE "products" ALTER COLUMN "image" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stripe_product_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stripe_price_id" varchar NOT NULL;