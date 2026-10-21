CREATE TYPE "public"."planner_run_statuses" AS ENUM('pending_review', 'approved', 'applied', 'rejected', 'stale');--> statement-breakpoint
CREATE TYPE "public"."planner_work_types" AS ENUM('small_job', 'extended_project', 'batch_candidate', 'standard');--> statement-breakpoint
CREATE TABLE "planner_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"planner_run_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"order_ref" text NOT NULL,
	"position" integer NOT NULL,
	"work_type" "planner_work_types" NOT NULL,
	"reason" text NOT NULL,
	CONSTRAINT "planner_recommendations_run_order_unique" UNIQUE("planner_run_id","order_id"),
	CONSTRAINT "planner_recommendations_run_position_unique" UNIQUE("planner_run_id","position"),
	CONSTRAINT "planner_recommendations_run_ref_unique" UNIQUE("planner_run_id","order_ref"),
	CONSTRAINT "planner_recommendations_position_check" CHECK ("planner_recommendations"."position" > 0),
	CONSTRAINT "planner_recommendations_order_ref_check" CHECK ("planner_recommendations"."order_ref" ~ '^order-[1-9][0-9]*$')
);
--> statement-breakpoint
CREATE TABLE "planner_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trigger_run_id" text NOT NULL,
	"status" "planner_run_statuses" DEFAULT 'pending_review' NOT NULL,
	"snapshot_version" text NOT NULL,
	"model" text NOT NULL,
	"summary" text NOT NULL,
	"generated_at" timestamp with time zone NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"applied_by" uuid,
	"applied_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "planner_runs_trigger_run_id_unique" UNIQUE("trigger_run_id"),
	CONSTRAINT "planner_runs_snapshot_version_check" CHECK ("planner_runs"."snapshot_version" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "queue_rank_is_manual" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "orders" SET "queue_rank_is_manual" = true WHERE "queue_rank" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "planner_recommendations" ADD CONSTRAINT "planner_recommendations_planner_run_id_planner_runs_id_fk" FOREIGN KEY ("planner_run_id") REFERENCES "public"."planner_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_recommendations" ADD CONSTRAINT "planner_recommendations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_runs" ADD CONSTRAINT "planner_runs_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_runs" ADD CONSTRAINT "planner_runs_applied_by_user_id_fk" FOREIGN KEY ("applied_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "planner_runs_status_created_idx" ON "planner_runs" USING btree ("status","created_at","id");