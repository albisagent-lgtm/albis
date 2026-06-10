import type { PublicProfileStats, Signal } from "./signals";

export type ProfileTabView = "posts" | "tab" | "about" | "sources";

export type ProfileTabEvidence = {
  title: string;
  href: string;
  date?: string;
};

export type ProfileTabData = {
  enoughData: boolean;
  snapshot: {
    headline: string;
    description: string;
    evidenceCount: number;
    lastUpdatedLabel: string;
  };
  topics: Array<{
    name: string;
    count: number;
    evidence: ProfileTabEvidence[];
  }>;
  contributions: Array<{
    title: string;
    summary: string | null;
    href: string;
    date: string;
    reason: string;
    sourceDomain: string | null;
  }>;
  timeline: Array<{
    label: string;
    title: string;
    href: string;
    date: string;
  }>;
  sources: Array<{
    domain: string;
    count: number;
    examples: Array<{ title: string; href: string }>;
  }>;
};

type ProfileLike = {
  displayName?: string | null;
};

const VALID_VIEWS = new Set<ProfileTabView>(["posts", "tab", "about", "sources"]);

export function normaliseProfileTabView(value: string | string[] | undefined): ProfileTabView {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && VALID_VIEWS.has(raw as ProfileTabView) ? (raw as ProfileTabView) : "posts";
}

export function profileTabHref(handle: string, view: ProfileTabView) {
  return view === "posts" ? `/u/${handle}` : `/u/${handle}?tab=${view}`;
}

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recent";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function monthLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recent";
  return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function sourceDomain(url: string | null | undefined) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function topicName(raw: string) {
  return raw.replace(/^#+/, "").replaceAll("-", " ").trim();
}

function signalHref(signal: Signal) {
  return `/signals/${signal.slug}`;
}

export function buildProfileTabData(handle: string, profile: ProfileLike, cards: Signal[], stats: PublicProfileStats): ProfileTabData {
  const evidenceCards = cards.filter((card) => card.title && card.slug);
  const sorted = [...evidenceCards].sort((a, b) => new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime());
  const sourceCards = sorted.filter((card) => Boolean(card.article_url));
  const topicMap = new Map<string, Signal[]>();

  for (const card of sorted) {
    const candidates = [...(card.tags || []), card.category || ""].map(topicName).filter(Boolean);
    for (const topic of new Set(candidates)) {
      if (topic.toLowerCase() === "people") continue;
      const existing = topicMap.get(topic) || [];
      existing.push(card);
      topicMap.set(topic, existing);
    }
  }

  const topics = [...topicMap.entries()]
    .map(([name, topicCards]) => ({
      name,
      count: topicCards.length,
      evidence: topicCards.slice(0, 3).map((card) => ({ title: card.title, href: signalHref(card), date: formatShortDate(card.published_at) })),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 10);

  const sourceMap = new Map<string, { count: number; examples: Array<{ title: string; href: string }> }>();
  for (const card of sourceCards) {
    const domain = sourceDomain(card.article_url);
    if (!domain || !card.article_url) continue;
    const entry = sourceMap.get(domain) || { count: 0, examples: [] };
    entry.count += 1;
    if (entry.examples.length < 3) entry.examples.push({ title: card.title, href: card.article_url });
    sourceMap.set(domain, entry);
  }

  const sources = [...sourceMap.entries()]
    .map(([domain, value]) => ({ domain, ...value }))
    .sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain));

  const contributions = sorted
    .map((card) => {
      const hasSummary = Boolean(card.summary && card.summary.trim());
      const hasSource = Boolean(card.article_url);
      const hasContext = Number(card.comment_count || 0) > 0;
      const score = (hasSummary ? 2 : 0) + (hasSource ? 2 : 0) + (hasContext ? 1 : 0) + Math.min(Number(card.priority || 0), 2);
      const reason = [
        hasSummary ? "includes profile-authored context" : null,
        hasSource ? "links to source evidence" : null,
        hasContext ? "has public discussion/context" : null,
      ].filter(Boolean).join(" · ") || "recent public contribution";
      return { card, score, reason };
    })
    .sort((a, b) => b.score - a.score || new Date(b.card.published_at || 0).getTime() - new Date(a.card.published_at || 0).getTime())
    .slice(0, 6)
    .map(({ card, reason }) => ({
      title: card.title,
      summary: card.summary,
      href: signalHref(card),
      date: formatShortDate(card.published_at),
      reason,
      sourceDomain: sourceDomain(card.article_url),
    }));

  const timeline = sorted.slice(0, 8).map((card) => ({
    label: monthLabel(card.published_at),
    title: card.title,
    href: signalHref(card),
    date: formatShortDate(card.published_at),
  }));

  const displayName = profile.displayName || `@${handle}`;
  const evidenceCount = evidenceCards.length;
  const lastUpdatedLabel = sorted[0] ? formatShortDate(sorted[0].published_at) : "not yet";
  const description = evidenceCount
    ? `This Tab is built from ${evidenceCount} public update${evidenceCount === 1 ? "" : "s"}, ${stats.sources_count} linked source${stats.sources_count === 1 ? "" : "s"}, and visible profile context.`
    : "This Tab will appear once the profile has public contributions with posts, topics, or linked sources.";

  return {
    enoughData: evidenceCount >= 2 || sourceCards.length >= 1 || topics.length >= 1,
    snapshot: {
      headline: `${displayName}'s public contributions, organised by evidence`,
      description,
      evidenceCount,
      lastUpdatedLabel,
    },
    topics,
    contributions,
    timeline,
    sources,
  };
}
