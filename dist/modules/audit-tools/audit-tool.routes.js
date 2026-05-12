"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditToolRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validate_1 = require("../../middleware/validate");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const audit_tool_validation_1 = require("../../validation/audit-tool.validation");
const audit_tool_controller_1 = require("./audit-tool.controller");
const router = (0, express_1.Router)();
exports.auditToolRoutes = router;
const idParams = zod_1.z.object({ id: zod_1.z.string().uuid() });
router.post("/", auth_middleware_1.requireAuth, (0, validate_1.validateBody)(audit_tool_validation_1.createAuditToolSchema), audit_tool_controller_1.createAuditTool);
router.patch("/:id", auth_middleware_1.requireAuth, (0, validate_1.validateParams)(idParams), (0, validate_1.validateBody)(audit_tool_validation_1.patchAuditToolSchema), audit_tool_controller_1.patchAuditTool);
router.delete("/:id", auth_middleware_1.requireAuth, (0, validate_1.validateParams)(idParams), audit_tool_controller_1.deleteAuditTool);
//# sourceMappingURL=audit-tool.routes.js.map