"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PlatformShell from "@/components/platform-shell";
import UiToast from "@/components/ui-toast";
import { UiSection, UiEmptyState } from "@/components/ui-section";
import { loadAgentMemory } from "@/lib/agent-memory";
import {
  generateLoopSuggestions,
  getNextBestAction,
  type LoopSuggestion,
} from "@/lib/agent-loop";

function getPriorityStyles(priority: LoopSuggestion["priority"]) {
  if (priority === "high") {
    return "border-red-500/20 bg-red-500/[0.06] text-red-200";
  }
  if (priority === "medium") {
    return "border-amber-500/20 bg-amber-500/[0.06] text-amber-200";
  }
  return "border-zinc-500/20 bg-zinc-500/[0.08] text-zinc-300";
}

function getAgentStyles(agent: LoopSuggestion["agent"]) {
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

export default function AutopilotPage() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<LoopSuggestion[]>([]);
  const [toast, setToast] = useState("");

  function refreshLoop() {
    const memory = loadAgentMemory();
    const next = generateLoopSuggestions(memory);
    setSuggestions(next);
    setToast("Autonomous agent loop refreshed.");
  }

  useEffect(() => {
    refreshLoop();
  }, []);

  const nextBestAction = useMemo(() => {
    if (suggestions.length === 0) return null;
    const memory = loadAgentMemory();
    return getNextBestAction(memory);
  }, [suggestions]);

  function openAssistant(suggestion: LoopSuggestion) {
    router.push(
      `/assistant?prompt=${encodeURIComponent(suggestion.assistantPrompt)}`
    );
  }

  function openWorkspace(suggestion: LoopSuggestion) {
    router.push(
      `/workspace?query=${encodeURIComponent(
        suggestion.workspacePrompt
      )}&autorun=1`
    );
  }

  return (
    <PlatformShell
      title="Autopilot"
      subtitle="Autonomous agent loop and next-best-action system"
    >
      <div className="space-y-6">
        <UiToast message={toast} onClose={() => setToast("")} />

        <UiSection
          eyebrow="Autonomous Agent Loop"
          title="What the system thinks should happen next"
          right={
            <button
              type="button"
              onClick={refreshLoop}
              className="rounded-2xl border border-white/8 bg-white px-4 py-3 text-sm font-semibold text-black"
            >
              Refresh Loop
            </button>
          }
        >
          <p className="max-w-3xl text-sm leading-7 text-zinc-400">
            Autopilot watches completed internal tasks and suggests the next
            highest-value moves. This is the start of a more autonomous operator
            layer inside Orvanthis.
          </p>
        </UiSection>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <UiSection eyebrow="Next Best Action" title="Top recommended move">
              {!nextBestAction ? (
                <UiEmptyState
                  title="No suggestion yet"
                  text="Complete or reset tasks to help the loop determine what should happen next."
                />
              ) : (
                <div className="rounded-[24px] border border-red-500/15 bg-red-500/[0.05] p-5">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${getAgentStyles(
                        nextBestAction.agent
                      )}`}
                    >
                      {nextBestAction.agent}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${getPriorityStyles(
                        nextBestAction.priority
                      )}`}
                    >
                      {nextBestAction.priority}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-semibold text-zinc-100">
                    {nextBestAction.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-zinc-300">
                    {nextBestAction.reason}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => openAssistant(nextBestAction)}
                      className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] px-4 py-3 text-sm font-medium text-violet-200"
                    >
                      Run in Assistant
                    </button>

                    <button
                      type="button"
                      onClick={() => openWorkspace(nextBestAction)}
                      className="rounded-2xl border border-white/8 bg-white px-4 py-3 text-sm font-semibold text-black"
                    >
                      Run in Workspace
                    </button>
                  </div>
                </div>
              )}
            </UiSection>

            <UiSection eyebrow="Loop Suggestions" title="Recommended agent actions">
              {suggestions.length === 0 ? (
                <UiEmptyState
                  title="No suggestions available"
                  text="The loop will show recommendations here once task memory is available."
                />
              ) : (
                <div className="space-y-4">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="rounded-[24px] border border-white/8 bg-[#0c0e12] p-5"
                    >
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${getAgentStyles(
                            suggestion.agent
                          )}`}
                        >
                          {suggestion.agent}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${getPriorityStyles(
                            suggestion.priority
                          )}`}
                        >
                          {suggestion.priority}
                        </span>
                      </div>

                      <h3 className="mt-4 text-lg font-semibold text-zinc-100">
                        {suggestion.title}
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-zinc-400">
                        {suggestion.reason}
                      </p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => openAssistant(suggestion)}
                          className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] px-4 py-3 text-sm font-medium text-violet-200"
                        >
                          Run in Assistant
                        </button>

                        <button
                          type="button"
                          onClick={() => openWorkspace(suggestion)}
                          className="rounded-2xl border border-white/8 bg-white px-4 py-3 text-sm font-semibold text-black"
                        >
                          Run in Workspace
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </UiSection>
          </section>

          <aside className="space-y-6">
            <UiSection eyebrow="What Autopilot Does" title="Loop behavior">
              <div className="space-y-3">
                <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-sm text-zinc-300">
                  Watches completed internal task memory
                </div>
                <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-sm text-zinc-300">
                  Recommends the highest-value next action
                </div>
                <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-sm text-zinc-300">
                  Routes into Assistant or Workspace
                </div>
                <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-sm text-zinc-300">
                  Creates a more autonomous operator feel
                </div>
              </div>
            </UiSection>

            <UiSection eyebrow="Best Use" title="How to operate it">
              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.05] p-5">
                <p className="text-sm leading-7 text-zinc-200">
                  Use Tasks to complete internal audits, then open Autopilot to
                  see what the system recommends next. This creates a loop:
                  audit → memory → recommendation → action.
                </p>
              </div>
            </UiSection>
          </aside>
        </div>
      </div>
    </PlatformShell>
  );
}