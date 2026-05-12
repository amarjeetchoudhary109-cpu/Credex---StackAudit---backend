"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadRoutes = void 0;
const express_1 = require("express");
const lead_controller_1 = require("../controllers/lead.controller");
const validate_1 = require("../middleware/validate");
const lead_validation_1 = require("../validation/lead.validation");
const router = (0, express_1.Router)();
exports.leadRoutes = router;
router.post("/", (0, validate_1.validateBody)(lead_validation_1.createLeadSchema), lead_controller_1.createLead);
router.get("/stats", lead_controller_1.getLeadStats);
//# sourceMappingURL=lead.routes.js.map