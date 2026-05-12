"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.benchmarkRoutes = void 0;
const express_1 = require("express");
const audit_controller_1 = require("../controllers/audit.controller");
const router = (0, express_1.Router)();
exports.benchmarkRoutes = router;
router.get("/", audit_controller_1.getBenchmarks);
//# sourceMappingURL=benchmark.routes.js.map