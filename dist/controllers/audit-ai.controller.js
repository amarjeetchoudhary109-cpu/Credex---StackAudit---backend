"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAuditInsights = void 0;
const audit_service_1 = require("../services/audit.service");
const gemini_service_1 = require("../services/gemini.service");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const apiResponse_1 = require("../utils/apiResponse");
const apiError_1 = require("../utils/apiError");
const auditService = new audit_service_1.AuditService();
const geminiService = new gemini_service_1.GeminiService();
exports.generateAuditInsights = (0, asyncHandler_1.default)(async (req, res) => {
    const auditId = req.params["auditId"];
    const userId = req.user?.id;
    if (!userId) {
        throw new apiError_1.ApiError(401, "Unauthorized");
    }
    const audit = await auditService.getAuditById(auditId);
    if (audit.userId == null) {
        throw new apiError_1.ApiError(403, "This audit has no owner; create a new audit while signed in to use AI insights.");
    }
    if (audit.userId !== userId) {
        throw new apiError_1.ApiError(403, "You do not have access to this audit.");
    }
    const modelUsed = (0, gemini_service_1.resolveGeminiModelId)(process.env.GEMINI_MODEL);
    const insights = await geminiService.generateAuditInsights({
        teamSize: audit.teamSize,
        primaryUseCase: audit.primaryUseCase,
        totalMonthlySpend: audit.totalMonthlySpend,
        monthlySavings: audit.monthlySavings,
        annualSavings: audit.annualSavings,
        efficiencyScore: audit.efficiencyScore,
        summary: audit.summary ?? "",
        tools: audit.tools.map((t) => ({
            tool: t.tool,
            plan: t.plan,
            monthlySpend: t.monthlySpend,
            seats: t.seats,
        })),
        recommendations: audit.recommendations.map((r) => ({
            tool: r.tool,
            monthlySavings: r.monthlySavings,
            recommendedAction: r.recommendedAction,
            reason: r.reason,
        })),
    });
    res.json(new apiResponse_1.ApiResponse(200, { insights, model: modelUsed }, "Insights generated"));
});
//# sourceMappingURL=audit-ai.controller.js.map