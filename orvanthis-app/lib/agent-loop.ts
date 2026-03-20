import type { AgentMemory } from "./agent-memory";

export type LoopSuggestion = {
  id: string;
  title: string;
  agent:
    | "Strategy Agent"
    | "Execution Agent"
    | "Research Agent"
    | "QA Agent"
    | "Operator Agent"
    | "Code Review Agent";
  reason: string;
  assistantPrompt: string;
  workspacePrompt: string;
  priority: "high" | "medium" | "low";
};

export function generateLoopSuggestions(memory: AgentMemory): LoopSuggestion[] {
  const completed = new Set(memory.completedTaskIds);
  const suggestions: LoopSuggestion[] = [];

  if (!completed.has("qa-dashboard-flow")) {
    suggestions.push({
      id: "loop-dashboard-qa",
      title: "Audit dashboard before deeper expansion",
      agent: "QA Agent",
      reason:
        "The dashboard is a core operating surface and should be hardened before layering more features.",
      assistantPrompt:
        "Act as the QA Agent. Audit the dashboard and identify the highest-priority UX, logic, and flow issues that should be fixed before adding more features.",
      workspacePrompt:
        "Generate a dashboard QA report covering UX, product clarity, broken flows, premium gating, and polish opportunities.",
      priority: "high",
    });
  }

  if (completed.has("qa-dashboard-flow") && !completed.has("bug-page-links")) {
    suggestions.push({
      id: "loop-bug-hunt",
      title: "Run cross-page bug hunt",
      agent: "QA Agent",
      reason:
        "Once the dashboard is reviewed, the next best move is checking navigation, links, and edge-case routing.",
      assistantPrompt:
        "Act as the QA Agent. Run a bug hunt across page transitions, buttons, route changes, and navigation flows. Prioritize the most likely break points.",
      workspacePrompt:
        "Generate a cross-page bug hunt report covering routes, navigation, links, redirect logic, and likely dead clicks.",
      priority: "high",
    });
  }

  if (completed.has("bug-page-links") && !completed.has("code-error-guards")) {
    suggestions.push({
      id: "loop-code-hardening",
      title: "Harden code safety patterns",
      agent: "Code Review Agent",
      reason:
        "After a bug hunt, the strongest next move is to strengthen defensive logic and error handling in code.",
      assistantPrompt:
        "Act as the Code Review Agent. Review the app for missing guards, weak error handling, unsafe assumptions, and likely stability risks.",
      workspacePrompt:
        "Generate a code hardening report covering weak guards, async handling, validation gaps, and error-path improvements.",
      priority: "high",
    });
  }

  if (completed.has("operator-next-launch")) {
    suggestions.push({
      id: "loop-scale-plan",
      title: "Plan the next scale phase",
      agent: "Operator Agent",
      reason:
        "Launch planning is underway, so the next best move is defining growth, scale, and operating priorities after first release.",
      assistantPrompt:
        "Act as the Operator Agent. Create the next-phase operating plan for scaling the product after initial launch readiness.",
      workspacePrompt:
        "Generate a scale roadmap covering product priorities, user growth, monetization sequencing, and post-launch execution.",
      priority: "medium",
    });
  }

  if (completed.has("qa-dashboard-flow") && completed.has("bug-page-links")) {
    suggestions.push({
      id: "loop-research-positioning",
      title: "Strengthen product positioning",
      agent: "Research Agent",
      reason:
        "After product hardening, improving positioning and category framing can raise launch quality.",
      assistantPrompt:
        "Act as the Research Agent. Analyze how Orvanthis should be positioned in the market, what category it fits in, and how to make the product feel more valuable.",
      workspacePrompt:
        "Generate a product positioning report for Orvanthis including category fit, user perception, differentiation, and launch messaging.",
      priority: "medium",
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: "loop-default-operator",
      title: "Review the highest-impact next move",
      agent: "Operator Agent",
      reason:
        "When task history is limited, the best next action is a top-level operating review.",
      assistantPrompt:
        "Act as the Operator Agent. Review the current maturity of the app and identify the single highest-impact next move.",
      workspacePrompt:
        "Generate an operator summary of the app’s current state and recommend the next highest-impact execution step.",
      priority: "high",
    });
  }

  return suggestions;
}

export function getNextBestAction(memory: AgentMemory): LoopSuggestion {
  const suggestions = generateLoopSuggestions(memory);

  const rank = { high: 3, medium: 2, low: 1 };

  return [...suggestions].sort(
    (a, b) => rank[b.priority] - rank[a.priority]
  )[0];
}