import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { LeadService } from "../services/lead.service";
import { CreateLeadInput } from "../validation/lead.validation";

const leadService = new LeadService();

export const createLead = asyncHandler(async (req: Request, res: Response) => {
  const input: CreateLeadInput = req.body;

  const result = await leadService.createLead(input);

  res.status(201).json(new ApiResponse(201, result, "Lead created successfully"));
});

export const getLeadStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await leadService.getLeadStats();

  res.json(new ApiResponse(200, stats, "Lead stats retrieved successfully"));
});
