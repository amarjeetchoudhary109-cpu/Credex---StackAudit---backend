import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();
import { ApiError } from "../utils/apiError";

/** Current Flash default for AI Studio; bare `gemini-1.5-flash` returns 404 on v1beta. */
export const GEMINI_DEFAULT_MODEL = "gemini-2.5-flash";

function logGeminiFailure(context: string, msg: string): void {
  const soft =
    /403|429|404|401|leaked|quota|API key not valid|PERMISSION_DENIED|RESOURCE_EXHAUSTED/i.test(
      msg
    );
  if (soft) {
    console.warn(`[Gemini] ${context} (rotate key or check quota):`, msg.slice(0, 500));
  } else {
    console.error(`[Gemini] ${context}:`, msg.slice(0, 500));
  }
}

export function resolveGeminiModelId(raw: string | undefined): string {
  const id = raw?.trim() || GEMINI_DEFAULT_MODEL;
  if (id === "gemini-1.5-flash") {
    console.warn(
      "[Gemini] GEMINI_MODEL gemini-1.5-flash is no longer available; using gemini-2.5-flash. Update backend/.env."
    );
    return GEMINI_DEFAULT_MODEL;
  }
  return id;
}

export interface AuditInsightsContext {
  teamSize: number;
  primaryUseCase: string;
  totalMonthlySpend: number;
  monthlySavings: number;
  annualSavings: number;
  efficiencyScore: number;
  summary: string;
  tools: {
    tool: string;
    plan: string;
    monthlySpend: number;
    seats: number;
  }[];
  recommendations: {
    tool: string;
    monthlySavings: number;
    recommendedAction: string;
    reason: string;
  }[];
}

/**
 * Uses Google Gemini via {@link https://ai.google.dev/pricing | Google AI Studio} free-tier
 * friendly models (default {@link GEMINI_DEFAULT_MODEL}). Set `GEMINI_API_KEY` from AI Studio.
 */
export class GeminiService {
  async generateAuditInsights(ctx: AuditInsightsContext): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new ApiError(
        503,
        "Gemini is not configured. Add GEMINI_API_KEY to backend/.env (Google AI Studio → Get API key)."
      );
    }

    const modelId = resolveGeminiModelId(process.env.GEMINI_MODEL);

    const genAI = new GoogleGenerativeAI(apiKey);
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
        throw new ApiError(502, "Gemini returned an empty response.");
      }
      return text.trim();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logGeminiFailure("generateAuditInsights", msg);
      throw new ApiError(
        502,
        `Gemini request failed: ${msg}. Check GEMINI_MODEL and API key quota in Google AI Studio.`
      );
    }
  }

  /**
   * Short narrative (e.g. share-page summary). Same API key / model as {@link generateAuditInsights}.
   */
  async generateFounderSummary(userPrompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new ApiError(
        503,
        "Gemini is not configured. Add GEMINI_API_KEY to backend/.env (Google AI Studio → Get API key)."
      );
    }

    const modelId = resolveGeminiModelId(process.env.GEMINI_MODEL);
    const genAI = new GoogleGenerativeAI(apiKey);
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
        throw new ApiError(502, "Gemini returned an empty response.");
      }
      return text.trim();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logGeminiFailure("generateFounderSummary", msg);
      throw new ApiError(
        502,
        `Gemini request failed: ${msg}. Check GEMINI_MODEL and API key quota in Google AI Studio.`
      );
    }
  }
}
