-- Drop old tables that no longer exist in schema
DROP TABLE IF EXISTS "public_reports" CASCADE;
DROP TABLE IF EXISTS "audit_items" CASCADE;
DROP TABLE IF EXISTS "audits" CASCADE;
DROP TABLE IF EXISTS "leads" CASCADE;

-- Drop old enums if they exist (will recreate below)
DROP TYPE IF EXISTS "public"."supported_tool" CASCADE;
DROP TYPE IF EXISTS "public"."use_case" CASCADE;

-- Recreate enums
CREATE TYPE "public"."use_case" AS ENUM('coding', 'writing', 'data', 'research', 'mixed');
CREATE TYPE "public"."supported_tool" AS ENUM('cursor', 'github_copilot', 'claude', 'chatgpt', 'anthropic_api', 'openai_api', 'gemini', 'windsurf');

-- Create audits table with new schema
CREATE TABLE "audits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "share_id" varchar(10) NOT NULL,
  "team_size" integer NOT NULL,
  "primary_use_case" "use_case" NOT NULL,
  "monthly_savings" numeric(12, 2) NOT NULL,
  "annual_savings" numeric(12, 2) NOT NULL,
  "efficiency_score" integer NOT NULL,
  "tools_json" jsonb NOT NULL,
  "recommendations_json" jsonb NOT NULL,
  "summary" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "audits_share_id_unique" UNIQUE("share_id")
);

-- Create leads table with new schema
CREATE TABLE "leads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "audit_id" uuid,
  "email" varchar(255) NOT NULL,
  "company_name" varchar(255),
  "role" varchar(120),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "leads_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE set null
);
