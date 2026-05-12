"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchOrganization = exports.getOrganization = exports.createOrganization = void 0;
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const apiResponse_1 = require("../../utils/apiResponse");
const organization_service_1 = require("./organization.service");
const organizationService = new organization_service_1.OrganizationService();
exports.createOrganization = (0, asyncHandler_1.default)(async (req, res) => {
    const body = req.body;
    const org = await organizationService.create(body);
    res.status(201).json(new apiResponse_1.ApiResponse(201, org, "Organization created"));
});
exports.getOrganization = (0, asyncHandler_1.default)(async (req, res) => {
    const id = req.params["id"];
    const org = await organizationService.getById(id);
    res.json(new apiResponse_1.ApiResponse(200, org, "Organization retrieved"));
});
exports.patchOrganization = (0, asyncHandler_1.default)(async (req, res) => {
    const id = req.params["id"];
    const body = req.body;
    const org = await organizationService.patch(id, body);
    res.json(new apiResponse_1.ApiResponse(200, org, "Organization updated"));
});
//# sourceMappingURL=organization.controller.js.map