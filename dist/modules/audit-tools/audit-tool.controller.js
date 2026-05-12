"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAuditTool = exports.patchAuditTool = exports.createAuditTool = void 0;
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const apiResponse_1 = require("../../utils/apiResponse");
const audit_tool_service_1 = require("./audit-tool.service");
const auditToolService = new audit_tool_service_1.AuditToolService();
exports.createAuditTool = (0, asyncHandler_1.default)(async (req, res) => {
    const body = req.body;
    const row = await auditToolService.create(body);
    res.status(201).json(new apiResponse_1.ApiResponse(201, row, "Audit tool created"));
});
exports.patchAuditTool = (0, asyncHandler_1.default)(async (req, res) => {
    const id = req.params["id"];
    const body = req.body;
    const row = await auditToolService.patch(id, body);
    res.json(new apiResponse_1.ApiResponse(200, row, "Audit tool updated"));
});
exports.deleteAuditTool = (0, asyncHandler_1.default)(async (req, res) => {
    const id = req.params["id"];
    const result = await auditToolService.delete(id);
    res.json(new apiResponse_1.ApiResponse(200, result, "Audit tool deleted"));
});
//# sourceMappingURL=audit-tool.controller.js.map