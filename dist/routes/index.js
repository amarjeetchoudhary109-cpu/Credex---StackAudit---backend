"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRoutes = void 0;
const express_1 = require("express");
const audit_routes_1 = require("./audit.routes");
const benchmark_routes_1 = require("./benchmark.routes");
const health_routes_1 = require("./health.routes");
const lead_routes_1 = require("./lead.routes");
const router = (0, express_1.Router)();
exports.apiRoutes = router;
router.use("/audits", audit_routes_1.auditRoutes);
router.use("/leads", lead_routes_1.leadRoutes);
router.use("/benchmarks", benchmark_routes_1.benchmarkRoutes);
router.use("/health", health_routes_1.healthRoutes);
//# sourceMappingURL=index.js.map