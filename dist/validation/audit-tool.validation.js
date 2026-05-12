"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchAuditToolSchema = exports.createAuditToolSchema = void 0;
const zod_1 = require("zod");
const enums_validation_1 = require("./enums.validation");
exports.createAuditToolSchema = zod_1.z.object({
    auditId: zod_1.z.string().uuid(),
    tool: enums_validation_1.supportedToolSchema,
    planName: zod_1.z.string().min(1).max(120),
    monthlyCost: zod_1.z.number().finite().nonnegative(),
    seats: zod_1.z.number().int().positive(),
    utilizationScore: zod_1.z.number().int().min(0).max(100).optional(),
    active: zod_1.z.boolean().optional(),
});
exports.patchAuditToolSchema = exports.createAuditToolSchema
    .omit({ auditId: true })
    .partial();
//# sourceMappingURL=audit-tool.validation.js.map