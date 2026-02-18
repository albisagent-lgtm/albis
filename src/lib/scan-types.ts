// ---------------------------------------------------------------------------
// Shared types and display constants — safe for client AND server
// ---------------------------------------------------------------------------

export interface ScanItem {
  headline: string;
  category: string;
  regions: string[];
  tags: string[];
  patterns: string[];
  significance: "high" | "medium" | "low";
  connection: string;
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
