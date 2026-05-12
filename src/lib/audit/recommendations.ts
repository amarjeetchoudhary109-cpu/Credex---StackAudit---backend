import type {
  CreateAuditInput,
  ToolInput,
  UseCase,
} from "../../validation/audit.validation";
import type { Recommendation } from "../../services/recommendation.service";
import { modeledMonthlySpend } from "./pricing";
import {
  roundMoney,
  shouldDowngradeChatgptTeam,
  shouldDowngradeClaudeTeam,
  shouldDowngradeCopilotEnterprise,
  shouldDowngradeCursorBusinessToPro,
} from "./rules";

const CODING_ASSISTANTS = new Set([
  "cursor",
  "github_copilot",
  "windsurf",
]);
const CHAT_LLMS = new Set(["chatgpt", "claude", "gemini"]);
const API_PROVIDERS = new Set(["openai_api", "anthropic_api"]);

function seatAlignedSpend(tool: ToolInput, teamSize: number): number {
  if (tool.seats <= teamSize) return tool.monthlySpend;
  const perSeat = tool.monthlySpend / Math.max(tool.seats, 1);
  return roundMoney(perSeat * teamSize);
}

/**
 * Deterministic per-tool recommendation: plan/seat right-sizing only (no LLM).
 */
export function buildPerToolLine(
  tool: ToolInput,
  teamSize: number,
  useCase: UseCase
): Recommendation {
  const current = tool.monthlySpend;
  let recommendedPlan = tool.plan;
  let recommendedSpend = current;
  let action = "Keep current setup";
  let reason =
    "Reported spend is already aligned with typical list pricing for this team shape.";

  let spendAfterSeats = seatAlignedSpend(tool, teamSize);
  if (spendAfterSeats < current - 0.01) {
    recommendedSpend = spendAfterSeats;
    action = "Right-size seats";
    recommendedPlan = `${tool.plan} (${Math.min(tool.seats, teamSize)} seats)`;
    reason = `You are paying for ${tool.seats} seats but only ${teamSize} people on the team—unused seats are pure margin leak.`;
  }

  const seatsEff = Math.min(tool.seats, teamSize);

  if (tool.tool === "cursor" && shouldDowngradeCursorBusinessToPro(tool, teamSize)) {
    const target = "pro";
    const alt = modeledMonthlySpend("cursor", target, seatsEff);
    if (alt !== null && alt < recommendedSpend - 1) {
      recommendedPlan = "Pro";
      recommendedSpend = alt;
      action = "Downgrade plan";
      reason =
        "Business (or Enterprise) list pricing is oversized for a 1–2 seat footprint; Pro covers most startup IDE AI usage.";
    }
  }

  if (shouldDowngradeChatgptTeam(tool, teamSize)) {
    const alt = modeledMonthlySpend("chatgpt", "plus", seatsEff);
    if (alt !== null && alt < recommendedSpend - 1) {
      recommendedPlan = "Plus";
      recommendedSpend = alt;
      action = "Downgrade plan";
      reason =
        "ChatGPT Team adds admin controls most sub-5 teams do not monetize; Plus usually matches actual usage.";
    }
  }

  if (shouldDowngradeClaudeTeam(tool, teamSize)) {
    const alt = modeledMonthlySpend("claude", "pro", seatsEff);
    if (alt !== null && alt < recommendedSpend - 1) {
      recommendedPlan = "Pro";
      recommendedSpend = alt;
      action = "Downgrade plan";
      reason =
        "Claude Team shines at centralized billing and retention policies; tiny groups rarely need the uplift over Pro.";
    }
  }

  if (shouldDowngradeCopilotEnterprise(tool, teamSize)) {
    const alt = modeledMonthlySpend("github_copilot", "business", seatsEff);
    if (alt !== null && alt < recommendedSpend - 1) {
      recommendedPlan = "Business";
      recommendedSpend = alt;
      action = "Downgrade plan";
      reason =
        "Enterprise SKU is priced for regulated fleets; sub-50 engineering groups typically clear security reviews on Business.";
    }
  }

  if (
    (useCase === "data" || useCase === "mixed") &&
    (tool.tool === "openai_api" || tool.tool === "anthropic_api") &&
    current > 800
  ) {
    const target = roundMoney(current * 0.88);
    if (target < recommendedSpend - 25) {
      recommendedSpend = target;
      recommendedPlan = "Optimized commit + burst";
      action = "Renegotiate / reshape commit";
      reason =
        "Heavy API spend on two providers often hides overlapping committed minimums; finance teams usually recover ~10–15% in the first negotiation cycle without changing models. Credex can sometimes layer committed cloud credits or commercial contracts to reduce net retail-equivalent rate (illustrative only—not a quote).";
    }
  }

  const monthlySavings = roundMoney(Math.max(0, current - recommendedSpend));

  if (monthlySavings < 0.01) {
    return {
      tool: tool.tool,
      currentPlan: tool.plan,
      seats: tool.seats,
      currentMonthlySpend: current,
      recommendedAction: "Keep current setup",
      recommendedPlanOrTool: tool.plan,
      recommendedMonthlySpend: current,
      monthlySavings: 0,
      annualSavings: 0,
      reason:
        "No defensible downgrade path at list pricing given the seats and plans you reported.",
    };
  }

  return {
    tool: tool.tool,
    currentPlan: tool.plan,
    seats: tool.seats,
    currentMonthlySpend: current,
    recommendedAction: action,
    recommendedPlanOrTool: recommendedPlan,
    recommendedMonthlySpend: recommendedSpend,
    monthlySavings,
    annualSavings: roundMoney(monthlySavings * 12),
    reason,
  };
}

function overlapPack(
  tools: ToolInput[],
  _teamSize: number,
  pack: { idSet: Set<string>; label: string; action: string }
): Recommendation[] {
  const subset = tools.filter((t) => pack.idSet.has(t.tool));
  if (subset.length < 2) return [];

  const sorted = [...subset].sort((a, b) => b.monthlySpend - a.monthlySpend);
  const primary = sorted[0]!;
  const redundantMonthly = sorted
    .slice(1)
    .reduce((s, t) => s + t.monthlySpend, 0);
  const heuristicSavings = roundMoney(redundantMonthly * 0.45);
  if (heuristicSavings < 5) return [];

  const newMonthly = roundMoney(
    Math.max(0, primary.monthlySpend + redundantMonthly - heuristicSavings)
  );

  return [
    {
      tool: primary.tool,
      currentPlan: primary.plan,
      seats: primary.seats,
      currentMonthlySpend: roundMoney(
        subset.reduce((s, t) => s + t.monthlySpend, 0)
      ),
      recommendedAction: pack.action,
      recommendedPlanOrTool: `Keep strongest ${pack.label} contract; trim redundant vendors`,
      recommendedMonthlySpend: newMonthly,
      monthlySavings: heuristicSavings,
      annualSavings: roundMoney(heuristicSavings * 12),
      reason: `You carry ${subset.length} paid ${pack.label} (${subset.map((t) => t.tool).join(", ")}). Most teams standardize on one primary surface and renegotiate API tiers instead of stacking subscriptions.`,
    },
  ];
}

function chatPlusVendorApiOverlap(tools: ToolInput[]): Recommendation[] {
  const pairs = [
    {
      chat: "chatgpt" as const,
      api: "openai_api" as const,
      vendor: "OpenAI",
    },
    {
      chat: "claude" as const,
      api: "anthropic_api" as const,
      vendor: "Anthropic",
    },
  ];
  const out: Recommendation[] = [];
  for (const { chat, api, vendor } of pairs) {
    const c = tools.find((t) => t.tool === chat);
    const a = tools.find((t) => t.tool === api);
    if (!c || !a) continue;
    const chatPaid =
      /team|plus|pro|advanced|business/i.test(c.plan) || c.monthlySpend >= 25;
    if (!chatPaid) continue;
    if (a.monthlySpend < 75) continue;
    const combined = roundMoney(c.monthlySpend + a.monthlySpend);
    const haircut = roundMoney(
      Math.min(c.monthlySpend * 0.22, a.monthlySpend * 0.18, combined * 0.12)
    );
    if (haircut < 20) continue;
    const newMonthly = roundMoney(combined - haircut);
    out.push({
      tool: chat,
      currentPlan: `${c.plan} + ${api}`,
      seats: c.seats,
      currentMonthlySpend: combined,
      recommendedAction: "Rationalize chat + API surface",
      recommendedPlanOrTool: `Consolidate ${vendor} under one negotiated program`,
      recommendedMonthlySpend: newMonthly,
      monthlySavings: haircut,
      annualSavings: roundMoney(haircut * 12),
      reason: `You carry both a paid ${vendor} chat SKU and a material ${vendor} API bill. Most teams either route more inference through the API with enterprise discounting or trim redundant chat seats once API adoption plateaus — finance can usually model 10–20% overlap here.`,
    });
  }
  return out;
}

function mergeByTool(rows: Recommendation[]): Recommendation[] {
  const byTool = new Map<string, Recommendation>();
  for (const r of rows) {
    const prev = byTool.get(r.tool);
    if (!prev || r.monthlySavings > prev.monthlySavings) {
      byTool.set(r.tool, r);
    }
  }
  return Array.from(byTool.values()).sort(
    (a, b) => b.monthlySavings - a.monthlySavings
  );
}

export function buildAllRecommendations(input: CreateAuditInput): Recommendation[] {
  const base = input.tools.map((t) =>
    buildPerToolLine(t, input.teamSize, input.primaryUseCase)
  );

  const stack = [
    ...overlapPack(input.tools, input.teamSize, {
      idSet: CODING_ASSISTANTS,
      label: "coding assistants",
      action: "Consolidate overlapping IDE assistants",
    }),
    ...overlapPack(input.tools, input.teamSize, {
      idSet: CHAT_LLMS,
      label: "chat LLM subscriptions",
      action: "Consolidate overlapping chat AI tools",
    }),
    ...overlapPack(input.tools, input.teamSize, {
      idSet: API_PROVIDERS,
      label: "API providers",
      action: "Consolidate LLM API contracts",
    }),
    ...chatPlusVendorApiOverlap(input.tools),
  ];

  return mergeByTool([...base, ...stack]).slice(0, 25);
}
