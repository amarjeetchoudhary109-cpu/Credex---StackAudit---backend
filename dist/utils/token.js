"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
exports.verifyAccessToken = verifyAccessToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const apiError_1 = require("./apiError");
const supabaseJwt_1 = require("./supabaseJwt");
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-only-change-JWT_SECRET";
/** When true and SUPABASE_URL is set, only JWKS verification is attempted (no HS256 fallback). */
function supabaseJwtOnly() {
    return (process.env.SUPABASE_JWT_VERIFY_ONLY === "1" ||
        process.env.SUPABASE_JWT_VERIFY_ONLY === "true");
}
function signToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
/** Legacy HS256 tokens issued by this API (`/auth/login`). */
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, JWT_SECRET);
}
async function verifyAccessToken(token) {
    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    if (supabaseUrl) {
        try {
            return await (0, supabaseJwt_1.verifySupabaseAccessToken)(token, supabaseUrl);
        }
        catch (e) {
            if (e instanceof apiError_1.ApiError && supabaseJwtOnly()) {
                throw e;
            }
            if (supabaseJwtOnly()) {
                throw e instanceof apiError_1.ApiError
                    ? e
                    : new apiError_1.ApiError(401, "Invalid or expired token");
            }
        }
    }
    try {
        return verifyToken(token);
    }
    catch {
        throw new apiError_1.ApiError(401, "Invalid or expired token");
    }
}
//# sourceMappingURL=token.js.map