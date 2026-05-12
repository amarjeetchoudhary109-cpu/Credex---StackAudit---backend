"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationEngineService = void 0;
const recommendation_service_1 = require("../../../services/recommendation.service");
const CODING_ASSISTANTS = new Set([
    "cursor",
    "github_copilot",
    "windsurf",
]);
const CHAT_LLMS = new Set(["chatgpt", "claude", "gemini"]);
const API_PROVIDERS = new Set(["openai_api", "anthropic_api"]);
function roundMoney(n) {
    return Math.round(n * 100) / 100;
}
/**
 * SaaS recommendation layer: per-tool optimizations from {@link RecommendationService}
 * plus stack overlap & API consolidation insights.
 */
class RecommendationEngineService {
    constructor() {
        this.perTool = new recommendation_service_1.RecommendationService();
    }
    /**
     * Merge per-tool engine output with cross-stack consolidation rows (deduped, capped).
     */
    generateAll(input) {
        const base = this.perTool.generateRecommendations(input.tools, input.teamSize, input.primaryUseCase);
        const stack = [
            ...this.overlapPack(input.tools, input.teamSize, input.primaryUseCase, {
                idSet: CODING_ASSISTANTS,
                label: "coding assistants",
                action: "Consolidate overlapping IDE assistants",
            }),
            ...this.overlapPack(input.tools, input.teamSize, input.primaryUseCase, {
                idSet: CHAT_LLMS,
                label: "chat LLM subscriptions",
                action: "Consolidate overlapping chat AI tools",
            }),
            ...this.overlapPack(input.tools, input.teamSize, input.primaryUseCase, {
                idSet: API_PROVIDERS,
                label: "API providers",
                action: "Consolidate LLM API contracts",
            }),
        ];
        const merged = this.mergeByTool([...base, ...stack]);
        return merged.slice(0, 25);
    }
    overlapPack(tools, teamSize, useCase, pack) {
        const subset = tools.filter((t) => pack.idSet.has(t.tool));
        if (subset.length < 2)
            return [];
        const sorted = [...subset].sort((a, b) => b.monthlySpend - a.monthlySpend);
        const primary = sorted[0];
        const redundantMonthly = sorted
            .slice(1)
            .reduce((s, t) => s + t.monthlySpend, 0);
        const heuristicSavings = roundMoney(redundantMonthly * 0.45);
        if (heuristicSavings < 5)
            return [];
        const newMonthly = roundMoney(Math.max(0, primary.monthlySpend + redundantMonthly - heuristicSavings));
        const rec = {
            tool: primary.tool,
            currentPlan: primary.plan,
            seats: primary.seats,
            currentMonthlySpend: roundMoney(subset.reduce((s, t) => s + t.monthlySpend, 0)),
            recommendedAction: pack.action,
            recommendedPlanOrTool: `Standardize on strongest contract; trim redundant ${pack.label}`,
            recommendedMonthlySpend: newMonthly,
            monthlySavings: heuristicSavings,
            annualSavings: roundMoney(heuristicSavings * 12),
            reason: `You reported ${subset.length} ${pack.label} (${subset.map((t) => t.tool).join(", ")}). Teams typically retain one primary vendor and negotiate enterprise/API tiers instead of parallel stacks.`,
        };
        void teamSize;
        void useCase;
        return [rec];
    }
    /** Prefer highest-savings row per tool id when duplicates exist */
    mergeByTool(rows) {
        const byTool = new Map();
        for (const r of rows) {
            const key = r.tool;
            const prev = byTool.get(key);
            if (!prev || r.monthlySavings > prev.monthlySavings) {
                byTool.set(key, r);
            }
        }
        return Array.from(byTool.values()).sort((a, b) => b.monthlySavings - a.monthlySavings);
    }
}
exports.RecommendationEngineService = RecommendationEngineService;
//# sourceMappingURL=recommendation-engine.service.js.map