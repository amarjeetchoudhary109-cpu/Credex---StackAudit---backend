"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAudit = runAudit;
const recommendations_1 = require("./recommendations");
const calculations_1 = require("./calculations");
const rules_1 = require("./rules");
__exportStar(require("./pricing"), exports);
__exportStar(require("./rules"), exports);
__exportStar(require("./recommendations"), exports);
__exportStar(require("./calculations"), exports);
/**
 * Single entry: deterministic recommendations + savings totals.
 */
function runAudit(input) {
    const recommendations = (0, recommendations_1.buildAllRecommendations)(input);
    const totalCurrentSpend = (0, rules_1.roundMoney)(input.tools.reduce((s, t) => s + t.monthlySpend, 0));
    const { totalRecommendedSpend, monthlySavings, annualSavings } = (0, calculations_1.totalsFromRecommendations)(recommendations, totalCurrentSpend);
    return {
        recommendations,
        totalCurrentSpend,
        totalRecommendedSpend,
        monthlySavings,
        annualSavings,
    };
}
//# sourceMappingURL=index.js.map