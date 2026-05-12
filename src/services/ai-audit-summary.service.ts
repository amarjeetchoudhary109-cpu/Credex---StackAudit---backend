import { db } from "../db/index";
import { auditsTable, recommendationsTable } from "../db/schema";
import { asc, eq } from "drizzle-orm";
import { parseLegacyPayload } from "./recommendation.service";
import type { Recommendation } from "./recommendation.service";
import { GeminiService } from "./gemini.service";

function fallbackSummary(monthlySavings: number): string {
  const x = Math.round(monthlySavings);
  return `You could save approximately $${x}/month by optimizing your AI stack.`;
}

function topRecLines(recs: Recommendation[], max = 5): string {
  return recs
    .filter((r) => r.monthlySavings > 0)
    .slice(0, max)
    .map(
      (r) =>
        `- ${r.tool}: ${r.recommendedAction} → ${r.recommendedPlanOrTool} (~$${Math.round(r.monthlySavings)}/mo)`
    )
    .join("\n");
}

export class AiAuditSummaryService {
  private gemini = new GeminiService();

  async generateAndPersistByShareId(shareId: string): Promise<string> {
    const [audit] = await db
      .select()
      .from(auditsTable)
      .where(eq(auditsTable.shareId, shareId))
      .limit(1);

    if (!audit) {
      throw new Error("Audit not found");
    }

    if (audit.aiSummary?.trim()) {
      return audit.aiSummary.trim();
    }

    const recRows = await db
      .select()
      .from(recommendationsTable)
      .where(eq(recommendationsTable.auditId, audit.id))
      .orderBy(asc(recommendationsTable.createdAt));

    const recommendations: Recommendation[] = [];
    for (const row of recRows) {
      const p = parseLegacyPayload(row.description);
      if (p) recommendations.push(p as Recommendation);
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
      await db
        .update(auditsTable)
        .set({ aiSummary: clipped })
        .where(eq(auditsTable.id, audit.id));
      return clipped;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(
        "[AiAuditSummary] Gemini unavailable, using deterministic fallback:",
        msg.slice(0, 400)
      );
      const fb = fallbackSummary(monthlySavings);
      await db
        .update(auditsTable)
        .set({ aiSummary: fb })
        .where(eq(auditsTable.id, audit.id));
      return fb;
    }
  }
}
