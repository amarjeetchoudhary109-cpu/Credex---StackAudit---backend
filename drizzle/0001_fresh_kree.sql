CREATE TYPE "public"."supported_tool" AS ENUM('cursor', 'github_copilot', 'claude', 'chatgpt', 'anthropic_api', 'openai_api', 'gemini', 'windsurf');--> statement-breakpoint
CREATE TYPE "public"."use_case" AS ENUM('coding', 'writing', 'data', 'research', 'mixed');--> statement-breakpoint
CREATE TABLE "audit_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" uuid NOT NULL,
	"tool" "supported_tool" NOT NULL,
	"current_plan" varchar(100) NOT NULL,
	"seats" integer NOT NULL,
	"current_monthly_spend" numeric(12, 2) NOT NULL,
	"recommended_action" text NOT NULL,
	"recommended_plan_or_tool" varchar(120) NOT NULL,
	"recommended_monthly_spend" numeric(12, 2) NOT NULL,
	"monthly_savings" numeric(12, 2) NOT NULL,
	"annual_savings" numeric(12, 2) NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_size" integer NOT NULL,
	"primary_use_case" "use_case" NOT NULL,
	"total_current_monthly_spend" numeric(12, 2) NOT NULL,
	"total_recommended_monthly_spend" numeric(12, 2) NOT NULL,
	"total_monthly_savings" numeric(12, 2) NOT NULL,
	"total_annual_savings" numeric(12, 2) NOT NULL,
	"llm_summary" text,
	"templated_summary" text,
	"summary_provider" varchar(50),
	"is_high_savings_lead" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" uuid,
	"email" varchar(255) NOT NULL,
	"company_name" varchar(255),
	"role" varchar(120),
	"reported_team_size" integer,
	"consent_to_contact" boolean DEFAULT true NOT NULL,
	"source" varchar(80),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" uuid NOT NULL,
	"slug" varchar(80) NOT NULL,
	"title" varchar(140) NOT NULL,
	"og_description" text NOT NULL,
	"public_payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "public_reports_audit_id_unique" UNIQUE("audit_id"),
	CONSTRAINT "public_reports_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "audit_items" ADD CONSTRAINT "audit_items_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_reports" ADD CONSTRAINT "public_reports_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE cascade ON UPDATE no action;