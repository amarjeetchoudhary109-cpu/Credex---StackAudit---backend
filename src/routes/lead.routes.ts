import { Router } from "express";
import { createLead, getLeadStats } from "../controllers/lead.controller";
import { validateBody } from "../middleware/validate";
import { createLeadSchema } from "../validation/lead.validation";

const router = Router();

router.post("/", validateBody(createLeadSchema), createLead);
router.get("/stats", getLeadStats);

export { router as leadRoutes };
