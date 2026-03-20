"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PlatformShell from "@/components/platform-shell";
import {
  OpportunityItem,
  addOpportunityToCalendar,
  loadTrackedOpportunityIds,
  toggleTrackedOpportunity,
} from "@/app/lib/opportunity-actions";
import {
  canUseCalendarAi,
  canUseExecutionMode,
  getPlanLabel,
} from "@/lib/plan-access";

const opportunities: OpportunityItem[] = [
  {
    id: "ai-infra",
    title: "AI Infrastructure",
    category: "AI Infrastructure",
    score: 8.4,
    stage: "Emerging",
    signal:
      "Demand expansion, compute constraints, and tooling growth continue creating white-space opportunities.",
    whyNow:
      "AI adoption is rising faster than underlying infrastructure capacity, creating durable demand for tools, systems, and operational support.",
    workspaceQuery:
      "Build a strategic report on AI infrastructure opportunities, strongest wedges, market timing, buyer demand, and major risks.",
    executionPrompt:
      "Turn the AI infrastructure opportunity into a 30-day execution plan with priorities, go-to-market ideas, risks, and next steps.",
    calendarTitle: "AI Infrastructure Opportunity Review",
    calendarNote:
      "Review strongest AI infrastructure angles, rank best wedges, and decide if it deserves active execution.",
    watchlistTag: "AI Infrastructure",
  },
  {
    id: "defense-software",
    title: "Defense Software",
    category: "Defense Software",
    score: 8.1,
    stage: "High Priority",
    signal:
      "Geopolitical pressure and modernization spending are creating strong strategic tailwinds.",
    whyNow:
      "Procurement urgency and modernization pressure are making software-enabled defense workflows more important and more fundable.",
    workspaceQuery:
      "Build a strategic report on defense software opportunities, procurement tailwinds, risks, and best go-to-market strategies.",
    executionPrompt:
      "Create a realistic execution plan for entering defense software, including customer discovery, positioning, and risk management.",
    calendarTitle: "Defense Software Strategy Review",
    calendarNote:
      "Reassess current defense software opportunity timing, buyer urgency, and practical execution path.",
    watchlistTag: "Defense Software",
  },
  {
    id: "energy-storage",
    title: "Energy Storage",
    category: "Energy Storage",
    score: 7.8,
    stage: "Monitoring",
    signal:
      "Grid volatility and electrification trends are driving long-duration infrastructure demand.",
    whyNow:
      "Infrastructure strain and energy transition pressure are increasing interest in storage solutions and supporting ecosystems.",
    workspaceQuery:
      "Build a strategic report on energy storage opportunities, strongest submarkets, demand drivers, and execution risks.",
    executionPrompt:
      "Create a practical execution roadmap for building around the energy storage opportunity.",
    calendarTitle: "Energy Storage Opportunity Check",
    calendarNote:
      "Review the timing, urgency, and strongest execution paths around energy storage demand.",
    watchlistTag: "Energy Storage",
  },
  {
    id: "compliance-tech",
    title: "Compliance Technology",
    category: "Compliance Technology",
    score: 7.6,
    stage: "Emerging",
    signal:
      "Regulatory complexity is increasing demand for automation, tracking, and reporting systems.",
    whyNow:
      "Rising compliance burden creates urgency for automation tools that reduce manual work and lower risk exposure.",
    workspaceQuery:
      "Build a strategic report on compliance technology opportunities, buyer urgency, regulatory catalysts, and strongest go-to-market angles.",
    executionPrompt:
      "Turn compliance technology into an execution plan with a 30-day roadmap and the most promising first customers.",
    calendarTitle: "Compliance Tech Execution Review",
    calendarNote:
      "Review compliance technology demand and identify whether it should move from monitoring into active execution.",
    watchlistTag: "Compliance Tech",
  },
  {
    id: "supply-chain-intel",
    title: "Supply Chain Intelligence",
    category: "Supply Chain Intelligence",
    score: 7.4,
    stage: "Monitoring",
    signal:
      "Operational resilience and procurement visibility remain major executive priorities.",
    whyNow:
      "Companies still need better forecasting, procurement visibility, and resilience planning after repeated supply disruptions.",
    workspaceQuery:
      "Build a strategic report on supply chain intelligence opportunities, strongest use cases, risks, and business value.",
    executionPrompt:
      "Create a step-by-step execution plan for supply chain intelligence with priorities and short-term actions.",
    calendarTitle: "Supply Chain Intelligence Review",
    calendarNote:
      "Evaluate whether supply chain intelligence should become a higher-priority tracked opportunity.",
    watchlistTag: "Supply Chain",
  },
  {
    id: "industrial-automation",
    title: "Industrial Automation",
    category: "Industrial Automation",
    score: 7.9,
    stage: "High Priority",
    signal:
      "Efficiency pressure and labor constraints are accelerating automation adoption across industries.",
    whyNow:
      "Industrial operators are under pressure to boost efficiency, lower dependency on labor bottlenecks, and digitize workflows.",
    workspaceQuery:
      "Build a strategic report on industrial automation opportunities, strongest adoption drivers, risks, and execution timing.",
    executionPrompt:
      "Turn industrial automation into a concrete 30-day plan with market priorities, positioning, and execution steps.",
    calendarTitle: "Industrial Automation Planning Session",
    calendarNote:
      "Review industrial automation opportunity strength and determine the best next move for execution.",
    watchlistTag: "Industrial Automation",
  },
];

function getScoreStyles(score: number) {
  if (score >= 8) {
    return {
      badge: "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-200",
      text: "text-emerald-200",
    };
  }

  if (score >= 7.5) {
    return {
      badge: "border-amber-500/20 bg-amber-500/[0.08] text-amber-200",
      text: "text-amber-200",
    };
  }

  return {
    badge: "border-zinc-500/20 bg-zinc-500/[0.10] text-zinc-300",
    text: "text-zinc-300",
  };
}

export default function OpportunitiesPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const userPlan =
    (session?.user as { plan?: string } | undefined)?.plan || "free";

  const [trackedIds, setTrackedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setTrackedIds(loadTrackedOpportunityIds());
  }, []);

  const trackedCount = useMemo(() => trackedIds.length, [trackedIds]);

  function goToBilling(message: string) {
    setFeedback(message);
    setTimeout(() => {
      router.push("/billing");
    }, 500);
  }

  function handleTrack(item: OpportunityItem) {
    const next = toggleTrackedOpportunity(item.id);
    setTrackedIds(next);

    const isTracked = next.includes(item.id);
    setFeedback(
      isTracked
        ? `"${item.title}" is now being tracked.`
        : `"${item.title}" was removed from tracked opportunities.`
    );
  }

  function handleAddToCalendar(item: OpportunityItem) {
    if (!canUseCalendarAi(userPlan)) {
      goToBilling(
        `Add to Calendar is available on Premium and above. Current plan: ${getPlanLabel(
          userPlan
        )}.`
      );
      return;
    }

    const added = addOpportunityToCalendar({
      title: item.calendarTitle,
      note: item.calendarNote,
      watchlistTag: item.watchlistTag,
    });

    setFeedback(
      added
        ? `"${item.title}" was added to your calendar.`
        : `Unable to add "${item.title}" to the calendar.`
    );
  }

  function handleSendToWorkspace(item: OpportunityItem) {
    router.push(
      `/workspace?query=${encodeURIComponent(item.workspaceQuery)}&autorun=1`
    );
  }

  function handleGeneratePlan(item: OpportunityItem) {
    if (!canUseExecutionMode(userPlan)) {
      goToBilling(
        `Generate Plan is available on Premium and above. Current plan: ${getPlanLabel(
          userPlan
        )}.`
      );
      return;
    }

    router.push(
      `/assistant?prompt=${encodeURIComponent(item.executionPrompt)}`
    );
  }

  function handleOpenAssistant(item: OpportunityItem) {
    router.push(
      `/assistant?prompt=${encodeURIComponent(
        `Analyze ${item.title} and explain why it matters right now.`
      )}`
    );
  }

  return (
    <PlatformShell
      title="Opportunities"
      subtitle="Move from opportunity discovery into tracking, planning, and execution"
    >
      <div className="space-y-6">
        <section className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Opportunity Engine
              </p>
              <h3 className="mt-2 text-3xl font-semibold text-zinc-100">
                Convert ideas into action
              </h3>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                Track opportunities, send them to your workspace, add them to
                the calendar, or generate an execution plan directly from the
                opportunity itself.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.05] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-sky-200/80">
                  Opportunities
                </p>
                <p className="mt-2 text-3xl font-semibold text-zinc-100">
                  {opportunities.length}
                </p>
              </div>

              <div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.05] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-violet-200/80">
                  Tracked
                </p>
                <p className="mt-2 text-3xl font-semibold text-zinc-100">
                  {trackedCount}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.05] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-amber-200/80">
                  Plan
                </p>
                <p className="mt-2 text-xl font-semibold text-zinc-100">
                  {getPlanLabel(userPlan)}
                </p>
              </div>
            </div>
          </div>

          {feedback && (
            <div className="mt-5 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.05] px-4 py-3 text-sm text-emerald-200">
              {feedback}
            </div>
          )}
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          {opportunities.map((item) => {
            const scoreStyles = getScoreStyles(item.score);
            const isTracked = trackedIds.includes(item.id);

            return (
              <div
                key={item.id}
                className="rounded-[28px] border border-white/8 bg-[#111318] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-violet-500/15 bg-violet-500/[0.06] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-violet-200/80">
                          {item.category}
                        </span>

                        <span className="rounded-full border border-white/8 bg-[#0c0e12] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                          {item.stage}
                        </span>

                        {isTracked && (
                          <span className="rounded-full border border-sky-500/15 bg-sky-500/[0.06] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-sky-200">
                            tracked
                          </span>
                        )}
                      </div>

                      <h4 className="mt-4 text-2xl font-semibold text-zinc-100">
                        {item.title}
                      </h4>
                    </div>

                    <div
                      className={`rounded-2xl border px-4 py-3 text-right ${scoreStyles.badge}`}
                    >
                      <p className="text-[10px] uppercase tracking-[0.14em]">
                        Opportunity Score
                      </p>
                      <p className={`mt-2 text-2xl font-semibold ${scoreStyles.text}`}>
                        {item.score.toFixed(1)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-[#0c0e12] p-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                      Opportunity Signal
                    </p>
                    <p className="mt-2 text-sm leading-7 text-zinc-200">
                      {item.signal}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-[#0c0e12] p-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                      Why Now
                    </p>
                    <p className="mt-2 text-sm leading-7 text-zinc-300">
                      {item.whyNow}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleTrack(item)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                        isTracked
                          ? "border-sky-500/20 bg-sky-500/[0.06] text-sky-200"
                          : "border-white/8 bg-[#0c0e12] text-zinc-300 hover:border-white/15 hover:text-white"
                      }`}
                    >
                      {isTracked ? "Tracked" : "Track This"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddToCalendar(item)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                        canUseCalendarAi(userPlan)
                          ? "border-white/8 bg-[#0c0e12] text-zinc-300 hover:border-white/15 hover:text-white"
                          : "border-amber-500/20 bg-amber-500/[0.06] text-amber-200"
                      }`}
                    >
                      {canUseCalendarAi(userPlan)
                        ? "Add to Calendar"
                        : "Add to Calendar • Premium"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendToWorkspace(item)}
                      className="rounded-2xl border border-white/8 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-100"
                    >
                      Send to Workspace
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGeneratePlan(item)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                        canUseExecutionMode(userPlan)
                          ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200 hover:border-emerald-400/30"
                          : "border-amber-500/20 bg-amber-500/[0.06] text-amber-200"
                      }`}
                    >
                      {canUseExecutionMode(userPlan)
                        ? "Generate Plan"
                        : "Generate Plan • Premium"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenAssistant(item)}
                      className="sm:col-span-2 rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] px-4 py-3 text-sm font-medium text-violet-200 transition hover:border-violet-400/30"
                    >
                      Open in Assistant
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </PlatformShell>
  );
}