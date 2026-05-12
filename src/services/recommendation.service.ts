import type { SupportedTool } from "../validation/audit.validation";

export interface Recommendation {
  tool: SupportedTool;
  currentPlan: string;
  seats: number;
  currentMonthlySpend: number;
  recommendedAction: string;
  recommendedPlanOrTool: string;
  recommendedMonthlySpend: number;
  monthlySavings: number;
  annualSavings: number;
  reason: string;
}

export interface LegacyRecommendationPayload {
  tool: string;
  currentPlan: string;
  seats: number;
  currentMonthlySpend: number;
  recommendedAction: string;
  recommendedPlanOrTool: string;
  recommendedMonthlySpend: number;
  monthlySavings: number;
  annualSavings: number;
  reason: string;
}

export function parseLegacyPayload(
  description: string | null
): LegacyRecommendationPayload | null {
  if (!description?.trim()) {
    return null;
  }
  try {
    return JSON.parse(description) as LegacyRecommendationPayload;
  } catch {
    return null;
  }
}
