"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySupabaseAccessToken = verifySupabaseAccessToken;
const apiError_1 = require("./apiError");
/**
 * Verifies Supabase Auth **access tokens** with the project JWKS (asymmetric keys).
 *
 * Aligns with Supabase docs:
 * - JWKS: `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`
 * - Typical `iss`: `{SUPABASE_URL}/auth/v1` (must match token `iss` claim)
 * - Optional `aud`: access tokens often use `authenticated` — set `SUPABASE_JWT_AUD` if verify fails
 *
 * If JWKS returns no keys, your project may still use HS256 legacy signing only — use Auth
 * verification or enable asymmetric JWT signing keys in the Supabase dashboard.
 *
 * `jose` is loaded lazily so the process still starts if `node_modules` is incomplete.
 *
 * @see https://supabase.com/docs/guides/auth/jwts
 * @see https://supabase.com/docs/guides/auth/jwt-fields
 */
async function verifySupabaseAccessToken(token, supabaseUrl) {
    let jwtVerify;
    let createRemoteJWKSet;
    try {
        const jose = await Promise.resolve().then(() => __importStar(require("jose")));
        jwtVerify = jose.jwtVerify;
        createRemoteJWKSet = jose.createRemoteJWKSet;
    }
    catch (cause) {
        console.error("[auth] Missing package `jose`. From the backend folder run: npm install");
        console.error(cause);
        throw new apiError_1.ApiError(503, "Server misconfigured: install backend dependency `jose` (npm install).");
    }
    const base = supabaseUrl.replace(/\/$/, "");
    const jwksUrl = process.env.SUPABASE_JWKS_URL?.trim() ??
        `${base}/auth/v1/.well-known/jwks.json`;
    const JWKS = createRemoteJWKSet(new URL(jwksUrl));
    const issuer = process.env.SUPABASE_JWT_ISSUER?.trim() ?? `${base}/auth/v1`;
    const verifyOpts = {
        issuer,
        clockTolerance: 30,
    };
    const aud = process.env.SUPABASE_JWT_AUD?.trim();
    if (aud) {
        verifyOpts.audience = aud.includes(",")
            ? aud.split(",").map((s) => s.trim())
            : aud;
    }
    let payload;
    try {
        const verified = await jwtVerify(token, JWKS, verifyOpts);
        payload = verified.payload;
    }
    catch (cause) {
        if (process.env.NODE_ENV !== "production") {
            const msg = cause instanceof Error ? cause.message : String(cause);
            console.warn("[auth] Supabase JWKS verify failed:", msg);
            console.warn("      Check SUPABASE_URL, SUPABASE_JWT_ISSUER (expect …/auth/v1), and SUPABASE_JWT_AUD if your token includes `aud`.");
        }
        throw new apiError_1.ApiError(401, "Invalid or expired Supabase token");
    }
    const sub = typeof payload["sub"] === "string" ? payload["sub"] : null;
    if (!sub) {
        throw new apiError_1.ApiError(401, "Invalid token: missing subject");
    }
    const email = typeof payload["email"] === "string"
        ? payload["email"]
        : "";
    return { sub, email };
}
//# sourceMappingURL=supabaseJwt.js.map