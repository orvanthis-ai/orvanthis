"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PlatformShell from "@/components/platform-shell";
import {
  canUsePremiumPlusAgent,
  getPlanLabel,
  hasPremium,
} from "@/lib/plan-access";

type AgentTier = "free" | "premium" | "premium_plus";

type AgentCard = {
  id: string;
  name: string;
  tier: AgentTier;
  status: "ready" | "expanding";
  description: string;
  outputs: string[];
  assistantPrompt: string;
  workspacePrompt: string;
};

const AGENTS: AgentCard[] = [
  {
    id: "strategy",
    name: "Strategy Agent",
    tier: "free",
    status: "ready",
    description: "Finds and prioritizes the strongest opportunities.",
    outputs: ["Market direction", "Opportunity picks", "Timing insights"],
    assistantPrompt:
      "Act as a strategy agent. What are the best opportunities right now?",
    workspacePrompt:
      "Generate a full strategic opportunity report for current markets.",
  },
  {
    id: "execution",
    name: "Execution Agent",
    tier: "premium",
    status: "ready",
    description: "Turns ideas into actionable plans.",
    outputs: ["30-day plans", "Execution roadmap", "Next steps"],
    assistantPrompt:
      "Create a 30-day execution plan for the best opportunity.",
    workspacePrompt:
      "Build a full execution roadmap with steps and milestones.",
  },
  {
    id: "research",
    name: "Research Agent",
    tier: "free",
    status: "ready",
    description: "Compares sectors and analyzes trends.",
    outputs: ["Sector comparison", "Trend breakdown", "Market analysis"],
    assistantPrompt:
      "Compare top sectors and explain which is strongest.",
    workspacePrompt:
      "Generate a deep research comparison across top sectors.",
  },
  {
    id: "qa",
    name: "QA Agent",
    tier: "premium",
    status: "expanding",
    description: "Finds bugs and weak points in the product.",
    outputs: ["Bug ideas", "Test cases", "Audit results"],
    assistantPrompt:
      "Audit the app and find weak points or bugs.",
    workspacePrompt:
      "Create a QA audit report with issues and fixes.",
  },
  {
    id: "operator",
    name: "Operator Agent",
    tier: "premium_plus",
    status: "expanding",
    description: "Prioritizes tasks and manages execution flow.",
    outputs: ["Task priority", "Launch readiness", "Execution plan"],
    assistantPrompt:
      "What should I focus on next to grow this platform?",
    workspacePrompt:
      "Generate a full operator-level execution plan.",
  },
  {
    id: "code",
    name: "Code Review Agent",
    tier: "premium_plus",
    status: "expanding",
    description: "Finds code issues and improvements.",
    outputs: ["Bug risks", "Refactors", "Code improvements"],
    assistantPrompt:
      "Review the code and identify potential issues.",
    workspacePrompt:
      "Generate a code audit report with improvements.",
  },
];

export default function AgentsPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const userPlan =
    (session?.user as { plan?: string } | undefined)?.plan || "free";

  const [message, setMessage] = useState("");

  const summary = useMemo(() => {
    return {
      total: AGENTS.length,
      free: AGENTS.filter((a) => a.tier === "free").length,
      premium: AGENTS.filter((a) => a.tier === "premium").length,
      premiumPlus: AGENTS.filter((a) => a.tier === "premium_plus").length,
    };
  }, []);

  function canUse(agent: AgentCard) {
    if (agent.tier === "free") return true;
    if (agent.tier === "premium") return hasPremium(userPlan);
    return canUsePremiumPlusAgent(userPlan);
  }

  function handleClick(agent: AgentCard, type: "assistant" | "workspace") {
    if (!canUse(agent)) {
      setMessage(`Upgrade required for ${agent.name}`);
      router.push("/billing");
      return;
    }

    if (type === "assistant") {
      router.push(
        `/assistant?prompt=${encodeURIComponent(agent.assistantPrompt)}`
      );
    } else {
      router.push(
        `/workspace?query=${encodeURIComponent(agent.workspacePrompt)}&autorun=1`
      );
    }
  }

  return (
    <PlatformShell
      title="Agents"
      subtitle="Multi-Agent AI Control Center"
    >
      <div className="space-y-6">

        {message && (
          <div className="p-3 bg-red-500/10 text-red-300 rounded-xl">
            {message}
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          <div>Total: {summary.total}</div>
          <div>Free: {summary.free}</div>
          <div>Premium: {summary.premium}</div>
          <div>Premium+: {summary.premiumPlus}</div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {AGENTS.map((agent) => {
            const unlocked = canUse(agent);

            return (
              <div
                key={agent.id}
                className="bg-[#111318] p-6 rounded-2xl border border-white/10"
              >
                <h2 className="text-xl font-semibold">{agent.name}</h2>
                <p className="text-zinc-400 mt-2">{agent.description}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {agent.outputs.map((o) => (
                    <span
                      key={o}
                      className="text-xs bg-[#0c0e12] px-3 py-1 rounded-full"
                    >
                      {o}
                    </span>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleClick(agent, "assistant")}
                    className="bg-blue-500 text-white py-2 rounded-xl"
                  >
                    Assistant
                  </button>

                  <button
                    onClick={() => handleClick(agent, "workspace")}
                    className="bg-white text-black py-2 rounded-xl"
                  >
                    Workspace
                  </button>
                </div>

                {!unlocked && (
                  <p className="text-yellow-400 text-sm mt-2">
                    Upgrade required
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PlatformShell>
  );
}