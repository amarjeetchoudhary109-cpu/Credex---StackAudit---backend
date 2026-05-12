"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const drizzle_orm_1 = require("drizzle-orm");
const index_1 = require("../db/index");
const schema_1 = require("../db/schema");
const recommendation_service_1 = require("./recommendation.service");
const audit_engine_service_1 = require("../modules/audits/services/audit-engine.service");
const audit_1 = require("../lib/audit");
const apiError_1 = require("../utils/apiError");
const benchmark_service_1 = require("./benchmark.service");
const summary_service_1 = require("./summary.service");
function generateShareId() {
    return crypto_1.default.randomBytes(10).toString("hex").toUpperCase();
}
function utilizationScore(seats, teamSize) {
    return Math.min(100, Math.max(0, Math.round((teamSize / Math.max(seats, 1)) * 100)));
}
function priorityForSavings(monthlySavings) {
    if (monthlySavings >= 500)
        return "high";
    if (monthlySavings >= 100)
        return "medium";
    return "low";
}
function legacyRecsFromRows(rows) {
    const out = [];
    for (const row of rows) {
        const parsed = (0, recommendation_service_1.parseLegacyPayload)(row.description);
        if (parsed) {
            out.push(parsed);
        }
    }
    return out;
}
/**
 * JWT `sub` may be Supabase (or another IdP) while `audits.user_id` FK targets `users`.
 * Only attach FKs when the referenced row exists to avoid insert 500s.
 */
async function resolveAuditForeignKeys(input) {
    let userId = input.userId ?? null;
    if (userId) {
        const [u] = await index_1.db
            .select({ id: schema_1.usersTable.id })
            .from(schema_1.usersTable)
            .where((0, drizzle_orm_1.eq)(schema_1.usersTable.id, userId))
            .limit(1);
        if (!u)
            userId = null;
    }
    let organizationId = input.organizationId ?? null;
    if (organizationId) {
        const [o] = await index_1.db
            .select({ id: schema_1.organizationsTable.id })
            .from(schema_1.organizationsTable)
            .where((0, drizzle_orm_1.eq)(schema_1.organizationsTable.id, organizationId))
            .limit(1);
        if (!o)
            organizationId = null;
    }
    return { userId, organizationId };
}
class AuditService {
    constructor() {
        this.auditEngine = new audit_engine_service_1.AuditEngineService();
        this.benchmarkService = new benchmark_service_1.BenchmarkService();
        this.summaryService = new summary_service_1.SummaryService();
    }
    async createAudit(input, userId) {
        const analysis = this.auditEngine.analyze(input);
        const engine = (0, audit_1.runAudit)(input);
        const recommendations = engine.recommendations;
        const totalCurrentSpend = engine.totalCurrentSpend;
        const totalRecommendedSpend = engine.totalRecommendedSpend;
        const monthlySavings = engine.monthlySavings;
        const annualSavings = engine.annualSavings;
        const unusedWaste = analysis.financials.unusedLicenseMonthlyWaste;
        const benchmark = analysis.benchmark;
        const efficiencyScore = this.benchmarkService.getEfficiencyScore(totalCurrentSpend, totalRecommendedSpend, benchmark.averageSpendPerDeveloper * input.teamSize);
        const summary = this.summaryService.generateSummary(recommendations, monthlySavings, input.teamSize, input.primaryUseCase, efficiencyScore);
        const shareId = generateShareId();
        const { userId: fkUserId, organizationId: fkOrgId } = await resolveAuditForeignKeys({
            userId: userId ?? null,
            organizationId: input.organizationId ?? null,
        });
        const auditId = await index_1.db.transaction(async (tx) => {
            const [audit] = await tx
                .insert(schema_1.auditsTable)
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
                throw new apiError_1.ApiError(500, "Failed to create audit record");
            }
            for (const tool of input.tools) {
                await tx.insert(schema_1.auditToolsTable).values({
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
                await tx.insert(schema_1.recommendationsTable).values({
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
        const [auditRow] = await index_1.db
            .select()
            .from(schema_1.auditsTable)
            .where((0, drizzle_orm_1.eq)(schema_1.auditsTable.id, auditId))
            .limit(1);
        if (!auditRow) {
            throw new apiError_1.ApiError(500, "Audit missing after insert");
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
    async getAuditByShareId(shareId) {
        const [audit] = await index_1.db
            .select()
            .from(schema_1.auditsTable)
            .where((0, drizzle_orm_1.eq)(schema_1.auditsTable.shareId, shareId))
            .limit(1);
        if (!audit) {
            throw new apiError_1.ApiError(404, "Audit not found");
        }
        const recRows = await index_1.db
            .select()
            .from(schema_1.recommendationsTable)
            .where((0, drizzle_orm_1.eq)(schema_1.recommendationsTable.auditId, audit.id))
            .orderBy((0, drizzle_orm_1.asc)(schema_1.recommendationsTable.createdAt));
        const recommendations = legacyRecsFromRows(recRows);
        const totalSpend = Number(audit.totalMonthlySpend);
        const benchmark = this.benchmarkService.getBenchmarkInsight(totalSpend, audit.teamSize, audit.primaryUseCase);
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
    async updateAiSummary(auditId, text) {
        await index_1.db
            .update(schema_1.auditsTable)
            .set({ aiSummary: text })
            .where((0, drizzle_orm_1.eq)(schema_1.auditsTable.id, auditId));
    }
    async getAuditIdByShareId(shareId) {
        const [row] = await index_1.db
            .select({ id: schema_1.auditsTable.id })
            .from(schema_1.auditsTable)
            .where((0, drizzle_orm_1.eq)(schema_1.auditsTable.shareId, shareId))
            .limit(1);
        return row?.id ?? null;
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=audit.service.js.map