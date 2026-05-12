import { desc, eq } from "drizzle-orm";

import { db } from "../db/index";
import {
  auditsTable,
  leadsTable,
  recommendationsTable,
} from "../db/schema";
import { CreateLeadInput } from "../validation/lead.validation";
import { parseLegacyPayload } from "./recommendation.service";
import { sendLeadConfirmationEmail } from "./resend-email.service";

function recommendationBulletFromRow(row: {
  title: string | null;
  description: string | null;
}): string {
  const parsed = parseLegacyPayload(row.description);
  if (parsed?.recommendedAction) {
    const label = parsed.tool.replace(/_/g, " ");
    return `${label}: ${parsed.recommendedAction}`;
  }
  return row.title?.trim() || "";
}

export class LeadService {
  async createLead(input: CreateLeadInput): Promise<{ success: boolean }> {
    let isHighSavingsLead = false;
    let auditShareId: string | null = null;
    let auditForEmail: {
      currentMonthlySpend: number;
      potentialMonthlySavings: number;
      estimatedAnnualSavings: number;
      bullets: string[];
    } | null = null;

    if (input.auditId) {
      const [audit] = await db
        .select({
          annualSavings: auditsTable.annualSavings,
          shareId: auditsTable.shareId,
          totalMonthlySpend: auditsTable.totalMonthlySpend,
          monthlySavings: auditsTable.monthlySavings,
        })
        .from(auditsTable)
        .where(eq(auditsTable.id, input.auditId))
        .limit(1);

      if (audit) {
        const annualSavings = Number(audit.annualSavings);
        isHighSavingsLead = annualSavings > 6000;
        auditShareId = audit.shareId;

        const recRows = await db
          .select({
            title: recommendationsTable.title,
            description: recommendationsTable.description,
            estimatedSavings: recommendationsTable.estimatedSavings,
          })
          .from(recommendationsTable)
          .where(eq(recommendationsTable.auditId, input.auditId))
          .orderBy(desc(recommendationsTable.estimatedSavings))
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

    const [inserted] = await db
      .insert(leadsTable)
      .values({
        auditId: input.auditId || null,
        email: input.email,
        companyName: input.companyName || null,
        role: input.role || null,
        teamSize: input.teamSize ?? null,
      })
      .returning({ id: leadsTable.id });

    const leadId = inserted?.id;
    if (leadId) {
      const base = (process.env.FRONTEND_URL || "http://localhost:5173").replace(
        /\/+$/,
        ""
      );
      const reportUrl = auditShareId
        ? `${base}/audit/${encodeURIComponent(auditShareId)}`
        : null;

      let pdfAttachment: { filename: string; content: Buffer } | undefined;
      const rawPdf = input.auditPdfBase64?.trim();
      if (rawPdf) {
        try {
          const buf = Buffer.from(rawPdf, "base64");
          if (
            buf.length >= 5 &&
            buf.subarray(0, 4).toString("ascii") === "%PDF"
          ) {
            const filename =
              input.auditPdfFilename?.trim() ||
              (auditShareId
                ? `ai-spend-audit-${auditShareId.slice(0, 8)}.pdf`
                : "credex-ai-spend-audit.pdf");
            pdfAttachment = { filename, content: buf };
          }
        } catch {
          pdfAttachment = undefined;
        }
      }

      const outcome = await sendLeadConfirmationEmail({
        leadId,
        to: input.email,
        companyName: input.companyName,
        reportUrl,
        siteHomeUrl: base,
        audit: auditForEmail,
        pdfAttachment,
      });
      if (!outcome.sent && outcome.skippedReason) {
        console.warn(
          `[LeadService] confirmation email not sent: ${outcome.skippedReason}`
        );
      }
    }

    if (isHighSavingsLead) {
      await this.tagHighSavingsLead(input.email, input.auditId);
    }

    return { success: true };
  }

  private async tagHighSavingsLead(email: string, auditId?: string): Promise<void> {
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
