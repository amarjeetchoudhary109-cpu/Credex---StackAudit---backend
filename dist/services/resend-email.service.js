"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatUsdWhole = formatUsdWhole;
exports.sendLeadConfirmationEmail = sendLeadConfirmationEmail;
const resend_1 = require("resend");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let client = null;
function getResend() {
    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) {
        return null;
    }
    if (!client) {
        client = new resend_1.Resend(key);
    }
    return client;
}
function escapeHtml(s) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
/** Resend test sender — OK for local/dev only; production must set RESEND_FROM. */
const RESEND_DEV_FROM = "Credex <onboarding@resend.dev>";
function resolveResendFrom() {
    const explicit = process.env.RESEND_FROM?.trim();
    if (explicit) {
        return explicit;
    }
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv !== "production" && nodeEnv !== "test") {
        return RESEND_DEV_FROM;
    }
    return null;
}
function formatUsdWhole(n) {
    const x = Math.round(Number.isFinite(n) ? n : 0);
    return `$${x.toLocaleString("en-US")}`;
}
const DEFAULT_RECOMMENDATION_BULLETS = [
    "Downgrade oversized team plans",
    "Reduce duplicate AI subscriptions",
    "Consolidate API usage where possible",
    "Explore discounted infrastructure credits through Credex",
];
function greetingLine(companyName) {
    const c = companyName?.trim();
    if (c) {
        return `Hi ${c},`;
    }
    return "Hi,";
}
function greetingHtml(companyName) {
    const c = companyName?.trim();
    if (c) {
        return `Hi ${escapeHtml(c)},`;
    }
    return "Hi,";
}
function buildBodies(params) {
    const hi = greetingLine(params.companyName);
    const pdfLineHtml = params.pdfAttachment
        ? `<p style="font-size:14px;color:#64748b">A detailed PDF copy of this audit is attached (<code>${escapeHtml(params.pdfAttachment.filename)}</code>).</p>`
        : "";
    if (!params.audit) {
        const home = params.siteHomeUrl.replace(/\/+$/, "");
        const text = [
            hi,
            "",
            "Thanks for using our AI Spend Audit tool.",
            "",
            "We saved your interest and will follow up when helpful.",
            "",
            `Run a free stack audit anytime: ${home}/audit`,
            "",
            ...(params.pdfAttachment
                ? ["A detailed PDF copy of this audit is attached to this email.", ""]
                : []),
            "Thanks,",
            "The Credex Audit Team",
        ].join("\n");
        const html = `<!doctype html>
<html>
<body style="font-family:system-ui,Segoe UI,sans-serif;line-height:1.55;color:#0f172a;max-width:42rem">
  <p>${greetingHtml(params.companyName)}</p>
  <p>Thanks for using our AI Spend Audit tool.</p>
  <p>We saved your interest and will follow up when helpful.</p>
  <p><a href="${escapeHtml(`${home}/audit`)}">Run a free stack audit</a></p>
  ${pdfLineHtml}
  <p>Thanks,<br/>The Credex Audit Team</p>
</body>
</html>`;
        return { html, text };
    }
    const a = params.audit;
    const bullets = a.bullets.length > 0 ? a.bullets : DEFAULT_RECOMMENDATION_BULLETS;
    const spend = formatUsdWhole(a.currentMonthlySpend);
    const monthlySave = formatUsdWhole(a.potentialMonthlySavings);
    const annualSave = formatUsdWhole(a.estimatedAnnualSavings);
    const reportBlock = params.reportUrl
        ? [
            "View your full report here:",
            "",
            params.reportUrl,
            "",
        ]
        : [];
    const text = [
        hi,
        "",
        "Thanks for using our AI Spend Audit tool.",
        "",
        "We analyzed your current AI tooling stack and identified potential opportunities to reduce monthly spend while maintaining similar workflow capabilities.",
        "",
        "## Your Audit Summary",
        "",
        `* Current Monthly Spend: ${spend}`,
        `* Potential Monthly Savings: ${monthlySave}`,
        `* Estimated Annual Savings: ${annualSave}`,
        "",
        "### Key Recommendations",
        "",
        ...bullets.map((b) => `* ${b}`),
        "",
        ...reportBlock,
        "If your projected savings are significant, the Credex team may reach out with additional optimization opportunities tailored to your stack.",
        "",
        ...(params.pdfAttachment
            ? ["A detailed PDF copy of this audit is attached to this email.", ""]
            : []),
        "Thanks,",
        "The Credex Audit Team",
    ].join("\n");
    const bulletsHtml = bullets
        .map((b) => `<li>${escapeHtml(b)}</li>`)
        .join("");
    const reportHtml = params.reportUrl
        ? `<p><a href="${escapeHtml(params.reportUrl)}">View your full report</a></p>`
        : "";
    const html = `<!doctype html>
<html>
<body style="font-family:system-ui,Segoe UI,sans-serif;line-height:1.55;color:#0f172a;max-width:42rem">
  <p>${greetingHtml(params.companyName)}</p>
  <p>Thanks for using our AI Spend Audit tool.</p>
  <p>We analyzed your current AI tooling stack and identified potential opportunities to reduce monthly spend while maintaining similar workflow capabilities.</p>
  <h2 style="font-size:1.1rem;margin:1.25rem 0 0.5rem">Your Audit Summary</h2>
  <ul style="margin:0 0 0.75rem;padding-left:1.25rem">
    <li>Current Monthly Spend: ${escapeHtml(spend)}</li>
    <li>Potential Monthly Savings: ${escapeHtml(monthlySave)}</li>
    <li>Estimated Annual Savings: ${escapeHtml(annualSave)}</li>
  </ul>
  <h3 style="font-size:1rem;margin:1rem 0 0.35rem">Key Recommendations</h3>
  <ul style="margin:0 0 1rem;padding-left:1.25rem">${bulletsHtml}</ul>
  ${reportHtml}
  ${pdfLineHtml}
  <p>If your projected savings are significant, the Credex team may reach out with additional optimization opportunities tailored to your stack.</p>
  <p>Thanks,<br/>The Credex Audit Team</p>
</body>
</html>`;
    return { html, text };
}
/**
 * Sends a post-lead confirmation using the official Resend Node SDK.
 * Uses `{ data, error }` — does not treat SDK errors as thrown exceptions.
 */
async function sendLeadConfirmationEmail(params) {
    const resend = getResend();
    if (!resend) {
        return { sent: false, skippedReason: "RESEND_API_KEY not set" };
    }
    const from = resolveResendFrom();
    if (!from) {
        return { sent: false, skippedReason: "RESEND_FROM not set" };
    }
    const { html, text } = buildBodies(params);
    const idempotencyKey = `lead-confirmation/${params.leadId}`.slice(0, 256);
    try {
        const { data, error } = await resend.emails.send({
            from,
            to: [params.to],
            subject: "Your AI Spend Audit summary",
            html,
            text,
            tags: [
                { name: "event", value: "lead_confirmation" },
                { name: "lead_id", value: params.leadId },
            ],
            attachments: params.pdfAttachment
                ? [
                    {
                        filename: params.pdfAttachment.filename,
                        content: params.pdfAttachment.content,
                        contentType: "application/pdf",
                    },
                ]
                : undefined,
        }, { idempotencyKey });
        if (error) {
            console.error("[Resend] lead confirmation failed:", error);
            return { sent: false, skippedReason: error.message };
        }
        return { sent: true, messageId: data?.id };
    }
    catch (err) {
        console.error("[Resend] network or unexpected error:", err);
        return { sent: false, skippedReason: "network_error" };
    }
}
//# sourceMappingURL=resend-email.service.js.map