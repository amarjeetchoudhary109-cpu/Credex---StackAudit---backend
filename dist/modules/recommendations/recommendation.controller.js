"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchRecommendation = exports.listRecommendationsForAudit = void 0;
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const apiResponse_1 = require("../../utils/apiResponse");
const recommendation_service_1 = require("./recommendation.service");
const recommendationModuleService = new recommendation_service_1.RecommendationModuleService();
exports.listRecommendationsForAudit = (0, asyncHandler_1.default)(async (req, res) => {
    const auditId = req.params["auditId"];
    const rows = await recommendationModuleService.listForAudit(auditId);
    res.json(new apiResponse_1.ApiResponse(200, rows, "Recommendations retrieved"));
});
exports.patchRecommendation = (0, asyncHandler_1.default)(async (req, res) => {
    const id = req.params["id"];
    const body = req.body;
    const row = await recommendationModuleService.patch(id, body);
    res.json(new apiResponse_1.ApiResponse(200, row, "Recommendation updated"));
});
//# sourceMappingURL=recommendation.controller.js.map