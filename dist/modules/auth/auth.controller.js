"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.updateProfile = exports.me = exports.login = exports.register = void 0;
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const apiResponse_1 = require("../../utils/apiResponse");
const apiError_1 = require("../../utils/apiError");
const auth_service_1 = require("./auth.service");
const authService = new auth_service_1.AuthService();
exports.register = (0, asyncHandler_1.default)(async (req, res) => {
    const body = req.body;
    const result = await authService.register(body);
    res.status(201).json(new apiResponse_1.ApiResponse(201, result, "Registered successfully"));
});
exports.login = (0, asyncHandler_1.default)(async (req, res) => {
    const body = req.body;
    const result = await authService.login(body);
    res.json(new apiResponse_1.ApiResponse(200, result, "Logged in successfully"));
});
exports.me = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?.id;
    const email = req.user?.email ?? "";
    if (!userId) {
        throw new apiError_1.ApiError(401, "Unauthorized");
    }
    const user = await authService.getMe(userId, email);
    res.json(new apiResponse_1.ApiResponse(200, user, "Profile retrieved"));
});
exports.updateProfile = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new apiError_1.ApiError(401, "Unauthorized");
    }
    const body = req.body;
    const user = await authService.updateProfile(userId, body);
    res.json(new apiResponse_1.ApiResponse(200, user, "Profile updated"));
});
exports.changePassword = (0, asyncHandler_1.default)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new apiError_1.ApiError(401, "Unauthorized");
    }
    const body = req.body;
    await authService.changePassword(userId, body);
    res.json(new apiResponse_1.ApiResponse(200, null, "Password updated"));
});
//# sourceMappingURL=auth.controller.js.map