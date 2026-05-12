import { UseCase } from "../validation/audit.validation";
import { Recommendation } from "./recommendation.service";

export interface SummaryData {
  overallAssessment: {
    level: "High" | "Moderate" | "Low";
    monthlySavings: number;
    savingsPercentage: number;
    efficiencyScore: number;
    description: string;
  };
  biggestOpportunity?: {
    tool: string;
    action: string;
    reason: string;
    monthlySavings: number;
  };
  useCaseInsight: string;
  teamSizeInsight: string;
  nextSteps: string[];
  enterpriseConsultation?: {
    recommended: boolean;
    annualSavings: number;
  };
}

export class SummaryService {
  generateSummary(
    recommendations: Recommendation[],
    totalSavings: number,
    teamSize: number,
    useCase: UseCase,
    efficiencyScore: number
  ): string {
    /** Plain ASCII text only (no emoji / markdown) so PDFs and legacy clients render cleanly. */
    const biggestWaste = this.findBiggestWaste(recommendations);
    const totalCurrentSpend = recommendations.reduce(
      (sum, r) => sum + r.currentMonthlySpend,
      0
    );
    const savingsPercentage =
      totalCurrentSpend > 0
        ? Math.round((totalSavings / totalCurrentSpend) * 100)
        : 0;

    let summary = "AI Spend Analysis Summary\n\n";

    summary += "Overall assessment\n";
    if (totalSavings > 500) {
      summary += `High savings opportunity: about $${totalSavings.toLocaleString("en-US")}/month (${savingsPercentage}%) may be recoverable by optimizing your AI tool stack.\n\n`;
    } else if (totalSavings > 100) {
      summary += `Moderate savings: about $${totalSavings.toLocaleString("en-US")}/month (${savingsPercentage}%) with plan and seat adjustments.\n\n`;
    } else {
      summary += `Well optimized: modeled waste is about $${totalSavings.toLocaleString("en-US")}/month.\n\n`;
    }

    summary += `Efficiency score: ${efficiencyScore}/100. `;
    if (efficiencyScore >= 80) {
      summary += "That suggests strong alignment between spend and team size.\n\n";
    } else if (efficiencyScore >= 60) {
      summary += "There is still room to tighten plans and seats.\n\n";
    } else {
      summary += "There is material headroom to reduce overlap and tier creep.\n\n";
    }

    if (biggestWaste && biggestWaste.monthlySavings > 50) {
      summary += "Biggest opportunity\n";
      summary += `${biggestWaste.recommendedAction} for ${biggestWaste.tool.toUpperCase()}: ${biggestWaste.reason} `;
      summary += `Roughly $${biggestWaste.monthlySavings}/month in this line item alone.\n\n`;
    }

    summary += this.getUseCaseAdvice(useCase, recommendations);
    summary += this.getTeamSizeAdvice(teamSize, recommendations);

    summary += "Recommended next steps\n";
    summary +=
      "1. Implement the highest-impact line items above.\n";
    summary +=
      "2. Reconcile seats to headcount on the next billing cycle.\n";
    summary +=
      "3. Re-run this audit after any contract change.\n\n";

    if (totalSavings > 3000) {
      summary += `At roughly $${(totalSavings * 12).toLocaleString("en-US")}/year in modeled savings, a short vendor strategy review may be worthwhile.\n`;
    }

    return summary.trimEnd();
  }

  generateStructuredSummary(
    recommendations: Recommendation[],
    totalSavings: number,
    teamSize: number,
    useCase: UseCase,
    efficiencyScore: number
  ): SummaryData {
    const biggestWaste = this.findBiggestWaste(recommendations);
    const totalCurrentSpend = recommendations.reduce((sum, r) => sum + r.currentMonthlySpend, 0);
    const savingsPercentage = Math.round((totalSavings / totalCurrentSpend) * 100);
    
    // Determine savings level
    let level: "High" | "Moderate" | "Low";
    let description: string;
    
    if (totalSavings > 500) {
      level = "High";
      description = `Your team could save $${totalSavings.toLocaleString()}/month (${savingsPercentage}%) by optimizing your AI tool stack.`;
    } else if (totalSavings > 100) {
      level = "Moderate";
      description = `There's potential to save $${totalSavings.toLocaleString()}/month (${savingsPercentage}%) with some adjustments.`;
    } else {
      level = "Low";
      description = `Your AI spend is already quite efficient with only $${totalSavings.toLocaleString()}/month in potential savings.`;
    }

    const summaryData: SummaryData = {
      overallAssessment: {
        level,
        monthlySavings: totalSavings,
        savingsPercentage,
        efficiencyScore,
        description
      },
      useCaseInsight: this.getUseCaseAdviceText(useCase, recommendations),
      teamSizeInsight: this.getTeamSizeAdviceText(teamSize),
      nextSteps: [
        "Implement the highest-impact recommendations above",
        "Review usage patterns monthly to ensure optimal plans",
        "Consider consolidating tools to reduce complexity and costs"
      ]
    };

    // Add biggest opportunity if significant
    if (biggestWaste && biggestWaste.monthlySavings > 50) {
      summaryData.biggestOpportunity = {
        tool: biggestWaste.tool,
        action: biggestWaste.recommendedAction,
        reason: biggestWaste.reason,
        monthlySavings: biggestWaste.monthlySavings
      };
    }

    // Add enterprise consultation if high savings
    if (totalSavings * 12 > 6000) {
      summaryData.enterpriseConsultation = {
        recommended: true,
        annualSavings: totalSavings * 12
      };
    }

    return summaryData;
  }

  private findBiggestWaste(recommendations: Recommendation[]): Recommendation | null {
    return recommendations.reduce((biggest, current) => {
      if (!biggest || current.monthlySavings > biggest.monthlySavings) {
        return current;
      }
      return biggest;
    }, null as Recommendation | null);
  }

  private getUseCaseAdvice(useCase: UseCase, recommendations: Recommendation[]): string {
    const hasEditor = recommendations.some(r => ["cursor", "github_copilot", "windsurf"].includes(r.tool));
    const hasChat = recommendations.some(r => ["claude", "chatgpt", "gemini"].includes(r.tool));
    
    let advice = `${useCase.charAt(0).toUpperCase() + useCase.slice(1)} team insights\n`;
    
    switch (useCase) {
      case "coding":
        if (!hasEditor) {
          advice += `Consider adding a dedicated AI coding assistant like Cursor or GitHub Copilot for maximum productivity.\n\n`;
        } else if (hasChat && hasEditor) {
          advice += `You have both coding and chat tools - consider if you need both or if one could handle most tasks.\n\n`;
        } else {
          advice += `Good tool selection for coding teams. Focus on optimizing seat counts and plans.\n\n`;
        }
        break;
      
      case "writing":
        advice += `For writing teams, Claude often provides better value than ChatGPT for content creation tasks.\n\n`;
        break;
      
      case "data":
        advice += `Data teams benefit from API access for custom integrations. Consider API plans over chat interfaces for heavy usage.\n\n`;
        break;
      
      case "research":
        advice += `Research teams can often use free tiers effectively. Upgrade only when hitting usage limits.\n\n`;
        break;
      
      case "mixed":
        advice += `Mixed-use teams should prioritize versatile tools that handle multiple use cases well.\n\n`;
        break;
    }
    
    return advice;
  }

  private getUseCaseAdviceText(useCase: UseCase, recommendations: Recommendation[]): string {
    const hasEditor = recommendations.some(r => ["cursor", "github_copilot", "windsurf"].includes(r.tool));
    const hasChat = recommendations.some(r => ["claude", "chatgpt", "gemini"].includes(r.tool));
    
    switch (useCase) {
      case "coding":
        if (!hasEditor) {
          return "Consider adding a dedicated AI coding assistant like Cursor or GitHub Copilot for maximum productivity.";
        } else if (hasChat && hasEditor) {
          return "You have both coding and chat tools - consider if you need both or if one could handle most tasks.";
        } else {
          return "Good tool selection for coding teams. Focus on optimizing seat counts and plans.";
        }
      
      case "writing":
        return "For writing teams, Claude often provides better value than ChatGPT for content creation tasks.";
      
      case "data":
        return "Data teams benefit from API access for custom integrations. Consider API plans over chat interfaces for heavy usage.";
      
      case "research":
        return "Research teams can often use free tiers effectively. Upgrade only when hitting usage limits.";
      
      case "mixed":
        return "Mixed-use teams should prioritize versatile tools that handle multiple use cases well.";
      
      default:
        return "Consider consolidating tools to reduce complexity and management overhead.";
    }
  }

  private getTeamSizeAdviceText(teamSize: number): string {
    if (teamSize <= 3) {
      return `Small teams (${teamSize} people) should focus on individual plans rather than team plans for most tools.`;
    } else if (teamSize <= 10) {
      return `Medium teams (${teamSize} people) can benefit from team plans but should watch for over-provisioning seats.`;
    } else {
      return `Larger teams (${teamSize} people) should negotiate enterprise pricing and consider bulk discounts.`;
    }
  }

  private getTeamSizeAdvice(teamSize: number, _recommendations: Recommendation[]): string {
    let advice = `Team size optimization\n`;
    
    if (teamSize <= 3) {
      advice += `Small teams (${teamSize} people) should focus on individual plans rather than team plans for most tools.\n\n`;
    } else if (teamSize <= 10) {
      advice += `Medium teams (${teamSize} people) can benefit from team plans but should watch for over-provisioning seats.\n\n`;
    } else {
      advice += `Larger teams (${teamSize} people) should negotiate enterprise pricing and consider bulk discounts.\n\n`;
    }
    
    return advice;
  }
}
