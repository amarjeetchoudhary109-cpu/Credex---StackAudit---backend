import { Router } from "express";
import { z } from "zod";

import {
  createAudit,
  getAuditByShareId,
  getShareOgSvg,
  getShareOpenGraphHtml,
  postAiSummaryByShareId,
} from "../controllers/audit.controller";
import { validateBody, validateParams } from "../middleware/validate";
import { rateLimitMiddleware } from "../middleware/rateLimit";
import { createAuditSchema } from "../validation/audit.validation";

const router = Router();

const shareParams = z.object({
  shareId: z.string().min(8).max(32),
});

const createAuditLimiter = rateLimitMiddleware({
  name: "audit_create",
  max: 30,
  windowMs: 60_000,
});

const aiSummaryLimiter = rateLimitMiddleware({
  name: "audit_ai_summary",
  max: 20,
  windowMs: 60_000,
});

router.post(
  "/",
  createAuditLimiter,
  validateBody(createAuditSchema),
  createAudit
);

router.get(
  "/share/:shareId/open",
  validateParams(shareParams),
  getShareOpenGraphHtml
);
router.get(
  "/share/:shareId/og.svg",
  validateParams(shareParams),
  getShareOgSvg
);
router.post(
  "/share/:shareId/ai-summary",
  aiSummaryLimiter,
  validateParams(shareParams),
  postAiSummaryByShareId
);
router.get(
  "/share/:shareId",
  validateParams(shareParams),
  getAuditByShareId
);

export { router as auditRoutes };
