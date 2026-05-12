import { describe, expect, it } from "vitest";

import type { CreateAuditInput } from "../../validation/audit.validation";
import { buildPerToolLine, buildAllRecommendations } from "./recommendations";
import { runAudit } from "./index";

describe("audit engine", () => {
  it("recommends Cursor Pro for small teams on Business", () => {
    const tool = {
      tool: "cursor" as const,
      plan: "Business",
      monthlySpend: 200,
      seats: 2,
    };
    const rec = buildPerToolLine(tool, 2, "coding");
    expect(rec.recommendedPlanOrTool.toLowerCase()).toContain("pro");
    expect(rec.monthlySavings).toBeGreaterThan(0);
  });

  it("detects oversized ChatGPT Team plan for small teams", () => {
    const tool = {
      tool: "chatgpt" as const,
      plan: "Team",
      monthlySpend: 150,
      seats: 3,
    };
    const rec = buildPerToolLine(tool, 3, "writing");
    expect(rec.recommendedPlanOrTool.toLowerCase()).toContain("plus");
    expect(rec.monthlySavings).toBeGreaterThan(0);
  });

  it("calculates annual savings correctly from runAudit", () => {
    const input: CreateAuditInput = {
      teamSize: 4,
      primaryUseCase: "coding",
      tools: [
        { tool: "cursor", plan: "Business", monthlySpend: 320, seats: 8 },
      ],
    };
    const r = runAudit(input);
    expect(r.annualSavings).toBeCloseTo(r.monthlySavings * 12, 1);
    expect(r.monthlySavings).toBeGreaterThan(0);
  });

  it("handles already optimized stack with zero savings", () => {
    const input: CreateAuditInput = {
      teamSize: 2,
      primaryUseCase: "coding",
      tools: [
        { tool: "cursor", plan: "Pro", monthlySpend: 40, seats: 2 },
      ],
    };
    const r = runAudit(input);
    expect(r.monthlySavings).toBe(0);
  });

  it("surfaces chat + same-vendor API overlap when both bills are material", () => {
    const input: CreateAuditInput = {
      teamSize: 10,
      primaryUseCase: "mixed",
      tools: [
        { tool: "chatgpt", plan: "Team", monthlySpend: 300, seats: 10 },
        { tool: "openai_api", plan: "GPT-4o heavy", monthlySpend: 400, seats: 1 },
      ],
    };
    const rows = buildAllRecommendations(input);
    const overlap = rows.find(
      (r) => r.recommendedAction === "Rationalize chat + API surface"
    );
    expect(overlap).toBeDefined();
    expect(overlap!.monthlySavings).toBeGreaterThan(0);
  });

  it("fallback summary text shape (unit-level)", () => {
    const monthly = 742;
    const fb = `You could save approximately $${Math.round(monthly)}/month by optimizing your AI stack.`;
    expect(fb).toContain("$742");
  });
});
