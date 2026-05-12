import { Router } from "express";
import { getBenchmarks } from "../controllers/audit.controller";

const router = Router();

router.get("/", getBenchmarks);

export { router as benchmarkRoutes };
