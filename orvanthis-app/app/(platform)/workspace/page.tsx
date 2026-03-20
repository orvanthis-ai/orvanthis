"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PlatformShell from "@/components/platform-shell";
import UiToast from "@/components/ui-toast";
import {
  UiSection,
  UiEmptyState,
  UiLoadingState,
} from "@/components/ui-section";
import {
  canUseExecutionMode,
  getPlanLabel,
  hasPremium,
} from "@/lib/plan-access";
import {
  loadPersonalizationProfile,
  PersonalizationProfile,
  labelGoal,
  labelMarketStyle,
  labelBusinessStyle,
} from "@/lib/personalization";

type SavedReport = {
  id: string;
  query: string;
  result: string;
  timestamp: number;
  pinned?: boolean;
  type?: "report" | "execution";
};

const SAVED_REPORTS_KEY = "orvanthis:savedReports";
const RECENT_SEARCHES_KEY = "orvanthis:recentSearches";

function loadSavedReports(): SavedReport[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(SAVED_REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is SavedReport =>
          typeof item === "object" &&
          item !== null &&
          typeof item.id === "string" &&
          typeof item.query === "string" &&
          typeof item.result === "string" &&
          typeof item.timestamp === "number"
      )
      .sort((a, b) => {
        const aPinned = Boolean(a.pinned);
        const bPinned = Boolean(b.pinned);
        if (aPinned !== bPinned) return aPinned ? -1 : 1;
        return b.timestamp - a.timestamp;
      });
  } catch {
    return [];
  }
}

function saveSavedReports(reports: SavedReport[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(SAVED_REPORTS_KEY, JSON.stringify(reports));
  } catch {}
}

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function saveRecentSearches(searches: string[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch {}
}

function truncate(text: string, max = 220) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

function buildTemplates(profile: PersonalizationProfile | null) {
  const topSector = profile?.preferredSectors?.[0];
  const topGoal = profile?.goals?.[0];
  const marketStyle = profile ? labelMarketStyle(profile.marketStyle) : null;
  const businessStyle = profile ? labelBusinessStyle(profile.businessStyle) : null;

  return [
    {
      id: "template-strategy",
      title: "Strategic Opportunity Report",
      description: "A high-signal market or sector opportunity report.",
      query: topSector
        ? `Build a strategic report on ${topSector}, including strongest opportunities, risks, market timing, and best execution angles.`
        : "Build a strategic report on the strongest opportunities right now, including risks, timing, and execution angles.",
      premium: false,
    },
    {
      id: "template-execution",
      title: "30-Day Execution Plan",
      description: "Turn a strong idea into a concrete execution roadmap.",
      query: topSector
        ? `Create a 30-day execution plan for building around ${topSector}, including weekly priorities, risks, and next steps.`
        : "Create a 30-day execution plan for the strongest opportunity I should be focusing on right now.",
      premium: true,
    },
    {
      id: "template-market",
      title: "Market Posture Brief",
      description: "Summarize what matters in the market right now.",
      query: marketStyle
        ? `Build a market posture brief for a ${marketStyle.toLowerCase()} style, including bias, catalysts, risks, and what to watch next.`
        : "Build a market posture brief including bias, catalysts, risks, and what to watch next.",
      premium: false,
    },
    {
      id: "template-business",
      title: "Founder / Operator Plan",
      description: "A business-focused operating plan tailored to your style.",
      query: businessStyle
        ? `Build an operator-style execution plan for a ${businessStyle.toLowerCase()} focused on speed, prioritization, and practical next actions.`
        : "Build a practical operator-style execution plan focused on prioritization and next actions.",
      premium: true,
    },
    {
      id: "template-goal",
      title: "Goal-Focused Report",
      description: "A report aligned to your top objective.",
      query: topGoal
        ? `Generate a report focused on how to ${labelGoal(topGoal).toLowerCase()}, including best opportunities, execution priorities, and major risks.`
        : "Generate a report aligned to my top objective, including best opportunities, execution priorities, and major risks.",
      premium: false,
    },
  ];
}

export default function WorkspacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const userPlan =
    (session?.user as { plan?: string } | undefined)?.plan || "free";

  const [profile, setProfile] = useState<PersonalizationProfile | null>(null);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [toastTone, setToastTone] = useState<
    "success" | "warning" | "error" | "info"
  >("info");

  useEffect(() => {
    setProfile(loadPersonalizationProfile());
    setSavedReports(loadSavedReports());
    setRecentSearches(loadRecentSearches());
  }, []);

  useEffect(() => {
    const incomingQuery = searchParams.get("query");
    const autorun = searchParams.get("autorun");

    if (incomingQuery) {
      setQuery(incomingQuery);

      if (autorun === "1") {
        void runReport(incomingQuery);
      }
    }
  }, [searchParams]);

  const templates = useMemo(() => buildTemplates(profile), [profile]);

  const pinnedReports = useMemo(
    () => savedReports.filter((report) => report.pinned),
    [savedReports]
  );

  const executionPlans = useMemo(
    () => savedReports.filter((report) => report.type === "execution"),
    [savedReports]
  );

  async function runReport(
    searchQuery: string,
    type: "report" | "execution" = "report"
  ) {
    const clean = searchQuery.trim();
    if (!clean) {
      setToast("Enter a query before generating.");
      setToastTone("warning");
      return;
    }

    if (type === "execution" && !canUseExecutionMode(userPlan)) {
      setToast(
        `Execution plans are available on Premium and above. Current plan: ${getPlanLabel(
          userPlan
        )}.`
      );
      setToastTone("warning");
      setTimeout(() => router.push("/billing"), 500);
      return;
    }

    setLoading(true);
    setResult("");
    setQuery(clean);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: clean }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult(data?.error || "Failed to generate report.");
        setToast("Report generation failed.");
        setToastTone("error");
        return;
      }

      const output = data?.result || "No result generated.";
      setResult(output);

      const nextReport: SavedReport = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        query: clean,
        result: output,
        timestamp: Date.now(),
        pinned: false,
        type,
      };

      const nextReports = [nextReport, ...loadSavedReports()].slice(0, 25);
      setSavedReports(nextReports);
      saveSavedReports(nextReports);

      const nextRecent = [
        clean,
        ...loadRecentSearches().filter((item) => item !== clean),
      ].slice(0, 12);
      setRecentSearches(nextRecent);
      saveRecentSearches(nextRecent);

      setToast(
        `${type === "execution" ? "Execution plan" : "Report"} generated successfully.`
      );
      setToastTone("success");
    } catch (error) {
      console.error("Workspace generation error:", error);
      setResult("There was an error generating the report.");
      setToast("There was an error generating the report.");
      setToastTone("error");
    } finally {
      setLoading(false);
    }
  }

  function handleTogglePin(id: string) {
    const target = savedReports.find((report) => report.id === id);
    const next = savedReports
      .map((report) =>
        report.id === id ? { ...report, pinned: !report.pinned } : report
      )
      .sort((a, b) => {
        const aPinned = Boolean(a.pinned);
        const bPinned = Boolean(b.pinned);
        if (aPinned !== bPinned) return aPinned ? -1 : 1;
        return b.timestamp - a.timestamp;
      });

    setSavedReports(next);
    saveSavedReports(next);
    setToast(`${target?.pinned ? "Unpinned" : "Pinned"} saved item.`);
    setToastTone("info");
  }

  function handleDeleteReport(id: string) {
    const target = savedReports.find((report) => report.id === id);
    const next = savedReports.filter((report) => report.id !== id);
    setSavedReports(next);
    saveSavedReports(next);
    setToast(`Deleted "${target ? truncate(target.query, 40) : "item"}".`);
    setToastTone("info");
  }

  function handleLoadReport(report: SavedReport) {
    setQuery(report.query);
    setResult(report.result);
    setToast(
      `Loaded saved ${report.type === "execution" ? "execution plan" : "report"}.`
    );
    setToastTone("success");
  }

  function handleTemplateRun(template: (typeof templates)[number]) {
    if (template.premium && !hasPremium(userPlan)) {
      setToast(
        `"${template.title}" is available on Premium and above. Current plan: ${getPlanLabel(
          userPlan
        )}.`
      );
      setToastTone("warning");
      setTimeout(() => router.push("/billing"), 500);
      return;
    }

    const type =
      template.title.toLowerCase().includes("execution") ||
      template.title.toLowerCase().includes("operator")
        ? "execution"
        : "report";

    void runReport(template.query, type);
  }

  return (
    <PlatformShell
      title="Workspace"
      subtitle="Generate reports, build execution plans, and manage saved intelligence"
    >
      <div className="space-y-6">
        <UiToast
          message={toast}
          tone={toastTone}
          onClose={() => setToast("")}
        />

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <UiSection
              eyebrow="Query Workspace"
              title="Build reports and execution plans"
              right={
                <div className="rounded-full border border-white/8 bg-[#0c0e12] px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-zinc-400">
                  Current plan: {getPlanLabel(userPlan)}
                </div>
              }
            >
              <p className="max-w-2xl text-sm leading-7 text-zinc-400">
                {profile?.completed
                  ? `Workspace is personalized for ${labelMarketStyle(
                      profile.marketStyle
                    ).toLowerCase()} thinking, ${labelBusinessStyle(
                      profile.businessStyle
                    ).toLowerCase()} execution, and your current priorities.`
                  : "Generate structured intelligence, planning documents, and premium execution outputs."}
              </p>

              <div className="mt-5 space-y-4">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={6}
                  className="w-full rounded-2xl border border-white/8 bg-[#0c0e12] px-5 py-4 text-white outline-none placeholder:text-zinc-600"
                  placeholder="Ask Orvanthis to generate a strategic report, execution plan, sector analysis, or market brief..."
                />

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void runReport(query, "report")}
                    disabled={loading}
                    className="rounded-2xl border border-white/8 bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-100 disabled:opacity-60"
                  >
                    Generate Report
                  </button>

                  <button
                    type="button"
                    onClick={() => void runReport(query, "execution")}
                    disabled={loading}
                    className={`rounded-2xl border px-5 py-3 font-medium transition ${
                      canUseExecutionMode(userPlan)
                        ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200 hover:border-emerald-400/30"
                        : "border-amber-500/20 bg-amber-500/[0.06] text-amber-200"
                    }`}
                  >
                    {canUseExecutionMode(userPlan)
                      ? "Generate Execution Plan"
                      : "Execution Plan • Premium"}
                  </button>
                </div>
              </div>
            </UiSection>

            <UiSection eyebrow="Output" title="Report output">
              {loading ? (
                <UiLoadingState text="Generating..." />
              ) : result ? (
                <div className="rounded-2xl border border-white/8 bg-[#0c0e12] p-5">
                  <pre className="whitespace-pre-wrap text-sm leading-7 text-zinc-200">
                    {result}
                  </pre>
                </div>
              ) : (
                <UiEmptyState
                  title="No output yet"
                  text="Run a report or use one of the personalized templates to generate intelligence."
                />
              )}
            </UiSection>

            <UiSection eyebrow="Personalized Templates" title="Faster starting points">
              <div className="grid gap-4 md:grid-cols-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateRun(template)}
                    className={`rounded-2xl border p-5 text-left transition ${
                      template.premium && !hasPremium(userPlan)
                        ? "border-amber-500/20 bg-amber-500/[0.06] text-amber-200"
                        : "border-white/8 bg-[#0c0e12] text-zinc-300 hover:border-white/15 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-base font-semibold">{template.title}</p>
                      {template.premium && (
                        <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em]">
                          Premium
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-6 opacity-90">
                      {template.description}
                    </p>
                  </button>
                ))}
              </div>
            </UiSection>
          </section>

          <aside className="space-y-6">
            <UiSection eyebrow="Pinned Reports" title="Priority saved items">
              {pinnedReports.length === 0 ? (
                <UiEmptyState
                  title="No pinned reports yet"
                  text="Pin important reports or execution plans so they stay at the top."
                />
              ) : (
                <div className="space-y-3">
                  {pinnedReports.map((report) => (
                    <div
                      key={report.id}
                      className="rounded-xl border border-white/8 bg-[#0c0e12] p-4"
                    >
                      <p className="text-sm font-semibold text-zinc-100">
                        {truncate(report.query, 80)}
                      </p>
                      <p className="mt-2 text-xs text-zinc-500">
                        {new Date(report.timestamp).toLocaleString()}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoadReport(report)}
                          className="rounded-lg border border-white/8 bg-[#111318] px-3 py-2 text-xs text-zinc-300"
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTogglePin(report.id)}
                          className="rounded-lg border border-white/8 bg-[#111318] px-3 py-2 text-xs text-zinc-300"
                        >
                          Unpin
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </UiSection>

            <UiSection eyebrow="Execution Plans" title="Saved action plans">
              {executionPlans.length === 0 ? (
                <UiEmptyState
                  title="No saved execution plans yet"
                  text="Generate an execution plan to start building a reusable action library."
                />
              ) : (
                <div className="space-y-3">
                  {executionPlans.slice(0, 6).map((report) => (
                    <div
                      key={report.id}
                      className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] p-4"
                    >
                      <p className="text-sm font-semibold text-zinc-100">
                        {truncate(report.query, 80)}
                      </p>
                      <p className="mt-2 text-xs text-zinc-500">
                        {new Date(report.timestamp).toLocaleString()}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoadReport(report)}
                          className="rounded-lg border border-white/8 bg-[#111318] px-3 py-2 text-xs text-zinc-300"
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTogglePin(report.id)}
                          className="rounded-lg border border-white/8 bg-[#111318] px-3 py-2 text-xs text-zinc-300"
                        >
                          {report.pinned ? "Unpin" : "Pin"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </UiSection>

            <UiSection eyebrow="Recent Searches" title="Query history">
              {recentSearches.length === 0 ? (
                <UiEmptyState
                  title="No recent searches yet"
                  text="Recent queries will appear here so you can quickly rerun them."
                />
              ) : (
                <div className="space-y-3">
                  {recentSearches.slice(0, 8).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setQuery(item)}
                      className="block w-full rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-left text-sm text-zinc-300 transition hover:border-white/15 hover:text-white"
                    >
                      {truncate(item, 90)}
                    </button>
                  ))}
                </div>
              )}
            </UiSection>

            <UiSection eyebrow="Saved Reports" title="Full report history">
              {savedReports.length === 0 ? (
                <UiEmptyState
                  title="No saved reports yet"
                  text="Reports and plans you generate will be saved here automatically."
                />
              ) : (
                <div className="space-y-3">
                  {savedReports.slice(0, 10).map((report) => (
                    <div
                      key={report.id}
                      className="rounded-xl border border-white/8 bg-[#0c0e12] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-100">
                            {truncate(report.query, 70)}
                          </p>
                          <p className="mt-2 text-xs text-zinc-500">
                            {new Date(report.timestamp).toLocaleString()} •{" "}
                            {report.type === "execution" ? "Execution" : "Report"}
                          </p>
                        </div>

                        {report.pinned && (
                          <span className="rounded-full border border-sky-500/20 bg-sky-500/[0.08] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-sky-200">
                            Pinned
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-sm leading-6 text-zinc-400">
                        {truncate(report.result)}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoadReport(report)}
                          className="rounded-lg border border-white/8 bg-[#111318] px-3 py-2 text-xs text-zinc-300"
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTogglePin(report.id)}
                          className="rounded-lg border border-white/8 bg-[#111318] px-3 py-2 text-xs text-zinc-300"
                        >
                          {report.pinned ? "Unpin" : "Pin"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReport(report.id)}
                          className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-xs text-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </UiSection>
          </aside>
        </div>
      </div>
    </PlatformShell>
  );
}