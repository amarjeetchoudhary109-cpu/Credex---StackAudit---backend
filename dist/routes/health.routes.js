"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = void 0;
const express_1 = require("express");
const health_controller_1 = require("../controllers/health.controller");
const router = (0, express_1.Router)();
exports.healthRoutes = router;
router.get("/", health_controller_1.checkHealth);
//# sourceMappingURL=health.routes.js.map