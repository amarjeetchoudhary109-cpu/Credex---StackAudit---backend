"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const index_1 = require("../db/index");
const schema_1 = require("../db/schema");
const recommendation_service_1 = require("./recommendation.service");
const resend_email_service_1 = require("./resend-email.service");
function recommendationBulletFromRow(row) {
    const parsed = (0, recommendation_service_1.parseLegacyPayload)(row.description);
    if (parsed?.recommendedAction) {
        const label = parsed.tool.replace(/_/g, " ");
        return `${label}: ${parsed.recommendedAction}`;
    }
    return row.title?.trim() || "";
}
class LeadService {
    async createLead(input) {
        let isHighSavingsLead = false;
        let auditShareId = null;
        let auditForEmail = null;
        if (input.auditId) {
            const [audit] = await index_1.db
                .select({
                annualSavings: schema_1.auditsTable.annualSavings,
                shareId: schema_1.auditsTable.shareId,
                totalMonthlySpend: schema_1.auditsTable.totalMonthlySpend,
                monthlySavings: schema_1.auditsTable.monthlySavings,
            })
                .from(schema_1.auditsTable)
                .where((0, drizzle_orm_1.eq)(schema_1.auditsTable.id, input.auditId))
                .limit(1);
            if (audit) {
                const annualSavings = Number(audit.annualSavings);
                isHighSavingsLead = annualSavings > 6000;
                auditShareId = audit.shareId;
                const recRows = await index_1.db
                    .select({
                    title: schema_1.recommendationsTable.title,
                    description: schema_1.recommendationsTable.description,
                    estimatedSavings: schema_1.recommendationsTable.estimatedSavings,
                })
                    .from(schema_1.recommendationsTable)
                    .where((0, drizzle_orm_1.eq)(schema_1.recommendationsTable.auditId, input.auditId))
                    .orderBy((0, drizzle_orm_1.desc)(schema_1.recommendationsTable.estimatedSavings))
                    .limit(6);
                const bullets = recRows
                    .map(recommendationBulletFromRow)
                    .filter(Boolean)
                    .slice(0, 5);
                auditForEmail = {
                    currentMonthlySpend: Number(audit.totalMonthlySpend),
                    potentialMonthlySavings: Number(audit.monthlySavings),
                    estimatedAnnualSavings: Number(audit.annualSavings),
                    bullets,
                };
            }
        }
        const [inserted] = await index_1.db
            .insert(schema_1.leadsTable)
            .values({
            auditId: input.auditId || null,
            email: input.email,
            companyName: input.companyName || null,
            role: input.role || null,
            teamSize: input.teamSize ?? null,
        })
            .returning({ id: schema_1.leadsTable.id });
        const leadId = inserted?.id;
        if (leadId) {
            const base = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
            const reportUrl = auditShareId
                ? `${base}/audit/${encodeURIComponent(auditShareId)}`
                : null;
            let pdfAttachment;
            const rawPdf = input.auditPdfBase64?.trim();
            if (rawPdf) {
                try {
                    const buf = Buffer.from(rawPdf, "base64");
                    if (buf.length >= 5 &&
                        buf.subarray(0, 4).toString("ascii") === "%PDF") {
                        const filename = input.auditPdfFilename?.trim() ||
                            (auditShareId
                                ? `ai-spend-audit-${auditShareId.slice(0, 8)}.pdf`
                                : "credex-ai-spend-audit.pdf");
                        pdfAttachment = { filename, content: buf };
                    }
                }
                catch {
                    pdfAttachment = undefined;
                }
            }
            const outcome = await (0, resend_email_service_1.sendLeadConfirmationEmail)({
                leadId,
                to: input.email,
                companyName: input.companyName,
                reportUrl,
                siteHomeUrl: base,
                audit: auditForEmail,
                pdfAttachment,
            });
            if (!outcome.sent && outcome.skippedReason) {
                console.warn(`[LeadService] confirmation email not sent: ${outcome.skippedReason}`);
            }
        }
        if (isHighSavingsLead) {
            await this.tagHighSavingsLead(input.email, input.auditId);
        }
        return { success: true };
    }
    async tagHighSavingsLead(email, auditId) {
        // TODO: Integrate with CRM (HubSpot, Salesforce, etc.)
        console.log(`Tagging high-savings lead: ${email}`, { auditId });
        // In production, this would integrate with your CRM:
        // await hubspot.contacts.create({
        //   email,
        //   properties: {
        //     lead_source: 'ai_audit',
        //     lead_quality: 'high_savings',
        //     audit_id: auditId
        //   }
        // });
    }
    async getLeadStats() {
        // TODO: Implement analytics for leads
        return {
            totalLeads: 0,
            highSavingsLeads: 0,
            conversionRate: 0,
        };
    }
}
exports.LeadService = LeadService;
//# sourceMappingURL=lead.service.js.map