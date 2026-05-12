"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recommendationRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validate_1 = require("../../middleware/validate");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const recommendation_validation_1 = require("../../validation/recommendation.validation");
const recommendation_controller_1 = require("./recommendation.controller");
const router = (0, express_1.Router)();
exports.recommendationRoutes = router;
const idParams = zod_1.z.object({ id: zod_1.z.string().uuid() });
router.patch("/:id", auth_middleware_1.requireAuth, (0, validate_1.validateParams)(idParams), (0, validate_1.validateBody)(recommendation_validation_1.patchRecommendationSchema), recommendation_controller_1.patchRecommendation);
//# sourceMappingURL=recommendation.routes.js.map