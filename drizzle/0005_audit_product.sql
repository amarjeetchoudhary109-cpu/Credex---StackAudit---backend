ALTER TABLE "audits" ADD COLUMN IF NOT EXISTS "tools_snapshot" jsonb;
ALTER TABLE "audits" ADD COLUMN IF NOT EXISTS "ai_summary" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "team_size" integer;

CREATE TABLE IF NOT EXISTS "pricing_snapshots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "label" varchar(120) NOT NULL,
  "payload" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "audits" ALTER COLUMN "share_id" SET DATA TYPE varchar(32);
