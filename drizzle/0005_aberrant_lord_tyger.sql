CREATE TABLE "pricing_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" varchar(120) NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audits" ALTER COLUMN "share_id" SET DATA TYPE varchar(32);--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN "tools_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN "ai_summary" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "team_size" integer;