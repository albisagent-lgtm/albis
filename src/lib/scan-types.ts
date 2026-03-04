// ---------------------------------------------------------------------------
// Shared types and display constants — safe for client AND server
// ---------------------------------------------------------------------------

export interface BlindspotData {
  isBlindspot: boolean;
  coveredBy: string[];
  missingFrom: string[];
}

export interface ScanItem {
  headline: string;
  category: string;
  regions: string[];
  tags: string[];
  patterns: string[];
  significance: "high" | "medium" | "low";
  connection: string;
  perception_gap?: number | null;
  blindspot?: BlindspotData;
}

export interface PatternOfDay {
  title: string;
  body: string;
}

export interface ParsedScan {
  date: string;
  displayDate: string;
  topTheme: string | null;
  mood: string | null;
  patternOfDay: PatternOfDay | null;
  weatherSummary: string | null;
  flowsSummary: string | null;
  framingNote: string | null;
  notableItems: string[];
  items: ScanItem[];
  scanMeta: string | null;
  rawMarkdown?: string;
  framingWatchRaw?: string;
}

export const CATEGORY_META: Record<string, { label: string; color: string; accent: string }> = {
  "current-events": { label: "World", color: "blue", accent: "#3b82f6" },
  "geopolitics": { label: "Geopolitics", color: "indigo", accent: "#1a3a5c" },
  "tech-ai": { label: "Tech & AI", color: "violet", accent: "#7c3aed" },
  "weather-climate": { label: "Weather & Climate", color: "cyan", accent: "#06b6d4" },
  "natural-world": { label: "Natural World", color: "emerald", accent: "#10b981" },
  "economic-flows": { label: "Economic Flows", color: "amber", accent: "#d97706" },
  "health": { label: "Health", color: "rose", accent: "#e11d48" },
  "grassroots": { label: "Grassroots", color: "lime", accent: "#65a30d" },
  "psychology-persuasion": { label: "Psych & Persuasion", color: "fuchsia", accent: "#c026d3" },
  "culture": { label: "Culture", color: "orange", accent: "#ea580c" },
  "influential-people": { label: "People", color: "sky", accent: "#0ea5e9" },
  "climate-energy": { label: "Climate & Energy", color: "teal", accent: "#14b8a6" },
  "cyber-info-warfare": { label: "Cyber & Info War", color: "red", accent: "#dc2626" },
  "food-agriculture": { label: "Food & Agriculture", color: "lime", accent: "#84cc16" },
  "migration-demographics": { label: "Migration", color: "slate", accent: "#64748b" },
  "science-space": { label: "Science & Space", color: "purple", accent: "#9333ea" },
  "conflict": { label: "Conflict", color: "red", accent: "#b91c1c" },
  "energy": { label: "Energy", color: "yellow", accent: "#ca8a04" },
  "governance": { label: "Governance", color: "blue", accent: "#2563eb" },
};

export const REGION_LABELS: Record<string, string> = {
  "south-asia": "South Asia",
  "south_asia": "South Asia",
  "western-world": "West",
  "us": "West",
  "middle-east": "Middle East",
  "middle_east": "Middle East",
  "eastern-europe": "E. Europe",
  "europe": "Europe",
  "eu": "Europe",
  "africa": "Africa",
  "east-se-asia": "East & SE Asia",
  "asia_pacific": "East & SE Asia",
  "latin-americas": "Latin America",
  "latam": "Latin America",
  "global": "Global",
};

// Normalise any region key to the canonical display key
const REGION_ALIAS: Record<string, string> = {
  "south_asia": "south-asia",
  "us": "western-world",
  "middle_east": "middle-east",
  "eu": "europe",
  "asia_pacific": "east-se-asia",
  "latam": "latin-americas",
};
export function normalizeRegion(r: string): string {
  return REGION_ALIAS[r] || r;
}

// Canonical display regions (excluding global)
export const DISPLAY_REGIONS = [
  "western-world",
  "europe",
  "middle-east",
  "south-asia",
  "east-se-asia",
  "africa",
  "latin-americas",
] as const;

export const FRAMING_PATTERNS = new Set(["framing"]);

export function hasFramingWatch(item: ScanItem): boolean {
  return item.patterns.some((p) => FRAMING_PATTERNS.has(p));
}

export function hasBlindspot(item: ScanItem): boolean {
  return item.blindspot?.isBlindspot === true;
}

// Region areas for blindspot detection — groups of related regions
const REGION_AREAS: Record<string, string[]> = {
  "Western": ["western-world"],
  "Eastern Europe": ["eastern-europe"],
  "Asia": ["south-asia", "east-se-asia"],
  "Middle East": ["middle-east"],
  "Africa": ["africa"],
  "Latin America": ["latin-americas"],
};

const ALL_REGION_KEYS = Object.keys(REGION_LABELS).filter((r) => r !== "global");

/**
 * Detects blindspots: stories heavily covered by some regions but missing from others.
 * A story is a blindspot if:
 * - It has 3+ regions from one area but 0 coverage from other major areas, OR
 * - It has only 1 region tagged (potential blindspot)
 */
export function detectBlindspots(items: ScanItem[]): ScanItem[] {
  return items.map((item) => {
    const coveredBy = item.regions.filter((r) => r !== "global");
    const missingFrom = ALL_REGION_KEYS.filter(
      (r) => !item.regions.includes(r)
    );

    // Check if only 1 region tagged — potential blindspot
    if (coveredBy.length === 1) {
      return {
        ...item,
        blindspot: { isBlindspot: true, coveredBy, missingFrom },
      };
    }

    // Check if 3+ regions from one area but missing entire other areas
    if (coveredBy.length >= 3) {
      const coveredAreas = new Set<string>();
      const missingAreas: string[] = [];

      for (const [area, areaRegions] of Object.entries(REGION_AREAS)) {
        if (areaRegions.some((r) => coveredBy.includes(r))) {
          coveredAreas.add(area);
        }
      }

      for (const area of Object.keys(REGION_AREAS)) {
        if (!coveredAreas.has(area)) {
          missingAreas.push(area);
        }
      }

      // Blindspot if covered areas are concentrated and missing areas are many
      if (missingAreas.length >= 3) {
        return {
          ...item,
          blindspot: { isBlindspot: true, coveredBy, missingFrom },
        };
      }
    }

    return {
      ...item,
      blindspot: { isBlindspot: false, coveredBy, missingFrom },
    };
  });
}

export function groupByCategory(items: ScanItem[]): Map<string, ScanItem[]> {
  const groups = new Map<string, ScanItem[]>();
  const order = Object.keys(CATEGORY_META);

  for (const item of items) {
    const existing = groups.get(item.category) || [];
    existing.push(item);
    groups.set(item.category, existing);
  }

  const sorted = new Map<string, ScanItem[]>();
  for (const cat of order) {
    if (groups.has(cat)) {
      sorted.set(cat, groups.get(cat)!);
    }
  }
  for (const [cat, catItems] of groups) {
    if (!sorted.has(cat)) {
      sorted.set(cat, catItems);
    }
  }

  return sorted;
}
