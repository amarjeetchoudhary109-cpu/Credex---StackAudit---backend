"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkHealth = void 0;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const apiResponse_1 = require("../utils/apiResponse");
exports.checkHealth = (0, asyncHandler_1.default)(async (_req, res) => {
    const data = {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
    };
    res.json(new apiResponse_1.ApiResponse(200, data, "Service is healthy"));
});
//# sourceMappingURL=health.controller.js.map