import type { Request, Response } from "express";

import asyncHandler from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { AuditService } from "../services/audit.service";
import { AiAuditSummaryService } from "../services/ai-audit-summary.service";
import type { CreateAuditInput } from "../validation/audit.validation";

const auditService = new AuditService();
const aiAuditSummaryService = new AiAuditSummaryService();

export const createAudit = asyncHandler(async (req: Request, res: Response) => {
  const input: CreateAuditInput = req.body;
  const result = await auditService.createAudit(input, null);

  res.status(201).json(new ApiResponse(201, result, "Audit created successfully"));
});

export const getAuditByShareId = asyncHandler(async (req: Request, res: Response) => {
  const shareId = req.params["shareId"] as string;

  if (!shareId) {
    throw new ApiError(400, "Share ID is required");
  }

  const audit = await auditService.getAuditByShareId(shareId);

  res.json(new ApiResponse(200, audit, "Audit retrieved successfully"));
});

export const getBenchmarks = asyncHandler(async (_req: Request, res: Response) => {
  const benchmarkData = {
    averageSpendPerDeveloper: 220,
    industryMedian: 190,
    topQuartile: 150,
    bottomQuartile: 280,
    sampleSize: 1247,
  };

  res.json(new ApiResponse(200, benchmarkData, "Benchmark data retrieved successfully"));
});

export const postAiSummaryByShareId = asyncHandler(
  async (req: Request, res: Response) => {
    const shareId = req.params["shareId"] as string;
    if (!shareId) {
      throw new ApiError(400, "Share ID is required");
    }
    const text = await aiAuditSummaryService.generateAndPersistByShareId(shareId);
    res.json(new ApiResponse(200, { aiSummary: text }, "Summary ready"));
  }
);

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const getShareOgSvg = asyncHandler(async (req: Request, res: Response) => {
  const shareId = req.params["shareId"] as string;
  const audit = await auditService.getAuditByShareId(shareId);
  const annual = Math.round(audit.annualSavings);
  const monthly = Math.round(audit.monthlySavings);
  const title = `This startup could save $${annual.toLocaleString("en-US")}/year on AI tools`;
  const sub = `~$${monthly.toLocaleString("en-US")}/mo modeled · Credex stack audit`;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f1419"/>
      <stop offset="100%" stop-color="#0b0f14"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="48" y="48" width="1104" height="6" fill="#38bdf8" opacity="0.85" rx="2"/>
  <text x="60" y="140" fill="#f1f5f9" font-size="44" font-family="system-ui,Segoe UI,sans-serif" font-weight="650">${escapeXml(title)}</text>
  <text x="60" y="210" fill="#94a3b8" font-size="26" font-family="system-ui,Segoe UI,sans-serif">${escapeXml(sub)}</text>
  <text x="60" y="520" fill="#64748b" font-size="22" font-family="system-ui,Segoe UI,sans-serif">Share ${escapeXml(shareId)} · Public audit link</text>
  <text x="60" y="560" fill="#475569" font-size="18" font-family="system-ui,Segoe UI,sans-serif">credex · AI spend audit</text>
</svg>`;
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.send(svg);
});

export const getShareOpenGraphHtml = asyncHandler(
  async (req: Request, res: Response) => {
    const shareId = req.params["shareId"] as string;
    const audit = await auditService.getAuditByShareId(shareId);
    const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
    const proto = req.protocol;
    const host = req.get("host") || "localhost:3000";
    const base = `${proto}://${host}`;
    const image = `${base}/api/v1/audits/share/${encodeURIComponent(shareId)}/og.svg`;
    const url = `${frontend}/audit/${encodeURIComponent(shareId)}`;
    const desc = `This startup could save $${Math.round(audit.annualSavings).toLocaleString("en-US")}/year on AI tools.`;
    const ogTitle = `Save ~$${Math.round(audit.annualSavings).toLocaleString("en-US")}/year on AI tools — Credex audit`;
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${escapeXml(ogTitle)}</title>
<meta name="description" content="${escapeXml(desc)}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${escapeXml(ogTitle)}" />
<meta property="og:description" content="${escapeXml(desc)}" />
<meta property="og:url" content="${escapeXml(url)}" />
<meta property="og:image" content="${escapeXml(image)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeXml(ogTitle)}" />
<meta name="twitter:description" content="${escapeXml(desc)}" />
<meta name="twitter:image" content="${escapeXml(image)}" />
<meta http-equiv="refresh" content="0;url=${escapeXml(url)}" />
</head>
<body style="font-family:system-ui;padding:2rem;background:#0b0f14;color:#e2e8f0">
<p>${escapeXml(desc)}</p>
<p><a href="${escapeXml(url)}" style="color:#38bdf8">Open audit</a></p>
</body>
</html>`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  }
);
