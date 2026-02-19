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
}

export const CATEGORY_META: Record<string, { label: string; color: string }> = {
  "current-events": { label: "World", color: "blue" },
  "tech-ai": { label: "Tech & AI", color: "violet" },
  "weather-climate": { label: "Weather & Climate", color: "cyan" },
  "natural-world": { label: "Natural World", color: "emerald" },
  "economic-flows": { label: "Economic Flows", color: "amber" },
  "health": { label: "Health", color: "rose" },
  "grassroots": { label: "Grassroots", color: "lime" },
  "psychology-persuasion": { label: "Psych & Persuasion", color: "fuchsia" },
  "culture": { label: "Culture", color: "orange" },
  "influential-people": { label: "People", color: "sky" },
  "climate-energy": { label: "Climate & Energy", color: "teal" },
};

export const REGION_LABELS: Record<string, string> = {
  "south-asia": "South Asia",
  "western-world": "West",
  "middle-east": "Middle East",
  "eastern-europe": "E. Europe",
  "africa": "Africa",
  "east-se-asia": "East & SE Asia",
  "latin-americas": "Latin America",
  "global": "Global",
};

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
