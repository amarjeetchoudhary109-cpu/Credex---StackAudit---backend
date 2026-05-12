"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiAuditSummaryService = void 0;
const index_1 = require("../db/index");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const recommendation_service_1 = require("./recommendation.service");
const gemini_service_1 = require("./gemini.service");
function fallbackSummary(monthlySavings) {
    const x = Math.round(monthlySavings);
    return `You could save approximately $${x}/month by optimizing your AI stack.`;
}
function topRecLines(recs, max = 5) {
    return recs
        .filter((r) => r.monthlySavings > 0)
        .slice(0, max)
        .map((r) => `- ${r.tool}: ${r.recommendedAction} → ${r.recommendedPlanOrTool} (~$${Math.round(r.monthlySavings)}/mo)`)
        .join("\n");
}
class AiAuditSummaryService {
    constructor() {
        this.gemini = new gemini_service_1.GeminiService();
    }
    async generateAndPersistByShareId(shareId) {
        const [audit] = await index_1.db
            .select()
            .from(schema_1.auditsTable)
            .where((0, drizzle_orm_1.eq)(schema_1.auditsTable.shareId, shareId))
            .limit(1);
        if (!audit) {
            throw new Error("Audit not found");
        }
        if (audit.aiSummary?.trim()) {
            return audit.aiSummary.trim();
        }
        const recRows = await index_1.db
            .select()
            .from(schema_1.recommendationsTable)
            .where((0, drizzle_orm_1.eq)(schema_1.recommendationsTable.auditId, audit.id))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.recommendationsTable.createdAt));
        const recommendations = [];
        for (const row of recRows) {
            const p = (0, recommendation_service_1.parseLegacyPayload)(row.description);
            if (p)
                recommendations.push(p);
        }
        const monthlySavings = Number(audit.monthlySavings);
        const annualSavings = Number(audit.annualSavings);
        const prompt = `You are an AI infrastructure cost consultant.

Summarize this startup's AI stack overspending in at most 100 words.

Audit:
- Current modeled savings opportunity: $${Math.round(monthlySavings)}/month (~$${Math.round(annualSavings)}/year)
- Team size: ${audit.teamSize}
- Primary use case: ${audit.primaryUseCase}
- Recommended changes:
${topRecLines(recommendations)}

Tone: helpful, sharp, founder-friendly. Plain text, no markdown.`;
        try {
            const text = await this.gemini.generateFounderSummary(prompt);
            const clipped = text.slice(0, 1200);
            await index_1.db
                .update(schema_1.auditsTable)
                .set({ aiSummary: clipped })
                .where((0, drizzle_orm_1.eq)(schema_1.auditsTable.id, audit.id));
            return clipped;
        }
        catch (e) {
            console.warn("[AiAuditSummary] Gemini unavailable, using fallback", e);
            const fb = fallbackSummary(monthlySavings);
            await index_1.db
                .update(schema_1.auditsTable)
                .set({ aiSummary: fb })
                .where((0, drizzle_orm_1.eq)(schema_1.auditsTable.id, audit.id));
            return fb;
        }
    }
}
exports.AiAuditSummaryService = AiAuditSummaryService;
//# sourceMappingURL=ai-audit-summary.service.js.map