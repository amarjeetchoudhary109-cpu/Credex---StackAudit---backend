"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = rateLimitMiddleware;
const apiError_1 = require("../utils/apiError");
const buckets = new Map();
function clientKey(req, key) {
    const xf = req.headers["x-forwarded-for"];
    const ip = typeof xf === "string"
        ? xf.split(",")[0]?.trim()
        : Array.isArray(xf)
            ? xf[0]
            : req.socket.remoteAddress ?? "unknown";
    return `${key}:${ip}`;
}
/**
 * Simple in-memory sliding window rate limiter (good enough for assignment / small deploy).
 */
function rateLimitMiddleware(opts) {
    return (req, _res, next) => {
        const k = clientKey(req, opts.name);
        const now = Date.now();
        let b = buckets.get(k);
        if (!b || now > b.resetAt) {
            b = { count: 0, resetAt: now + opts.windowMs };
            buckets.set(k, b);
        }
        b.count += 1;
        if (b.count > opts.max) {
            next(new apiError_1.ApiError(429, "Too many requests. Please wait a minute and try again."));
            return;
        }
        next();
    };
}
//# sourceMappingURL=rateLimit.js.map