"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function AgentAnalyticsPage() {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [toast, setToast] = useState("");
  const [toastTone, setToastTone] = useState<
    "success" | "warning" | "error" | "info"
  >("info");

  async function loadRuns() {
    try {
      const res = await fetch("/api/agent-runs", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        setToast(data?.message || "Failed to load analytics.");
        setToastTone("error");
        return;
      }

      setRuns(data);
    } catch (error) {
      console.error(error);
      setToast("Failed to load analytics.");
      setToastTone("error");
    }
  }

  useEffect(() => {
    void loadRuns();
  }, []);

  const stats = useMemo(() => {
    const totalRuns = runs.length;
    const assistantRuns = runs.filter((run) => run.route === "assistant").length;
    const workspaceRuns = runs.filter((run) => run.route === "workspace").length;
    const favorites = runs.filter((run) => run.favorite).length;
    const withNotes = runs.filter((run) => (run.notes || "").trim().length > 0).length;
    const withOutput = runs.filter((run) => (run.output || "").trim().length > 0).length;

    const agentCounts = runs.reduce<Record<string, number>>((acc, run) => {
      acc[run.agent] = (acc[run.agent] || 0) + 1;
      return acc;
    }, {});

    const mostUsedAgentEntry = Object.entries(agentCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      totalRuns,
      assistantRuns,
      workspaceRuns,
      favorites,
      withNotes,
      withOutput,
      mostUsedAgent: mostUsedAgentEntry?.[0] || "None",
      mostUsedCount: mostUsedAgentEntry?.[1] || 0,
    };
  }, [runs]);

  const agentBreakdown = useMemo(() => {
    const counts = runs.reduce<Record<string, number>>((acc, run) => {
      acc[run.agent] = (acc[run.agent] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([agent, count]) => ({
        agent: agent as ConsoleAgent,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [runs]);

  const topSavedRuns = useMemo(() => {
    return runs
      .filter((run) => run.favorite)
      .slice(0, 5);
  }, [runs]);

  const recentRuns = useMemo(() => {
    return runs.slice(0, 8);
  }, [runs]);

  return (
    <PlatformShell
      title="Agent Analytics"
      subtitle="See how your AI agents are being used and which workflows matter most"
    >
      <div className="space-y-6">
        <UiToast
          message={toast}
          tone={toastTone}
          onClose={() => setToast("")}
        />

        <UiSection
          eyebrow="Agent Analytics"
          title="Usage overview"
          right={
            <button
              type="button"
              onClick={() => void loadRuns()}
              className="rounded-2xl border border-white/8 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-100"
            >
              Refresh Analytics
            </button>
          }
        >
          <p className="max-w-3xl text-sm leading-7 text-zinc-400">
            Track which agents are being used most, how often they run in Assistant
            vs Workspace, and which saved workflows are becoming part of your real operating system.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-4 xl:grid-cols-8">
            <div className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.05] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-sky-200/80">Total</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">{stats.totalRuns}</p>
            </div>

            <div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.05] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-violet-200/80">Assistant</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">{stats.assistantRuns}</p>
            </div>

            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.05] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-200/80">Workspace</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">{stats.workspaceRuns}</p>
            </div>

            <div className="rounded-2xl border border-yellow-500/15 bg-yellow-500/[0.05] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-yellow-200/80">Saved</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">{stats.favorites}</p>
            </div>

            <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.05] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-amber-200/80">With Notes</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">{stats.withNotes}</p>
            </div>

            <div className="rounded-2xl border border-fuchsia-500/15 bg-fuchsia-500/[0.05] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-fuchsia-200/80">With Output</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">{stats.withOutput}</p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-[#111318] p-4 md:col-span-2">
              <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400">Top Agent</p>
              <p className="mt-2 text-lg font-semibold text-zinc-100">{stats.mostUsedAgent}</p>
              <p className="mt-1 text-sm text-zinc-400">{stats.mostUsedCount} runs</p>
            </div>
          </div>
        </UiSection>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-6">
            <UiSection eyebrow="Agent Breakdown" title="Most-used agents">
              {agentBreakdown.length === 0 ? (
                <UiEmptyState
                  title="No analytics yet"
                  text="Run some agents from Agent Console and your breakdown will appear here."
                />
              ) : (
                <div className="space-y-4">
                  {agentBreakdown.map((item) => (
                    <div
                      key={item.agent}
                      className="rounded-[24px] border border-white/8 bg-[#0c0e12] p-5"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${getAgentStyles(
                              item.agent
                            )}`}
                          >
                            {item.agent}
                          </span>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-semibold text-zinc-100">{item.count}</p>
                          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">runs</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </UiSection>

            <UiSection eyebrow="Recent Activity" title="Latest agent runs">
              {recentRuns.length === 0 ? (
                <UiEmptyState
                  title="No recent runs"
                  text="Recent agent activity will appear here after you start using the console."
                />
              ) : (
                <div className="space-y-4">
                  {recentRuns.map((run) => (
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
                          {run.favorite ? (
                            <span className="rounded-full border border-yellow-500/20 bg-yellow-500/[0.08] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-yellow-200">
                              saved
                            </span>
                          ) : null}
                        </div>

                        <p className="text-xs text-zinc-500">
                          {new Date(run.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <h3 className="mt-4 text-base font-semibold text-zinc-100">
                        {run.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-7 text-zinc-400">
                        {run.prompt}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </UiSection>
          </section>

          <aside className="space-y-6">
            <UiSection eyebrow="Top Saved Workflows" title="Most valuable runs">
              {topSavedRuns.length === 0 ? (
                <UiEmptyState
                  title="No saved workflows yet"
                  text="Save your best agent runs in Agent Console and they will appear here."
                />
              ) : (
                <div className="space-y-4">
                  {topSavedRuns.map((run) => (
                    <div
                      key={run.id}
                      className="rounded-[24px] border border-yellow-500/15 bg-yellow-500/[0.05] p-5"
                    >
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${getAgentStyles(
                            run.agent
                          )}`}
                        >
                          {run.agent}
                        </span>
                        <span className="rounded-full border border-yellow-500/20 bg-yellow-500/[0.08] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-yellow-200">
                          saved
                        </span>
                      </div>

                      <h3 className="mt-4 text-base font-semibold text-zinc-100">
                        {run.title}
                      </h3>

                      {(run.notes || "").trim() ? (
                        <p className="mt-3 text-sm leading-7 text-zinc-300">
                          {run.notes}
                        </p>
                      ) : (
                        <p className="mt-3 text-sm leading-7 text-zinc-400">
                          No notes added yet.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </UiSection>

            <UiSection eyebrow="System Insight" title="What this tells you">
              <div className="space-y-3">
                <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-sm text-zinc-300">
                  You can see which agents are becoming part of your real workflow.
                </div>
                <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-sm text-zinc-300">
                  Saved runs show which prompts are worth keeping and reusing.
                </div>
                <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-sm text-zinc-300">
                  This is the base for future automation, ranking, and agent chaining.
                </div>
              </div>
            </UiSection>
          </aside>
        </div>
      </div>
    </PlatformShell>
  );
}