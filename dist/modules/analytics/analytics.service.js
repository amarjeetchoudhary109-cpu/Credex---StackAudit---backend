"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const index_1 = require("../../db/index");
const schema_1 = require("../../db/schema");
class AnalyticsService {
    async getOverview(userId) {
        const rows = await index_1.db
            .select({
            monthlySavings: schema_1.auditsTable.monthlySavings,
            annualSavings: schema_1.auditsTable.annualSavings,
            efficiencyScore: schema_1.auditsTable.efficiencyScore,
            totalMonthlySpend: schema_1.auditsTable.totalMonthlySpend,
        })
            .from(schema_1.auditsTable)
            .where((0, drizzle_orm_1.eq)(schema_1.auditsTable.userId, userId));
        if (rows.length === 0) {
            return {
                auditCount: 0,
                totalMonthlySpendReported: 0,
                totalMonthlySavingsEstimate: 0,
                totalAnnualSavingsEstimate: 0,
                averageEfficiencyScore: null,
                overspendingVsCohortAvgPercent: null,
            };
        }
        let spendSum = 0;
        let savingsSum = 0;
        let annualSum = 0;
        let effSum = 0;
        for (const r of rows) {
            spendSum += Number(r.totalMonthlySpend);
            savingsSum += Number(r.monthlySavings);
            annualSum += Number(r.annualSavings);
            effSum += r.efficiencyScore;
        }
        return {
            auditCount: rows.length,
            totalMonthlySpendReported: Math.round(spendSum * 100) / 100,
            totalMonthlySavingsEstimate: Math.round(savingsSum * 100) / 100,
            totalAnnualSavingsEstimate: Math.round(annualSum * 100) / 100,
            averageEfficiencyScore: Math.round(effSum / rows.length),
            overspendingVsCohortAvgPercent: null,
        };
    }
    async getSpendTrends(userId) {
        const rows = await index_1.db
            .select({
            createdAt: schema_1.auditsTable.createdAt,
            totalMonthlySpend: schema_1.auditsTable.totalMonthlySpend,
            monthlySavings: schema_1.auditsTable.monthlySavings,
        })
            .from(schema_1.auditsTable)
            .where((0, drizzle_orm_1.eq)(schema_1.auditsTable.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.auditsTable.createdAt));
        const byMonth = new Map();
        for (const r of rows) {
            const d = new Date(r.createdAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            const cur = byMonth.get(key) ?? { spend: 0, savings: 0, count: 0 };
            cur.spend += Number(r.totalMonthlySpend);
            cur.savings += Number(r.monthlySavings);
            cur.count += 1;
            byMonth.set(key, cur);
        }
        const sortedKeys = Array.from(byMonth.keys()).sort();
        return sortedKeys.map((monthKey) => {
            const v = byMonth.get(monthKey);
            const [y, m] = monthKey.split("-");
            return {
                monthKey,
                period: `${y}-${m}`,
                spend: Math.round(v.spend * 100) / 100,
                savings: Math.round(v.savings * 100) / 100,
                auditCount: v.count,
            };
        });
    }
    async getToolDistribution(userId) {
        const rows = await index_1.db
            .select({
            tool: schema_1.auditToolsTable.tool,
            spend: (0, drizzle_orm_1.sql) `sum(${schema_1.auditToolsTable.monthlyCost}::numeric)`,
            appearances: (0, drizzle_orm_1.sql) `count(*)::int`,
        })
            .from(schema_1.auditToolsTable)
            .innerJoin(schema_1.auditsTable, (0, drizzle_orm_1.eq)(schema_1.auditToolsTable.auditId, schema_1.auditsTable.id))
            .where((0, drizzle_orm_1.eq)(schema_1.auditsTable.userId, userId))
            .groupBy(schema_1.auditToolsTable.tool);
        return rows
            .map((r) => ({
            tool: r.tool,
            monthlySpendSum: Math.round(Number(r.spend) * 100) / 100,
            auditAppearances: Number(r.appearances),
        }))
            .sort((a, b) => b.monthlySpendSum - a.monthlySpendSum);
    }
    async getSavings(userId) {
        const rows = await index_1.db
            .select({
            id: schema_1.auditsTable.id,
            monthlySavings: schema_1.auditsTable.monthlySavings,
            annualSavings: schema_1.auditsTable.annualSavings,
            createdAt: schema_1.auditsTable.createdAt,
        })
            .from(schema_1.auditsTable)
            .where((0, drizzle_orm_1.eq)(schema_1.auditsTable.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.auditsTable.createdAt));
        const totalMonthlySavings = rows.reduce((s, r) => s + Number(r.monthlySavings), 0);
        const totalAnnualSavings = rows.reduce((s, r) => s + Number(r.annualSavings), 0);
        return {
            totalMonthlySavings: Math.round(totalMonthlySavings * 100) / 100,
            totalAnnualSavings: Math.round(totalAnnualSavings * 100) / 100,
            savingsPerAudit: rows.map((r) => ({
                auditId: r.id,
                monthlySavings: Number(r.monthlySavings),
                createdAt: r.createdAt instanceof Date
                    ? r.createdAt.toISOString()
                    : String(r.createdAt),
            })),
        };
    }
    async getEfficiency(userId) {
        const rows = await index_1.db
            .select({
            id: schema_1.auditsTable.id,
            efficiencyScore: schema_1.auditsTable.efficiencyScore,
            createdAt: schema_1.auditsTable.createdAt,
        })
            .from(schema_1.auditsTable)
            .where((0, drizzle_orm_1.eq)(schema_1.auditsTable.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.auditsTable.createdAt));
        if (rows.length === 0) {
            return { averageScore: null, scores: [] };
        }
        const avg = rows.reduce((s, r) => s + r.efficiencyScore, 0) / rows.length;
        return {
            averageScore: Math.round(avg),
            scores: rows.map((r) => ({
                auditId: r.id,
                efficiencyScore: r.efficiencyScore,
                createdAt: r.createdAt instanceof Date
                    ? r.createdAt.toISOString()
                    : String(r.createdAt),
            })),
        };
    }
}
exports.AnalyticsService = AnalyticsService;
//# sourceMappingURL=analytics.service.js.map