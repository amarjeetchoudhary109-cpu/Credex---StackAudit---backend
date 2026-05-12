import type { SupportedTool } from "../../validation/audit.validation";

/** Per-seat monthly USD for known vendor list tiers (deterministic audit math). */
export const pricing: Record<
  SupportedTool,
  Record<string, number>
> = {
  cursor: {
    hobby: 0,
    free: 0,
    pro: 20,
    business: 40,
    enterprise: 60,
  },
  github_copilot: {
    individual: 10,
    business: 19,
    enterprise: 39,
  },
  claude: {
    free: 0,
    pro: 20,
    team: 30,
  },
  chatgpt: {
    free: 0,
    plus: 20,
    team: 30,
    enterprise: 60,
  },
  anthropic_api: {
    "pay-as-you-go": 0,
    payg: 0,
  },
  openai_api: {
    "pay-as-you-go": 0,
    payg: 0,
  },
  gemini: {
    free: 0,
    advanced: 20,
  },
  windsurf: {
    free: 0,
    pro: 15,
    team: 25,
  },
};

export function normalizePlanKey(plan: string): string {
  return plan.trim().toLowerCase().replace(/\s+/g, "_");
}

export function pricePerSeat(tool: SupportedTool, plan: string): number | null {
  const key = normalizePlanKey(plan);
  const row = pricing[tool];
  if (!row) return null;
  if (key in row) return row[key]!;
  const direct = Object.entries(row).find(([k]) => k === key);
  if (direct) return direct[1];
  const fuzzy = Object.entries(row).find(([k]) => key.includes(k) || k.includes(key));
  return fuzzy ? fuzzy[1] : null;
}

export function modeledMonthlySpend(
  tool: SupportedTool,
  plan: string,
  seats: number
): number | null {
  const p = pricePerSeat(tool, plan);
  if (p === null) return null;
  return Math.round(p * seats * 100) / 100;
}
