import type { CreateAuditInput, ToolInput } from "../../../validation/audit.validation";
import {
  BenchmarkService,
  type BenchmarkInsight,
} from "../../../services/benchmark.service";

export interface ToolOverlapCluster {
  clusterId: "coding_assistants" | "chat_llms" | "api_providers";
  tools: SupportedToolKey[];
  monthlySpendTotal: number;
  rationale: string;
}

export type SupportedToolKey = ToolInput["tool"];

const CODING_ASSISTANTS: SupportedToolKey[] = [
  "cursor",
  "github_copilot",
  "windsurf",
];
const CHAT_LLMS: SupportedToolKey[] = ["chatgpt", "claude", "gemini"];
const API_PROVIDERS: SupportedToolKey[] = ["openai_api", "anthropic_api"];

export interface AuditEngineFinancials {
  totalMonthlySpend: number;
  annualSpend: number;
  unusedLicenseMonthlyWaste: number;
}

export interface UtilizationRow {
  tool: SupportedToolKey;
  seats: number;
  utilizationPercent: number;
}

export interface AuditEngineAnalysis {
  financials: AuditEngineFinancials;
  utilization: UtilizationRow[];
  duplicateToolIds: SupportedToolKey[];
  overlapClusters: ToolOverlapCluster[];
  benchmark: BenchmarkInsight;
  efficiencyScoreInputs: {
    currentSpend: number;
    optimizedSpend: number;
    benchmarkMonthlyTotalForTeam: number;
  };
}

function utilizationPercent(seats: number, teamSize: number): number {
  return Math.min(
    100,
    Math.max(0, Math.round((teamSize / Math.max(seats, 1)) * 100))
  );
}

function unusedLicenseWaste(tools: ToolInput[], teamSize: number): number {
  let waste = 0;
  for (const t of tools) {
    const excess = Math.max(0, t.seats - teamSize);
    if (excess === 0) continue;
    const perSeat = t.monthlySpend / Math.max(t.seats, 1);
    waste += excess * perSeat;
  }
  return Math.round(waste * 100) / 100;
}

function findDuplicates(tools: ToolInput[]): SupportedToolKey[] {
  const seen = new Map<SupportedToolKey, number>();
  const dups: SupportedToolKey[] = [];
  for (const t of tools) {
    seen.set(t.tool, (seen.get(t.tool) ?? 0) + 1);
  }
  for (const [tool, n] of seen) {
    if (n > 1) dups.push(tool);
  }
  return dups;
}

function clusterOverlap(
  tools: ToolInput[],
  cluster: SupportedToolKey[],
  clusterId: ToolOverlapCluster["clusterId"],
  rationale: string
): ToolOverlapCluster | null {
  const present = tools.filter((t) => cluster.includes(t.tool));
  if (present.length < 2) return null;
  const monthlySpendTotal = present.reduce((s, t) => s + t.monthlySpend, 0);
  return {
    clusterId,
    tools: present.map((t) => t.tool),
    monthlySpendTotal,
    rationale,
  };
}

/**
 * Core SaaS intelligence for an audit intake payload: spend, waste, utilization,
 * duplicate-vendor detection, overlapping-product stacks, and cohort benchmarks.
 */
export class AuditEngineService {
  private benchmarks = new BenchmarkService();

  analyze(input: CreateAuditInput): AuditEngineAnalysis {
    const { tools, teamSize, primaryUseCase } = input;

    const totalMonthlySpend = tools.reduce((s, t) => s + t.monthlySpend, 0);
    const annualSpend = totalMonthlySpend * 12;
    const unusedLicenseMonthlyWaste = unusedLicenseWaste(tools, teamSize);

    const utilization = tools.map((t) => ({
      tool: t.tool,
      seats: t.seats,
      utilizationPercent: utilizationPercent(t.seats, teamSize),
    }));

    const duplicateToolIds = findDuplicates(tools);

    const overlapClusters: ToolOverlapCluster[] = [];
    const c1 = clusterOverlap(
      tools,
      CODING_ASSISTANTS,
      "coding_assistants",
      "Multiple IDE/coding assistants often duplicate Copilot-class spend."
    );
    if (c1) overlapClusters.push(c1);
    const c2 = clusterOverlap(
      tools,
      CHAT_LLMS,
      "chat_llms",
      "Multiple general chat LLM subscriptions overlap for knowledge work."
    );
    if (c2) overlapClusters.push(c2);
    const c3 = clusterOverlap(
      tools,
      API_PROVIDERS,
      "api_providers",
      "Separate OpenAI + Anthropic API contracts may consolidate under one negotiated tier."
    );
    if (c3) overlapClusters.push(c3);

    const benchmark = this.benchmarks.getBenchmarkInsight(
      totalMonthlySpend,
      teamSize,
      primaryUseCase
    );

    const benchmarkMonthlyTotalForTeam =
      benchmark.averageSpendPerDeveloper * teamSize;

    return {
      financials: {
        totalMonthlySpend,
        annualSpend,
        unusedLicenseMonthlyWaste,
      },
      utilization,
      duplicateToolIds,
      overlapClusters,
      benchmark,
      efficiencyScoreInputs: {
        currentSpend: totalMonthlySpend,
        optimizedSpend: totalMonthlySpend,
        benchmarkMonthlyTotalForTeam,
      },
    };
  }
}
