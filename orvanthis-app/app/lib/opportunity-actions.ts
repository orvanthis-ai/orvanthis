export type OpportunityItem = {
  id: string;
  title: string;
  category: string;
  score: number;
  stage: string;
  signal: string;
  whyNow: string;
  workspaceQuery: string;
  executionPrompt: string;
  calendarTitle: string;
  calendarNote: string;
  watchlistTag: string;
};

export const TRACKED_OPPORTUNITIES_KEY = "orvanthis:trackedOpportunities";
export const CALENDAR_EVENTS_KEY = "orvanthis:calendarEvents:v2";

export function loadTrackedOpportunityIds(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(TRACKED_OPPORTUNITIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function saveTrackedOpportunityIds(ids: string[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      TRACKED_OPPORTUNITIES_KEY,
      JSON.stringify(ids)
    );
  } catch {
    // ignore
  }
}

export function toggleTrackedOpportunity(id: string) {
  const current = loadTrackedOpportunityIds();
  const exists = current.includes(id);

  const next = exists
    ? current.filter((item) => item !== id)
    : [id, ...current];

  saveTrackedOpportunityIds(next);
  return next;
}

export function addOpportunityToCalendar(args: {
  title: string;
  note: string;
  watchlistTag: string;
  date?: string;
}) {
  if (typeof window === "undefined") return false;

  try {
    const raw = window.localStorage.getItem(CALENDAR_EVENTS_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const events = Array.isArray(existing) ? existing : [];

    const date =
      args.date ||
      (() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().slice(0, 10);
      })();

    const nextEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: args.title,
      date,
      type: "opportunity",
      source: "opportunity",
      priority: "high",
      status: "upcoming",
      pinned: true,
      watchlistTag: args.watchlistTag,
      note: args.note,
      aiSummary:
        "This opportunity was added from the Opportunities workflow to keep it visible inside the strategic calendar.",
      actionNote:
        "Review this opportunity, confirm timing, and decide whether it should move into active execution.",
    };

    window.localStorage.setItem(
      CALENDAR_EVENTS_KEY,
      JSON.stringify([nextEvent, ...events])
    );

    return true;
  } catch {
    return false;
  }
}