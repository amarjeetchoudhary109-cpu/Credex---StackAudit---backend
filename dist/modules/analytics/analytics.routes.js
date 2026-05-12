"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const analytics_controller_1 = require("./analytics.controller");
const router = (0, express_1.Router)();
exports.analyticsRoutes = router;
router.get("/overview", auth_middleware_1.requireAuth, analytics_controller_1.analyticsOverview);
router.get("/spend-trends", auth_middleware_1.requireAuth, analytics_controller_1.analyticsSpendTrends);
router.get("/tool-distribution", auth_middleware_1.requireAuth, analytics_controller_1.analyticsToolDistribution);
router.get("/savings", auth_middleware_1.requireAuth, analytics_controller_1.analyticsSavings);
router.get("/efficiency", auth_middleware_1.requireAuth, analytics_controller_1.analyticsEfficiency);
//# sourceMappingURL=analytics.routes.js.map