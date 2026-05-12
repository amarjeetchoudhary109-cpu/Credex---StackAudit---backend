import { sql } from "drizzle-orm";

import { app } from "./app";
import { db } from "./db/index";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    console.log("Testing database connection...");
    await db.execute(sql`SELECT 1`);
    console.log("✅ Database connected successfully");

    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`🚀 Server running on http://127.0.0.1:${PORT} (bound 0.0.0.0:${PORT})`);
      console.log(`   API: http://127.0.0.1:${PORT}/api/v1/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
