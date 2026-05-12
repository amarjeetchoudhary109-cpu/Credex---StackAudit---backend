"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPublicReportSchema = void 0;
const zod_1 = require("zod");
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
exports.createPublicReportSchema = zod_1.z.object({
    auditId: zod_1.z.string().uuid(),
    slug: zod_1.z.string().trim().min(3).max(80).regex(slugRegex),
    title: zod_1.z.string().trim().min(1).max(140),
    ogDescription: zod_1.z.string().trim().min(1).max(300),
    publicPayload: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()),
});
//# sourceMappingURL=public-report.validation.js.map