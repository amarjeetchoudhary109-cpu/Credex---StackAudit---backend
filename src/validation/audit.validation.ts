import { z } from "zod";
import { supportedToolSchema, useCaseSchema } from "./enums.validation";

export const toolInputSchema = z.object({
  tool: supportedToolSchema,
  plan: z.string().min(1),
  monthlySpend: z.number().min(0),
  seats: z.number().int().min(1),
});

export const createAuditSchema = z.object({
  teamSize: z.number().int().min(1).max(1000),
  primaryUseCase: useCaseSchema,
  tools: z.array(toolInputSchema).min(1).max(10),
  organizationId: z.string().uuid().optional(),
});

export type CreateAuditInput = z.infer<typeof createAuditSchema>;
export type ToolInput = z.infer<typeof toolInputSchema>;
export type SupportedTool = z.infer<typeof supportedToolSchema>;
export type UseCase = z.infer<typeof useCaseSchema>;

// Re-export the schemas for convenience
export { supportedToolSchema, useCaseSchema };
