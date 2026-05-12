"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchOrganizationSchema = exports.createOrganizationSchema = void 0;
const zod_1 = require("zod");
exports.createOrganizationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    industry: zod_1.z.string().max(120).optional(),
    companySize: zod_1.z.number().int().positive().optional(),
});
exports.patchOrganizationSchema = exports.createOrganizationSchema.partial();
//# sourceMappingURL=organization.validation.js.map