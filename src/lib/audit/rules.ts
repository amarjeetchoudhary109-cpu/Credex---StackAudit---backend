import type { SupportedTool, ToolInput, UseCase } from "../../validation/audit.validation";
import { modeledMonthlySpend, normalizePlanKey } from "./pricing";

export function seatsExcessVsTeam(tool: ToolInput, teamSize: number): number {
  return Math.max(0, tool.seats - teamSize);
}

export function shouldDowngradeCursorBusinessToPro(
  tool: ToolInput,
  teamSize: number
): boolean {
  if (tool.tool !== "cursor") return false;
  const p = normalizePlanKey(tool.plan);
  if (p !== "business" && p !== "enterprise") return false;
  return teamSize <= 2 || tool.seats <= 2;
}

export function shouldDowngradeChatgptTeam(
  tool: ToolInput,
  teamSize: number
): boolean {
  if (tool.tool !== "chatgpt") return false;
  if (normalizePlanKey(tool.plan) !== "team") return false;
  return teamSize <= 5 || tool.seats <= 5;
}

export function shouldDowngradeClaudeTeam(
  tool: ToolInput,
  teamSize: number
): boolean {
  if (tool.tool !== "claude") return false;
  if (normalizePlanKey(tool.plan) !== "team") return false;
  return teamSize <= 3 || tool.seats <= 3;
}

export function shouldDowngradeCopilotEnterprise(
  tool: ToolInput,
  teamSize: number
): boolean {
  if (tool.tool !== "github_copilot") return false;
  if (normalizePlanKey(tool.plan) !== "enterprise") return false;
  return teamSize < 50;
}

export function apiVersusChatForDataTeam(
  tool: ToolInput,
  useCase: UseCase
): boolean {
  if (useCase !== "data" && useCase !== "mixed") return false;
  return (
    (tool.tool === "openai_api" || tool.tool === "anthropic_api") &&
    tool.monthlySpend > 500
  );
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function spendIfPlan(
  tool: SupportedTool,
  targetPlan: string,
  seats: number
): number {
  const m = modeledMonthlySpend(tool, targetPlan, seats);
  return m ?? 0;
}
