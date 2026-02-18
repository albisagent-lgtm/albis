// ---------------------------------------------------------------------------
// User preferences — localStorage now, Supabase later
// ---------------------------------------------------------------------------

export const TOPICS = [
  { id: "current-events", label: "World", color: "blue" },
  { id: "tech-ai", label: "Tech & AI", color: "violet" },
  { id: "influential-people", label: "People", color: "sky" },
  { id: "psychology-persuasion", label: "Psych & Persuasion", color: "fuchsia" },
  { id: "natural-world", label: "Natural World", color: "emerald" },
  { id: "weather-climate", label: "Weather & Climate", color: "cyan" },
  { id: "wild-card", label: "Wild Card", color: "zinc" },
  { id: "economic-flows", label: "Economic Flows", color: "amber" },
  { id: "grassroots", label: "Grassroots", color: "lime" },
  { id: "health", label: "Health", color: "rose" },
  { id: "climate-energy", label: "Climate & Energy", color: "teal" },
  { id: "culture", label: "Culture", color: "orange" },
] as const;

export const REGIONS = [
  { id: "south-asia", label: "South Asia" },
  { id: "east-se-asia", label: "East & SE Asia" },
  { id: "middle-east", label: "Middle East" },
  { id: "africa", label: "Africa" },
  { id: "eastern-europe", label: "Eastern Europe" },
  { id: "western-world", label: "Western World" },
  { id: "latin-americas", label: "Latin America" },
] as const;

export type TopicId = (typeof TOPICS)[number]["id"];
export type RegionId = (typeof REGIONS)[number]["id"];

export interface UserPreferences {
  topics: TopicId[];
  regions: RegionId[];
  onboardingComplete: boolean;
}

export interface TierLimits {
  maxTopics: number;
  maxRegions: number;
  tier: "free" | "premium";
}

export const FREE_TIER: TierLimits = {
  maxTopics: 2,
  maxRegions: 1,
  tier: "free",
};

const STORAGE_KEY = "albis-preferences";
const AUTH_KEY = "albis-auth";

// ---------------------------------------------------------------------------
// Auth helpers (localStorage placeholder — swap to Supabase later)
// ---------------------------------------------------------------------------

export interface LocalUser {
  email: string;
  createdAt: string;
}

export function getLocalUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLocalUser(user: LocalUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function clearLocalUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("albis-premium");
}

// ---------------------------------------------------------------------------
// Preferences CRUD
// ---------------------------------------------------------------------------

const DEFAULT_PREFS: UserPreferences = {
  topics: [],
  regions: [],
  onboardingComplete: false,
};

export function getPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePreferences(prefs: UserPreferences): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

const PREMIUM_KEY = "albis-premium";

export function isPremium(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PREMIUM_KEY) === "true";
  } catch {
    return false;
  }
}

export function setPremium(value: boolean): void {
  if (typeof window === "undefined") return;
  if (value) {
    localStorage.setItem(PREMIUM_KEY, "true");
  } else {
    localStorage.removeItem(PREMIUM_KEY);
  }
}

export function getTierLimits(): TierLimits {
  if (isPremium()) {
    return { maxTopics: 12, maxRegions: 7, tier: "premium" };
  }
  return FREE_TIER;
}

export function canAddTopic(current: TopicId[]): boolean {
  const limits = getTierLimits();
  return current.length < limits.maxTopics;
}

export function canAddRegion(current: RegionId[]): boolean {
  const limits = getTierLimits();
  return current.length < limits.maxRegions;
}
