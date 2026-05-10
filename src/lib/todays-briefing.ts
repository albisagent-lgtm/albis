import { getPostUrl, type BlogPost } from "@/lib/blog";
import {
  CATEGORY_META,
  REGION_LABELS,
  normalizeRegion,
  type ScanItem,
} from "@/lib/scan-types";
import type { SiteSnapshot } from "@/lib/site-snapshot";

export type PublicSignalLevel = "Low" | "Medium" | "High" | "Moderate" | "Developing";

export interface TodayBriefingStory {
  id: string;
  label: string;
  headline: string;
  href?: string;
  whatHappened: string;
  whyItMatters: string;
  howFramed: string;
  whatIsMissing: string;
  whatToWatch: string;
  perspectiveGap: PublicSignalLevel;
  globalAttention: PublicSignalLevel;
}

export interface TodayBriefing {
  dateLabel: string;
  summary: string;
  stories: TodayBriefingStory[];
  perspectiveGap: {
    headline: string;
    level: PublicSignalLevel;
    explanation: string;
    href?: string;
  };
  attentionGap: {
    headline: string;
    level: PublicSignalLevel;
    explanation: string;
  };
  trust: {
    sources: string;
    regions: string;
    languages: string;
    lastUpdated: string;
  };
}

const SIGNAL_ORDER: Record<ScanItem["significance"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function formatDate(value?: string | null) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "Today";
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(value?: string | null) {
  if (!value) return "Preparing now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Preparing now";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function latestDateLabel(...values: Array<string | null | undefined>) {
  let latest: Date | null = null;
  let latestRaw: string | null = null;

  for (const value of values) {
    if (!value) continue;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) continue;
    if (!latest || date.getTime() > latest.getTime()) {
      latest = date;
      latestRaw = value;
    }
  }

  return formatDate(latestRaw);
}

function regionList(item: ScanItem) {
  const regions = [...new Set((item.regions || []).map(normalizeRegion).filter((r) => r !== "global"))];
  return regions.map((r) => REGION_LABELS[r] || r).slice(0, 4);
}

function categoryLabel(category: string) {
  return CATEGORY_META[category]?.label || "World";
}

function perspectiveLevel(score?: number | null): PublicSignalLevel {
  if (typeof score !== "number") return "Developing";
  if (score >= 7) return "High";
  if (score >= 4) return "Moderate";
  return "Low";
}

function attentionLevel(item: ScanItem): PublicSignalLevel {
  if (typeof item.coverage_breadth === "number") {
    if (item.coverage_breadth >= 7) return "High";
    if (item.coverage_breadth >= 4) return "Medium";
    return "Low";
  }
  const regions = regionList(item).length;
  if (regions >= 4) return "High";
  if (regions >= 2) return "Medium";
  return "Low";
}

function postSlugMap(posts: BlogPost[]) {
  return new Map(posts.map((post) => [post.title.toLowerCase(), getPostUrl(post)]));
}

function hrefForItem(item: ScanItem, posts: BlogPost[], titleMap: Map<string, string>) {
  const explicitSlug = "slug" in item ? (item as ScanItem & { slug?: string }).slug : undefined;
  if (explicitSlug) return getPostUrl({ slug: explicitSlug, category: item.category } as BlogPost);

  const exact = titleMap.get(item.headline.toLowerCase());
  if (exact) return exact;

  const words = item.headline.toLowerCase().split(/\W+/).filter((word) => word.length > 4);
  const match = posts.slice(0, 40).find((post) => {
    const title = post.title.toLowerCase();
    return words.filter((word) => title.includes(word)).length >= 2;
  });
  return match ? getPostUrl(match) : undefined;
}

function storyFromItem(item: ScanItem, index: number, posts: BlogPost[], titleMap: Map<string, string>): TodayBriefingStory {
  const regions = regionList(item);
  const missing = item.blindspot?.missingFrom?.map((r) => REGION_LABELS[r] || r).slice(0, 3) || [];
  return {
    id: `${index}-${item.headline}`,
    label: categoryLabel(item.category),
    headline: item.headline,
    href: hrefForItem(item, posts, titleMap),
    whatHappened: item.connection || `A ${categoryLabel(item.category).toLowerCase()} story surfaced in today’s scan.`,
    whyItMatters: item.significance === "high"
      ? "Albis marked this as a high-priority signal in today’s scan."
      : "Relevance detail arrives with the next scan update.",
    howFramed: regions.length
      ? `Most visible in ${regions.join(", ")}; compare how those regions prioritise the story.`
      : "Regional framing is still being gathered.",
    whatIsMissing: missing.length
      ? `Thin or missing coverage from ${missing.join(", ")}.`
      : "Watch for local voices, primary evidence, and practical consequences that may be absent from early coverage.",
    whatToWatch: item.tags?.length
      ? `Watch the ${item.tags.slice(0, 2).join(" / ")} signal next.`
      : "Watch whether the story spreads beyond its first coverage cluster.",
    perspectiveGap: perspectiveLevel(item.perception_gap),
    globalAttention: attentionLevel(item),
  };
}

function storyFromPost(post: BlogPost, index: number): TodayBriefingStory {
  return {
    id: `${index}-${post.slug}`,
    label: categoryLabel(post.category),
    headline: post.title,
    href: getPostUrl(post),
    whatHappened: post.description || post.title,
    whyItMatters: post.description || "This is a useful background read from the Albis archive.",
    howFramed: post.tags?.length ? `Connected tags: ${post.tags.slice(0, 3).join(", ")}.` : "Regional framing is still being gathered.",
    whatIsMissing: "Use the article sources to check what is not yet visible: local voices, hard numbers, and context from affected communities.",
    whatToWatch: "Watch whether this becomes a wider regional or global signal.",
    perspectiveGap: "Developing",
    globalAttention: "Medium",
  };
}

function trustRegions(snapshot: SiteSnapshot) {
  const regions = new Set<string>();
  for (const item of snapshot.items || []) {
    for (const region of item.regions || []) {
      const normalized = normalizeRegion(region);
      if (normalized !== "global") regions.add(REGION_LABELS[normalized] || normalized);
    }
  }
  return regions.size ? `${regions.size} regions visible today` : "Region coverage loading";
}

function fallbackStories(posts: BlogPost[]): TodayBriefingStory[] {
  const fromPosts = posts.slice(0, 5).map(storyFromPost);
  if (fromPosts.length >= 3) return fromPosts;

  return [
    {
      id: "fallback-1",
      label: "World",
      headline: "A calmer daily briefing is being prepared",
      whatHappened: "Albis is waiting for the latest scan payload before naming specific stories here.",
      whyItMatters: "The briefing should only make public claims when the source material is ready to inspect.",
      howFramed: "Regional framing appears once today’s scan has enough evidence.",
      whatIsMissing: "Live source detail is still being gathered for this edition.",
      whatToWatch: "Check back after the next scan, or browse the archive for the latest completed briefing.",
      perspectiveGap: "Developing",
      globalAttention: "Low",
    },
    {
      id: "fallback-2",
      label: "Attention",
      headline: "What’s missing is part of the product",
      whatHappened: "Albis compares coverage across regions to find where important context may be absent.",
      whyItMatters: "Uneven attention is often where public understanding becomes distorted.",
      howFramed: "The live edition will show which regions are emphasizing the story and which are barely covering it.",
      whatIsMissing: "Specific missing-context claims wait for a traceable source packet.",
      whatToWatch: "Watch for stories with high impact but low global attention.",
      perspectiveGap: "Developing",
      globalAttention: "Low",
    },
    {
      id: "fallback-3",
      label: "Trust",
      headline: "Trust strip and briefing ritual are now in place",
      whatHappened: "The page makes inspectability part of the daily flow.",
      whyItMatters: "Trust comes from showing source scope, uncertainty, and what changed.",
      howFramed: "The page leads with plain labels instead of internal acronyms.",
      whatIsMissing: "Live source counts, language counts, and correction history should be wired next.",
      whatToWatch: "Add the evidence packet contract behind each story.",
      perspectiveGap: "Low",
      globalAttention: "Low",
    },
  ];
}

export function buildTodayBriefing(snapshot: SiteSnapshot, posts: BlogPost[]): TodayBriefing {
  const titleMap = postSlugMap(posts);
  const scanStories = [...snapshot.items]
    .filter((item) => item?.headline)
    .sort((a, b) => (SIGNAL_ORDER[a.significance] ?? 1) - (SIGNAL_ORDER[b.significance] ?? 1))
    .slice(0, 5)
    .map((item, index) => storyFromItem(item, index, posts, titleMap));

  const stories = scanStories.length >= 3 ? scanStories : fallbackStories(posts);
  const pgiStory = stories.find((story) => story.perspectiveGap === "High" || story.perspectiveGap === "Moderate") || stories[0];
  const attentionStory = stories.find((story) => story.globalAttention === "Low") || stories[stories.length - 1];

  return {
    dateLabel: latestDateLabel(snapshot.scanDate, snapshot.briefingDate, snapshot.updatedAt),
    summary:
      snapshot.briefingSummary ||
      snapshot.briefingTitle ||
      snapshot.topTheme ||
      stories[0]?.headline ||
      "A calm two-minute briefing on what happened, how it is being framed, and what may be missing.",
    stories,
    perspectiveGap: {
      headline: snapshot.topPgiStory || pgiStory.headline,
      level: perspectiveLevel(snapshot.topPgiScore) === "Low" ? pgiStory.perspectiveGap : perspectiveLevel(snapshot.topPgiScore),
      explanation:
        "Perspective Gap shows how differently the same story is framed across regions and sources. High means the public may be seeing meaningfully different versions of the same event.",
      href: snapshot.topPgiStorySlug ? `/indexes/pgi/${snapshot.scanDate || "latest"}` : pgiStory.href,
    },
    attentionGap: {
      headline: snapshot.topGaiStory || attentionStory.headline,
      level: snapshot.topGaiScore && snapshot.topGaiScore >= 7 ? "High" : attentionStory.globalAttention,
      explanation:
        "Global Attention shows how widely or unevenly a story is covered. Low or uneven attention can signal missing context, especially when impact is high.",
    },
    trust: {
      sources: snapshot.storiesFound ? `${snapshot.storiesFound} stories scanned` : "Source-backed scan",
      regions: trustRegions(snapshot),
      languages: "Language coverage shown where available",
      lastUpdated: formatTime(snapshot.updatedAt),
    },
  };
}
