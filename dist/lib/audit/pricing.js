"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pricing = void 0;
exports.normalizePlanKey = normalizePlanKey;
exports.pricePerSeat = pricePerSeat;
exports.modeledMonthlySpend = modeledMonthlySpend;
/** Per-seat monthly USD for known vendor list tiers (deterministic audit math). */
exports.pricing = {
    cursor: {
        hobby: 0,
        free: 0,
        pro: 20,
        business: 40,
        enterprise: 60,
    },
    github_copilot: {
        individual: 10,
        business: 19,
        enterprise: 39,
    },
    claude: {
        free: 0,
        pro: 20,
        team: 30,
    },
    chatgpt: {
        free: 0,
        plus: 20,
        team: 30,
        enterprise: 60,
    },
    anthropic_api: {
        "pay-as-you-go": 0,
        payg: 0,
    },
    openai_api: {
        "pay-as-you-go": 0,
        payg: 0,
    },
    gemini: {
        free: 0,
        advanced: 20,
    },
    windsurf: {
        free: 0,
        pro: 15,
        team: 25,
    },
};
function normalizePlanKey(plan) {
    return plan.trim().toLowerCase().replace(/\s+/g, "_");
}
function pricePerSeat(tool, plan) {
    const key = normalizePlanKey(plan);
    const row = exports.pricing[tool];
    if (!row)
        return null;
    if (key in row)
        return row[key];
    const direct = Object.entries(row).find(([k]) => k === key);
    if (direct)
        return direct[1];
    const fuzzy = Object.entries(row).find(([k]) => key.includes(k) || k.includes(key));
    return fuzzy ? fuzzy[1] : null;
}
function modeledMonthlySpend(tool, plan, seats) {
    const p = pricePerSeat(tool, plan);
    if (p === null)
        return null;
    return Math.round(p * seats * 100) / 100;
}
//# sourceMappingURL=pricing.js.map