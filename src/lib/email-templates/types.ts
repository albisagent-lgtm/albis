// ---------------------------------------------------------------------------
// Types for the Albis Daily Newsletter V2
// ---------------------------------------------------------------------------

export interface NewsletterItem {
  headline: string;
  category: string;
  connection: string;
  significance: "high" | "medium" | "low";
  regions: string[];
  tags?: string[];
  patterns?: string[];
  perception_gap?: number | null;
}

export interface PgiStory {
  story_headline: string;
  story_slug: string;
  story_pgi: number;
  category: string;
  regions_covered: string[];
  scoring_rationale: string;
  d3_framing: number;
  d4_emotional: number;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
}

export interface PulseItem {
  label: string;
  value: string;
  change?: string; // e.g. "↑ 2.3%"
}

export interface BlindSpotItem {
  headline: string;
  connection: string;
  coveredIn: string[];   // regions covering it
  missingFrom: string[]; // regions NOT covering it
  category: string;
}

export interface NewsletterData {
  date: string;
  displayDate: string;
  // 🌅 Good Morning
  greeting: string;
  // 📊 The Pulse
  pulseItems: PulseItem[];
  // 🔍 The Full Picture — Lead Story
  bigStory: NewsletterItem;
  bigStoryAnalysis: {
    whatHappened: string;
    perspectives: { region: string; view: string }[];
    whatEveryoneMisses: string;
    zoomOut: string;
  };
  // ⚡ World at a Glance
  glanceItems: NewsletterItem[];
  // 🌍 The Blind Spot
  blindSpot: BlindSpotItem | null;
  // Perception Gap (legacy, still useful)
  perceptionGap: PgiStory | null;
  // 📚 Worth Reading
  blogPosts: BlogPost[];
  // 💬 One Thing
  closingThought: string;
  // Meta
  mood?: string | null;
  patternOfDay?: { title: string; body: string } | string | null;
}

// Category emoji mapping
export const CATEGORY_EMOJI: Record<string, string> = {
  "current-events": "🌍",
  cybersecurity: "🔒",
  "tech-ai": "🤖",
  "ai-intelligence": "🤖",
  "weather-climate": "🌦️",
  "natural-world": "🌿",
  "economic-flows": "💰",
  health: "🏥",
  "health-longevity": "🔬",
  grassroots: "✊",
  "psychology-persuasion": "🧠",
  culture: "🎭",
  "influential-people": "👤",
  "climate-energy": "⚡",
};

// PGI tier labels
export function getPgiTier(score: number): string {
  if (score <= 2) return "Low Gap";
  if (score <= 4) return "Moderate Gap";
  if (score <= 6) return "Significant Gap";
  if (score <= 8) return "High Gap";
  return "Extreme Gap";
}

// Region flag emojis
export const REGION_FLAGS: Record<string, string> = {
  us: "🇺🇸",
  eu: "🇪🇺",
  china: "🇨🇳",
  latam: "🌎",
  india: "🇮🇳",
  africa: "🌍",
  "middle-east": "🕌",
  "south-asia": "🇮🇳",
  "east-se-asia": "🇯🇵",
  "western-world": "🇺🇸",
  "eastern-europe": "🇺🇦",
  "latin-americas": "🌎",
};

// Human-readable region names
export const REGION_NAMES: Record<string, string> = {
  us: "United States",
  eu: "Europe",
  china: "China",
  latam: "Latin America",
  india: "India",
  africa: "Africa",
  "middle-east": "Middle East",
  "south-asia": "South Asia",
  "east-se-asia": "East & SE Asia",
  "western-world": "Western World",
  "eastern-europe": "Eastern Europe",
  "latin-americas": "Latin Americas",
};
