import { z } from "zod";

const MAX_PDF_BYTES = 5 * 1024 * 1024;

export const createLeadSchema = z
  .object({
    auditId: z.string().uuid().optional(),
    email: z.string().email(),
    companyName: z.string().min(1).max(255).optional(),
    role: z.string().min(1).max(120).optional(),
    teamSize: z.number().int().min(1).max(1000).optional(),
    /** Honeypot — must stay empty (bots fill hidden fields). */
    companyWebsite: z.string().max(200).optional(),
    /** Base64-encoded PDF (same generator as the in-app download). */
    auditPdfBase64: z.string().optional(),
    /** Original filename from the client, e.g. ai-spend-audit-abc12.pdf */
    auditPdfFilename: z
      .string()
      .min(1)
      .max(120)
      .regex(/^[\w.-]+\.pdf$/i)
      .optional(),
  })
  .refine((d) => !d.companyWebsite?.trim(), {
    message: "Invalid submission",
    path: ["companyWebsite"],
  })
  .refine((d) => !d.auditPdfFilename?.trim() || Boolean(d.auditPdfBase64?.trim()), {
    message: "auditPdfFilename requires auditPdfBase64",
    path: ["auditPdfFilename"],
  })
  .superRefine((d, ctx) => {
    const raw = d.auditPdfBase64?.trim();
    if (!raw) {
      return;
    }
    let buf: Buffer;
    try {
      buf = Buffer.from(raw, "base64");
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid PDF encoding",
        path: ["auditPdfBase64"],
      });
      return;
    }
    if (buf.length < 5 || buf.subarray(0, 4).toString("ascii") !== "%PDF") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Attachment must be a PDF",
        path: ["auditPdfBase64"],
      });
      return;
    }
    if (buf.length > MAX_PDF_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `PDF must be at most ${MAX_PDF_BYTES} bytes`,
        path: ["auditPdfBase64"],
      });
    }
  });

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
