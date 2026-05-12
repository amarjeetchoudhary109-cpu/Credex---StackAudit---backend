"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const index_1 = require("../../db/index");
const schema_1 = require("../../db/schema");
const apiError_1 = require("../../utils/apiError");
class OrganizationService {
    async create(input) {
        const [org] = await index_1.db.insert(schema_1.organizationsTable).values(input).returning();
        if (!org) {
            throw new apiError_1.ApiError(500, "Failed to create organization");
        }
        return org;
    }
    async getById(id) {
        const [org] = await index_1.db
            .select()
            .from(schema_1.organizationsTable)
            .where((0, drizzle_orm_1.eq)(schema_1.organizationsTable.id, id))
            .limit(1);
        if (!org) {
            throw new apiError_1.ApiError(404, "Organization not found");
        }
        return org;
    }
    async patch(id, input) {
        await this.getById(id);
        const [updated] = await index_1.db
            .update(schema_1.organizationsTable)
            .set(input)
            .where((0, drizzle_orm_1.eq)(schema_1.organizationsTable.id, id))
            .returning();
        return updated;
    }
}
exports.OrganizationService = OrganizationService;
//# sourceMappingURL=organization.service.js.map