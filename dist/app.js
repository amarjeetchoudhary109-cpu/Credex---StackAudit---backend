"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const index_1 = require("./routes/index");
const errorHandler_1 = require("./middleware/errorHandler");
const requestLogger_1 = require("./middleware/requestLogger");
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
/** Browsers send Origin without a trailing slash — normalize so allowlists match. */
function normalizeOriginUrl(raw) {
    if (!raw?.trim())
        return null;
    try {
        const u = new URL(raw.trim());
        u.pathname = "";
        u.search = "";
        u.hash = "";
        return u.origin;
    }
    catch {
        const s = raw.trim().replace(/\/+$/, "");
        return s || null;
    }
}
function buildAllowedOrigins() {
    const pieces = [
        process.env.FRONTEND_URL,
        process.env.CORS_ORIGIN,
        process.env.CORS_ORIGINS,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://credex-stackaudit-production.up.railway.app",
        "https://credex-stackaudit-production.up.railway.app"
    ]
        .filter(Boolean)
        .flatMap((s) => String(s).split(","))
        .map((s) => normalizeOriginUrl(s.trim()))
        .filter((o) => Boolean(o));
    return new Set(pieces);
}
const allowedOrigins = buildAllowedOrigins();
app.use((0, cors_1.default)({
    origin(origin, callback) {
        if (!origin) {
            callback(null, true);
            return;
        }
        const normalized = normalizeOriginUrl(origin);
        if (normalized && allowedOrigins.has(normalized)) {
            callback(null, true);
            return;
        }
        callback(null, false);
    },
    credentials: true,
    optionsSuccessStatus: 204,
}));
app.use((req, _res, next) => {
    if (req.originalUrl.startsWith("/api")) {
        console.log(`[→in] ${req.method} ${req.originalUrl}`);
    }
    next();
});
app.use(requestLogger_1.requestLogger);
/** Lead submissions may include a base64 audit PDF (same as client download). */
app.use(express_1.default.json({ limit: "15mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/api/v1", index_1.apiRoutes);
app.get("/", (_req, res) => {
    res.json({
        success: true,
        message: "Credex API is running",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
    });
});
app.use((req, res) => {
    console.warn(`[404] ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.originalUrl,
    });
});
app.use(errorHandler_1.errorHandler);
//# sourceMappingURL=app.js.map