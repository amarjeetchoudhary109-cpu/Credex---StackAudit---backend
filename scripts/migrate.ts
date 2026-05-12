import postgres from "postgres";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function migrate() {
  console.log("Running migration...");

  const migrationSQL = fs.readFileSync(
    path.join(process.cwd(), "drizzle", "0002_new_schema.sql"),
    "utf-8"
  );

  try {
    await sql.unsafe(migrationSQL);
    console.log("✅ Migration completed successfully");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
