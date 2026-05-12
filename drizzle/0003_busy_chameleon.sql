CREATE TYPE "public"."audit_status" AS ENUM('pending', 'analyzing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "audit_tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" uuid NOT NULL,
	"tool" "supported_tool" NOT NULL,
	"plan_name" varchar(120) NOT NULL,
	"monthly_cost" numeric(12, 2) NOT NULL,
	"seats" integer NOT NULL,
	"utilization_score" integer,
	"active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"industry" varchar(120),
	"company_size" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audit_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"estimated_savings" numeric(12, 2),
	"priority" varchar(50),
	"implemented" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"password_hash" varchar(255),
	"image_url" text,
	"role" varchar(50) DEFAULT 'user',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN "total_monthly_spend" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN "unused_license_monthly_waste" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "audits" ADD COLUMN "status" "audit_status" DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_tools" ADD CONSTRAINT "audit_tools_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audits" ADD CONSTRAINT "audits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audits" ADD CONSTRAINT "audits_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audits" DROP COLUMN "tools_json";--> statement-breakpoint
ALTER TABLE "audits" DROP COLUMN "recommendations_json";