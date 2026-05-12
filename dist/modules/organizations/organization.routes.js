"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validate_1 = require("../../middleware/validate");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const organization_validation_1 = require("../../validation/organization.validation");
const organization_controller_1 = require("./organization.controller");
const router = (0, express_1.Router)();
exports.organizationRoutes = router;
const idParams = zod_1.z.object({ id: zod_1.z.string().uuid() });
router.post("/", auth_middleware_1.requireAuth, (0, validate_1.validateBody)(organization_validation_1.createOrganizationSchema), organization_controller_1.createOrganization);
router.get("/:id", auth_middleware_1.requireAuth, (0, validate_1.validateParams)(idParams), organization_controller_1.getOrganization);
router.patch("/:id", auth_middleware_1.requireAuth, (0, validate_1.validateParams)(idParams), (0, validate_1.validateBody)(organization_validation_1.patchOrganizationSchema), organization_controller_1.patchOrganization);
//# sourceMappingURL=organization.routes.js.map