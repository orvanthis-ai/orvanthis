"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import PlatformShell from "@/components/platform-shell";
import UiToast from "@/components/ui-toast";
import { UiSection } from "@/components/ui-section";

const KEYS_TO_CLEAR = [
  "orvanthis:personalizationProfile",
  "orvanthis:watchlists",
  "orvanthis:savedReports",
  "orvanthis:recentSearches",
  "orvanthis:calendarEvents:v2",
  "orvanthis:calendarPrefs:v1",
  "orvanthis:trackedOpportunities",
  "orvanthis:prelaunchChecklist:v1",
  "orvanthis:taskRunner:v1",
  "orvanthis:agentMemory:v1",
  "orvanthis:devPlanOverride",
];

function seedDemoData() {
  const now = Date.now();

  const reports = [
    {
      id: `demo-report-${now}`,
      query:
        "Build a strategic report on AI infrastructure opportunities, risks, market timing, and strongest execution wedges.",
      result:
        "OPPORTUNITY: AI Infrastructure\n\nSCORE: 8.8\n\nCATEGORY: AI Infrastructure\n\nSTAGE: Growth\n\nKEY SIGNALS\n• Enterprise adoption still rising\n• Compute bottlenecks remain real\n• Tooling layer continues expanding\n\nACTIONABLE TAKEAWAY\nPrioritize infrastructure-adjacent software and operational tooling.",
      timestamp: now,
      pinned: true,
      type: "report",
    },
    {
      id: `demo-execution-${now + 1}`,
      query:
        "Create a 30-day execution plan for building around AI infrastructure.",
      result:
        "OBJECTIVE\nBuild a focused wedge around AI infrastructure.\n\nTOP PRIORITIES\n1. Pick one narrow use case\n2. Validate customer pain\n3. Ship a thin execution layer",
      timestamp: now + 1,
      pinned: false,
      type: "execution",
    },
  ];

  const recentSearches = [
    "Build a strategic report on AI infrastructure opportunities",
    "Create a 30-day execution plan for compliance technology",
    "Summarize the top market catalysts right now",
  ];

  const watchlists = [
    "AI Infrastructure",
    "AI Leaders",
    "Macro",
    "Execution Targets",
  ];

  const calendarEvents = [
    {
      id: `demo-event-${now}`,
      title: "AI Infrastructure Review",
      date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      type: "opportunity",
      source: "opportunity",
      priority: "high",
      status: "upcoming",
      pinned: true,
      watchlistTag: "AI Infrastructure",
      note: "Reassess strongest wedges and timing.",
      aiSummary:
        "This review is meant to keep AI infrastructure at the top of the execution queue.",
      actionNote:
        "Choose one wedge and move it into an execution plan.",
    },
  ];

  const personalization = {
    completed: true,
    goals: ["find-opportunities", "execute-faster"],
    marketStyle: "growth",
    businessStyle: "operator",
    preferredSectors: ["AI Infrastructure", "Macro"],
    watchlistPresets: ["AI Leaders", "Execution Targets"],
    assistantDefaultMode: "intelligence",
  };

  const tracked = ["ai-infra", "defense-software"];

  localStorage.setItem("orvanthis:savedReports", JSON.stringify(reports));
  localStorage.setItem(
    "orvanthis:recentSearches",
    JSON.stringify(recentSearches)
  );
  localStorage.setItem("orvanthis:watchlists", JSON.stringify(watchlists));
  localStorage.setItem(
    "orvanthis:calendarEvents:v2",
    JSON.stringify(calendarEvents)
  );
  localStorage.setItem(
    "orvanthis:personalizationProfile",
    JSON.stringify(personalization)
  );
  localStorage.setItem(
    "orvanthis:trackedOpportunities",
    JSON.stringify(tracked)
  );
}

export default function DevAdminPage() {
  const { data: session, status } = useSession();
  const [allowed, setAllowed] = useState(false);
  const [toast, setToast] = useState("");
  const [toastTone, setToastTone] = useState<
    "success" | "warning" | "error" | "info"
  >("info");

  useEffect(() => {
    const isDev = process.env.NODE_ENV === "development";
    const localEmail =
      (session?.user as { email?: string } | undefined)?.email || "";

    setAllowed(isDev && Boolean(localEmail));
  }, [session]);

  if (status === "loading") {
    return (
      <PlatformShell title="Dev Admin" subtitle="Loading developer access...">
        <div className="rounded-2xl border border-white/8 bg-[#111318] p-6 text-zinc-300">
          Loading...
        </div>
      </PlatformShell>
    );
  }

  if (!allowed) {
    return (
      <PlatformShell title="Dev Admin" subtitle="Restricted">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-6 text-red-200">
          Dev Admin is only available in local development while authenticated.
        </div>
      </PlatformShell>
    );
  }

  function setDevPlan(plan: "free" | "premium" | "premium_plus") {
    localStorage.setItem("orvanthis:devPlanOverride", plan);
    setToast(`Dev plan override set to ${plan}.`);
    setToastTone("success");
  }

  function clearDevPlan() {
    localStorage.removeItem("orvanthis:devPlanOverride");
    setToast("Dev plan override cleared.");
    setToastTone("info");
  }

  function resetPersonalization() {
    localStorage.removeItem("orvanthis:personalizationProfile");
    localStorage.removeItem("orvanthis:watchlists");
    setToast("Personalization and smart watchlists reset.");
    setToastTone("warning");
  }

  function clearAllLocalData() {
    KEYS_TO_CLEAR.forEach((key) => localStorage.removeItem(key));
    setToast("All Orvanthis local dev data cleared.");
    setToastTone("warning");
  }

  function handleSeedDemo() {
    seedDemoData();
    setToast("Demo data seeded successfully.");
    setToastTone("success");
  }

  return (
    <PlatformShell
      title="Dev Admin"
      subtitle="Internal tools for testing plans, data, and product flows"
    >
      <div className="space-y-6">
        <UiToast
          message={toast}
          tone={toastTone}
          onClose={() => setToast("")}
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <UiSection eyebrow="Plan Testing" title="Developer plan controls">
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setDevPlan("free")}
                className="rounded-2xl border border-white/8 bg-[#0c0e12] px-5 py-4 text-sm font-medium text-zinc-300"
              >
                Set Free
              </button>
              <button
                type="button"
                onClick={() => setDevPlan("premium")}
                className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-5 py-4 text-sm font-medium text-emerald-200"
              >
                Set Premium
              </button>
              <button
                type="button"
                onClick={() => setDevPlan("premium_plus")}
                className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] px-5 py-4 text-sm font-medium text-violet-200"
              >
                Set Premium Plus
              </button>
              <button
                type="button"
                onClick={clearDevPlan}
                className="rounded-2xl border border-white/8 bg-[#111318] px-5 py-4 text-sm font-medium text-zinc-300"
              >
                Clear Override
              </button>
            </div>
          </UiSection>

          <UiSection eyebrow="Seed Data" title="Populate demo state">
            <div className="space-y-4">
              <p className="text-sm leading-7 text-zinc-400">
                Seed reports, execution plans, watchlists, personalization,
                tracked opportunities, and calendar events so the app looks full
                during testing.
              </p>
              <button
                type="button"
                onClick={handleSeedDemo}
                className="rounded-2xl border border-white/8 bg-white px-5 py-4 text-sm font-semibold text-black"
              >
                Seed Demo Data
              </button>
            </div>
          </UiSection>

          <UiSection eyebrow="Reset Tools" title="Testing reset actions">
            <div className="grid gap-3">
              <button
                type="button"
                onClick={resetPersonalization}
                className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-5 py-4 text-left text-sm font-medium text-amber-200"
              >
                Reset Personalization + Watchlists
              </button>

              <button
                type="button"
                onClick={clearAllLocalData}
                className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-5 py-4 text-left text-sm font-medium text-red-200"
              >
                Clear All Local Dev Data
              </button>
            </div>
          </UiSection>

          <UiSection eyebrow="Usage Notes" title="How to use Dev Admin">
            <div className="space-y-3 text-sm text-zinc-400">
              <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3">
                Use plan override to test free vs premium gating quickly.
              </div>
              <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3">
                Seed demo data before screenshots, UI polish, or walkthrough videos.
              </div>
              <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3">
                Clear local data when you want to simulate a clean first-time user.
              </div>
            </div>
          </UiSection>
        </div>
      </div>
    </PlatformShell>
  );
}