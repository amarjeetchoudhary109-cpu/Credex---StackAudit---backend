import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";

export const checkHealth = asyncHandler(async (_req: Request, res: Response) => {
  const data = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  };

  res.json(new ApiResponse(200, data, "Service is healthy"));
});
