"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = optionalAuth;
const apiError_1 = require("../utils/apiError");
const token_1 = require("../utils/token");
function optionalAuth(req, _res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        next();
        return;
    }
    const raw = header.slice(7);
    (0, token_1.verifyAccessToken)(raw)
        .then((payload) => {
        req.user = { id: payload.sub, email: payload.email };
        next();
    })
        .catch((err) => {
        if (process.env.NODE_ENV !== "production") {
            const msg = err instanceof apiError_1.ApiError ? err.message : String(err);
            console.warn("[optionalAuth] Bearer token not applied (audit saved without user):", msg);
        }
        next();
    });
}
//# sourceMappingURL=auth.middleware.js.map