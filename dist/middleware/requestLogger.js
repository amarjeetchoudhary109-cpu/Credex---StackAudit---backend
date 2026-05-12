"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
/**
 * Logs every request when it completes so POST 404/500 issues are visible in the backend console.
 */
function requestLogger(req, res, next) {
    const started = Date.now();
    res.on("finish", () => {
        const ms = Date.now() - started;
        const line = `${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`;
        if (res.statusCode >= 500) {
            console.error(`[HTTP] ${line}`);
        }
        else if (res.statusCode >= 400) {
            console.warn(`[HTTP] ${line}`);
        }
        else {
            console.log(`[HTTP] ${line}`);
        }
    });
    next();
}
//# sourceMappingURL=requestLogger.js.map