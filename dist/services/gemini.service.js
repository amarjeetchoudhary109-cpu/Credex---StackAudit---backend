"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = exports.GEMINI_DEFAULT_MODEL = void 0;
exports.resolveGeminiModelId = resolveGeminiModelId;
const generative_ai_1 = require("@google/generative-ai");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const apiError_1 = require("../utils/apiError");
/** Current Flash default for AI Studio; bare `gemini-1.5-flash` returns 404 on v1beta. */
exports.GEMINI_DEFAULT_MODEL = "gemini-2.5-flash";
function resolveGeminiModelId(raw) {
    const id = raw?.trim() || exports.GEMINI_DEFAULT_MODEL;
    if (id === "gemini-1.5-flash") {
        console.warn("[Gemini] GEMINI_MODEL gemini-1.5-flash is no longer available; using gemini-2.5-flash. Update backend/.env.");
        return exports.GEMINI_DEFAULT_MODEL;
    }
    return id;
}
/**
 * Uses Google Gemini via {@link https://ai.google.dev/pricing | Google AI Studio} free-tier
 * friendly models (default {@link GEMINI_DEFAULT_MODEL}). Set `GEMINI_API_KEY` from AI Studio.
 */
class GeminiService {
    async generateAuditInsights(ctx) {
        const apiKey = process.env.GEMINI_API_KEY?.trim();
        if (!apiKey) {
            throw new apiError_1.ApiError(503, "Gemini is not configured. Add GEMINI_API_KEY to backend/.env (Google AI Studio → Get API key).");
        }
        const modelId = resolveGeminiModelId(process.env.GEMINI_MODEL);
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: modelId,
            generationConfig: {
                maxOutputTokens: 4096,
                temperature: 0.4,
            },
        });
        const payload = JSON.stringify(ctx, null, 0);
        const prompt = `You are an expert B2B SaaS AI spend advisor. The JSON below describes one team's self-reported AI tool stack and our deterministic savings model output.

Analyze it and respond with:
1) Top 3 risks or inefficiencies (bullet points).
2) Top 5 concrete actions (bullet points) — negotiate vendor, consolidate tools, right-size seats, API tiering, governance.
3) One short paragraph on ROI framing for leadership.

Rules: Be specific to the tools and numbers given. Do not invent vendors not listed. If data is thin, say what data would help. Stay under 400 words. Plain text, no markdown tables.

DATA:
${payload}`;
        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            if (!text?.trim()) {
                throw new apiError_1.ApiError(502, "Gemini returned an empty response.");
            }
            return text.trim();
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error("[Gemini]", msg);
            throw new apiError_1.ApiError(502, `Gemini request failed: ${msg}. Check GEMINI_MODEL and API key quota in Google AI Studio.`);
        }
    }
    /**
     * Short narrative (e.g. share-page summary). Same API key / model as {@link generateAuditInsights}.
     */
    async generateFounderSummary(userPrompt) {
        const apiKey = process.env.GEMINI_API_KEY?.trim();
        if (!apiKey) {
            throw new apiError_1.ApiError(503, "Gemini is not configured. Add GEMINI_API_KEY to backend/.env (Google AI Studio → Get API key).");
        }
        const modelId = resolveGeminiModelId(process.env.GEMINI_MODEL);
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: modelId,
            generationConfig: {
                maxOutputTokens: 320,
                temperature: 0.35,
            },
        });
        try {
            const result = await model.generateContent(userPrompt);
            const text = result.response.text();
            if (!text?.trim()) {
                throw new apiError_1.ApiError(502, "Gemini returned an empty response.");
            }
            return text.trim();
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error("[Gemini] generateFounderSummary", msg);
            throw new apiError_1.ApiError(502, `Gemini request failed: ${msg}. Check GEMINI_MODEL and API key quota in Google AI Studio.`);
        }
    }
}
exports.GeminiService = GeminiService;
//# sourceMappingURL=gemini.service.js.map