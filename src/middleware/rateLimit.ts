import type { NextFunction, Request, Response } from "express";

import { ApiError } from "../utils/apiError";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function clientKey(req: Request, key: string): string {
  const xf = req.headers["x-forwarded-for"];
  const ip =
    typeof xf === "string"
      ? xf.split(",")[0]?.trim()
      : Array.isArray(xf)
        ? xf[0]
        : req.socket.remoteAddress ?? "unknown";
  return `${key}:${ip}`;
}

/**
 * Simple in-memory sliding window rate limiter (good enough for assignment / small deploy).
 */
export function rateLimitMiddleware(opts: {
  name: string;
  max: number;
  windowMs: number;
}) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const k = clientKey(req, opts.name);
    const now = Date.now();
    let b = buckets.get(k);
    if (!b || now > b.resetAt) {
      b = { count: 0, resetAt: now + opts.windowMs };
      buckets.set(k, b);
    }
    b.count += 1;
    if (b.count > opts.max) {
      next(
        new ApiError(
          429,
          "Too many requests. Please wait a minute and try again."
        )
      );
      return;
    }
    next();
  };
}
