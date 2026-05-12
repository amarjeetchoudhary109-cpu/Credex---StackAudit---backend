"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportedToolSchema = exports.useCaseSchema = exports.supportedToolValues = exports.useCaseValues = void 0;
const zod_1 = require("zod");
exports.useCaseValues = [
    "coding",
    "writing",
    "data",
    "research",
    "mixed",
];
exports.supportedToolValues = [
    "cursor",
    "github_copilot",
    "claude",
    "chatgpt",
    "anthropic_api",
    "openai_api",
    "gemini",
    "windsurf",
];
exports.useCaseSchema = zod_1.z.enum(exports.useCaseValues);
exports.supportedToolSchema = zod_1.z.enum(exports.supportedToolValues);
//# sourceMappingURL=enums.validation.js.map