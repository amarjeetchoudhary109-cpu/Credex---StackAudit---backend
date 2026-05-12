"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BenchmarkService = void 0;
class BenchmarkService {
    getBenchmarkData(totalSpend, teamSize, useCase) {
        const spendPerDeveloper = totalSpend / Math.max(teamSize, 1);
        const benchmarks = this.getIndustryBenchmarks(useCase, teamSize);
        const percentile = this.calculatePercentile(spendPerDeveloper, benchmarks.average);
        return {
            averageSpendPerDeveloper: benchmarks.average,
            userSpendPerDeveloper: Math.round(spendPerDeveloper),
            percentile,
            industryAverage: benchmarks.industryWide,
            teamSizeCategory: this.getTeamSizeCategory(teamSize),
        };
    }
    /** Full intelligence layer: ratio vs cohort + overspending headline metric */
    getBenchmarkInsight(totalSpend, teamSize, useCase) {
        const base = this.getBenchmarkData(totalSpend, teamSize, useCase);
        const cohortAvg = Math.max(base.averageSpendPerDeveloper, 1);
        const ratio = base.userSpendPerDeveloper / cohortAvg;
        const overspendingPct = ratio > 1 ? Math.round((ratio - 1) * 100) : 0;
        return {
            ...base,
            spendVsBenchmarkRatio: Math.round(ratio * 100) / 100,
            overspendingVsCohortPercent: overspendingPct,
        };
    }
    getIndustryBenchmarks(useCase, teamSize) {
        const baseRates = {
            coding: { small: 180, medium: 220, large: 250 },
            writing: { small: 120, medium: 150, large: 180 },
            data: { small: 200, medium: 240, large: 280 },
            research: { small: 100, medium: 130, large: 160 },
            mixed: { small: 160, medium: 200, large: 230 },
        };
        const category = teamSize <= 5 ? "small" : teamSize <= 20 ? "medium" : "large";
        const average = baseRates[useCase][category];
        return {
            average,
            industryWide: 190, // Overall industry average
        };
    }
    calculatePercentile(userSpend, average) {
        // Simplified percentile calculation
        // In reality, this would use actual distribution data
        const ratio = userSpend / average;
        if (ratio <= 0.5)
            return 10;
        if (ratio <= 0.7)
            return 25;
        if (ratio <= 0.9)
            return 40;
        if (ratio <= 1.1)
            return 50;
        if (ratio <= 1.3)
            return 65;
        if (ratio <= 1.5)
            return 75;
        if (ratio <= 2.0)
            return 85;
        return 95;
    }
    getTeamSizeCategory(teamSize) {
        if (teamSize <= 5)
            return "Small Team (1-5)";
        if (teamSize <= 20)
            return "Medium Team (6-20)";
        if (teamSize <= 50)
            return "Large Team (21-50)";
        return "Enterprise (50+)";
    }
    getEfficiencyScore(currentSpend, optimizedSpend, benchmarkSpend) {
        // Calculate efficiency score (0-100)
        const savingsRatio = (currentSpend - optimizedSpend) / currentSpend;
        // Base score from savings potential
        let score = Math.max(0, 100 - (savingsRatio * 100));
        // Adjust based on benchmark comparison
        if (optimizedSpend <= benchmarkSpend) {
            score = Math.min(100, score + 20); // Bonus for being below benchmark
        }
        else {
            score = Math.max(0, score - 10); // Penalty for being above benchmark
        }
        return Math.round(score);
    }
}
exports.BenchmarkService = BenchmarkService;
//# sourceMappingURL=benchmark.service.js.map