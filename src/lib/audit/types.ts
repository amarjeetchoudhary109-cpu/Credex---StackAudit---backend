import type { CreateAuditInput, ToolInput } from "../../validation/audit.validation";
import type { Recommendation } from "../../services/recommendation.service";

export type { CreateAuditInput, ToolInput, Recommendation };

export interface AuditRunResult {
  recommendations: Recommendation[];
  totalCurrentSpend: number;
  totalRecommendedSpend: number;
  monthlySavings: number;
  annualSavings: number;
}
