"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const audit_controller_1 = require("../controllers/audit.controller");
const validate_1 = require("../middleware/validate");
const rateLimit_1 = require("../middleware/rateLimit");
const audit_validation_1 = require("../validation/audit.validation");
const router = (0, express_1.Router)();
exports.auditRoutes = router;
const shareParams = zod_1.z.object({
    shareId: zod_1.z.string().min(8).max(32),
});
const createAuditLimiter = (0, rateLimit_1.rateLimitMiddleware)({
    name: "audit_create",
    max: 30,
    windowMs: 60000,
});
const aiSummaryLimiter = (0, rateLimit_1.rateLimitMiddleware)({
    name: "audit_ai_summary",
    max: 20,
    windowMs: 60000,
});
router.post("/", createAuditLimiter, (0, validate_1.validateBody)(audit_validation_1.createAuditSchema), audit_controller_1.createAudit);
router.get("/share/:shareId/open", (0, validate_1.validateParams)(shareParams), audit_controller_1.getShareOpenGraphHtml);
router.get("/share/:shareId/og.svg", (0, validate_1.validateParams)(shareParams), audit_controller_1.getShareOgSvg);
router.post("/share/:shareId/ai-summary", aiSummaryLimiter, (0, validate_1.validateParams)(shareParams), audit_controller_1.postAiSummaryByShareId);
router.get("/share/:shareId", (0, validate_1.validateParams)(shareParams), audit_controller_1.getAuditByShareId);
//# sourceMappingURL=audit.routes.js.map