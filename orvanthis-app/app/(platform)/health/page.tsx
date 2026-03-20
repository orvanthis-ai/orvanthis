"use client";

import { useEffect, useMemo, useState } from "react";
import PlatformShell from "@/components/platform-shell";
import UiToast from "@/components/ui-toast";
import {
  UiSection,
  UiEmptyState,
  UiLoadingState,
} from "@/components/ui-section";

type HealthStatus = "good" | "warning" | "error";

type HealthCheckItem = {
  id: string;
  label: string;
  status: HealthStatus;
  detail: string;
};

type HealthResponse = {
  summary: {
    total: number;
    good: number;
    warning: number;
    error: number;
  };
  envChecks: HealthCheckItem[];
  productChecks: HealthCheckItem[];
  agentChecks: HealthCheckItem[];
  currentPlan: string;
};

function getStatusStyles(status: HealthStatus) {
  if (status === "good") {
    return "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200";
  }
  if (status === "warning") {
    return "border-amber-500/20 bg-amber-500/[0.06] text-amber-200";
  }
  return "border-red-500/20 bg-red-500/[0.06] text-red-200";
}

export default function HealthPage() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [toastTone, setToastTone] = useState<
    "success" | "warning" | "error" | "info"
  >("info");

  async function loadHealth() {
    try {
      setLoading(true);

      const res = await fetch("/api/health", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        setToast(json?.message || "Unable to load health data.");
        setToastTone("error");
        setData(null);
        return;
      }

      setData(json);
      setToast("Health audit loaded.");
      setToastTone("success");
    } catch (error) {
      console.error("Health load error:", error);
      setToast("There was an error loading the health audit.");
      setToastTone("error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHealth();
  }, []);

  const allWarnings = useMemo(() => {
    if (!data) return [];
    return [...data.envChecks, ...data.productChecks, ...data.agentChecks].filter(
      (item) => item.status !== "good"
    );
  }, [data]);

  return (
    <PlatformShell
      title="Health"
      subtitle="Audit app readiness, product health, and AI agent coverage"
    >
      <div className="space-y-6">
        <UiToast
          message={toast}
          tone={toastTone}
          onClose={() => setToast("")}
        />

        <UiSection
          eyebrow="App Health Center"
          title="Readiness and audit overview"
          right={
            <button
              type="button"
              onClick={() => void loadHealth()}
              className="rounded-2xl border border-white/8 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-100"
            >
              Run Audit Again
            </button>
          }
        >
          {loading ? (
            <UiLoadingState text="Running app health audit..." />
          ) : !data ? (
            <UiEmptyState
              title="No health data available"
              text="Run the audit again to load readiness information."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-5">
              <div className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.05] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-sky-200/80">
                  Total Checks
                </p>
                <p className="mt-2 text-3xl font-semibold text-zinc-100">
                  {data.summary.total}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.05] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-200/80">
                  Good
                </p>
                <p className="mt-2 text-3xl font-semibold text-zinc-100">
                  {data.summary.good}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.05] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-amber-200/80">
                  Warnings
                </p>
                <p className="mt-2 text-3xl font-semibold text-zinc-100">
                  {data.summary.warning}
                </p>
              </div>

              <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.05] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-red-200/80">
                  Errors
                </p>
                <p className="mt-2 text-3xl font-semibold text-zinc-100">
                  {data.summary.error}
                </p>
              </div>

              <div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.05] p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-violet-200/80">
                  Current Plan
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-100">
                  {data.currentPlan}
                </p>
              </div>
            </div>
          )}
        </UiSection>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <UiSection eyebrow="Environment" title="Runtime configuration checks">
              {loading ? (
                <UiLoadingState text="Checking environment..." />
              ) : !data?.envChecks?.length ? (
                <UiEmptyState
                  title="No environment checks"
                  text="Environment checks will appear here after the audit runs."
                />
              ) : (
                <div className="space-y-3">
                  {data.envChecks.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/8 bg-[#0c0e12] p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-semibold text-zinc-100">
                            {item.label}
                          </h4>
                          <p className="mt-2 text-sm leading-6 text-zinc-400">
                            {item.detail}
                          </p>
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${getStatusStyles(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </UiSection>

            <UiSection eyebrow="Product" title="Readiness and architecture checks">
              {loading ? (
                <UiLoadingState text="Checking product readiness..." />
              ) : !data?.productChecks?.length ? (
                <UiEmptyState
                  title="No product checks"
                  text="Product readiness checks will appear here after the audit runs."
                />
              ) : (
                <div className="space-y-3">
                  {data.productChecks.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/8 bg-[#0c0e12] p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-semibold text-zinc-100">
                            {item.label}
                          </h4>
                          <p className="mt-2 text-sm leading-6 text-zinc-400">
                            {item.detail}
                          </p>
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${getStatusStyles(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </UiSection>
          </section>

          <aside className="space-y-6">
            <UiSection eyebrow="AI Agents" title="Agent coverage status">
              {loading ? (
                <UiLoadingState text="Checking agent coverage..." />
              ) : !data?.agentChecks?.length ? (
                <UiEmptyState
                  title="No agent checks"
                  text="Agent coverage checks will appear here after the audit runs."
                />
              ) : (
                <div className="space-y-3">
                  {data.agentChecks.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/8 bg-[#0c0e12] p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-semibold text-zinc-100">
                            {item.label}
                          </h4>
                          <p className="mt-2 text-sm leading-6 text-zinc-400">
                            {item.detail}
                          </p>
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${getStatusStyles(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </UiSection>

            <UiSection eyebrow="Audit Summary" title="Priority follow-ups">
              {loading ? (
                <UiLoadingState text="Summarizing follow-ups..." />
              ) : allWarnings.length === 0 ? (
                <UiEmptyState
                  title="No warnings detected"
                  text="Everything currently audited is in a good state."
                />
              ) : (
                <div className="space-y-3">
                  {allWarnings.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-amber-500/15 bg-amber-500/[0.05] px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-zinc-100">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-zinc-300">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </UiSection>

            <UiSection eyebrow="Next AI Layer" title="Best next build">
              <div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.05] p-5">
                <p className="text-sm leading-7 text-zinc-200">
                  The strongest next step is a multi-agent control center with:
                  Strategy Agent, Execution Agent, QA Agent, Operator Agent, and
                  Code Review Agent.
                </p>
              </div>
            </UiSection>
          </aside>
        </div>
      </div>
    </PlatformShell>
  );
}