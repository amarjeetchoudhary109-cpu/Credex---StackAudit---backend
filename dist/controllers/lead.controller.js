"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeadStats = exports.createLead = void 0;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const apiResponse_1 = require("../utils/apiResponse");
const lead_service_1 = require("../services/lead.service");
const leadService = new lead_service_1.LeadService();
exports.createLead = (0, asyncHandler_1.default)(async (req, res) => {
    const input = req.body;
    const result = await leadService.createLead(input);
    res.status(201).json(new apiResponse_1.ApiResponse(201, result, "Lead created successfully"));
});
exports.getLeadStats = (0, asyncHandler_1.default)(async (_req, res) => {
    const stats = await leadService.getLeadStats();
    res.json(new apiResponse_1.ApiResponse(200, stats, "Lead stats retrieved successfully"));
});
//# sourceMappingURL=lead.controller.js.map