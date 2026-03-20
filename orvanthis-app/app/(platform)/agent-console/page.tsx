"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PlatformShell from "@/components/platform-shell";
import UiToast from "@/components/ui-toast";
import { UiSection, UiEmptyState } from "@/components/ui-section";

type ConsoleAgent =
  | "Strategy Agent"
  | "Execution Agent"
  | "Research Agent"
  | "QA Agent"
  | "Operator Agent"
  | "Code Review Agent";

type AgentRun = {
  id: string;
  agent: ConsoleAgent;
  title: string;
  prompt: string;
  route: "assistant" | "workspace";
  createdAt: string | number;
  output?: string | null;
  favorite?: boolean;
  notes?: string | null;
};

const AGENT_ACTIONS: {
  id: string;
  agent: ConsoleAgent;
  title: string;
  description: string;
  assistantPrompt: string;
  workspacePrompt: string;
}[] = [
  {
    id: "strategy-market",
    agent: "Strategy Agent",
    title: "Market Opportunity Scan",
    description:
      "Identify the strongest opportunities and where focus should go next.",
    assistantPrompt:
      "Act as Orvanthis Strategy Agent. Identify the strongest opportunities right now, explain why they matter, and recommend where focus should go next.",
    workspacePrompt:
      "Build a strategic opportunity report covering the strongest opportunities, timing, risks, and recommended priority order.",
  },
  {
    id: "execution-plan",
    agent: "Execution Agent",
    title: "30-Day Execution Plan",
    description: "Turn current priorities into a practical execution roadmap.",
    assistantPrompt:
      "Act as Orvanthis Execution Agent. Turn my current priority into a concrete 30-day execution plan with weekly steps, risks, and the best immediate next move.",
    workspacePrompt:
      "Create a 30-day execution roadmap with weekly milestones, risks, and operator-style prioritization.",
  },
  {
    id: "research-compare",
    agent: "Research Agent",
    title: "Sector Comparison",
    description:
      "Compare sectors, narratives, and where the best near-term opportunity may be.",
    assistantPrompt:
      "Act as Orvanthis Research Agent. Compare the strongest sectors or themes right now, explain the differences, and identify where the best near-term opportunity may be.",
    workspacePrompt:
      "Build a sector comparison report covering strengths, weaknesses, timing, and best current opportunities.",
  },
  {
    id: "qa-audit",
    agent: "QA Agent",
    title: "Product QA Audit",
    description: "Audit weak spots, likely bugs, and test priorities.",
    assistantPrompt:
      "Act as Orvanthis QA Agent. Audit the product from a QA perspective, identify likely weak spots, and propose the highest-priority test cases and bug checks.",
    workspacePrompt:
      "Build a QA audit report for the app including likely failure points, UI bugs, regression risks, and recommended tests.",
  },
  {
    id: "operator-priority",
    agent: "Operator Agent",
    title: "Launch Priority Review",
    description:
      "Review maturity and determine the highest-impact next actions.",
    assistantPrompt:
      "Act as Orvanthis Operator Agent. Review current app maturity, prioritize the most important tasks before launch, and create the clearest next-action sequence.",
    workspacePrompt:
      "Build an operator report covering launch readiness, product priorities, execution sequencing, and highest-impact next steps.",
  },
  {
    id: "code-review",
    agent: "Code Review Agent",
    title: "Code Risk Audit",
    description:
      "Look for likely bugs, missing guards, and refactor opportunities.",
    assistantPrompt:
      "Act as Orvanthis Code Review Agent. Audit the app codebase conceptually for likely bugs, missing guards, weak error handling, and refactor opportunities.",
    workspacePrompt:
      "Build a code review audit report covering probable logic issues, missing safeguards, stability risks, and code quality improvements.",
  },
];

function getAgentStyles(agent: ConsoleAgent) {
  if (agent === "QA Agent") {
    return "border-sky-500/20 bg-sky-500/[0.06] text-sky-200";
  }
  if (agent === "Code Review Agent") {
    return "border-violet-500/20 bg-violet-500/[0.06] text-violet-200";
  }
  if (agent === "Operator Agent") {
    return "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200";
  }
  if (agent === "Research Agent") {
    return "border-amber-500/20 bg-amber-500/[0.06] text-amber-200";
  }
  if (agent === "Execution Agent") {
    return "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200";
  }
  return "border-white/8 bg-[#111318] text-zinc-300";
}

export default function AgentConsolePage() {
  const router = useRouter();
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [toast, setToast] = useState("");
  const [toastTone, setToastTone] = useState<
    "success" | "warning" | "error" | "info"
  >("info");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  async function loadRuns() {
    try {
      const res = await fetch("/api/agent-runs", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        setToast(data?.message || "Failed to load agent runs.");
        setToastTone("error");
        return;
      }

      setRuns(data);
    } catch (error) {
      console.error(error);
      setToast("Failed to load agent runs.");
      setToastTone("error");
    }
  }

  useEffect(() => {
    void loadRuns();
  }, []);

  const stats = useMemo(() => {
    return {
      totalRuns: runs.length,
      assistantRuns: runs.filter((run) => run.route === "assistant").length,
      workspaceRuns: runs.filter((run) => run.route === "workspace").length,
      uniqueAgents: new Set(runs.map((run) => run.agent)).size,
      favorites: runs.filter((run) => run.favorite).length,
    };
  }, [runs]);

  const filteredRuns = useMemo(() => {
    return showFavoritesOnly ? runs.filter((run) => run.favorite) : runs;
  }, [runs, showFavoritesOnly]);

  async function logRun(
    agent: ConsoleAgent,
    title: string,
    prompt: string,
    route: "assistant" | "workspace"
  ) {
    try {
      const res = await fetch("/api/agent-runs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent,
          title,
          prompt,
          route,
          output: "",
          notes: "",
          favorite: false,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setRuns((prev) => [data, ...prev].slice(0, 25));
      }
    } catch (error) {
      console.error(error);
    }
  }

  function runAssistant(
    agent: ConsoleAgent,
    title: string,
    prompt: string
  ) {
    void logRun(agent, title, prompt, "assistant");
    setToast(`${agent} launched in Assistant.`);
    setToastTone("success");
    router.push(`/assistant?prompt=${encodeURIComponent(prompt)}`);
  }

  function runWorkspace(
    agent: ConsoleAgent,
    title: string,
    prompt: string
  ) {
    void logRun(agent, title, prompt, "workspace");
    setToast(`${agent} launched in Workspace.`);
    setToastTone("success");
    router.push(`/workspace?query=${encodeURIComponent(prompt)}&autorun=1`);
  }

  function rerun(run: AgentRun) {
    if (run.route === "assistant") {
      router.push(`/assistant?prompt=${encodeURIComponent(run.prompt)}`);
      return;
    }

    router.push(`/workspace?query=${encodeURIComponent(run.prompt)}&autorun=1`);
  }

  async function clearHistory() {
    try {
      await Promise.all(
        runs.map((run) =>
          fetch(`/api/agent-runs?id=${encodeURIComponent(run.id)}`, {
            method: "DELETE",
          })
        )
      );
      setRuns([]);
      setToast("Agent console history cleared.");
      setToastTone("info");
    } catch (error) {
      console.error(error);
      setToast("Failed to clear history.");
      setToastTone("error");
    }
  }

  async function toggleFavorite(id: string, favorite: boolean) {
    const next = runs.map((run) =>
      run.id === id ? { ...run, favorite: !favorite } : run
    );
    setRuns(next);

    await fetch("/api/agent-runs", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        favorite: !favorite,
      }),
    });
  }

  async function saveOutput(id: string, output: string) {
    const next = runs.map((run) => (run.id === id ? { ...run, output } : run));
    setRuns(next);

    await fetch("/api/agent-runs", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        output,
      }),
    });
  }

  async function saveNotes(id: string, notes: string) {
    const next = runs.map((run) => (run.id === id ? { ...run, notes } : run));
    setRuns(next);

    await fetch("/api/agent-runs", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        notes,
      }),
    });
  }

  return (
    <PlatformShell
      title="Agent Console"
      subtitle="Central control room for running and reusing AI agent workflows"
    >
      <div className="space-y-6">
        <UiToast
          message={toast}
          tone={toastTone}
          onClose={() => setToast("")}
        />

        <UiSection
          eyebrow="Agent Console"
          title="Run, track, and reuse internal agent actions"
          right={
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className="rounded-2xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-sm font-medium text-zinc-300 transition hover:border-white/15 hover:text-white"
              >
                {showFavoritesOnly ? "Show All" : "Show Saved Only"}
              </button>
              <button
                type="button"
                onClick={() => void clearHistory()}
                className="rounded-2xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-sm font-medium text-zinc-300 transition hover:border-white/15 hover:text-white"
              >
                Clear History
              </button>
            </div>
          }
        >
          <p className="max-w-3xl text-sm leading-7 text-zinc-400">
            The Agent Console gives you one place to launch specialized agent
            workflows, review recent runs, save the best ones, and keep notes on
            what worked.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-5">
            <div className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.05] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-sky-200/80">
                Total Runs
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">
                {stats.totalRuns}
              </p>
            </div>

            <div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.05] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-violet-200/80">
                Assistant
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">
                {stats.assistantRuns}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.05] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-200/80">
                Workspace
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">
                {stats.workspaceRuns}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.05] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-amber-200/80">
                Active Agents
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">
                {stats.uniqueAgents}
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-500/15 bg-yellow-500/[0.05] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-yellow-200/80">
                Saved
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">
                {stats.favorites}
              </p>
            </div>
          </div>
        </UiSection>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <UiSection eyebrow="Quick Actions" title="Launch agent workflows">
              <div className="grid gap-4">
                {AGENT_ACTIONS.map((action) => (
                  <div
                    key={action.id}
                    className="rounded-[24px] border border-white/8 bg-[#0c0e12] p-5"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${getAgentStyles(
                          action.agent
                        )}`}
                      >
                        {action.agent}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-semibold text-zinc-100">
                      {action.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-zinc-400">
                      {action.description}
                    </p>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <button
                        type="button"
                        onClick={() =>
                          runAssistant(
                            action.agent,
                            action.title,
                            action.assistantPrompt
                          )
                        }
                        className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] px-4 py-3 text-sm font-medium text-violet-200 transition hover:border-violet-400/30"
                      >
                        Run in Assistant
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          runWorkspace(
                            action.agent,
                            action.title,
                            action.workspacePrompt
                          )
                        }
                        className="rounded-2xl border border-white/8 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-100"
                      >
                        Run in Workspace
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </UiSection>
          </section>

          <aside className="space-y-6">
            <UiSection eyebrow="Recent Runs" title="Prompt history and saved output">
              {filteredRuns.length === 0 ? (
                <UiEmptyState
                  title="No agent runs yet"
                  text={
                    showFavoritesOnly
                      ? "No saved runs yet. Save a run and it will appear here."
                      : "Run an agent action and your recent history will appear here."
                  }
                />
              ) : (
                <div className="space-y-4">
                  {filteredRuns.map((run) => (
                    <div
                      key={run.id}
                      className="rounded-[24px] border border-white/8 bg-[#0c0e12] p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${getAgentStyles(
                              run.agent
                            )}`}
                          >
                            {run.agent}
                          </span>

                          <span className="rounded-full border border-white/8 bg-[#111318] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-zinc-300">
                            {run.route}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => void toggleFavorite(run.id, Boolean(run.favorite))}
                          className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] transition ${
                            run.favorite
                              ? "border-yellow-500/20 bg-yellow-500/[0.08] text-yellow-200"
                              : "border-white/8 bg-[#111318] text-zinc-300 hover:border-white/15 hover:text-white"
                          }`}
                        >
                          {run.favorite ? "★ Saved" : "☆ Save"}
                        </button>
                      </div>

                      <h3 className="mt-4 text-base font-semibold text-zinc-100">
                        {run.title}
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-zinc-400">
                        {run.prompt}
                      </p>

                      <textarea
                        placeholder="Paste or write agent output here..."
                        value={run.output || ""}
                        onChange={(e) => void saveOutput(run.id, e.target.value)}
                        className="mt-4 min-h-[110px] w-full rounded-2xl border border-white/8 bg-[#111318] p-3 text-sm text-white outline-none placeholder:text-zinc-500"
                      />

                      <textarea
                        placeholder="Add notes about why this was useful, what to do next, or what to improve..."
                        value={run.notes || ""}
                        onChange={(e) => void saveNotes(run.id, e.target.value)}
                        className="mt-3 min-h-[90px] w-full rounded-2xl border border-white/8 bg-[#111318] p-3 text-xs text-zinc-300 outline-none placeholder:text-zinc-500"
                      />

                      <div className="mt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => rerun(run)}
                          className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.06] px-4 py-3 text-sm font-medium text-sky-200 transition hover:border-sky-400/30"
                        >
                          Run Again
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </UiSection>

            <UiSection eyebrow="What This Unlocks" title="Why this matters">
              <div className="space-y-3">
                <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-sm text-zinc-300">
                  Save your best agent workflows instead of losing them
                </div>
                <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-sm text-zinc-300">
                  Keep notes and output for later execution
                </div>
                <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-sm text-zinc-300">
                  Build a reusable internal AI knowledge base
                </div>
              </div>
            </UiSection>
          </aside>
        </div>
      </div>
    </PlatformShell>
  );
}