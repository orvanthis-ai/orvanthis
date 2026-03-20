export type UserGoal =
  | "find-opportunities"
  | "trade-better"
  | "build-business"
  | "track-market"
  | "execute-faster";

export type MarketStyle =
  | "macro"
  | "growth"
  | "swing"
  | "day-trading"
  | "long-term";

export type BusinessStyle =
  | "operator"
  | "founder"
  | "investor"
  | "builder"
  | "analyst";

export type AssistantDefaultMode =
  | "chat"
  | "intelligence"
  | "execution"
  | "trader";

export type PersonalizationProfile = {
  completed: boolean;
  goals: UserGoal[];
  marketStyle: MarketStyle;
  businessStyle: BusinessStyle;
  preferredSectors: string[];
  watchlistPresets: string[];
  assistantDefaultMode: AssistantDefaultMode;
};

export const PERSONALIZATION_STORAGE_KEY = "orvanthis:personalizationProfile";

export const defaultPersonalizationProfile: PersonalizationProfile = {
  completed: false,
  goals: [],
  marketStyle: "growth",
  businessStyle: "operator",
  preferredSectors: [],
  watchlistPresets: [],
  assistantDefaultMode: "chat",
};

export function loadPersonalizationProfile(): PersonalizationProfile {
  if (typeof window === "undefined") return defaultPersonalizationProfile;

  try {
    const raw = window.localStorage.getItem(PERSONALIZATION_STORAGE_KEY);
    if (!raw) return defaultPersonalizationProfile;

    const parsed = JSON.parse(raw);

    return {
      completed: Boolean(parsed?.completed),
      goals: Array.isArray(parsed?.goals)
        ? parsed.goals.filter((item: unknown): item is UserGoal => typeof item === "string")
        : [],
      marketStyle:
        typeof parsed?.marketStyle === "string"
          ? parsed.marketStyle
          : defaultPersonalizationProfile.marketStyle,
      businessStyle:
        typeof parsed?.businessStyle === "string"
          ? parsed.businessStyle
          : defaultPersonalizationProfile.businessStyle,
      preferredSectors: Array.isArray(parsed?.preferredSectors)
        ? parsed.preferredSectors.filter(
            (item: unknown): item is string => typeof item === "string"
          )
        : [],
      watchlistPresets: Array.isArray(parsed?.watchlistPresets)
        ? parsed.watchlistPresets.filter(
            (item: unknown): item is string => typeof item === "string"
          )
        : [],
      assistantDefaultMode:
        typeof parsed?.assistantDefaultMode === "string"
          ? parsed.assistantDefaultMode
          : defaultPersonalizationProfile.assistantDefaultMode,
    };
  } catch {
    return defaultPersonalizationProfile;
  }
}

export function savePersonalizationProfile(profile: PersonalizationProfile) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      PERSONALIZATION_STORAGE_KEY,
      JSON.stringify(profile)
    );
  } catch {
    // ignore
  }
}

export function toggleStringInArray(values: string[], item: string) {
  return values.includes(item)
    ? values.filter((value) => value !== item)
    : [...values, item];
}

export function labelGoal(goal: UserGoal) {
  switch (goal) {
    case "find-opportunities":
      return "Find better opportunities";
    case "trade-better":
      return "Trade with better context";
    case "build-business":
      return "Build a business";
    case "track-market":
      return "Track the market better";
    case "execute-faster":
      return "Execute faster";
  }
}

export function labelMarketStyle(style: MarketStyle) {
  switch (style) {
    case "macro":
      return "Macro";
    case "growth":
      return "Growth";
    case "swing":
      return "Swing";
    case "day-trading":
      return "Day Trading";
    case "long-term":
      return "Long-Term";
  }
}

export function labelBusinessStyle(style: BusinessStyle) {
  switch (style) {
    case "operator":
      return "Operator";
    case "founder":
      return "Founder";
    case "investor":
      return "Investor";
    case "builder":
      return "Builder";
    case "analyst":
      return "Analyst";
  }
}

export function labelAssistantMode(
  mode: AssistantDefaultMode
): string {
  switch (mode) {
    case "chat":
      return "Chat";
    case "intelligence":
      return "Intelligence";
    case "execution":
      return "Execution";
    case "trader":
      return "Trader";
  }
}