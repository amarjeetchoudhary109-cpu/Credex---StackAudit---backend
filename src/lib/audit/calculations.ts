import type { Recommendation } from "../../services/recommendation.service";
import { roundMoney } from "./rules";

export function totalsFromRecommendations(
  recommendations: Recommendation[],
  totalCurrentSpend: number
): {
  totalRecommendedSpend: number;
  monthlySavings: number;
  annualSavings: number;
} {
  const totalRecommendedSpend = roundMoney(
    recommendations.reduce((s, r) => s + r.recommendedMonthlySpend, 0)
  );
  const monthlySavings = roundMoney(
    Math.max(0, totalCurrentSpend - totalRecommendedSpend)
  );
  return {
    totalRecommendedSpend,
    monthlySavings,
    annualSavings: roundMoney(monthlySavings * 12),
  };
}
