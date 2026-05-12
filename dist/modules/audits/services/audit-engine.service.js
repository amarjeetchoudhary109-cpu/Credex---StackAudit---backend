"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditEngineService = void 0;
const benchmark_service_1 = require("../../../services/benchmark.service");
const CODING_ASSISTANTS = [
    "cursor",
    "github_copilot",
    "windsurf",
];
const CHAT_LLMS = ["chatgpt", "claude", "gemini"];
const API_PROVIDERS = ["openai_api", "anthropic_api"];
function utilizationPercent(seats, teamSize) {
    return Math.min(100, Math.max(0, Math.round((teamSize / Math.max(seats, 1)) * 100)));
}
function unusedLicenseWaste(tools, teamSize) {
    let waste = 0;
    for (const t of tools) {
        const excess = Math.max(0, t.seats - teamSize);
        if (excess === 0)
            continue;
        const perSeat = t.monthlySpend / Math.max(t.seats, 1);
        waste += excess * perSeat;
    }
    return Math.round(waste * 100) / 100;
}
function findDuplicates(tools) {
    const seen = new Map();
    const dups = [];
    for (const t of tools) {
        seen.set(t.tool, (seen.get(t.tool) ?? 0) + 1);
    }
    for (const [tool, n] of seen) {
        if (n > 1)
            dups.push(tool);
    }
    return dups;
}
function clusterOverlap(tools, cluster, clusterId, rationale) {
    const present = tools.filter((t) => cluster.includes(t.tool));
    if (present.length < 2)
        return null;
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
class AuditEngineService {
    constructor() {
        this.benchmarks = new benchmark_service_1.BenchmarkService();
    }
    analyze(input) {
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
        const overlapClusters = [];
        const c1 = clusterOverlap(tools, CODING_ASSISTANTS, "coding_assistants", "Multiple IDE/coding assistants often duplicate Copilot-class spend.");
        if (c1)
            overlapClusters.push(c1);
        const c2 = clusterOverlap(tools, CHAT_LLMS, "chat_llms", "Multiple general chat LLM subscriptions overlap for knowledge work.");
        if (c2)
            overlapClusters.push(c2);
        const c3 = clusterOverlap(tools, API_PROVIDERS, "api_providers", "Separate OpenAI + Anthropic API contracts may consolidate under one negotiated tier.");
        if (c3)
            overlapClusters.push(c3);
        const benchmark = this.benchmarks.getBenchmarkInsight(totalMonthlySpend, teamSize, primaryUseCase);
        const benchmarkMonthlyTotalForTeam = benchmark.averageSpendPerDeveloper * teamSize;
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
exports.AuditEngineService = AuditEngineService;
//# sourceMappingURL=audit-engine.service.js.map