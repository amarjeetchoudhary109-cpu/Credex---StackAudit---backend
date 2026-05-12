import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";

function pgCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code?: unknown }).code);
  }
  return undefined;
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      console.error(
        `[API ${err.statusCode}] ${req.method} ${req.originalUrl} — ${err.message}`
      );
    }
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      data: null,
    });
  }

  const code = pgCode(err);
  if (code === "42P01") {
    console.error(`[DB] ${req.method} ${req.originalUrl}`);
    console.error(err);
    return res.status(503).json({
      success: false,
      message:
        'Database table missing. From the backend folder run: npm run db:push (or db:migrate)',
      errors: [],
      data: null,
    });
  }

  const message =
    err instanceof Error ? err.message : "Internal server error";

  console.error(`[500] ${req.method} ${req.originalUrl}`);
  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  } else {
    console.error(err);
  }

  res.status(500).json({
    success: false,
    message,
    errors: [],
    data: null,
  });
}

// Keep createError for any legacy usage
export function createError(message: string, statusCode = 500): ApiError {
  return new ApiError(statusCode, message);
}
