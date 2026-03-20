"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PlatformShell from "@/components/platform-shell";
import UiToast from "@/components/ui-toast";
import { UiSection, UiEmptyState } from "@/components/ui-section";
import {
  loadAgentMemory,
  markTaskComplete,
  resetAgentMemory,
} from "@/lib/agent-memory";
import { generateAdaptiveTasks } from "@/lib/task-generator";

type TaskType = "qa" | "bug" | "code" | "operator" | "launch";
type TaskPriority = "high" | "medium" | "low";
type TaskStatus = "todo" | "in_progress" | "done";

type TaskItem = {
  id: string;
  title: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  description: string;
  assistantPrompt?: string;
  workspacePrompt?: string;
  routeTarget?: string;
};

const STORAGE_KEY = "orvanthis:taskRunner:v1";

const DEFAULT_TASKS: TaskItem[] = [
  {
    id: "qa-dashboard-flow",
    title: "Audit dashboard flow",
    type: "qa",
    priority: "high",
    status: "todo",
    description:
      "Review dashboard modules, empty states, premium locks, and click-through actions.",
    assistantPrompt:
      "Act as the QA Agent. Audit the dashboard flow, identify weak spots, and list the highest-priority fixes.",
    workspacePrompt:
      "Create a QA audit report for the dashboard page covering UX issues, dead-end flows, premium gating clarity, and visual inconsistencies.",
    routeTarget: "/dashboard",
  },
  {
    id: "qa-assistant-flow",
    title: "Audit assistant modes",
    type: "qa",
    priority: "high",
    status: "todo",
    description:
      "Check chat, intelligence, execution, and trader behavior along with mode switching and gating.",
    assistantPrompt:
      "Act as the QA Agent. Audit assistant mode switching, feature locks, and response flows. Find the most likely user confusion points.",
    workspacePrompt:
      "Build a QA report on the assistant page covering mode behavior, prompts, state handling, errors, and premium lock clarity.",
    routeTarget: "/assistant",
  },
  {
    id: "bug-page-links",
    title: "Run page-to-page bug hunt",
    type: "bug",
    priority: "high",
    status: "todo",
    description:
      "Look for dead buttons, broken routing, confusing redirects, and layout inconsistencies.",
    assistantPrompt:
      "Act as the QA Agent. Build a bug-hunt checklist for page links, button actions, redirects, and navigation issues across the app.",
    workspacePrompt:
      "Generate a bug hunt report for routing, page transitions, broken links, and dead click risks across Orvanthis.",
    routeTarget: "/health",
  },
  {
    id: "code-error-guards",
    title: "Review code error handling",
    type: "code",
    priority: "high",
    status: "todo",
    description:
      "Audit fetch failures, local storage parsing, auth checks, and missing defensive guards.",
    assistantPrompt:
      "Act as the Code Review Agent. Audit the app for weak error handling, unsafe assumptions, and missing guards.",
    workspacePrompt:
      "Generate a code review report covering weak error handling, missing validation, risky state handling, and stability improvements.",
    routeTarget: "/agents",
  },
  {
    id: "operator-next-launch",
    title: "Prioritize next launch tasks",
    type: "operator",
    priority: "high",
    status: "todo",
    description:
      "Use health, prelaunch, and current product maturity to decide what should be built or fixed next.",
    assistantPrompt:
      "Act as the Operator Agent. Review current app maturity and prioritize the next most important launch tasks in order.",
    workspacePrompt:
      "Create an operator report covering launch readiness, blockers, product polish priorities, and the next execution sequence.",
    routeTarget: "/prelaunch",
  },
  {
    id: "qa-calendar-pass",
    title: "Run calendar UX pass",
    type: "qa",
    priority: "medium",
    status: "todo",
    description:
      "Review smart agenda, event creation, pinning, completion state, and learning summaries.",
    assistantPrompt:
      "Act as the QA Agent. Audit the calendar experience and identify UX issues, missing actions, and confusing states.",
    workspacePrompt:
      "Generate a QA report for the calendar page focusing on usability, event workflows, smart agenda clarity, and actionability.",
    routeTarget: "/calendar",
  },
  {
    id: "code-plan-enforcement",
    title: "Review plan enforcement logic",
    type: "code",
    priority: "medium",
    status: "todo",
    description:
      "Double-check premium gating logic in UI, server routes, and dev override behavior.",
    assistantPrompt:
      "Act as the Code Review Agent. Review plan enforcement logic and identify where premium gating could drift or fail.",
    workspacePrompt:
      "Generate a code review report on plan enforcement across UI gating, API checks, usage limits, and dev overrides.",
    routeTarget: "/billing",
  },
  {
    id: "launch-first-user-pass",
    title: "Simulate first-user experience",
    type: "launch",
    priority: "medium",
    status: "todo",
    description:
      "Walk through homepage, signup, onboarding, dashboard, and first assistant usage as a new user.",
    assistantPrompt:
      "Act as the QA Agent. Simulate a first-time user journey and identify friction points from landing page through onboarding and first use.",
    workspacePrompt:
      "Create a first-user experience report covering homepage, signup, onboarding, dashboard, and assistant activation.",
    routeTarget: "/",
  },
];

function loadTasks(): TaskItem[] {
  if (typeof window === "undefined") return DEFAULT_TASKS;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TASKS;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_TASKS;

    return parsed.filter(
      (item): item is TaskItem =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.type === "string" &&
        typeof item.priority === "string" &&
        typeof item.status === "string" &&
        typeof item.description === "string"
    );
  } catch {
    return DEFAULT_TASKS;
  }
}

function saveTasks(tasks: TaskItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {}
}

function getPriorityStyles(priority: TaskPriority) {
  if (priority === "high") {
    return "border-red-500/20 bg-red-500/[0.06] text-red-200";
  }
  if (priority === "medium") {
    return "border-amber-500/20 bg-amber-500/[0.06] text-amber-200";
  }
  return "border-zinc-500/20 bg-zinc-500/[0.08] text-zinc-300";
}

function getTypeStyles(type: TaskType) {
  if (type === "qa") {
    return "border-sky-500/20 bg-sky-500/[0.06] text-sky-200";
  }
  if (type === "bug") {
    return "border-red-500/20 bg-red-500/[0.06] text-red-200";
  }
  if (type === "code") {
    return "border-violet-500/20 bg-violet-500/[0.06] text-violet-200";
  }
  if (type === "operator") {
    return "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200";
  }
  return "border-amber-500/20 bg-amber-500/[0.06] text-amber-200";
}

function getStatusStyles(status: TaskStatus) {
  if (status === "done") {
    return "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200";
  }
  if (status === "in_progress") {
    return "border-sky-500/20 bg-sky-500/[0.06] text-sky-200";
  }
  return "border-white/8 bg-[#111318] text-zinc-300";
}

function mergeTasks(baseTasks: TaskItem[], adaptiveTasks: TaskItem[]) {
  const seen = new Set<string>();
  const merged: TaskItem[] = [];

  for (const task of [...baseTasks, ...adaptiveTasks]) {
    if (seen.has(task.id)) continue;
    seen.add(task.id);
    merged.push(task);
  }

  return merged;
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [toast, setToast] = useState("");
  const [toastTone, setToastTone] = useState<
    "success" | "warning" | "error" | "info"
  >("info");

  useEffect(() => {
    const baseTasks = loadTasks();
    const memory = loadAgentMemory();
    const adaptiveTasks = generateAdaptiveTasks(memory);
    const merged = mergeTasks(baseTasks, adaptiveTasks);

    setTasks(merged);
    saveTasks(merged);
  }, []);

  const summary = useMemo(() => {
    return {
      total: tasks.length,
      todo: tasks.filter((task) => task.status === "todo").length,
      inProgress: tasks.filter((task) => task.status === "in_progress").length,
      done: tasks.filter((task) => task.status === "done").length,
      highPriority: tasks.filter((task) => task.priority === "high").length,
    };
  }, [tasks]);

  const fixNext = useMemo(() => {
    return tasks.find(
      (task) => task.priority === "high" && task.status !== "done"
    );
  }, [tasks]);

  const grouped = useMemo(() => {
    return {
      qa: tasks.filter((task) => task.type === "qa"),
      bug: tasks.filter((task) => task.type === "bug"),
      code: tasks.filter((task) => task.type === "code"),
      operator: tasks.filter((task) => task.type === "operator"),
      launch: tasks.filter((task) => task.type === "launch"),
    };
  }, [tasks]);

  function updateTaskStatus(id: string, status: TaskStatus) {
    const next = tasks.map((task) =>
      task.id === id ? { ...task, status } : task
    );

    setTasks(next);
    saveTasks(next);

    if (status === "done") {
      markTaskComplete(id);

      const memory = loadAgentMemory();
      const adaptiveTasks = generateAdaptiveTasks(memory);
      const merged = mergeTasks(next, adaptiveTasks);

      setTasks(merged);
      saveTasks(merged);
    }

    const updated = next.find((task) => task.id === id);
    setToast(
      `${updated?.title || "Task"} updated to ${status.replace("_", " ")}.`
    );
    setToastTone("success");
  }

  function resetTasks() {
    resetAgentMemory();
    localStorage.removeItem(STORAGE_KEY);

    const merged = [...DEFAULT_TASKS];
    setTasks(merged);
    saveTasks(merged);

    setToast("Task runner and agent memory reset to defaults.");
    setToastTone("info");
  }

  function openAssistant(task: TaskItem) {
    if (!task.assistantPrompt) return;
    router.push(`/assistant?prompt=${encodeURIComponent(task.assistantPrompt)}`);
  }

  function openWorkspace(task: TaskItem) {
    if (!task.workspacePrompt) return;
    router.push(
      `/workspace?query=${encodeURIComponent(task.workspacePrompt)}&autorun=1`
    );
  }

  function openRoute(task: TaskItem) {
    if (!task.routeTarget) return;
    router.push(task.routeTarget);
  }

  function renderTaskCard(task: TaskItem) {
    return (
      <div
        key={task.id}
        className="rounded-[24px] border border-white/8 bg-[#0c0e12] p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${getTypeStyles(
                  task.type
                )}`}
              >
                {task.type}
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${getPriorityStyles(
                  task.priority
                )}`}
              >
                {task.priority}
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${getStatusStyles(
                  task.status
                )}`}
              >
                {task.status.replace("_", " ")}
              </span>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-zinc-100">
              {task.title}
            </h3>

            <p className="mt-3 text-sm leading-7 text-zinc-400">
              {task.description}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <button
            type="button"
            onClick={() =>
              updateTaskStatus(
                task.id,
                task.status === "todo" ? "in_progress" : "todo"
              )
            }
            className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.06] px-4 py-3 text-sm font-medium text-sky-200 transition hover:border-sky-400/30"
          >
            {task.status === "todo" ? "Start Task" : "Move to Todo"}
          </button>

          <button
            type="button"
            onClick={() =>
              updateTaskStatus(
                task.id,
                task.status === "done" ? "todo" : "done"
              )
            }
            className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm font-medium text-emerald-200 transition hover:border-emerald-400/30"
          >
            {task.status === "done" ? "Reopen" : "Mark Done"}
          </button>

          {task.routeTarget ? (
            <button
              type="button"
              onClick={() => openRoute(task)}
              className="rounded-2xl border border-white/8 bg-[#111318] px-4 py-3 text-sm font-medium text-zinc-300 transition hover:border-white/15 hover:text-white"
            >
              Open Page
            </button>
          ) : (
            <div />
          )}
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => openAssistant(task)}
            disabled={!task.assistantPrompt}
            className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] px-4 py-3 text-sm font-medium text-violet-200 transition hover:border-violet-400/30 disabled:opacity-40"
          >
            Run in Assistant
          </button>

          <button
            type="button"
            onClick={() => openWorkspace(task)}
            disabled={!task.workspacePrompt}
            className="rounded-2xl border border-white/8 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-100 disabled:opacity-40"
          >
            Run in Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <PlatformShell
      title="Tasks"
      subtitle="Run recurring QA, bug hunt, code review, and operator workflows"
    >
      <div className="space-y-6">
        <UiToast
          message={toast}
          tone={toastTone}
          onClose={() => setToast("")}
        />

        <UiSection
          eyebrow="Task Runner"
          title="Auto QA loop and internal execution board"
          right={
            <button
              type="button"
              onClick={resetTasks}
              className="rounded-2xl border border-white/8 bg-[#0c0e12] px-4 py-3 text-sm font-medium text-zinc-300 transition hover:border-white/15 hover:text-white"
            >
              Reset Tasks
            </button>
          }
        >
          <p className="max-w-3xl text-sm leading-7 text-zinc-400">
            This page acts like your internal task engine. Use it to repeatedly
            audit pages, hunt bugs, run code review prompts, and prioritize what
            to fix next before launch.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-5">
            <div className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.05] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-sky-200/80">
                Total
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">
                {summary.total}
              </p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-[#111318] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400">
                Todo
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">
                {summary.todo}
              </p>
            </div>

            <div className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.05] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-sky-200/80">
                In Progress
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">
                {summary.inProgress}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.05] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-200/80">
                Done
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">
                {summary.done}
              </p>
            </div>

            <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.05] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-red-200/80">
                High Priority
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">
                {summary.highPriority}
              </p>
            </div>
          </div>
        </UiSection>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <UiSection eyebrow="Fix Next" title="Highest-priority task">
              {fixNext ? (
                <div className="rounded-[24px] border border-red-500/15 bg-red-500/[0.05] p-5">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${getTypeStyles(
                        fixNext.type
                      )}`}
                    >
                      {fixNext.type}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${getPriorityStyles(
                        fixNext.priority
                      )}`}
                    >
                      {fixNext.priority}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-semibold text-zinc-100">
                    {fixNext.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-zinc-300">
                    {fixNext.description}
                  </p>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => updateTaskStatus(fixNext.id, "in_progress")}
                      className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.06] px-4 py-3 text-sm font-medium text-sky-200 transition hover:border-sky-400/30"
                    >
                      Start Now
                    </button>

                    <button
                      type="button"
                      onClick={() => openAssistant(fixNext)}
                      className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] px-4 py-3 text-sm font-medium text-violet-200 transition hover:border-violet-400/30"
                    >
                      Assistant
                    </button>

                    <button
                      type="button"
                      onClick={() => openWorkspace(fixNext)}
                      className="rounded-2xl border border-white/8 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-100"
                    >
                      Workspace
                    </button>
                  </div>
                </div>
              ) : (
                <UiEmptyState
                  title="No urgent task left"
                  text="All high-priority tasks are done. Reset tasks or add new internal audits."
                />
              )}
            </UiSection>

            <UiSection eyebrow="QA Tasks" title="Recurring product audits">
              {grouped.qa.length === 0 ? (
                <UiEmptyState
                  title="No QA tasks"
                  text="QA tasks will appear here."
                />
              ) : (
                <div className="space-y-4">{grouped.qa.map(renderTaskCard)}</div>
              )}
            </UiSection>

            <UiSection
              eyebrow="Bug Hunt Tasks"
              title="Find broken flows and UI issues"
            >
              {grouped.bug.length === 0 ? (
                <UiEmptyState
                  title="No bug hunt tasks"
                  text="Bug hunt tasks will appear here."
                />
              ) : (
                <div className="space-y-4">
                  {grouped.bug.map(renderTaskCard)}
                </div>
              )}
            </UiSection>
          </section>

          <aside className="space-y-6">
            <UiSection
              eyebrow="Code Review Tasks"
              title="Stability and quality checks"
            >
              {grouped.code.length === 0 ? (
                <UiEmptyState
                  title="No code review tasks"
                  text="Code review tasks will appear here."
                />
              ) : (
                <div className="space-y-4">
                  {grouped.code.map(renderTaskCard)}
                </div>
              )}
            </UiSection>

            <UiSection eyebrow="Operator Tasks" title="Internal prioritization">
              {grouped.operator.length === 0 ? (
                <UiEmptyState
                  title="No operator tasks"
                  text="Operator tasks will appear here."
                />
              ) : (
                <div className="space-y-4">
                  {grouped.operator.map(renderTaskCard)}
                </div>
              )}
            </UiSection>

            <UiSection eyebrow="Launch Tasks" title="Prelaunch workflow checks">
              {grouped.launch.length === 0 ? (
                <UiEmptyState
                  title="No launch tasks"
                  text="Launch tasks will appear here."
                />
              ) : (
                <div className="space-y-4">
                  {grouped.launch.map(renderTaskCard)}
                </div>
              )}
            </UiSection>
          </aside>
        </div>
      </div>
    </PlatformShell>
  );
}