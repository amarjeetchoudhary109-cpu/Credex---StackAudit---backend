"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const drizzle_orm_1 = require("drizzle-orm");
const app_1 = require("./app");
const index_1 = require("./db/index");
const PORT = process.env.PORT || 3000;
async function startServer() {
    try {
        // Test database connection
        console.log("Testing database connection...");
        await index_1.db.execute((0, drizzle_orm_1.sql) `SELECT 1`);
        console.log("✅ Database connected successfully");
        app_1.app.listen(Number(PORT), "0.0.0.0", () => {
            console.log(`🚀 Server running on http://127.0.0.1:${PORT} (bound 0.0.0.0:${PORT})`);
            console.log(`   API: http://127.0.0.1:${PORT}/api/v1/health`);
        });
    }
    catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=index.js.map