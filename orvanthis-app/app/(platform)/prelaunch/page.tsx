"use client";

import { useEffect, useMemo, useState } from "react";
import PlatformShell from "@/components/platform-shell";
import UiToast from "@/components/ui-toast";
import { UiSection, UiEmptyState } from "@/components/ui-section";

type ChecklistCategory =
  | "product"
  | "payments"
  | "legal"
  | "qa"
  | "launch";

type ChecklistItem = {
  id: string;
  category: ChecklistCategory;
  title: string;
  description: string;
  done: boolean;
  priority: "high" | "medium" | "low";
};

const STORAGE_KEY = "orvanthis:prelaunchChecklist:v1";

const starterItems: ChecklistItem[] = [
  {
    id: "product-assistant",
    category: "product",
    title: "Assistant modes finalized",
    description: "Chat, Intelligence, Execution, and Trader flows feel stable and polished.",
    done: true,
    priority: "high",
  },
  {
    id: "product-calendar",
    category: "product",
    title: "Calendar workflow finalized",
    description: "Calendar, reminders, agenda, and event actions feel production-ready.",
    done: true,
    priority: "high",
  },
  {
    id: "product-homepage",
    category: "product",
    title: "Homepage and navigation polished",
    description: "Landing page, shell navigation, and product entry points are launch-ready.",
    done: true,
    priority: "medium",
  },
  {
    id: "payments-stripe",
    category: "payments",
    title: "Stripe live setup",
    description: "Create live Stripe products, prices, checkout, portal, and webhook configuration.",
    done: false,
    priority: "high",
  },
  {
    id: "payments-billing",
    category: "payments",
    title: "Billing flow tested end-to-end",
    description: "Upgrade, cancellation, renewal, and plan state changes are fully tested.",
    done: false,
    priority: "high",
  },
  {
    id: "legal-llc",
    category: "legal",
    title: "LLC created",
    description: "Business entity is formed before accepting live customer payments.",
    done: false,
    priority: "high",
  },
  {
    id: "legal-domain",
    category: "legal",
    title: "Primary domain purchased",
    description: "Secure the production domain and brand-facing web presence.",
    done: false,
    priority: "medium",
  },
  {
    id: "legal-policy",
    category: "legal",
    title: "Basic policy pages drafted",
    description: "Privacy Policy, Terms, and refund/billing language are prepared.",
    done: false,
    priority: "medium",
  },
  {
    id: "qa-playwright",
    category: "qa",
    title: "Core Playwright suite passing",
    description: "Onboarding, calendar, signals, workspace, and premium locks are green.",
    done: true,
    priority: "high",
  },
  {
    id: "qa-manual",
    category: "qa",
    title: "Manual UI pass completed",
    description: "Critical flows and visual checks reviewed manually before launch.",
    done: false,
    priority: "medium",
  },
  {
    id: "launch-seed-users",
    category: "launch",
    title: "Initial test users identified",
    description: "Have a small list of first users/testers to validate the product after launch.",
    done: false,
    priority: "medium",
  },
  {
    id: "launch-feedback",
    category: "launch",
    title: "Feedback loop ready",
    description: "Have a way to collect bug reports, ideas, and user feedback quickly.",
    done: false,
    priority: "medium",
  },
];

function loadItems(): ChecklistItem[] {
  if (typeof window === "undefined") return starterItems;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return starterItems;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return starterItems;

    return parsed.filter(
      (item): item is ChecklistItem =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        typeof item.category === "string" &&
        typeof item.title === "string" &&
        typeof item.description === "string" &&
        typeof item.done === "boolean" &&
        typeof item.priority === "string"
    );
  } catch {
    return starterItems;
  }
}

function saveItems(items: ChecklistItem[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function getCategoryLabel(category: ChecklistCategory) {
  if (category === "product") return "Product";
  if (category === "payments") return "Payments";
  if (category === "legal") return "Legal";
  if (category === "qa") return "QA";
  return "Launch";
}

function getPriorityStyles(priority: ChecklistItem["priority"]) {
  if (priority === "high") {
    return "border-red-500/20 bg-red-500/[0.06] text-red-200";
  }
  if (priority === "medium") {
    return "border-amber-500/20 bg-amber-500/[0.06] text-amber-200";
  }
  return "border-zinc-500/20 bg-zinc-500/[0.08] text-zinc-300";
}

export default function PrelaunchPage() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [toast, setToast] = useState("");
  const [toastTone, setToastTone] = useState<
    "success" | "warning" | "error" | "info"
  >("info");

  useEffect(() => {
    setItems(loadItems());
  }, []);

  const grouped = useMemo(() => {
    return {
      product: items.filter((item) => item.category === "product"),
      payments: items.filter((item) => item.category === "payments"),
      legal: items.filter((item) => item.category === "legal"),
      qa: items.filter((item) => item.category === "qa"),
      launch: items.filter((item) => item.category === "launch"),
    };
  }, [items]);

  const stats = useMemo(() => {
    const total = items.length;
    const done = items.filter((item) => item.done).length;
    const remaining = total - done;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    return { total, done, remaining, percent };
  }, [items]);

  function handleToggle(id: string) {
    const target = items.find((item) => item.id === id);

    const next = items.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item
    );

    setItems(next);
    saveItems(next);

    setToast(
      `${target?.title || "Checklist item"} marked ${
        target?.done ? "incomplete" : "complete"
      }.`
    );
    setToastTone("success");
  }

  function handleReset() {
    setItems(starterItems);
    saveItems(starterItems);
    setToast("Prelaunch checklist reset to defaults.");
    setToastTone("info");
  }

  return (
    <PlatformShell
      title="Prelaunch"
      subtitle="Track launch readiness across product, payments, legal, QA, and go-live"
    >
      <div className="space-y-6">
        <UiToast
          message={toast}
          tone={toastTone}
          onClose={() => setToast("")}
        />

        <UiSection
          eyebrow="Launch Readiness"
          title="Prelaunch control center"
          right={
            <button
              type="button"
              onClick={handleReset}
              className="rounded-2xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-sm font-medium text-zinc-300"
            >
              Reset Checklist
            </button>
          }
        >
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.05] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-sky-200/80">
                Total Items
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">
                {stats.total}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.05] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-200/80">
                Completed
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">
                {stats.done}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.05] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-amber-200/80">
                Remaining
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">
                {stats.remaining}
              </p>
            </div>

            <div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.05] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-violet-200/80">
                Completion
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">
                {stats.percent}%
              </p>
            </div>
          </div>
        </UiSection>

        <div className="grid gap-6 xl:grid-cols-2">
          {(Object.entries(grouped) as [ChecklistCategory, ChecklistItem[]][]).map(
            ([category, categoryItems]) => (
              <UiSection
                key={category}
                eyebrow={getCategoryLabel(category)}
                title={`${getCategoryLabel(category)} checklist`}
              >
                {categoryItems.length === 0 ? (
                  <UiEmptyState
                    title="No items in this section"
                    text="Add checklist items here later if needed."
                  />
                ) : (
                  <div className="space-y-3">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-white/8 bg-[#0c0e12] p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap gap-2">
                              <span
                                className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${getPriorityStyles(
                                  item.priority
                                )}`}
                              >
                                {item.priority}
                              </span>

                              <span
                                className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${
                                  item.done
                                    ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200"
                                    : "border-white/8 bg-[#111318] text-zinc-400"
                                }`}
                              >
                                {item.done ? "complete" : "incomplete"}
                              </span>
                            </div>

                            <h4 className="mt-4 text-lg font-semibold text-zinc-100">
                              {item.title}
                            </h4>

                            <p className="mt-2 text-sm leading-6 text-zinc-400">
                              {item.description}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggle(item.id)}
                            className={`rounded-xl border px-4 py-2 text-xs uppercase tracking-[0.12em] transition ${
                              item.done
                                ? "border-white/8 bg-[#111318] text-zinc-300"
                                : "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200"
                            }`}
                          >
                            {item.done ? "Mark Incomplete" : "Mark Complete"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </UiSection>
            )
          )}
        </div>
      </div>
    </PlatformShell>
  );
}