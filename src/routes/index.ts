import { Router } from "express";

import { auditRoutes } from "./audit.routes";
import { benchmarkRoutes } from "./benchmark.routes";
import { healthRoutes } from "./health.routes";
import { leadRoutes } from "./lead.routes";

const router = Router();

router.use("/audits", auditRoutes);
router.use("/leads", leadRoutes);
router.use("/benchmarks", benchmarkRoutes);
router.use("/health", healthRoutes);

export { router as apiRoutes };
