"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seatsExcessVsTeam = seatsExcessVsTeam;
exports.shouldDowngradeCursorBusinessToPro = shouldDowngradeCursorBusinessToPro;
exports.shouldDowngradeChatgptTeam = shouldDowngradeChatgptTeam;
exports.shouldDowngradeClaudeTeam = shouldDowngradeClaudeTeam;
exports.shouldDowngradeCopilotEnterprise = shouldDowngradeCopilotEnterprise;
exports.apiVersusChatForDataTeam = apiVersusChatForDataTeam;
exports.roundMoney = roundMoney;
exports.spendIfPlan = spendIfPlan;
const pricing_1 = require("./pricing");
function seatsExcessVsTeam(tool, teamSize) {
    return Math.max(0, tool.seats - teamSize);
}
function shouldDowngradeCursorBusinessToPro(tool, teamSize) {
    if (tool.tool !== "cursor")
        return false;
    const p = (0, pricing_1.normalizePlanKey)(tool.plan);
    if (p !== "business" && p !== "enterprise")
        return false;
    return teamSize <= 2 || tool.seats <= 2;
}
function shouldDowngradeChatgptTeam(tool, teamSize) {
    if (tool.tool !== "chatgpt")
        return false;
    if ((0, pricing_1.normalizePlanKey)(tool.plan) !== "team")
        return false;
    return teamSize <= 5 || tool.seats <= 5;
}
function shouldDowngradeClaudeTeam(tool, teamSize) {
    if (tool.tool !== "claude")
        return false;
    if ((0, pricing_1.normalizePlanKey)(tool.plan) !== "team")
        return false;
    return teamSize <= 3 || tool.seats <= 3;
}
function shouldDowngradeCopilotEnterprise(tool, teamSize) {
    if (tool.tool !== "github_copilot")
        return false;
    if ((0, pricing_1.normalizePlanKey)(tool.plan) !== "enterprise")
        return false;
    return teamSize < 50;
}
function apiVersusChatForDataTeam(tool, useCase) {
    if (useCase !== "data" && useCase !== "mixed")
        return false;
    return ((tool.tool === "openai_api" || tool.tool === "anthropic_api") &&
        tool.monthlySpend > 500);
}
function roundMoney(n) {
    return Math.round(n * 100) / 100;
}
function spendIfPlan(tool, targetPlan, seats) {
    const m = (0, pricing_1.modeledMonthlySpend)(tool, targetPlan, seats);
    return m ?? 0;
}
//# sourceMappingURL=rules.js.map