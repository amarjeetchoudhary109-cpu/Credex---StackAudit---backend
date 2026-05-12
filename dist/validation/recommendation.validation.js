"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchRecommendationSchema = void 0;
const zod_1 = require("zod");
exports.patchRecommendationSchema = zod_1.z
    .object({
    title: zod_1.z.string().min(1).max(255).optional(),
    description: zod_1.z.string().optional(),
    priority: zod_1.z.string().max(50).optional(),
    implemented: zod_1.z.boolean().optional(),
})
    .refine((data) => data.title !== undefined ||
    data.description !== undefined ||
    data.priority !== undefined ||
    data.implemented !== undefined, { message: "Provide at least one field to update" });
//# sourceMappingURL=recommendation.validation.js.map