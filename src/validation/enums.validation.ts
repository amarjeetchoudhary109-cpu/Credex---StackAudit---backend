import { z } from "zod";

export const useCaseValues = [
  "coding",
  "writing",
  "data",
  "research",
  "mixed",
] as const;

export const supportedToolValues = [
  "cursor",
  "github_copilot",
  "claude",
  "chatgpt",
  "anthropic_api",
  "openai_api",
  "gemini",
  "windsurf",
] as const;

export const useCaseSchema = z.enum(useCaseValues);
export const supportedToolSchema = z.enum(supportedToolValues);
