/**
 * Smoke test against the real Gemini API. Loads backend/.env from the backend root.
 *
 * Usage (from backend folder):
 *   npx tsx scripts/test-gemini-live.ts
 *
 * Requires GEMINI_API_KEY in .env (Google AI Studio).
 */
import path from "path";
import { config } from "dotenv";

config({ path: path.join(__dirname, "..", ".env") });

import type { AuditInsightsContext } from "../src/services/gemini.service";
import {
  GEMINI_DEFAULT_MODEL,
  GeminiService,
  resolveGeminiModelId,
} from "../src/services/gemini.service";

const sampleCtx: AuditInsightsContext = {
  teamSize: 3,
  primaryUseCase: "Developer productivity",
  totalMonthlySpend: 500,
  monthlySavings: 50,
  annualSavings: 600,
  efficiencyScore: 65,
  summary: "Small team using one primary vendor.",
  tools: [
    {
      tool: "Gemini",
      plan: "Free / trial",
      monthlySpend: 0,
      seats: 3,
    },
  ],
  recommendations: [
    {
      tool: "Gemini",
      monthlySavings: 0,
      recommendedAction: "Confirm enterprise pricing before scale",
      reason: "Avoid surprise usage caps",
    },
  ],
};

async function main(): Promise<void> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    console.error(
      "Missing GEMINI_API_KEY. Add it to backend/.env (Google AI Studio → API key)."
    );
    process.exit(1);
  }

  const model = resolveGeminiModelId(process.env.GEMINI_MODEL);
  console.log(`Calling Gemini model: ${model} (default: ${GEMINI_DEFAULT_MODEL})`);

  const svc = new GeminiService();
  const text = await svc.generateAuditInsights(sampleCtx);

  console.log("--- Response (first 500 chars) ---");
  console.log(text.slice(0, 500));
  console.log("--- OK: Gemini returned non-empty insight text ---");
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
