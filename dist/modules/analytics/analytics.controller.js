"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsEfficiency = exports.analyticsSavings = exports.analyticsToolDistribution = exports.analyticsSpendTrends = exports.analyticsOverview = void 0;
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const apiResponse_1 = require("../../utils/apiResponse");
const apiError_1 = require("../../utils/apiError");
const analytics_service_1 = require("./analytics.service");
const analyticsService = new analytics_service_1.AnalyticsService();
exports.analyticsOverview = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new apiError_1.ApiError(401, "Unauthorized");
    const data = await analyticsService.getOverview(userId);
    res.json(new apiResponse_1.ApiResponse(200, data, "Overview analytics"));
});
exports.analyticsSpendTrends = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new apiError_1.ApiError(401, "Unauthorized");
    const data = await analyticsService.getSpendTrends(userId);
    res.json(new apiResponse_1.ApiResponse(200, data, "Spend trends"));
});
exports.analyticsToolDistribution = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new apiError_1.ApiError(401, "Unauthorized");
    const data = await analyticsService.getToolDistribution(userId);
    res.json(new apiResponse_1.ApiResponse(200, data, "Tool distribution"));
});
exports.analyticsSavings = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new apiError_1.ApiError(401, "Unauthorized");
    const data = await analyticsService.getSavings(userId);
    res.json(new apiResponse_1.ApiResponse(200, data, "Savings analytics"));
});
exports.analyticsEfficiency = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        throw new apiError_1.ApiError(401, "Unauthorized");
    const data = await analyticsService.getEfficiency(userId);
    res.json(new apiResponse_1.ApiResponse(200, data, "Efficiency analytics"));
});
//# sourceMappingURL=analytics.controller.js.map