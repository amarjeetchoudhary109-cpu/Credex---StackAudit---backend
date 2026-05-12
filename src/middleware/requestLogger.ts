import type { NextFunction, Request, Response } from "express";

/**
 * Logs every request when it completes so POST 404/500 issues are visible in the backend console.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const started = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - started;
    const line = `${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`;
    if (res.statusCode >= 500) {
      console.error(`[HTTP] ${line}`);
    } else if (res.statusCode >= 400) {
      console.warn(`[HTTP] ${line}`);
    } else {
      console.log(`[HTTP] ${line}`);
    }
  });
  next();
}
