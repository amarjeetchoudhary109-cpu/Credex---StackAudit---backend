"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationModuleService = void 0;
exports.parseLegacyPayload = parseLegacyPayload;
const drizzle_orm_1 = require("drizzle-orm");
const index_1 = require("../../db/index");
const schema_1 = require("../../db/schema");
const apiError_1 = require("../../utils/apiError");
function parseLegacyPayload(description) {
    if (!description?.trim()) {
        return null;
    }
    try {
        return JSON.parse(description);
    }
    catch {
        return null;
    }
}
class RecommendationModuleService {
    async listForAudit(auditId) {
        const rows = await index_1.db
            .select()
            .from(schema_1.recommendationsTable)
            .where((0, drizzle_orm_1.eq)(schema_1.recommendationsTable.auditId, auditId))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.recommendationsTable.createdAt));
        return rows.map((row) => ({
            id: row.id,
            auditId: row.auditId,
            title: row.title,
            description: row.description,
            estimatedSavings: row.estimatedSavings
                ? Number(row.estimatedSavings)
                : null,
            priority: row.priority,
            implemented: row.implemented,
            createdAt: row.createdAt,
            engine: parseLegacyPayload(row.description),
        }));
    }
    async patch(id, input) {
        const [existing] = await index_1.db
            .select()
            .from(schema_1.recommendationsTable)
            .where((0, drizzle_orm_1.eq)(schema_1.recommendationsTable.id, id))
            .limit(1);
        if (!existing) {
            throw new apiError_1.ApiError(404, "Recommendation not found");
        }
        const updates = {};
        if (input.title !== undefined)
            updates.title = input.title;
        if (input.description !== undefined)
            updates.description = input.description;
        if (input.priority !== undefined)
            updates.priority = input.priority;
        if (input.implemented !== undefined)
            updates.implemented = input.implemented;
        const [row] = await index_1.db
            .update(schema_1.recommendationsTable)
            .set(updates)
            .where((0, drizzle_orm_1.eq)(schema_1.recommendationsTable.id, id))
            .returning();
        return row;
    }
}
exports.RecommendationModuleService = RecommendationModuleService;
//# sourceMappingURL=recommendation.service.js.map