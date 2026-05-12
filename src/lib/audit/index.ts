import type { CreateAuditInput } from "../../validation/audit.validation";
import type { AuditRunResult } from "./types";
import { buildAllRecommendations } from "./recommendations";
import { totalsFromRecommendations } from "./calculations";
import { roundMoney } from "./rules";

export * from "./pricing";
export * from "./rules";
export * from "./recommendations";
export * from "./calculations";
export type { AuditRunResult } from "./types";

/**
 * Single entry: deterministic recommendations + savings totals.
 */
export function runAudit(input: CreateAuditInput): AuditRunResult {
  const recommendations = buildAllRecommendations(input);
  const totalCurrentSpend = roundMoney(
    input.tools.reduce((s, t) => s + t.monthlySpend, 0)
  );
  const { totalRecommendedSpend, monthlySavings, annualSavings } =
    totalsFromRecommendations(recommendations, totalCurrentSpend);

  return {
    recommendations,
    totalCurrentSpend,
    totalRecommendedSpend,
    monthlySavings,
    annualSavings,
  };
}
