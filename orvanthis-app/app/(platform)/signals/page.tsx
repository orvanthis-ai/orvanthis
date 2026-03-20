"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PlatformShell from "@/components/platform-shell";
import UiToast from "@/components/ui-toast";
import { UiSection, UiEmptyState } from "@/components/ui-section";
import {
  canUseCalendarAi,
  canUseExecutionMode,
  getPlanLabel,
  hasPremium,
} from "@/lib/plan-access";
import {
  loadPersonalizationProfile,
  PersonalizationProfile,
  labelGoal,
  labelMarketStyle,
} from "@/lib/personalization";
import { addOpportunityToCalendar } from "@/app/lib/opportunity-actions";

type SignalItem = {
  id: string;
  title: string;
  category: string;
  strength: number;
  tone: "bullish" | "neutral" | "bearish";
  timeframe: string;
  summary: string;
  whyItMatters: string;
  premiumInsight: string;
  workspaceQuery: string;
  assistantPrompt: string;
  executionPrompt: string;
  calendarTitle: string;
  calendarNote: string;
  watchlistTag: string;
};

const signals: SignalItem[] = [
  {
    id: "ai-capex",
    title: "AI Infrastructure Capex Expansion",
    category: "AI Infrastructure",
    strength: 8.8,
    tone: "bullish",
    timeframe: "Near to Mid Term",
    summary:
      "Infrastructure demand, compute constraints, and enterprise adoption continue to support AI-related expansion signals.",
    whyItMatters:
      "This signal matters because expanding AI investment can create strong second-order opportunities across infrastructure, tooling, and operational support.",
    premiumInsight:
      "The strongest edge is not just in obvious AI leaders, but in second-layer infrastructure businesses that benefit from the same demand wave with less crowded positioning.",
    workspaceQuery:
      "Build a strategic report on AI infrastructure capex expansion, second-order beneficiaries, strongest wedges, and execution timing.",
    assistantPrompt:
      "Analyze the AI infrastructure capex expansion signal and explain why it matters right now.",
    executionPrompt:
      "Turn the AI infrastructure capex expansion signal into a 30-day execution plan with priorities and next steps.",
    calendarTitle: "AI Infrastructure Signal Review",
    calendarNote:
      "Review the current AI infrastructure capex signal and decide if it should move into active execution focus.",
    watchlistTag: "AI Infrastructure",
  },
  {
    id: "defense-modernization",
    title: "Defense Modernization Software Tailwind",
    category: "Defense Software",
    strength: 8.2,
    tone: "bullish",
    timeframe: "Mid Term",
    summary:
      "Modernization pressure and procurement urgency continue supporting software-led defense opportunities.",
    whyItMatters:
      "Budget urgency and geopolitical pressure create durable incentives for software systems that improve planning, coordination, and operational effectiveness.",
    premiumInsight:
      "The best positioning often sits in mission support and workflow software rather than trying to compete directly in the most crowded prime contractor layers.",
    workspaceQuery:
      "Build a strategic report on defense modernization software tailwinds, strongest submarkets, procurement urgency, and execution risks.",
    assistantPrompt:
      "Analyze the defense modernization software signal and explain where the strongest opportunity may be.",
    executionPrompt:
      "Build a realistic execution plan around the defense modernization software opportunity.",
    calendarTitle: "Defense Software Signal Review",
    calendarNote:
      "Reassess whether defense modernization software should move higher in the execution queue.",
    watchlistTag: "Defense Software",
  },
  {
    id: "macro-volatility",
    title: "Macro Volatility Risk Window",
    category: "Macro",
    strength: 7.6,
    tone: "neutral",
    timeframe: "Short Term",
    summary:
      "Markets remain sensitive to macro catalysts, which increases the value of preparation, timing, and disciplined execution.",
    whyItMatters:
      "Even strong opportunities can underperform in unstable macro conditions, so timing and risk framing become more important.",
    premiumInsight:
      "The best use of this signal is not panic — it is sequencing. Prioritize flexible execution, tighter review loops, and calendar-based preparation around known catalysts.",
    workspaceQuery:
      "Build a strategic report on macro volatility risk, execution timing, and how to position around unstable market conditions.",
    assistantPrompt:
      "Explain the macro volatility risk window and what it means for near-term decision making.",
    executionPrompt:
      "Create a practical plan for operating during a macro volatility risk window.",
    calendarTitle: "Macro Volatility Review",
    calendarNote:
      "Review macro volatility conditions and prepare around the next likely catalyst window.",
    watchlistTag: "Macro",
  },
  {
    id: "industrial-automation",
    title: "Industrial Automation Efficiency Pressure",
    category: "Industrial Automation",
    strength: 7.9,
    tone: "bullish",
    timeframe: "Mid Term",
    summary:
      "Labor pressure and efficiency demand continue supporting automation and software-enabled industrial workflows.",
    whyItMatters:
      "This creates a durable reason for buyers to move faster on automation, especially where ROI can be made clear.",
    premiumInsight:
      "The strongest angle is often not broad automation messaging, but narrowly defined workflow value tied to labor constraints and measurable savings.",
    workspaceQuery:
      "Build a strategic report on industrial automation efficiency pressure, strongest use cases, buyer urgency, and execution opportunities.",
    assistantPrompt:
      "Analyze the industrial automation efficiency signal and explain why it matters now.",
    executionPrompt:
      "Create a step-by-step execution plan around industrial automation efficiency pressure.",
    calendarTitle: "Industrial Automation Signal Review",
    calendarNote:
      "Review whether industrial automation deserves a higher-priority execution sprint.",
    watchlistTag: "Industrial Automation",
  },
  {
    id: "compliance-burden",
    title: "Compliance Burden Automation Signal",
    category: "Compliance Tech",
    strength: 7.5,
    tone: "bullish",
    timeframe: "Mid Term",
    summary:
      "Rising reporting, tracking, and governance pressure keeps supporting compliance automation demand.",
    whyItMatters:
      "The more compliance burden rises, the more buyers seek tools that reduce manual work and lower operational risk.",
    premiumInsight:
      "The best opportunities often sit in narrow, painful workflows where compliance burden is repetitive, auditable, and expensive to manage manually.",
    workspaceQuery:
      "Build a strategic report on compliance burden automation, strongest vertical opportunities, and execution timing.",
    assistantPrompt:
      "Explain the compliance burden automation signal and where the strongest wedge might be.",
    executionPrompt:
      "Turn the compliance burden automation signal into a focused execution roadmap.",
    calendarTitle: "Compliance Automation Signal Review",
    calendarNote:
      "Review compliance burden automation as a candidate for active execution priority.",
    watchlistTag: "Compliance Tech",
  },
];

function getToneStyles(tone: SignalItem["tone"]) {
  if (tone === "bullish") {
    return {
      badge: "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-200",
      panel: "border-emerald-500/15 bg-emerald-500/[0.05]",
    };
  }

  if (tone === "bearish") {
    return {
      badge: "border-red-500/20 bg-red-500/[0.08] text-red-200",
      panel: "border-red-500/15 bg-red-500/[0.05]",
    };
  }

  return {
    badge: "border-amber-500/20 bg-amber-500/[0.08] text-amber-200",
    panel: "border-amber-500/15 bg-amber-500/[0.05]",
  };
}

function personalizeSignal(
  signal: SignalItem,
  profile: PersonalizationProfile | null
) {
  if (!profile?.completed) return signal;

  const topSector = profile.preferredSectors[0];
  const topGoal = profile.goals[0] ? labelGoal(profile.goals[0]) : null;

  let personalizedSummary = signal.summary;
  if (topSector && signal.category.toLowerCase().includes(topSector.toLowerCase())) {
    personalizedSummary = `${signal.summary} This aligns directly with your current sector preference in ${topSector}.`;
  }

  let personalizedWhy = signal.whyItMatters;
  if (topGoal) {
    personalizedWhy = `${signal.whyItMatters} This is especially relevant if your priority is to ${topGoal.toLowerCase()}.`;
  }

  return {
    ...signal,
    summary: personalizedSummary,
    whyItMatters: personalizedWhy,
  };
}

export default function SignalsPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const userPlan =
    (session?.user as { plan?: string } | undefined)?.plan || "free";

  const [profile, setProfile] = useState<PersonalizationProfile | null>(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<
    "success" | "warning" | "error" | "info"
  >("info");

  useEffect(() => {
    setProfile(loadPersonalizationProfile());
  }, []);

  const personalizedSignals = useMemo(() => {
    return signals
      .map((signal) => personalizeSignal(signal, profile))
      .sort((a, b) => b.strength - a.strength);
  }, [profile]);

  const signalHeadline = useMemo(() => {
    if (!profile?.completed) {
      return "Smart signals across strategic sectors";
    }

    const sector = profile.preferredSectors[0];
    const style = labelMarketStyle(profile.marketStyle).toLowerCase();

    if (sector) {
      return `Smart signals for ${sector} and a ${style} style`;
    }

    return `Smart signals for a ${style} approach`;
  }, [profile]);

  function goToBilling(message: string) {
    setFeedback(message);
    setFeedbackTone("warning");
    setTimeout(() => {
      router.push("/billing");
    }, 500);
  }

  function handleOpenAssistant(signal: SignalItem) {
    router.push(
      `/assistant?prompt=${encodeURIComponent(signal.assistantPrompt)}`
    );
  }

  function handleSendToWorkspace(signal: SignalItem) {
    router.push(
      `/workspace?query=${encodeURIComponent(signal.workspaceQuery)}&autorun=1`
    );
  }

  function handleGeneratePlan(signal: SignalItem) {
    if (!canUseExecutionMode(userPlan)) {
      goToBilling(
        `Generate Plan is available on Premium and above. Current plan: ${getPlanLabel(
          userPlan
        )}.`
      );
      return;
    }

    router.push(
      `/assistant?prompt=${encodeURIComponent(signal.executionPrompt)}`
    );
  }

  function handleAddToCalendar(signal: SignalItem) {
    if (!canUseCalendarAi(userPlan)) {
      goToBilling(
        `Add to Calendar is available on Premium and above. Current plan: ${getPlanLabel(
          userPlan
        )}.`
      );
      return;
    }

    const added = addOpportunityToCalendar({
      title: signal.calendarTitle,
      note: signal.calendarNote,
      watchlistTag: signal.watchlistTag,
    });

    setFeedback(
      added
        ? `"${signal.title}" was added to your calendar.`
        : `Unable to add "${signal.title}" to the calendar.`
    );
    setFeedbackTone(added ? "success" : "error");
  }

  return (
    <PlatformShell
      title="Signals"
      subtitle="Track personalized strategic signals and convert them into action"
    >
      <div className="space-y-6">
        <UiSection
          eyebrow="Smart Signals Engine"
          title={signalHeadline}
          right={
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.05] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-sky-200/80">
                  Signals
                </p>
                <p className="mt-2 text-3xl font-semibold text-zinc-100">
                  {personalizedSignals.length}
                </p>
              </div>

              <div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.05] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-violet-200/80">
                  Plan
                </p>
                <p className="mt-2 text-xl font-semibold text-zinc-100">
                  {getPlanLabel(userPlan)}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.05] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-amber-200/80">
                  Profile
                </p>
                <p className="mt-2 text-sm font-semibold text-zinc-100">
                  {profile?.completed ? "Personalized" : "Generic"}
                </p>
              </div>
            </div>
          }
        >
          <p className="max-w-3xl text-sm leading-7 text-zinc-400">
            Signals help you understand where pressure, momentum, and strategic urgency are building — then move straight into analysis, planning, and calendar tracking.
          </p>

          <div className="mt-5">
            <UiToast
              message={feedback}
              tone={feedbackTone}
              onClose={() => setFeedback("")}
            />
          </div>
        </UiSection>

        <section className="grid gap-5 xl:grid-cols-2">
          {personalizedSignals.length === 0 ? (
            <UiEmptyState
              title="No signals available"
              text="Signals will appear here as Orvanthis builds your strategic read."
            />
          ) : (
            personalizedSignals.map((signal) => {
              const toneStyles = getToneStyles(signal.tone);

              return (
                <div
                  key={signal.id}
                  className="rounded-[28px] border border-white/8 bg-[#111318] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-violet-500/15 bg-violet-500/[0.06] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-violet-200/80">
                            {signal.category}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${toneStyles.badge}`}
                          >
                            {signal.tone}
                          </span>
                          <span className="rounded-full border border-white/8 bg-[#0c0e12] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                            {signal.timeframe}
                          </span>
                        </div>

                        <h4 className="mt-4 text-2xl font-semibold text-zinc-100">
                          {signal.title}
                        </h4>
                      </div>

                      <div className={`rounded-2xl border px-4 py-3 ${toneStyles.panel}`}>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                          Signal Strength
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-zinc-100">
                          {signal.strength.toFixed(1)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-[#0c0e12] p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                        Summary
                      </p>
                      <p className="mt-2 text-sm leading-7 text-zinc-200">
                        {signal.summary}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-[#0c0e12] p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                        Why It Matters
                      </p>
                      <p className="mt-2 text-sm leading-7 text-zinc-300">
                        {signal.whyItMatters}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-[#0c0e12] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                          Premium Signal Insight
                        </p>
                        {!hasPremium(userPlan) && (
                          <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-amber-200">
                            Premium
                          </span>
                        )}
                      </div>

                      {hasPremium(userPlan) ? (
                        <p className="mt-2 text-sm leading-7 text-zinc-200">
                          {signal.premiumInsight}
                        </p>
                      ) : (
                        <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
                          <p className="text-sm leading-7 text-amber-200">
                            Premium unlocks deeper signal interpretation, stronger framing, and more execution-oriented signal guidance.
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              goToBilling(
                                "Premium Signal Insight is available on Premium and above."
                              )
                            }
                            className="mt-3 rounded-xl border border-amber-500/20 bg-[#111318] px-4 py-2 text-sm font-medium text-amber-200"
                          >
                            Unlock Premium
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => handleOpenAssistant(signal)}
                        className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] px-4 py-3 text-sm font-medium text-violet-200 transition hover:border-violet-400/30"
                      >
                        Open in Assistant
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendToWorkspace(signal)}
                        className="rounded-2xl border border-white/8 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-100"
                      >
                        Send to Workspace
                      </button>

                      <button
                        type="button"
                        onClick={() => handleGeneratePlan(signal)}
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
                        onClick={() => handleAddToCalendar(signal)}
                        className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                          canUseCalendarAi(userPlan)
                            ? "border-sky-500/20 bg-sky-500/[0.06] text-sky-200 hover:border-sky-400/30"
                            : "border-amber-500/20 bg-amber-500/[0.06] text-amber-200"
                        }`}
                      >
                        {canUseCalendarAi(userPlan)
                          ? "Add to Calendar"
                          : "Add to Calendar • Premium"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </PlatformShell>
  );
}