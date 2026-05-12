"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditToolService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const index_1 = require("../../db/index");
const schema_1 = require("../../db/schema");
const apiError_1 = require("../../utils/apiError");
class AuditToolService {
    async ensureAuditExists(auditId) {
        const [a] = await index_1.db
            .select({ id: schema_1.auditsTable.id })
            .from(schema_1.auditsTable)
            .where((0, drizzle_orm_1.eq)(schema_1.auditsTable.id, auditId))
            .limit(1);
        if (!a) {
            throw new apiError_1.ApiError(404, "Audit not found");
        }
    }
    async create(input) {
        await this.ensureAuditExists(input.auditId);
        const [row] = await index_1.db
            .insert(schema_1.auditToolsTable)
            .values({
            auditId: input.auditId,
            tool: input.tool,
            planName: input.planName,
            monthlyCost: input.monthlyCost.toFixed(2),
            seats: input.seats,
            utilizationScore: input.utilizationScore ?? null,
            active: input.active ?? true,
        })
            .returning();
        if (!row) {
            throw new apiError_1.ApiError(500, "Failed to create audit tool");
        }
        return this.serialize(row);
    }
    async patch(id, input) {
        const [existing] = await index_1.db
            .select()
            .from(schema_1.auditToolsTable)
            .where((0, drizzle_orm_1.eq)(schema_1.auditToolsTable.id, id))
            .limit(1);
        if (!existing) {
            throw new apiError_1.ApiError(404, "Audit tool not found");
        }
        const updates = {};
        if (input.tool !== undefined)
            updates.tool = input.tool;
        if (input.planName !== undefined)
            updates.planName = input.planName;
        if (input.monthlyCost !== undefined) {
            updates.monthlyCost = input.monthlyCost.toFixed(2);
        }
        if (input.seats !== undefined)
            updates.seats = input.seats;
        if (input.utilizationScore !== undefined) {
            updates.utilizationScore = input.utilizationScore;
        }
        if (input.active !== undefined)
            updates.active = input.active;
        const [row] = await index_1.db
            .update(schema_1.auditToolsTable)
            .set(updates)
            .where((0, drizzle_orm_1.eq)(schema_1.auditToolsTable.id, id))
            .returning();
        return this.serialize(row);
    }
    async delete(id) {
        const [existing] = await index_1.db
            .select()
            .from(schema_1.auditToolsTable)
            .where((0, drizzle_orm_1.eq)(schema_1.auditToolsTable.id, id))
            .limit(1);
        if (!existing) {
            throw new apiError_1.ApiError(404, "Audit tool not found");
        }
        await index_1.db.delete(schema_1.auditToolsTable).where((0, drizzle_orm_1.eq)(schema_1.auditToolsTable.id, id));
        return { success: true };
    }
    serialize(row) {
        return {
            ...row,
            monthlyCost: Number(row.monthlyCost),
        };
    }
}
exports.AuditToolService = AuditToolService;
//# sourceMappingURL=audit-tool.service.js.map