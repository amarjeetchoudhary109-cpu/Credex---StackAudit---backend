import { Request, Response, NextFunction } from "express";
import type { ZodIssue } from "zod";
import { z } from "zod";

function formatZodIssues(issues: ZodIssue[]) {
  return issues.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
}

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: formatZodIssues(error.issues),
        });
      }
      next(error);
    }
  };
}

export function validateParams(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      Object.assign(req.params, schema.parse(req.params));
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Invalid parameters",
          errors: formatZodIssues(error.issues),
        });
      }
      next(error);
    }
  };
}
