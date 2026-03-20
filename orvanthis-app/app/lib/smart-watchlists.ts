import { loadPersonalizationProfile } from "@/lib/personalization";

export const WATCHLISTS_KEY = "orvanthis:watchlists";

export function loadWatchlists(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(WATCHLISTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function saveWatchlists(watchlists: string[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(WATCHLISTS_KEY, JSON.stringify(watchlists));
  } catch {
    // ignore
  }
}

export function seedWatchlistsFromPersonalization() {
  if (typeof window === "undefined") return [];

  const current = loadWatchlists();
  if (current.length > 0) return current;

  const profile = loadPersonalizationProfile();

  const seeded = Array.from(
    new Set([
      ...profile.watchlistPresets,
      ...profile.preferredSectors,
      ...(profile.marketStyle ? [profile.marketStyle] : []),
      ...(profile.businessStyle ? [profile.businessStyle] : []),
    ])
  ).filter(Boolean);

  if (seeded.length > 0) {
    saveWatchlists(seeded);
    return seeded;
  }

  return [];
}

export function addWatchlistItem(item: string) {
  const clean = item.trim();
  if (!clean) return loadWatchlists();

  const current = loadWatchlists();
  const next = Array.from(new Set([clean, ...current]));
  saveWatchlists(next);
  return next;
}

export function removeWatchlistItem(item: string) {
  const next = loadWatchlists().filter((value) => value !== item);
  saveWatchlists(next);
  return next;
}