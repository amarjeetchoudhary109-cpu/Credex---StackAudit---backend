"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditItemSchema = void 0;
const zod_1 = require("zod");
const enums_validation_1 = require("./enums.validation");
const moneySchema = zod_1.z.number().finite().nonnegative();
exports.createAuditItemSchema = zod_1.z.object({
    tool: enums_validation_1.supportedToolSchema,
    currentPlan: zod_1.z.string().trim().min(1).max(100),
    seats: zod_1.z.number().int().positive(),
    currentMonthlySpend: moneySchema,
    recommendedAction: zod_1.z.string().trim().min(1),
    recommendedPlanOrTool: zod_1.z.string().trim().min(1).max(120),
    recommendedMonthlySpend: moneySchema,
    monthlySavings: moneySchema,
    annualSavings: moneySchema,
    reason: zod_1.z.string().trim().min(1),
});
//# sourceMappingURL=audit-item.validation.js.map