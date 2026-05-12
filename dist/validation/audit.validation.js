"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCaseSchema = exports.supportedToolSchema = exports.createAuditSchema = exports.toolInputSchema = void 0;
const zod_1 = require("zod");
const enums_validation_1 = require("./enums.validation");
Object.defineProperty(exports, "supportedToolSchema", { enumerable: true, get: function () { return enums_validation_1.supportedToolSchema; } });
Object.defineProperty(exports, "useCaseSchema", { enumerable: true, get: function () { return enums_validation_1.useCaseSchema; } });
exports.toolInputSchema = zod_1.z.object({
    tool: enums_validation_1.supportedToolSchema,
    plan: zod_1.z.string().min(1),
    monthlySpend: zod_1.z.number().min(0),
    seats: zod_1.z.number().int().min(1),
});
exports.createAuditSchema = zod_1.z.object({
    teamSize: zod_1.z.number().int().min(1).max(1000),
    primaryUseCase: enums_validation_1.useCaseSchema,
    tools: zod_1.z.array(exports.toolInputSchema).min(1).max(10),
    organizationId: zod_1.z.string().uuid().optional(),
});
//# sourceMappingURL=audit.validation.js.map