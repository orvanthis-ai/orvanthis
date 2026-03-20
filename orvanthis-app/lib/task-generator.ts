import type { AgentMemory } from "./agent-memory";

export type AdaptiveTaskItem = {
  id: string;
  title: string;
  type: "qa" | "bug" | "code" | "operator" | "launch";
  priority: "high" | "medium" | "low";
  status: "todo";
  description: string;
  assistantPrompt?: string;
  workspacePrompt?: string;
  routeTarget?: string;
};

export function generateAdaptiveTasks(
  memory: AgentMemory
): AdaptiveTaskItem[] {
  const tasks: AdaptiveTaskItem[] = [];

  if (memory.completedTaskIds.includes("qa-dashboard-flow")) {
    tasks.push({
      id: "qa-deep-dashboard",
      title: "Deep dashboard UX audit",
      type: "qa",
      priority: "high",
      status: "todo",
      description:
        "Analyze deeper UX issues on the dashboard, including layout rhythm, edge cases, feedback states, and micro-interactions.",
      assistantPrompt:
        "Act as the QA Agent. Perform a deep UX audit on the dashboard including interaction issues, weak feedback states, and edge-case friction.",
      workspacePrompt:
        "Generate a deep dashboard UX audit report covering micro-interactions, edge cases, state transitions, and visual improvements.",
      routeTarget: "/dashboard",
    });
  }

  if (memory.completedTaskIds.includes("bug-page-links")) {
    tasks.push({
      id: "bug-edge-cases",
      title: "Find edge-case bugs",
      type: "bug",
      priority: "high",
      status: "todo",
      description:
        "Look for rare routing, state, auth, and async issues that may only appear under unusual user behavior.",
      assistantPrompt:
        "Act as the QA Agent. Identify edge-case bugs that could break flows under unusual navigation, auth, or async conditions.",
      workspacePrompt:
        "Generate a report on edge-case failures across navigation, state handling, auth, and async UI behavior.",
      routeTarget: "/health",
    });
  }

  if (memory.completedTaskIds.includes("operator-next-launch")) {
    tasks.push({
      id: "operator-scale-plan",
      title: "Scale strategy plan",
      type: "operator",
      priority: "high",
      status: "todo",
      description:
        "Plan the next phase after initial launch, including user growth, product expansion, and monetization priorities.",
      assistantPrompt:
        "Act as the Operator Agent. What are the next steps to scale this platform after initial launch readiness?",
      workspacePrompt:
        "Create a scale strategy roadmap including users, revenue priorities, product expansion, and operating milestones.",
      routeTarget: "/prelaunch",
    });
  }

  if (memory.completedTaskIds.includes("code-error-guards")) {
    tasks.push({
      id: "code-api-hardening",
      title: "Harden API safety patterns",
      type: "code",
      priority: "medium",
      status: "todo",
      description:
        "Review API routes for consistency in error handling, auth checks, response shape, and usage enforcement.",
      assistantPrompt:
        "Act as the Code Review Agent. Review API routes for weak validation, inconsistent error responses, missing guards, and auth enforcement issues.",
      workspacePrompt:
        "Generate an API hardening report covering auth checks, validation, response consistency, and error-handling improvements.",
      routeTarget: "/health",
    });
  }

  if (memory.completedTaskIds.includes("launch-first-user-pass")) {
    tasks.push({
      id: "launch-conversion-pass",
      title: "Optimize conversion path",
      type: "launch",
      priority: "medium",
      status: "todo",
      description:
        "Review how a new user moves from homepage to signup to first product value and identify conversion friction.",
      assistantPrompt:
        "Act as the QA Agent. Analyze the conversion path from homepage to signup to first meaningful use and identify the biggest friction points.",
      workspacePrompt:
        "Create a conversion audit report covering homepage messaging, signup friction, onboarding clarity, and time-to-value improvements.",
      routeTarget: "/",
    });
  }

  return tasks;
}