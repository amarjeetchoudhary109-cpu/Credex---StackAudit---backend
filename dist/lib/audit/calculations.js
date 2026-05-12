"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.totalsFromRecommendations = totalsFromRecommendations;
const rules_1 = require("./rules");
function totalsFromRecommendations(recommendations, totalCurrentSpend) {
    const totalRecommendedSpend = (0, rules_1.roundMoney)(recommendations.reduce((s, r) => s + r.recommendedMonthlySpend, 0));
    const monthlySavings = (0, rules_1.roundMoney)(Math.max(0, totalCurrentSpend - totalRecommendedSpend));
    return {
        totalRecommendedSpend,
        monthlySavings,
        annualSavings: (0, rules_1.roundMoney)(monthlySavings * 12),
    };
}
//# sourceMappingURL=calculations.js.map