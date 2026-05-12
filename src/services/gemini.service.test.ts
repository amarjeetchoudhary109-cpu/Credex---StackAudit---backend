import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GoogleGenerativeAI } from "@google/generative-ai";

import type { AuditInsightsContext } from "./gemini.service";
import { GeminiService } from "./gemini.service";

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn(),
}));

const minimalCtx: AuditInsightsContext = {
  teamSize: 5,
  primaryUseCase: "Support automation",
  totalMonthlySpend: 1200,
  monthlySavings: 200,
  annualSavings: 2400,
  efficiencyScore: 72,
  summary: "Mixed stack",
  tools: [
    {
      tool: "ChatGPT",
      plan: "Team",
      monthlySpend: 600,
      seats: 10,
    },
  ],
  recommendations: [
    {
      tool: "ChatGPT",
      monthlySavings: 100,
      recommendedAction: "Annual commitment",
      reason: "Vendor discount",
    },
  ],
};

describe("GeminiService.generateAuditInsights", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
    delete process.env.GEMINI_MODEL;
    vi.mocked(GoogleGenerativeAI).mockImplementation(
      () =>
        ({
          getGenerativeModel: () => ({
            generateContent: vi.fn().mockResolvedValue({
              response: {
                text: () => "  AI insight reply  ",
              },
            }),
          }),
        }) as unknown as InstanceType<typeof GoogleGenerativeAI>
    );
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalKey;
    }
    if (originalModel === undefined) {
      delete process.env.GEMINI_MODEL;
    } else {
      process.env.GEMINI_MODEL = originalModel;
    }
    vi.clearAllMocks();
  });

  it("throws 503 when GEMINI_API_KEY is missing", async () => {
    delete process.env.GEMINI_API_KEY;
    const svc = new GeminiService();
    await expect(svc.generateAuditInsights(minimalCtx)).rejects.toMatchObject({
      statusCode: 503,
    });
  });

  it("returns trimmed insight text when the API succeeds", async () => {
    const svc = new GeminiService();
    const text = await svc.generateAuditInsights(minimalCtx);
    expect(text).toBe("AI insight reply");
  });

  it("throws 502 when Gemini returns empty text", async () => {
    vi.mocked(GoogleGenerativeAI).mockImplementation(
      () =>
        ({
          getGenerativeModel: () => ({
            generateContent: vi.fn().mockResolvedValue({
              response: {
                text: () => "",
              },
            }),
          }),
        }) as unknown as InstanceType<typeof GoogleGenerativeAI>
    );
    const svc = new GeminiService();
    await expect(svc.generateAuditInsights(minimalCtx)).rejects.toMatchObject({
      statusCode: 502,
    });
  });

  it("throws 502 when generateContent fails", async () => {
    vi.mocked(GoogleGenerativeAI).mockImplementation(
      () =>
        ({
          getGenerativeModel: () => ({
            generateContent: vi.fn().mockRejectedValue(new Error("quota exceeded")),
          }),
        }) as unknown as InstanceType<typeof GoogleGenerativeAI>
    );
    const svc = new GeminiService();
    await expect(svc.generateAuditInsights(minimalCtx)).rejects.toMatchObject({
      statusCode: 502,
    });
  });
});
