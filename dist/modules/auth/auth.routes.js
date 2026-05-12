"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const validate_1 = require("../../middleware/validate");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const auth_controller_1 = require("./auth.controller");
const auth_validation_1 = require("../../validation/auth.validation");
/**
 * Session/profile route only. Login/register are registered on `app` in `app.ts`
 * so POST paths match reliably across Express 5 + nested routers.
 */
const router = (0, express_1.Router)();
exports.authRoutes = router;
router.get("/me", auth_middleware_1.requireAuth, auth_controller_1.me);
router.patch("/me", auth_middleware_1.requireAuth, (0, validate_1.validateBody)(auth_validation_1.updateProfileSchema), auth_controller_1.updateProfile);
router.post("/me/password", auth_middleware_1.requireAuth, (0, validate_1.validateBody)(auth_validation_1.changePasswordSchema), auth_controller_1.changePassword);
//# sourceMappingURL=auth.routes.js.map