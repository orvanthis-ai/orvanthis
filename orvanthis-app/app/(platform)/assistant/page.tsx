"use client";

import { useEffect, useMemo, useState } from "react";
import PlatformShell from "@/components/platform-shell";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  canUseExecutionMode,
  canUseTraderMode,
  getPlanLabel,
} from "@/lib/plan-access";
import {
  loadPersonalizationProfile,
  labelBusinessStyle,
  labelGoal,
  labelMarketStyle,
  PersonalizationProfile,
} from "@/lib/personalization";

type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

type AssistantMode = "chat" | "intelligence" | "execution" | "trader";

const BASE_MODE_CONFIG: Record<
  AssistantMode,
  {
    label: string;
    title: string;
    description: string;
    accent: string;
    quickPrompts: string[];
    placeholder: string;
    requiredPlan: "free" | "premium";
  }
> = {
  chat: {
    label: "Chat Mode",
    title: "Conversational assistant",
    description:
      "Natural, human-style conversation for explanations, questions, and back-and-forth discussion.",
    accent: "border-sky-500/20 bg-sky-500/[0.06] text-sky-200",
    quickPrompts: [
      "What is FOMC?",
      "Explain inflation like I’m new to markets",
      "What’s the difference between bullish and bearish?",
      "Why do interest rates move stocks?",
    ],
    placeholder: "Ask naturally... e.g. What is FOMC?",
    requiredPlan: "free",
  },
  intelligence: {
    label: "Intelligence Mode",
    title: "Structured analysis",
    description:
      "High-signal structured outputs for market research, opportunity scoring, and executive analysis.",
    accent: "border-violet-500/20 bg-violet-500/[0.06] text-violet-200",
    quickPrompts: [
      "Analyze AI infrastructure opportunities",
      "Build a strategic report on defense software",
      "Compare two high-growth sectors",
      "Summarize the strongest business opportunities right now",
    ],
    placeholder: "Ask for structured intelligence...",
    requiredPlan: "free",
  },
  execution: {
    label: "Execution Mode",
    title: "Action planning",
    description:
      "Turns research into execution steps, timelines, priorities, and next actions.",
    accent: "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200",
    quickPrompts: [
      "Turn this market opportunity into a 30-day execution plan",
      "What should I do this week if I want to build around AI agents?",
      "Give me a step-by-step launch plan for a premium SaaS product",
      "Build an action plan for validating a new business idea",
    ],
    placeholder: "Ask for a plan, next steps, or execution strategy...",
    requiredPlan: "premium",
  },
  trader: {
    label: "Trader Mode",
    title: "Fast market read",
    description:
      "Short, direct market and trading-style responses focused on bias, catalysts, and levels to watch.",
    accent: "border-amber-500/20 bg-amber-500/[0.06] text-amber-200",
    quickPrompts: [
      "What’s the market bias today?",
      "Give me a fast read on SPY and QQQ",
      "What should I watch this week for volatility?",
      "Summarize the top market catalysts right now",
    ],
    placeholder: "Ask for a quick market read...",
    requiredPlan: "premium",
  },
};

function buildPersonalizationContext(profile: PersonalizationProfile | null) {
  if (!profile) return "";

  const goals = profile.goals.length
    ? profile.goals.map(labelGoal).join(", ")
    : "Not specified";

  const sectors = profile.preferredSectors.length
    ? profile.preferredSectors.join(", ")
    : "Not specified";

  const presets = profile.watchlistPresets.length
    ? profile.watchlistPresets.join(", ")
    : "Not specified";

  return `
USER PERSONALIZATION PROFILE
Goals: ${goals}
Market Style: ${labelMarketStyle(profile.marketStyle)}
Business Style: ${labelBusinessStyle(profile.businessStyle)}
Preferred Sectors: ${sectors}
Watchlist Presets: ${presets}
Default Assistant Mode: ${profile.assistantDefaultMode}

Use this context to shape your priorities, examples, framing, and recommendations.
When relevant:
- Favor the user's preferred sectors.
- Match the user's market and business style.
- Align answers with the user's goals.
- Keep personalization helpful, not repetitive.
`;
}

function buildPrompt(
  mode: AssistantMode,
  userInput: string,
  profile: PersonalizationProfile | null
) {
  const personalizationContext = buildPersonalizationContext(profile);

  if (mode === "chat") {
    return `You are Orvanthis AI in CHAT MODE.

Speak like a smart, helpful human strategist.

Rules:
- Be natural and conversational.
- Explain clearly and simply.
- Do not force rigid formatting.
- Be insightful, direct, and easy to understand.
- Use short paragraphs.
- Answer the user's actual question directly first.
- When useful, tailor examples to the user's interests and priorities.

${personalizationContext}

User question:
${userInput}`;
  }

  if (mode === "intelligence") {
    return `You are an AI opportunity intelligence analyst for the platform Orvanthis.

Your job is to produce SHORT, DIRECT, HIGH-SIGNAL opportunity briefs.

DO NOT write long essays.
DO NOT write filler paragraphs.
Be concise and structured.

${personalizationContext}

Return the report using this exact structure:

OPPORTUNITY: <name of opportunity>

SCORE: <number between 1 and 10>

CATEGORY: <industry category>

STAGE: <emerging / growth / mature>

KEY SIGNALS
• signal
• signal
• signal

MARKET SIZE
TAM: <estimated total addressable market>

TOP COMPANIES
• company
• company
• company

WHY THIS OPPORTUNITY EXISTS
<2-3 sentences maximum>

BULL CASE
• point
• point
• point

BEAR CASE
• point
• point

RISKS
• risk
• risk

TIME HORIZON
<years>

ACTIONABLE TAKEAWAY
<short recommendation>

Now generate the report for:

${userInput}`;
  }

  if (mode === "execution") {
    return `You are Orvanthis AI in EXECUTION MODE.

Your job is to turn opportunities, ideas, and research into clear action.

Rules:
- Think like an operator, founder, strategist, or execution-focused advisor.
- Be concrete and practical.
- Prioritize what should be done first.
- Focus on execution, not theory.
- Keep it clear, direct, and structured.
- Adapt priorities to the user's business style, goals, and preferred sectors.

${personalizationContext}

Return your answer in this structure:

OBJECTIVE
<one sentence>

WHY THIS MATTERS
<2-3 sentences max>

TOP PRIORITIES
1. <priority>
2. <priority>
3. <priority>

30-DAY EXECUTION PLAN
Week 1: <actions>
Week 2: <actions>
Week 3: <actions>
Week 4: <actions>

RISKS TO WATCH
• risk
• risk
• risk

NEXT BEST ACTION
<single best next move>

Now build the execution response for:

${userInput}`;
  }

  return `You are Orvanthis AI in TRADER MODE.

Your job is to respond like a fast, sharp market and trading assistant.

Rules:
- Be short, clear, and direct.
- Focus on market bias, catalysts, momentum, levels, and near-term risk.
- Do not write long essays.
- Sound like a professional market operator.
- Keep each section tight.
- Adapt market framing to the user's market style and preferred sectors.

${personalizationContext}

Return your answer in this structure:

MARKET BIAS
<bullish / bearish / neutral>

WHY
<short explanation>

KEY CATALYSTS
• catalyst
• catalyst
• catalyst

WHAT TO WATCH
• item
• item
• item

RISK
<short risk note>

TRADER TAKE
<short tactical read>

Now respond for:

${userInput}`;
}

function getPersonalizedQuickPrompts(
  mode: AssistantMode,
  profile: PersonalizationProfile | null
) {
  const fallback = BASE_MODE_CONFIG[mode].quickPrompts;
  if (!profile) return fallback;

  const topSector = profile.preferredSectors[0];
  const topGoal = profile.goals[0];

  if (mode === "chat") {
    const prompts = [
      topSector
        ? `Explain the biggest opportunity in ${topSector} right now`
        : null,
      profile.marketStyle
        ? `Explain how a ${labelMarketStyle(
            profile.marketStyle
          ).toLowerCase()} approach changes decision-making`
        : null,
      topGoal
        ? `How should I think about my goal to ${labelGoal(topGoal).toLowerCase()}?`
        : null,
      "What should I focus on first inside Orvanthis?",
    ].filter(Boolean) as string[];

    return prompts.length ? prompts : fallback;
  }

  if (mode === "intelligence") {
    const prompts = [
      topSector ? `Build a strategic report on ${topSector}` : null,
      topGoal
        ? `Generate high-signal opportunities that align with ${labelGoal(
            topGoal
          ).toLowerCase()}`
        : null,
      profile.watchlistPresets[0]
        ? `Summarize the strongest opportunities around ${profile.watchlistPresets[0]}`
        : null,
      "Compare the strongest sectors for execution right now",
    ].filter(Boolean) as string[];

    return prompts.length ? prompts : fallback;
  }

  if (mode === "execution") {
    const prompts = [
      topSector ? `Turn ${topSector} into a 30-day execution plan` : null,
      topGoal
        ? `Build an execution roadmap around my goal to ${labelGoal(
            topGoal
          ).toLowerCase()}`
        : null,
      `Give me an execution plan that matches a ${labelBusinessStyle(
        profile.businessStyle
      ).toLowerCase()} style`,
      "What should I do this week to make real progress?",
    ].filter(Boolean) as string[];

    return prompts.length ? prompts : fallback;
  }

  const prompts = [
    topSector ? `Give me a fast trader read on ${topSector}` : null,
    `What should a ${labelMarketStyle(
      profile.marketStyle
    ).toLowerCase()} trader focus on right now?`,
    profile.watchlistPresets[0]
      ? `What is the tactical setup around ${profile.watchlistPresets[0]}?`
      : null,
    "Summarize the top market catalysts right now",
  ].filter(Boolean) as string[];

  return prompts.length ? prompts : fallback;
}

function getPersonalizedPlaceholder(
  mode: AssistantMode,
  profile: PersonalizationProfile | null
) {
  if (!profile || !profile.preferredSectors.length) {
    return BASE_MODE_CONFIG[mode].placeholder;
  }

  const sector = profile.preferredSectors[0];

  if (mode === "chat") {
    return `Ask naturally... e.g. What is the outlook for ${sector}?`;
  }
  if (mode === "intelligence") {
    return `Ask for structured intelligence on ${sector}...`;
  }
  if (mode === "execution") {
    return `Ask for an execution plan around ${sector}...`;
  }

  return `Ask for a quick trader read on ${sector}...`;
}

function getAgentFromMode(mode: AssistantMode) {
  if (mode === "execution") return "Execution Agent";
  if (mode === "intelligence") return "Research Agent";
  if (mode === "trader") return "Strategy Agent";
  return "Strategy Agent";
}

export default function AssistantPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const userPlan =
    (session?.user as { plan?: string } | undefined)?.plan || "free";

  const [profile, setProfile] = useState<PersonalizationProfile | null>(null);
  const [mode, setMode] = useState<AssistantMode>("chat");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [upgradePrompt, setUpgradePrompt] = useState("");
  const [saveToast, setSaveToast] = useState("");
  const [isSavingRun, setIsSavingRun] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content:
        "I’m Orvanthis AI Assistant. I’ll adapt to your goals, sectors, and working style as your personalization profile is completed.",
    },
  ]);

  useEffect(() => {
    const loadedProfile = loadPersonalizationProfile();
    setProfile(loadedProfile);

    if (loadedProfile?.completed) {
      setMode(loadedProfile.assistantDefaultMode);
    }

    const starter = searchParams.get("prompt");
    if (starter) {
      setInput(starter);
    }
  }, [searchParams]);

  const currentMode = useMemo(() => BASE_MODE_CONFIG[mode], [mode]);

  const personalizedQuickPrompts = useMemo(
    () => getPersonalizedQuickPrompts(mode, profile),
    [mode, profile]
  );

  const personalizedPlaceholder = useMemo(
    () => getPersonalizedPlaceholder(mode, profile),
    [mode, profile]
  );

  const lastAssistantMessage = useMemo(() => {
    return [...messages].reverse().find((message) => message.role === "assistant");
  }, [messages]);

  function isModeLocked(modeKey: AssistantMode) {
    if (modeKey === "execution") return !canUseExecutionMode(userPlan);
    if (modeKey === "trader") return !canUseTraderMode(userPlan);
    return false;
  }

  function handleModeChange(nextMode: AssistantMode) {
    if (isModeLocked(nextMode)) {
      setUpgradePrompt(
        `${BASE_MODE_CONFIG[nextMode].label} is available on Premium and above.`
      );
      return;
    }

    setUpgradePrompt("");
    setMode(nextMode);
  }

  async function sendMessage(customInput?: string) {
    const clean = (customInput ?? input).trim();
    if (!clean) return;

    if (isModeLocked(mode)) {
      setUpgradePrompt(
        `${currentMode.label} is locked on the ${getPlanLabel(
          userPlan
        )} plan. Upgrade to Premium to use it.`
      );
      return;
    }

    const nextMessages: AssistantMessage[] = [
      ...messages,
      { role: "user", content: clean },
    ];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setSaveToast("");

    try {
      const prompt = buildPrompt(mode, clean, profile);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          query: prompt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const serverMessage =
          data?.message || data?.error || "Assistant request failed.";

        setMessages([
          ...nextMessages,
          {
            role: "assistant",
            content: serverMessage,
          },
        ]);
        return;
      }

      const assistantReply =
        (data?.result as string) ||
        "I couldn’t generate a useful assistant response.";

      setMessages([
        ...nextMessages,
        { role: "assistant", content: assistantReply },
      ]);
    } catch (error) {
      console.error("Assistant error:", error);
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: "There was an error contacting the assistant.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function saveAssistantOutputToMemory() {
    try {
      setIsSavingRun(true);
      setSaveToast("");

      const promptValue = input.trim()
        ? input
        : [...messages].reverse().find((message) => message.role === "user")
            ?.content || "";

      const outputValue = lastAssistantMessage?.content || "";

      if (!promptValue.trim() || !outputValue.trim()) {
        setSaveToast("Nothing to save yet.");
        return;
      }

      const res = await fetch("/api/agent-runs/save-output", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent: getAgentFromMode(mode),
          title: `${currentMode.label} Saved Output`,
          prompt: promptValue,
          route: "assistant",
          output: outputValue,
          notes: "",
          favorite: false,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSaveToast(data?.message || "Failed to save output.");
        return;
      }

      setSaveToast("Assistant output saved to Agent Console.");
    } catch (error) {
      console.error(error);
      setSaveToast("Failed to save output.");
    } finally {
      setIsSavingRun(false);
    }
  }

  function clearChat() {
    setMessages([
      {
        role: "assistant",
        content:
          "I’m Orvanthis AI Assistant. I’ll adapt to your goals, sectors, and working style as your personalization profile is completed.",
      },
    ]);
    setSaveToast("");
  }

  return (
    <PlatformShell
      title="AI Assistant"
      subtitle="Switch between conversational, intelligence, execution, and trader workflows"
    >
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <section className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Assistant Modes
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-zinc-100">
                Personalized multi-mode AI assistant
              </h3>
            </div>

            <div className="rounded-full border border-white/8 bg-[#0c0e12] px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-zinc-400">
              Current plan: {getPlanLabel(userPlan)}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {(Object.keys(BASE_MODE_CONFIG) as AssistantMode[]).map((modeKey) => {
              const item = BASE_MODE_CONFIG[modeKey];
              const active = mode === modeKey;
              const locked = isModeLocked(modeKey);

              return (
                <button
                  key={modeKey}
                  type="button"
                  onClick={() => handleModeChange(modeKey)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    active && !locked
                      ? item.accent
                      : "border-white/8 bg-[#0c0e12] text-zinc-300 hover:border-white/15 hover:bg-[#101317]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-[0.16em]">
                      {item.label}
                    </p>
                    {locked && (
                      <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-amber-200">
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-base font-semibold">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>

          {upgradePrompt ? (
            <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-4">
              <p className="text-sm text-amber-200">{upgradePrompt}</p>
              <button
                type="button"
                onClick={() => router.push("/billing")}
                className="mt-3 rounded-xl border border-amber-500/20 bg-[#111318] px-4 py-2 text-sm font-medium text-amber-200"
              >
                View Plans
              </button>
            </div>
          ) : null}

          {saveToast ? (
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-200">
              {saveToast}
            </div>
          ) : null}

          <div className="mt-5 rounded-2xl border border-white/8 bg-[#0c0e12] p-4">
            <div className="max-h-[540px] space-y-4 overflow-y-auto pr-1">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`rounded-2xl px-4 py-4 text-sm leading-7 ${
                    message.role === "assistant"
                      ? "border border-sky-500/15 bg-sky-500/[0.05] text-zinc-200"
                      : "border border-white/8 bg-[#111318] text-white"
                  }`}
                >
                  <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                    {message.role === "assistant" ? "Orvanthis" : "You"}
                  </p>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}

              {loading ? (
                <div className="rounded-2xl border border-white/8 bg-[#111318] px-4 py-4 text-sm text-zinc-400">
                  Thinking...
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void sendMessage();
                }
              }}
              className="flex-1 rounded-2xl border border-white/8 bg-[#0c0e12] px-5 py-4 text-white outline-none placeholder:text-zinc-600"
              placeholder={personalizedPlaceholder}
            />

            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={loading}
              className="rounded-2xl border border-white/8 bg-white px-6 py-4 font-semibold text-black transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Send
            </button>

            <button
              type="button"
              onClick={() => clearChat()}
              className="rounded-2xl border border-white/8 bg-[#0c0e12] px-5 py-4 font-medium text-zinc-300 transition hover:border-white/15 hover:text-white"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => void saveAssistantOutputToMemory()}
              disabled={isSavingRun || loading}
              className="rounded-2xl border border-white/8 bg-[#0c0e12] px-5 py-4 font-medium text-zinc-300 transition hover:border-white/15 hover:text-white disabled:opacity-50"
            >
              {isSavingRun ? "Saving..." : "Save to Agent Console"}
            </button>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Current Mode
            </p>

            <div className={`mt-4 rounded-2xl border p-5 ${currentMode.accent}`}>
              <p className="text-lg font-semibold text-zinc-100">
                {currentMode.label}
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-200/90">
                {currentMode.description}
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Personalized Quick Prompts
              </p>
              {isModeLocked(mode) ? (
                <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-amber-200">
                  Locked
                </span>
              ) : null}
            </div>

            <div className="mt-4 space-y-3">
              {personalizedQuickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    if (isModeLocked(mode)) {
                      setUpgradePrompt(
                        `${currentMode.label} is available on Premium and above.`
                      );
                      return;
                    }
                    setInput(prompt);
                  }}
                  className={`block w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                    isModeLocked(mode)
                      ? "border-white/8 bg-[#0a0c10] text-zinc-600"
                      : "border-white/8 bg-[#0c0e12] text-zinc-300 hover:border-zinc-500 hover:bg-[#101317] hover:text-white"
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Personalization Active
            </p>

            <div className="mt-4 space-y-3 text-sm text-zinc-400">
              <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3">
                Goals:{" "}
                {profile?.goals?.length
                  ? profile.goals.map(labelGoal).join(", ")
                  : "Not configured"}
              </div>
              <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3">
                Market Style:{" "}
                {profile ? labelMarketStyle(profile.marketStyle) : "Not configured"}
              </div>
              <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3">
                Business Style:{" "}
                {profile
                  ? labelBusinessStyle(profile.businessStyle)
                  : "Not configured"}
              </div>
              <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3">
                Preferred Sectors:{" "}
                {profile?.preferredSectors?.length
                  ? profile.preferredSectors.join(", ")
                  : "Not configured"}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[#111318] p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Premium Unlocks
            </p>

            <div className="mt-4 space-y-3 text-sm text-zinc-400">
              <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3">
                Chat + Intelligence on Free
              </div>
              <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] px-4 py-3 text-emerald-200">
                Execution Mode on Premium
              </div>
              <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.05] px-4 py-3 text-amber-200">
                Trader Mode on Premium
              </div>
            </div>
          </div>
        </aside>
      </div>
    </PlatformShell>
  );
}