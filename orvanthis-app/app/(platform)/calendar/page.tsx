"use client";

import { useEffect, useMemo, useState } from "react";
import PlatformShell from "@/components/platform-shell";
import UiToast from "@/components/ui-toast";
import { UiSection, UiEmptyState } from "@/components/ui-section";

type CalendarEventType = "macro" | "earnings" | "opportunity" | "reminder";
type CalendarEventPriority = "high" | "medium" | "low";
type CalendarEventStatus = "upcoming" | "completed";

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  type: CalendarEventType;
  source: "system" | "user" | "opportunity";
  priority: CalendarEventPriority;
  status: CalendarEventStatus;
  pinned: boolean;
  watchlistTag: string;
  note: string;
  aiSummary: string;
  actionNote: string;
};

type CalendarPreferences = {
  preferredTypes: CalendarEventType[];
  pinnedCount: number;
  completedCount: number;
  createdCount: number;
  mostUsedWatchlistTags: string[];
};

const STORAGE_KEY = "orvanthis:calendarEvents:v2";
const PREFS_KEY = "orvanthis:calendarPrefs:v1";

function getFutureDate(daysAhead: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

function isSameDay(a: string, b: string) {
  return a === b;
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getDaysBetween(today: string, future: string) {
  const t1 = new Date(today);
  const t2 = new Date(future);
  const diff = t2.getTime() - t1.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

const starterEvents: CalendarEvent[] = [
  {
    id: "fomc-next",
    title: "FOMC Watch Window",
    date: getFutureDate(7),
    type: "macro",
    source: "system",
    priority: "high",
    status: "upcoming",
    pinned: true,
    watchlistTag: "Macro",
    note: "Review rates, market expectations, and volatility setup.",
    aiSummary:
      "This event can shift market bias, rate expectations, and volatility across equities, bonds, and crypto.",
    actionNote:
      "Prepare a pre-event market read, identify risk assets most exposed, and review post-announcement scenarios.",
  },
  {
    id: "earnings-tech",
    title: "Tech Earnings Review",
    date: getFutureDate(3),
    type: "earnings",
    source: "system",
    priority: "medium",
    status: "upcoming",
    pinned: false,
    watchlistTag: "AI Leaders",
    note: "Track AI leaders, guidance, and forward demand commentary.",
    aiSummary:
      "Large-cap tech earnings often affect AI infrastructure sentiment, growth multiples, and risk appetite.",
    actionNote:
      "Watch guidance language, capex commentary, AI demand trends, and how the market reacts after the print.",
  },
  {
    id: "ai-opportunity",
    title: "AI Infrastructure Opportunity Review",
    date: getFutureDate(10),
    type: "opportunity",
    source: "opportunity",
    priority: "high",
    status: "upcoming",
    pinned: true,
    watchlistTag: "AI Infrastructure",
    note: "Reassess strongest infrastructure opportunities and execution timing.",
    aiSummary:
      "This review helps convert broad AI interest into concrete strategic priorities and execution decisions.",
    actionNote:
      "Rank the top ideas, compare urgency, and decide which one deserves a focused execution sprint.",
  },
];

function loadEvents(): CalendarEvent[] {
  if (typeof window === "undefined") return starterEvents;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return starterEvents;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return starterEvents;

    return parsed.filter(
      (item): item is CalendarEvent =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.date === "string" &&
        typeof item.type === "string" &&
        typeof item.source === "string" &&
        typeof item.priority === "string" &&
        typeof item.status === "string" &&
        typeof item.pinned === "boolean" &&
        typeof item.watchlistTag === "string" &&
        typeof item.note === "string" &&
        typeof item.aiSummary === "string" &&
        typeof item.actionNote === "string"
    );
  } catch {
    return starterEvents;
  }
}

function saveEvents(events: CalendarEvent[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {}
}

function derivePreferences(events: CalendarEvent[]): CalendarPreferences {
  const typeCount = new Map<CalendarEventType, number>();
  const tagCount = new Map<string, number>();

  for (const event of events) {
    typeCount.set(event.type, (typeCount.get(event.type) ?? 0) + 1);

    if (event.watchlistTag.trim()) {
      tagCount.set(
        event.watchlistTag,
        (tagCount.get(event.watchlistTag) ?? 0) + 1
      );
    }
  }

  const preferredTypes = [...typeCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type]) => type);

  const mostUsedWatchlistTags = [...tagCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tag]) => tag);

  return {
    preferredTypes,
    pinnedCount: events.filter((event) => event.pinned).length,
    completedCount: events.filter((event) => event.status === "completed")
      .length,
    createdCount: events.length,
    mostUsedWatchlistTags,
  };
}

function savePreferences(events: CalendarEvent[]) {
  if (typeof window === "undefined") return;
  try {
    const prefs = derivePreferences(events);
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}

function loadPreferences(): CalendarPreferences {
  if (typeof window === "undefined") {
    return {
      preferredTypes: [],
      pinnedCount: 0,
      completedCount: 0,
      createdCount: 0,
      mostUsedWatchlistTags: [],
    };
  }

  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return derivePreferences(starterEvents);
    return JSON.parse(raw) as CalendarPreferences;
  } catch {
    return derivePreferences(starterEvents);
  }
}

function getTypeStyles(type: CalendarEventType) {
  if (type === "macro") {
    return "border-amber-500/20 bg-amber-500/[0.06] text-amber-200";
  }
  if (type === "earnings") {
    return "border-sky-500/20 bg-sky-500/[0.06] text-sky-200";
  }
  if (type === "opportunity") {
    return "border-violet-500/20 bg-violet-500/[0.06] text-violet-200";
  }
  return "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200";
}

function getPriorityStyles(priority: CalendarEventPriority) {
  if (priority === "high") {
    return "border-red-500/20 bg-red-500/[0.06] text-red-200";
  }
  if (priority === "medium") {
    return "border-amber-500/20 bg-amber-500/[0.06] text-amber-200";
  }
  return "border-zinc-500/20 bg-zinc-500/[0.08] text-zinc-300";
}

function priorityScore(priority: CalendarEventPriority) {
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}

function sortEvents(events: CalendarEvent[]) {
  return [...events].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.status !== b.status) return a.status === "upcoming" ? -1 : 1;
    if (priorityScore(a.priority) !== priorityScore(b.priority)) {
      return priorityScore(b.priority) - priorityScore(a.priority);
    }
    return a.date.localeCompare(b.date);
  });
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [preferences, setPreferences] = useState<CalendarPreferences | null>(
    null
  );

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<CalendarEventType>("reminder");
  const [priority, setPriority] = useState<CalendarEventPriority>("medium");
  const [watchlistTag, setWatchlistTag] = useState("");
  const [note, setNote] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [toast, setToast] = useState("");
  const [toastTone, setToastTone] = useState<
    "success" | "warning" | "error" | "info"
  >("info");

  useEffect(() => {
    const loadedEvents = loadEvents();
    setEvents(loadedEvents);
    setPreferences(loadPreferences());
  }, []);

  const sortedEvents = useMemo(() => sortEvents(events), [events]);

  const agenda = useMemo(() => {
    const today = getTodayKey();

    const upcoming = events.filter((event) => event.status === "upcoming");
    const todayEvents = upcoming.filter((event) => isSameDay(event.date, today));
    const weekEvents = upcoming.filter((event) => {
      const days = getDaysBetween(today, event.date);
      return days >= 0 && days <= 7;
    });

    const topToday = sortEvents(todayEvents).slice(0, 3);
    const topWeek = sortEvents(weekEvents).slice(0, 5);

    const highestFocus =
      sortEvents(
        upcoming.filter((event) => {
          const days = getDaysBetween(today, event.date);
          return days >= 0 && days <= 14;
        })
      )[0] ?? null;

    let dailySummary =
      "No major events are scheduled for today, so this is a good window for planning, research, and execution.";
    if (topToday.length > 0) {
      dailySummary = `You have ${topToday.length} event${
        topToday.length > 1 ? "s" : ""
      } on the calendar today. Focus first on the highest-priority catalyst and prepare follow-up actions before the day gets noisy.`;
    }

    let weeklySummary =
      "This week is relatively open, which makes it a strong setup window for deeper strategic work.";
    if (topWeek.length > 0) {
      weeklySummary = `This week has ${topWeek.length} upcoming catalyst${
        topWeek.length > 1 ? "s" : ""
      }. The best approach is to prioritize pinned and high-priority events, then organize lower-priority reminders around them.`;
    }

    const nextBestAction = highestFocus
      ? highestFocus.actionNote ||
        highestFocus.note ||
        `Prepare early for ${highestFocus.title}.`
      : "Create your next execution reminder or add a catalyst you want to track.";

    return {
      topToday,
      topWeek,
      highestFocus,
      dailySummary,
      weeklySummary,
      nextBestAction,
    };
  }, [events]);

  function sync(nextEvents: CalendarEvent[]) {
    setEvents(nextEvents);
    saveEvents(nextEvents);
    savePreferences(nextEvents);
    setPreferences(derivePreferences(nextEvents));
  }

  function handleAddEvent() {
    const cleanTitle = title.trim();
    const cleanDate = date.trim();

    if (!cleanTitle || !cleanDate) {
      setToast("Event title and date are required.");
      setToastTone("warning");
      return;
    }

    const nextEvents = sortEvents([
      ...events,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: cleanTitle,
        date: cleanDate,
        type,
        source: "user",
        priority,
        status: "upcoming",
        pinned: false,
        watchlistTag: watchlistTag.trim(),
        note: note.trim(),
        aiSummary: aiSummary.trim(),
        actionNote: actionNote.trim(),
      },
    ]);

    sync(nextEvents);

    setTitle("");
    setDate("");
    setType("reminder");
    setPriority("medium");
    setWatchlistTag("");
    setNote("");
    setAiSummary("");
    setActionNote("");

    setToast(`"${cleanTitle}" was added to your calendar.`);
    setToastTone("success");
  }

  function handleDeleteEvent(id: string) {
    const event = events.find((item) => item.id === id);
    sync(events.filter((item) => item.id !== id));
    setToast(`"${event?.title || "Event"}" was deleted.`);
    setToastTone("info");
  }

  function handleTogglePinned(id: string) {
    const event = events.find((item) => item.id === id);
    const next = sortEvents(
      events.map((item) =>
        item.id === id ? { ...item, pinned: !item.pinned } : item
      )
    );
    sync(next);
    setToast(
      `${event?.title || "Event"} ${event?.pinned ? "unpinned" : "pinned"}.`
    );
    setToastTone("info");
  }

  function handleToggleCompleted(id: string) {
    const event = events.find((item) => item.id === id);
    const next = sortEvents(
      events.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "completed" ? "upcoming" : "completed",
            }
          : item
      )
    );
    sync(next);
    setToast(
      `${event?.title || "Event"} marked ${
        event?.status === "completed" ? "upcoming" : "completed"
      }.`
    );
    setToastTone("success");
  }

  return (
    <PlatformShell
      title="Calendar"
      subtitle="Track catalysts, reminders, and execution timing"
    >
      <div className="space-y-6">
        <UiToast
          message={toast}
          tone={toastTone}
          onClose={() => setToast("")}
        />

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <UiSection eyebrow="AI Daily Agenda" title="What matters now">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-sky-500/15 bg-sky-500/[0.05] p-5">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-sky-200/80">
                    Today
                  </p>
                  <p className="mt-3 text-sm leading-7 text-zinc-200">
                    {agenda.dailySummary}
                  </p>
                </div>

                <div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.05] p-5">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-violet-200/80">
                    This Week
                  </p>
                  <p className="mt-3 text-sm leading-7 text-zinc-200">
                    {agenda.weeklySummary}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.05] p-5">
                <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-200/80">
                  Next Best Action
                </p>
                <p className="mt-3 text-sm leading-7 text-zinc-200">
                  {agenda.nextBestAction}
                </p>
              </div>
            </UiSection>

            <UiSection eyebrow="Smart Timeline" title="Upcoming events, reminders, and execution windows">
              {sortedEvents.length === 0 ? (
                <UiEmptyState
                  title="No calendar events yet"
                  text="Add your first catalyst, reminder, or execution review to start building your smart calendar."
                />
              ) : (
                <div className="space-y-4">
                  {sortedEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`rounded-[24px] border p-5 ${
                        event.status === "completed"
                          ? "border-white/8 bg-[#0b0d11] opacity-75"
                          : "border-white/8 bg-[#0c0e12]"
                      }`}
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap gap-2">
                              <div
                                className={`inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${getTypeStyles(
                                  event.type
                                )}`}
                              >
                                {event.type}
                              </div>

                              <div
                                className={`inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${getPriorityStyles(
                                  event.priority
                                )}`}
                              >
                                {event.priority} priority
                              </div>

                              <div className="inline-flex rounded-full border border-white/8 bg-[#111318] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                                {event.source}
                              </div>

                              {event.pinned && (
                                <div className="inline-flex rounded-full border border-sky-500/20 bg-sky-500/[0.06] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-sky-200">
                                  pinned
                                </div>
                              )}

                              <div className="inline-flex rounded-full border border-white/8 bg-[#111318] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                                {event.status}
                              </div>
                            </div>

                            <h4 className="mt-4 text-lg font-semibold text-zinc-100">
                              {event.title}
                            </h4>

                            <p className="mt-2 text-sm text-zinc-400">
                              {new Date(event.date).toLocaleDateString()}
                              {event.watchlistTag ? ` • ${event.watchlistTag}` : ""}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleTogglePinned(event.id)}
                              className="rounded-xl border border-white/8 bg-[#111318] px-4 py-2 text-xs uppercase tracking-[0.12em] text-zinc-400 transition hover:border-sky-400/30 hover:text-sky-200"
                            >
                              {event.pinned ? "Unpin" : "Pin"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleCompleted(event.id)}
                              className="rounded-xl border border-white/8 bg-[#111318] px-4 py-2 text-xs uppercase tracking-[0.12em] text-zinc-400 transition hover:border-emerald-400/30 hover:text-emerald-200"
                            >
                              {event.status === "completed"
                                ? "Mark Upcoming"
                                : "Complete"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(event.id)}
                              className="rounded-xl border border-white/8 bg-[#111318] px-4 py-2 text-xs uppercase tracking-[0.12em] text-zinc-400 transition hover:border-red-400/30 hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {event.note && (
                          <div className="rounded-2xl border border-white/8 bg-[#111318] p-4">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                              Note
                            </p>
                            <p className="mt-2 text-sm leading-6 text-zinc-300">
                              {event.note}
                            </p>
                          </div>
                        )}

                        {event.aiSummary && (
                          <div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.05] p-4">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-violet-200/80">
                              AI Summary
                            </p>
                            <p className="mt-2 text-sm leading-6 text-zinc-200">
                              {event.aiSummary}
                            </p>
                          </div>
                        )}

                        {event.actionNote && (
                          <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.05] p-4">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-200/80">
                              Action Note
                            </p>
                            <p className="mt-2 text-sm leading-6 text-zinc-200">
                              {event.actionNote}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </UiSection>
          </div>

          <aside className="space-y-6">
            <UiSection eyebrow="Highest Focus" title="Top event right now">
              <div className="rounded-2xl border border-white/8 bg-[#0c0e12] p-5">
                {agenda.highestFocus ? (
                  <>
                    <p className="text-lg font-semibold text-zinc-100">
                      {agenda.highestFocus.title}
                    </p>
                    <p className="mt-2 text-sm text-zinc-400">
                      {new Date(agenda.highestFocus.date).toLocaleDateString()}
                    </p>
                    <p className="mt-4 text-sm leading-6 text-zinc-300">
                      {agenda.highestFocus.aiSummary ||
                        agenda.highestFocus.note ||
                        "This is currently the most important upcoming focus item."}
                    </p>
                  </>
                ) : (
                  <UiEmptyState
                    title="No focus event yet"
                    text="Add or pin an event to highlight the most important upcoming priority."
                  />
                )}
              </div>
            </UiSection>

            <UiSection eyebrow="Today’s Focus" title="Immediate priorities">
              {agenda.topToday.length === 0 ? (
                <UiEmptyState
                  title="No events today"
                  text="Today is open. Use it for planning, research, or execution work."
                />
              ) : (
                <div className="space-y-3">
                  {agenda.topToday.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-zinc-100">
                        {event.title}
                      </p>
                      <p className="mt-2 text-xs text-zinc-500">
                        {event.priority} priority
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </UiSection>

            <UiSection eyebrow="This Week" title="Upcoming catalysts">
              {agenda.topWeek.length === 0 ? (
                <UiEmptyState
                  title="No events this week"
                  text="Your calendar is open this week. Add catalysts or reminders to guide execution."
                />
              ) : (
                <div className="space-y-3">
                  {agenda.topWeek.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-zinc-100">
                        {event.title}
                      </p>
                      <p className="mt-2 text-xs text-zinc-500">
                        {new Date(event.date).toLocaleDateString()} • {event.priority} priority
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </UiSection>

            <UiSection eyebrow="Add Smart Event" title="Create a reminder or catalyst">
              <div className="space-y-4">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Event title"
                  className="w-full rounded-2xl border border-white/8 bg-[#0c0e12] px-4 py-4 text-white outline-none placeholder:text-zinc-600"
                />

                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-2xl border border-white/8 bg-[#0c0e12] px-4 py-4 text-white outline-none"
                />

                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CalendarEventType)}
                  className="w-full rounded-2xl border border-white/8 bg-[#0c0e12] px-4 py-4 text-white outline-none"
                >
                  <option value="reminder">Reminder</option>
                  <option value="macro">Macro</option>
                  <option value="earnings">Earnings</option>
                  <option value="opportunity">Opportunity</option>
                </select>

                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as CalendarEventPriority)
                  }
                  className="w-full rounded-2xl border border-white/8 bg-[#0c0e12] px-4 py-4 text-white outline-none"
                >
                  <option value="low">Low priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="high">High priority</option>
                </select>

                <input
                  value={watchlistTag}
                  onChange={(e) => setWatchlistTag(e.target.value)}
                  placeholder="Watchlist tag (optional)"
                  className="w-full rounded-2xl border border-white/8 bg-[#0c0e12] px-4 py-4 text-white outline-none placeholder:text-zinc-600"
                />

                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Reminder note"
                  rows={3}
                  className="w-full rounded-2xl border border-white/8 bg-[#0c0e12] px-4 py-4 text-white outline-none placeholder:text-zinc-600"
                />

                <textarea
                  value={aiSummary}
                  onChange={(e) => setAiSummary(e.target.value)}
                  placeholder="AI summary / why it matters"
                  rows={4}
                  className="w-full rounded-2xl border border-white/8 bg-[#0c0e12] px-4 py-4 text-white outline-none placeholder:text-zinc-600"
                />

                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Action note / what to do next"
                  rows={4}
                  className="w-full rounded-2xl border border-white/8 bg-[#0c0e12] px-4 py-4 text-white outline-none placeholder:text-zinc-600"
                />

                <button
                  type="button"
                  onClick={handleAddEvent}
                  className="w-full rounded-2xl border border-white/8 bg-white px-5 py-4 font-semibold text-black transition hover:bg-zinc-100"
                >
                  Add Event
                </button>
              </div>
            </UiSection>

            <UiSection eyebrow="Calendar Learning" title="Behavior summary">
              <div className="space-y-3">
                <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                    Events Created
                  </p>
                  <p className="mt-2 text-lg font-semibold text-zinc-100">
                    {preferences?.createdCount ?? 0}
                  </p>
                </div>

                <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                    Pinned Events
                  </p>
                  <p className="mt-2 text-lg font-semibold text-zinc-100">
                    {preferences?.pinnedCount ?? 0}
                  </p>
                </div>

                <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                    Completed Events
                  </p>
                  <p className="mt-2 text-lg font-semibold text-zinc-100">
                    {preferences?.completedCount ?? 0}
                  </p>
                </div>

                <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                    Preferred Event Types
                  </p>
                  <p className="mt-2 text-sm text-zinc-300">
                    {preferences?.preferredTypes.length
                      ? preferences.preferredTypes.join(", ")
                      : "No preference data yet"}
                  </p>
                </div>

                <div className="rounded-xl border border-white/8 bg-[#0c0e12] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                    Top Watchlist Tags
                  </p>
                  <p className="mt-2 text-sm text-zinc-300">
                    {preferences?.mostUsedWatchlistTags.length
                      ? preferences.mostUsedWatchlistTags.join(", ")
                      : "No tag data yet"}
                  </p>
                </div>
              </div>
            </UiSection>
          </aside>
        </section>
      </div>
    </PlatformShell>
  );
}