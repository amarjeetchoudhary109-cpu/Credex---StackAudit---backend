ALTER TABLE "audit_items" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public_reports" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "audit_items" CASCADE;--> statement-breakpoint
DROP TABLE "public_reports" CASCADE;--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN "share_id" varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN "monthly_savings" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN "annual_savings" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN "efficiency_score" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN "tools_json" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN "recommendations_json" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "audits" DROP COLUMN "total_current_monthly_spend";--> statement-breakpoint
ALTER TABLE "audits" DROP COLUMN "total_recommended_monthly_spend";--> statement-breakpoint
ALTER TABLE "audits" DROP COLUMN "total_monthly_savings";--> statement-breakpoint
ALTER TABLE "audits" DROP COLUMN "total_annual_savings";--> statement-breakpoint
ALTER TABLE "audits" DROP COLUMN "llm_summary";--> statement-breakpoint
ALTER TABLE "audits" DROP COLUMN "templated_summary";--> statement-breakpoint
ALTER TABLE "audits" DROP COLUMN "summary_provider";--> statement-breakpoint
ALTER TABLE "audits" DROP COLUMN "is_high_savings_lead";--> statement-breakpoint
ALTER TABLE "audits" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "leads" DROP COLUMN "reported_team_size";--> statement-breakpoint
ALTER TABLE "leads" DROP COLUMN "consent_to_contact";--> statement-breakpoint
ALTER TABLE "leads" DROP COLUMN "source";--> statement-breakpoint
ALTER TABLE "audits" ADD CONSTRAINT "audits_share_id_unique" UNIQUE("share_id");