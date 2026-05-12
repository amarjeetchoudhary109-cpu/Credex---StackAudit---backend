import crypto from "crypto";
import { asc, eq } from "drizzle-orm";

import { db } from "../db/index";
import {
  auditToolsTable,
  auditsTable,
  organizationsTable,
  recommendationsTable,
  usersTable,
} from "../db/schema";
import { parseLegacyPayload } from "./recommendation.service";
import { AuditEngineService } from "../modules/audits/services/audit-engine.service";
import { runAudit } from "../lib/audit";
import type { CreateAuditInput, UseCase } from "../validation/audit.validation";
import { ApiError } from "../utils/apiError";
import { BenchmarkService } from "./benchmark.service";
import type { Recommendation } from "./recommendation.service";
import { SummaryService } from "./summary.service";

function generateShareId(): string {
  return crypto.randomBytes(10).toString("hex").toUpperCase();
}

function utilizationScore(seats: number, teamSize: number): number {
  return Math.min(
    100,
    Math.max(0, Math.round((teamSize / Math.max(seats, 1)) * 100))
  );
}

function priorityForSavings(monthlySavings: number): string {
  if (monthlySavings >= 500) return "high";
  if (monthlySavings >= 100) return "medium";
  return "low";
}

function legacyRecsFromRows(
  rows: (typeof recommendationsTable.$inferSelect)[]
): Recommendation[] {
  const out: Recommendation[] = [];
  for (const row of rows) {
    const parsed = parseLegacyPayload(row.description);
    if (parsed) {
      out.push(parsed as Recommendation);
    }
  }
  return out;
}

/**
 * JWT `sub` may be Supabase (or another IdP) while `audits.user_id` FK targets `users`.
 * Only attach FKs when the referenced row exists to avoid insert 500s.
 */
async function resolveAuditForeignKeys(input: {
  userId?: string | null;
  organizationId?: string | null;
}): Promise<{ userId: string | null; organizationId: string | null }> {
  let userId: string | null = input.userId ?? null;
  if (userId) {
    const [u] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    if (!u) userId = null;
  }
  let organizationId: string | null = input.organizationId ?? null;
  if (organizationId) {
    const [o] = await db
      .select({ id: organizationsTable.id })
      .from(organizationsTable)
      .where(eq(organizationsTable.id, organizationId))
      .limit(1);
    if (!o) organizationId = null;
  }
  return { userId, organizationId };
}

export interface AuditResult {
  success: boolean;
  auditId: string;
  shareId: string;
  monthlySavings: number;
  annualSavings: number;
  efficiencyScore: number;
  recommendations: Recommendation[];
  summary: string;
  aiSummary?: string | null;
  benchmark?: unknown;
}

export class AuditService {
  private auditEngine = new AuditEngineService();
  private benchmarkService = new BenchmarkService();
  private summaryService = new SummaryService();

  async createAudit(
    input: CreateAuditInput,
    userId?: string | null
  ): Promise<AuditResult> {
    const analysis = this.auditEngine.analyze(input);
    const engine = runAudit(input);
    const recommendations = engine.recommendations;

    const totalCurrentSpend = engine.totalCurrentSpend;
    const totalRecommendedSpend = engine.totalRecommendedSpend;
    const monthlySavings = engine.monthlySavings;
    const annualSavings = engine.annualSavings;
    const unusedWaste = analysis.financials.unusedLicenseMonthlyWaste;

    const benchmark = analysis.benchmark;

    const efficiencyScore = this.benchmarkService.getEfficiencyScore(
      totalCurrentSpend,
      totalRecommendedSpend,
      benchmark.averageSpendPerDeveloper * input.teamSize
    );

    const summary = this.summaryService.generateSummary(
      recommendations,
      monthlySavings,
      input.teamSize,
      input.primaryUseCase,
      efficiencyScore
    );

    const shareId = generateShareId();

    const { userId: fkUserId, organizationId: fkOrgId } =
      await resolveAuditForeignKeys({
        userId: userId ?? null,
        organizationId: input.organizationId ?? null,
      });

    const auditId = await db.transaction(async (tx) => {
      const [audit] = await tx
        .insert(auditsTable)
        .values({
          shareId,
          userId: fkUserId,
          organizationId: fkOrgId,
          teamSize: input.teamSize,
          primaryUseCase: input.primaryUseCase,
          totalMonthlySpend: totalCurrentSpend.toFixed(2),
          unusedLicenseMonthlyWaste: unusedWaste.toFixed(2),
          monthlySavings: monthlySavings.toFixed(2),
          annualSavings: annualSavings.toFixed(2),
          efficiencyScore,
          summary,
          toolsSnapshot: {
            teamSize: input.teamSize,
            primaryUseCase: input.primaryUseCase,
            tools: input.tools,
            engineVersion: "lib/audit@v1",
          },
          aiSummary: null,
          status: "completed",
        })
        .returning();

      if (!audit) {
        throw new ApiError(500, "Failed to create audit record");
      }

      for (const tool of input.tools) {
        await tx.insert(auditToolsTable).values({
          auditId: audit.id,
          tool: tool.tool,
          planName: tool.plan,
          monthlyCost: tool.monthlySpend.toFixed(2),
          seats: tool.seats,
          utilizationScore: utilizationScore(tool.seats, input.teamSize),
          active: true,
        });
      }

      for (const rec of recommendations) {
        await tx.insert(recommendationsTable).values({
          auditId: audit.id,
          title: `${rec.tool}: ${rec.recommendedAction}`,
          description: JSON.stringify(rec),
          estimatedSavings: rec.monthlySavings.toFixed(2),
          priority: priorityForSavings(rec.monthlySavings),
          implemented: false,
        });
      }

      return audit.id;
    });

    const [auditRow] = await db
      .select()
      .from(auditsTable)
      .where(eq(auditsTable.id, auditId))
      .limit(1);

    if (!auditRow) {
      throw new ApiError(500, "Audit missing after insert");
    }

    return {
      success: true,
      auditId: auditRow.id,
      shareId: auditRow.shareId,
      monthlySavings: Math.round(monthlySavings),
      annualSavings: Math.round(annualSavings),
      efficiencyScore,
      recommendations,
      summary,
      aiSummary: null,
      benchmark: {
        ...benchmark,
        overlapClusters: analysis.overlapClusters,
        duplicateTools: analysis.duplicateToolIds,
        utilization: analysis.utilization,
      },
    };
  }

  async getAuditByShareId(shareId: string) {
    const [audit] = await db
      .select()
      .from(auditsTable)
      .where(eq(auditsTable.shareId, shareId))
      .limit(1);

    if (!audit) {
      throw new ApiError(404, "Audit not found");
    }

    const recRows = await db
      .select()
      .from(recommendationsTable)
      .where(eq(recommendationsTable.auditId, audit.id))
      .orderBy(asc(recommendationsTable.createdAt));

    const recommendations = legacyRecsFromRows(recRows);

    const totalSpend = Number(audit.totalMonthlySpend);
    const benchmark = this.benchmarkService.getBenchmarkInsight(
      totalSpend,
      audit.teamSize,
      audit.primaryUseCase as UseCase
    );

    return {
      auditId: audit.id,
      shareId: audit.shareId,
      teamSize: audit.teamSize,
      primaryUseCase: audit.primaryUseCase,
      monthlySavings: Number(audit.monthlySavings),
      annualSavings: Number(audit.annualSavings),
      efficiencyScore: audit.efficiencyScore,
      recommendations,
      summary: audit.summary ?? "",
      aiSummary: audit.aiSummary ?? null,
      createdAt: audit.createdAt,
      benchmark,
    };
  }

  async updateAiSummary(auditId: string, text: string) {
    await db
      .update(auditsTable)
      .set({ aiSummary: text })
      .where(eq(auditsTable.id, auditId));
  }

  async getAuditIdByShareId(shareId: string): Promise<string | null> {
    const [row] = await db
      .select({ id: auditsTable.id })
      .from(auditsTable)
      .where(eq(auditsTable.shareId, shareId))
      .limit(1);
    return row?.id ?? null;
  }
}
