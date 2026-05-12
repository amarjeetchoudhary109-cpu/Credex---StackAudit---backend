import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
}));

vi.mock("dotenv", () => ({
  default: { config: vi.fn() },
}));

vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: { send: sendMock },
  })),
}));

describe("sendLeadConfirmationEmail", () => {
  const savedKey = process.env.RESEND_API_KEY;
  const savedFrom = process.env.RESEND_FROM;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn> | undefined;

  beforeEach(() => {
    vi.resetModules();
    sendMock.mockReset();
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM;
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
    if (savedKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = savedKey;
    if (savedFrom === undefined) delete process.env.RESEND_FROM;
    else process.env.RESEND_FROM = savedFrom;
  });

  it("returns skipped when RESEND_API_KEY is not set", async () => {
    process.env.RESEND_FROM = "Credex <hello@example.com>";
    const { sendLeadConfirmationEmail } = await import("./resend-email.service");
    const r = await sendLeadConfirmationEmail({
      leadId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      to: "lead@example.com",
      siteHomeUrl: "https://example.com",
      audit: null,
    });
    expect(r).toEqual({ sent: false, skippedReason: "RESEND_API_KEY not set" });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("returns skipped when RESEND_FROM is not set", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    const { sendLeadConfirmationEmail } = await import("./resend-email.service");
    const r = await sendLeadConfirmationEmail({
      leadId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      to: "lead@example.com",
      siteHomeUrl: "https://example.com",
      audit: null,
    });
    expect(r).toEqual({ sent: false, skippedReason: "RESEND_FROM not set" });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("calls Resend with idempotency key, tags, and escaped HTML", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.RESEND_FROM = "Credex <notifications@example.com>";
    sendMock.mockResolvedValue({
      data: { id: "msg_123" },
      error: null,
      headers: null,
    });

    const { sendLeadConfirmationEmail } = await import("./resend-email.service");
    const leadId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const reportUrl = "https://app.example.com/audit/ABC123";

    const r = await sendLeadConfirmationEmail({
      leadId,
      to: "lead@example.com",
      companyName: "Acme & Sons",
      reportUrl,
      siteHomeUrl: "https://app.example.com",
      audit: {
        currentMonthlySpend: 1240,
        potentialMonthlySavings: 420,
        estimatedAnnualSavings: 5040,
        bullets: ["Downgrade oversized team plans", "Reduce duplicate AI subscriptions"],
      },
    });

    expect(r).toEqual({ sent: true, messageId: "msg_123" });
    expect(sendMock).toHaveBeenCalledTimes(1);

    const [payload, options] = sendMock.mock.calls[0] as [
      Record<string, unknown>,
      { idempotencyKey: string },
    ];

    expect(payload.from).toBe("Credex <notifications@example.com>");
    expect(payload.to).toEqual(["lead@example.com"]);
    expect(payload.subject).toBe("Your AI Spend Audit summary");
    expect(options.idempotencyKey).toBe(`lead-confirmation/${leadId}`);
    expect(payload.tags).toEqual([
      { name: "event", value: "lead_confirmation" },
      { name: "lead_id", value: leadId },
    ]);
    expect(String(payload.html)).toContain("Acme &amp; Sons");
    expect(String(payload.html)).toContain("https://app.example.com/audit/ABC123");
    expect(String(payload.text)).toContain("Current Monthly Spend: $1,240");
    expect(String(payload.text)).toContain("Potential Monthly Savings: $420");
    expect(String(payload.text)).toContain("View your full report here:");
    expect(String(payload.text)).toContain("https://app.example.com/audit/ABC123");
  });

  it("includes PDF attachment in Resend payload when provided", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.RESEND_FROM = "Credex <notifications@example.com>";
    sendMock.mockResolvedValue({
      data: { id: "msg_pdf" },
      error: null,
      headers: null,
    });

    const { sendLeadConfirmationEmail } = await import("./resend-email.service");
    const pdf = Buffer.from(
      "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF",
      "utf8"
    );
    await sendLeadConfirmationEmail({
      leadId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      to: "lead@example.com",
      siteHomeUrl: "https://example.com",
      audit: null,
      pdfAttachment: { filename: "ai-spend-audit-test.pdf", content: pdf },
    });

    const [payload] = sendMock.mock.calls[0] as [Record<string, unknown>, unknown];
    const attachments = payload.attachments as {
      filename: string;
      content: Buffer;
      contentType?: string;
    }[];
    expect(attachments).toHaveLength(1);
    expect(attachments[0].filename).toBe("ai-spend-audit-test.pdf");
    expect(attachments[0].contentType).toBe("application/pdf");
    expect(attachments[0].content.equals(pdf)).toBe(true);
  });

  it("uses SDK error message when Resend returns error", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.RESEND_FROM = "Credex <notifications@example.com>";
    sendMock.mockResolvedValue({
      data: null,
      error: { message: "Invalid from address", statusCode: 422, name: "validation_error" },
      headers: null,
    });

    const { sendLeadConfirmationEmail } = await import("./resend-email.service");
    const r = await sendLeadConfirmationEmail({
      leadId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      to: "lead@example.com",
      siteHomeUrl: "https://example.com",
      audit: null,
    });

    expect(r.sent).toBe(false);
    expect(r.skippedReason).toBe("Invalid from address");
  });

  it("returns network_error when send throws", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.RESEND_FROM = "Credex <notifications@example.com>";
    sendMock.mockRejectedValue(new Error("ECONNRESET"));

    const { sendLeadConfirmationEmail } = await import("./resend-email.service");
    const r = await sendLeadConfirmationEmail({
      leadId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      to: "lead@example.com",
      siteHomeUrl: "https://example.com",
      audit: null,
    });

    expect(r).toEqual({ sent: false, skippedReason: "network_error" });
  });

  it("formatUsdWhole rounds to whole dollars with grouping", async () => {
    const { formatUsdWhole } = await import("./resend-email.service");
    expect(formatUsdWhole(1234.4)).toBe("$1,234");
    expect(formatUsdWhole(5040)).toBe("$5,040");
  });
});
