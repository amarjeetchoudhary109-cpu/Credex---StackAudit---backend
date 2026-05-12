"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.createError = createError;
const apiError_1 = require("../utils/apiError");
function pgCode(err) {
    if (err && typeof err === "object" && "code" in err) {
        return String(err.code);
    }
    return undefined;
}
function errorHandler(err, req, res, _next) {
    if (err instanceof apiError_1.ApiError) {
        if (err.statusCode >= 500) {
            console.error(`[API ${err.statusCode}] ${req.method} ${req.originalUrl} — ${err.message}`);
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
            message: 'Database table missing. From the backend folder run: npm run db:push (or db:migrate)',
            errors: [],
            data: null,
        });
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error(`[500] ${req.method} ${req.originalUrl}`);
    if (err instanceof Error && err.stack) {
        console.error(err.stack);
    }
    else {
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
function createError(message, statusCode = 500) {
    return new apiError_1.ApiError(statusCode, message);
}
//# sourceMappingURL=errorHandler.js.map