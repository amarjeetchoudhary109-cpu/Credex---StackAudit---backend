"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingService = exports.TOOL_PRICING = void 0;
exports.TOOL_PRICING = {
    cursor: {
        name: "cursor",
        displayName: "Cursor",
        category: "editor",
        plans: [
            { name: "Free", pricePerSeat: 0, features: ["Limited AI requests"] },
            { name: "Pro", pricePerSeat: 20, features: ["Unlimited AI", "Advanced features"] },
            { name: "Business", pricePerSeat: 40, features: ["Team features", "Admin controls"] },
        ],
    },
    github_copilot: {
        name: "github_copilot",
        displayName: "GitHub Copilot",
        category: "editor",
        plans: [
            { name: "Individual", pricePerSeat: 10, features: ["Code suggestions"] },
            { name: "Business", pricePerSeat: 19, features: ["Team features"] },
            { name: "Enterprise", pricePerSeat: 39, features: ["Advanced security"] },
        ],
    },
    claude: {
        name: "claude",
        displayName: "Claude",
        category: "chat",
        plans: [
            { name: "Free", pricePerSeat: 0, features: ["Limited messages"] },
            { name: "Pro", pricePerSeat: 20, features: ["5x more usage"] },
            { name: "Team", pricePerSeat: 30, features: ["Team workspace"] },
        ],
    },
    chatgpt: {
        name: "chatgpt",
        displayName: "ChatGPT",
        category: "chat",
        plans: [
            { name: "Free", pricePerSeat: 0, features: ["GPT-3.5"] },
            { name: "Plus", pricePerSeat: 20, features: ["GPT-4", "DALL-E"] },
            { name: "Team", pricePerSeat: 30, features: ["Team workspace"] },
        ],
    },
    anthropic_api: {
        name: "anthropic_api",
        displayName: "Anthropic API",
        category: "api",
        plans: [
            { name: "Pay-as-you-go", pricePerSeat: 0, features: ["Usage-based pricing"] },
        ],
    },
    openai_api: {
        name: "openai_api",
        displayName: "OpenAI API",
        category: "api",
        plans: [
            { name: "Pay-as-you-go", pricePerSeat: 0, features: ["Usage-based pricing"] },
        ],
    },
    gemini: {
        name: "gemini",
        displayName: "Gemini",
        category: "chat",
        plans: [
            { name: "Free", pricePerSeat: 0, features: ["Limited requests"] },
            { name: "Advanced", pricePerSeat: 20, features: ["Unlimited access"] },
        ],
    },
    windsurf: {
        name: "windsurf",
        displayName: "Windsurf",
        category: "editor",
        plans: [
            { name: "Free", pricePerSeat: 0, features: ["Basic features"] },
            { name: "Pro", pricePerSeat: 15, features: ["Unlimited AI"] },
        ],
    },
};
class PricingService {
    getPlanPrice(tool, planName) {
        const toolConfig = exports.TOOL_PRICING[tool];
        const plan = toolConfig.plans.find(p => p.name === planName);
        return plan?.pricePerSeat || 0;
    }
    calculateMonthlySpend(tool, planName, seats) {
        return this.getPlanPrice(tool, planName) * seats;
    }
    getToolConfig(tool) {
        return exports.TOOL_PRICING[tool];
    }
    getAllPlans(tool) {
        return exports.TOOL_PRICING[tool].plans;
    }
}
exports.PricingService = PricingService;
//# sourceMappingURL=pricing.service.js.map