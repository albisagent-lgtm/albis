import Link from "next/link";
import { EmailCapture } from "./components/email-capture";
import { FeedMemoryFeed } from "./components/feed-memory-feed";
import { type FollowSuggestion } from "./components/follow-discovery";
import { FollowingFeed } from "./components/following-feed";
import { LiveEventFeed, type LiveFeedEvent } from "./components/live-event-feed";
import { getPostUrl, getRecentPosts, type BlogPost } from "@/lib/blog";
import { authorProfileHandle, getLatestSignals, type Signal } from "@/lib/signals";
import latestWeatherRun from "../../public/community-weather/latest.json";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 300;

type FeedFilter = "for-you" | "following" | "global" | "undercovered" | "latest";

type WeatherReport = {
  city: { name: string; country: string; region?: string };
  current: { temperatureC: number | null; description: string };
  daily: { precipitationMm: number | null; maxWindKph: number | null };
  riskReasons: string[];
  status: "routine" | "media-mentioned" | "weather-watch" | "community-watch-needed";
};

type WeatherRun = { date: string; generatedAt: string; reports: WeatherReport[] };

type FeedItem = LiveFeedEvent & { bucket: "albis" | "people" | "weather"; weight: number; publishedAt?: string; score?: number };

type FeedScoreRow = { card_slug: string; score: number | string | null; comments_count: number | null; shares_count: number | null; saves_count: number | null; unique_opens: number | null };

const weatherRun = latestWeatherRun as WeatherRun;
const primaryFilters: Array<{ key: FeedFilter; label: string }> = [
  { key: "for-you", label: "For You" },
  { key: "following", label: "Following" },
  { key: "global", label: "Global" },
  { key: "undercovered", label: "Undercovered" },
  { key: "latest", label: "Latest" },
];

const filters = primaryFilters;

const peopleCards: FeedItem[] = [
  {
    id: "people-weather-report",
    href: "/create",
    label: "people",
    title: "Post an update, link, or note",
    summary: "Short updates from people can sit beside Albis stories and articles.",
    author: "Albis community",
    timestamp: "prototype",
    action: "Create",
    commentCount: 0,
    bucket: "people",
    weight: 72,
  },
  {
    id: "people-independent-writing",
    href: "/read",
    label: "article",
    title: "Independent writing belongs in the feed",
    summary: "Articles, reporting, essays, and sourced notes can become part of the same conversation.",
    author: "Albis",
    timestamp: "prototype",
    action: "Read",
    commentCount: 0,
    bucket: "people",
    weight: 55,
  },
];

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function youtubeIdFromUrl(value: string) {
  const match = value.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return match?.[1] || null;
}

function mediaPreviewFromSignal(signal: Signal) {
  const meta = signal.metadata || {};
  const mediaUrl = asString(meta.media_url) || asString(meta.mediaUrl) || asString(meta.image_url) || asString(meta.imageUrl) || asString(meta.hero_image) || asString(meta.heroImage) || asString(meta.thumbnail_url) || asString(meta.thumbnailUrl) || asString(meta.source_image) || asString(meta.sourceImage) || asString(meta.youtube_url) || asString(meta.youtubeUrl);
  const sourceUrl = asString(meta.source_url) || asString(meta.sourceUrl);
  const youtubeId = youtubeIdFromUrl(mediaUrl || sourceUrl || "");
  if (youtubeId) return { type: "youtube" as const, url: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`, badge: "Video", alt: signal.title };
  if (!mediaUrl) return undefined;
  const lower = mediaUrl.toLowerCase();
  if (/\.(mp4|mov|webm)(\?|$)/.test(lower)) return { type: "video" as const, url: mediaUrl, badge: "Video", alt: signal.title };
  return { type: "image" as const, url: mediaUrl, badge: "Photo", alt: signal.title };
}

function fmt(value: number | null | undefined, suffix = "") {
  if (typeof value !== "number" || !Number.isFinite(value)) return "n/a";
  return `${Math.round(value * 10) / 10}${suffix}`;
}

function prettyTime(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function prettyReportDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function signalToCard(signal: Signal, index: number): FeedItem {
  const label = signal.category?.replaceAll("-", " ") || "albis";
  const cardSlug = signal.article_slug || `signal-${signal.id}`;
  const authorName = typeof signal.metadata?.author_display_name === "string" ? signal.metadata.author_display_name : typeof signal.metadata?.author_name === "string" ? signal.metadata.author_name : "Albis";
  const authorHandle = authorProfileHandle(typeof signal.metadata?.author_name === "string" ? signal.metadata.author_name : authorName);
  const authorAvatarUrl = typeof signal.metadata?.author_avatar_url === "string" ? signal.metadata.author_avatar_url : null;
  const aiReviewStatus = typeof signal.metadata?.ai_review_status === "string" ? signal.metadata.ai_review_status : null;
  const externalSourceUrl = asString(signal.metadata?.source_url) || asString(signal.metadata?.sourceUrl);
  const isPeopleCard = label.startsWith("people");
  return {
    id: `signal-${signal.id}`,
    cardSlug,
    href: `/signals/${signal.slug}`,
    label,
    title: signal.title,
    summary: signal.summary,
    author: authorName,
    authorAvatarUrl,
    authorHref: authorHandle && authorName !== "Albis" ? `/u/${authorHandle}` : null,
    source: signal.region || (isPeopleCard ? "reader update" : undefined),
    sourceHref: externalSourceUrl || signal.article_url || undefined,
    timestamp: prettyTime(signal.published_at),
    tags: signal.tags || [],
    bullets: signal.bullets || [],
    stillUnclear: signal.still_unclear,
    sourceNote: signal.source_note,
    aiReviewStatus,
    mediaPreview: mediaPreviewFromSignal(signal),
    publishedAt: signal.published_at,
    action: "Open",
    articleSlug: signal.article_slug,
    commentCount: signal.comment_count,
    bucket: isPeopleCard ? "people" : "albis",
    weight: (isPeopleCard ? 78 : 100) - index,
  };
}

function weatherToCard(report: WeatherReport, index: number): FeedItem {
  const line = `${report.current.description}; ${fmt(report.current.temperatureC, "°C")}. Rain ${fmt(report.daily.precipitationMm, "mm")}; wind ${fmt(report.daily.maxWindKph, "km/h")}.`;
  const cardSlug = `weather-${report.city.name}-${report.city.country}`;
  return {
    id: cardSlug,
    cardSlug,
    href: "/community-weather",
    label: "weather",
    title: `${report.city.name}, ${report.city.country}`,
    summary: report.riskReasons[0] || line,
    author: "Albis Weather",
    source: report.status.replaceAll("-", " "),
    timestamp: prettyReportDate(weatherRun.date),
    tags: ["weather", "community-watch"],
    publishedAt: `${weatherRun.date}T12:00:00Z`,
    action: "Open",
    commentCount: 0,
    bucket: "weather",
    weight: 86 - index,
  };
}

function postToCard(post: BlogPost, index: number): FeedItem {
  return {
    id: `post-${post.slug}`,
    cardSlug: post.slug,
    href: getPostUrl(post),
    label: "read",
    title: post.title,
    summary: post.description,
    author: post.author || "Albis",
    timestamp: prettyTime(post.date),
    publishedAt: post.date,
    mediaPreview: post.image ? { type: "image", url: post.image, badge: "Source", alt: post.title } : undefined,
    tags: [post.category].filter(Boolean),
    action: "Read",
    articleSlug: post.slug,
    commentCount: 0,
    bucket: "albis",
    weight: 64 - index,
  };
}

function FilterChip({ item, active }: { item: { key: FeedFilter; label: string }; active: boolean }) {
  const href = item.key === "for-you" ? "/" : `/?filter=${item.key}`;
  return (
    <Link href={href} className={`rounded-full px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold ${active ? "bg-[#111] text-white dark:bg-white dark:text-black" : "border border-black/[0.12] text-zinc-600 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300"}`}>
      {item.label}
    </Link>
  );
}

async function getFeedScoreMap() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("feed_scores")
      .select("card_slug, score, comments_count, shares_count, saves_count, unique_opens")
      .limit(300);
    if (error) return new Map<string, FeedScoreRow>();
    return new Map((data || []).map((row) => [(row as FeedScoreRow).card_slug, row as FeedScoreRow]));
  } catch {
    return new Map<string, FeedScoreRow>();
  }
}

function applyScores(cards: FeedItem[], scores: Map<string, FeedScoreRow>) {
  return cards.map((card) => {
    const row = scores.get(card.cardSlug || card.articleSlug || card.id);
    if (!row) return card;
    const score = Number(row.score || 0);
    return {
      ...card,
      score,
      commentCount: Math.max(card.commentCount || 0, row.comments_count || 0),
      weight: card.weight + score * 10,
    };
  });
}

function slugifyFollow(value: string) {
  return value.toLowerCase().replace(/^@+/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "follow";
}

function buildFollowSuggestions(signals: Signal[]): FollowSuggestion[] {
  const suggestions = new Map<string, FollowSuggestion>();
  for (const signal of signals) {
    const authorName = typeof signal.metadata?.author_name === "string" ? signal.metadata.author_name : null;
    if (authorName && authorName !== "Albis") {
      const id = `person:${slugifyFollow(authorName)}`;
      suggestions.set(id, {
        id,
        type: "person",
        label: authorName,
        title: authorName,
        description: "Follow this person’s updates and comments when they post on Albis.",
      });
    }
    if (signal.category) {
      const label = signal.category.replaceAll("-", " ");
      const id = `topic:${slugifyFollow(signal.category)}`;
      suggestions.set(id, {
        id,
        type: "topic",
        label,
        title: label,
        description: "Follow this topic to pull more related updates into your feed.",
      });
    }
    for (const tag of signal.tags || []) {
      const label = tag.replaceAll("-", " ");
      const id = `topic:${slugifyFollow(tag)}`;
      suggestions.set(id, {
        id,
        type: "topic",
        label,
        title: label,
        description: "Follow this tag to pull more related updates into your feed.",
      });
    }
    if (signal.region) {
      const id = `source:${slugifyFollow(signal.region)}`;
      suggestions.set(id, {
        id,
        type: "source",
        label: signal.region,
        title: signal.region,
        description: "Follow this source or region signal for more updates like this.",
      });
    }
  }

  const starter: FollowSuggestion[] = [
    { id: "person:zinfinite", type: "person", label: "@zinfinite", title: "@zinfinite", description: "Follow Ignatius’s updates and early community posts." },
    { id: "topic:life-systems", type: "topic", label: "Life Systems", title: "Life Systems", description: "Follow food, water, energy, climate, infrastructure, health, supply chain, and resilience updates." },
    { id: "topic:human-nature", type: "topic", label: "Human Nature", title: "Human Nature", description: "Follow reflections, links, and discussion around human behaviour and meaning." },
    { id: "topic:weather", type: "topic", label: "Weather", title: "Weather", description: "Follow local weather-watch and community-risk updates." },
    { id: "source:albis", type: "source", label: "Albis", title: "Albis", description: "Follow official Albis updates, briefings, and source intelligence." },
  ];
  for (const item of starter) if (!suggestions.has(item.id)) suggestions.set(item.id, item);
  return [...suggestions.values()].slice(0, 8);
}

export default async function Home({ searchParams }: { searchParams?: Promise<{ filter?: string }> }) {
  const params = await searchParams;
  const activeFilter = filters.some((item) => item.key === params?.filter) ? params?.filter as FeedFilter : "for-you";
  const [signals, posts, scoreMap] = await Promise.all([getLatestSignals(50), getRecentPosts(24), getFeedScoreMap()]);
  const signalCards = signals.map(signalToCard);
  const activeWeatherReports = weatherRun.reports.filter((report) => report.status !== "routine");
  const weatherReportsForFeed = (activeWeatherReports.length ? activeWeatherReports : weatherRun.reports).slice(0, 36);
  const weatherCards = weatherReportsForFeed.map(weatherToCard);
  const readCards = posts.slice(0, 12).map(postToCard);
  const cards = applyScores([...signalCards, ...weatherCards, ...peopleCards, ...readCards], scoreMap);
  const topCards = [...cards].sort((a, b) => b.weight - a.weight);
  const latestCards = [...cards].sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime() || b.weight - a.weight);
  const visibleCards = activeFilter === "global"
    ? topCards.slice(0, 48)
    : activeFilter === "latest"
      ? latestCards.slice(0, 48)
      : [];
  const followSuggestions = buildFollowSuggestions(signals);
  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea]">
      <section className="border-b border-black/[0.08] dark:border-white/[0.08]">
        <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.16em] text-[#b58320]">Albis</p>
              <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight md:text-6xl">See what you missed.</h1>
            </div>
            <Link href="/create" className="rounded-full bg-[#c8922a] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-black hover:bg-[#b58320]">
              Create
            </Link>
          </div>
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
            {primaryFilters.map((item) => <FilterChip key={item.key} item={item} active={activeFilter === item.key} />)}
          </div>
          <p className="mt-2 font-[family-name:var(--font-inter)] text-sm text-zinc-600 dark:text-zinc-300">
            Global stories, gaps, and context in one simple feed.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-5 md:px-6">
        <div className="mx-auto w-full">
          {activeFilter === "for-you" ? (
            <FeedMemoryFeed cards={topCards.slice(0, 72)} />
          ) : activeFilter === "following" ? (
            <FollowingFeed cards={topCards.slice(0, 48)} suggestions={followSuggestions} />
          ) : activeFilter === "undercovered" ? (
            <FeedMemoryFeed cards={topCards.slice(0, 72)} mode="undercovered" />
          ) : visibleCards.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-black/10 bg-white/50 px-6 py-14 text-center dark:border-white/10 dark:bg-white/[0.025]">
              <p className="font-[family-name:var(--font-playfair)] text-2xl font-bold">No updates here yet.</p>
              <Link href="/create" className="mt-4 inline-flex rounded-full bg-[#111] px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-black">Create an update</Link>
            </div>
          ) : (
            <LiveEventFeed events={visibleCards} />
          )}
        </div>

        <aside className="mt-5 space-y-3">
          <div className="rounded-3xl border border-[#c8922a]/30 bg-[#fff8e8] p-4 dark:border-[#f0c15e]/25 dark:bg-[#f0c15e]/10">
            <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-[#9b6b18] dark:text-[#f0c15e]">New here?</p>
            <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-bold">Start with a 10-minute feed check.</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              Use Albis as a quick media-literacy exercise: pick one topic, compare what appears here with your usual feed, then tell us what felt useful or confusing.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/media-literacy" className="rounded-full bg-[#111] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-white dark:bg-white dark:text-black">
                Try the exercise
              </Link>
              <Link href="/feedback" className="rounded-full border border-black/[0.12] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-700 hover:border-[#c8922a]/50 hover:text-[#9b6b18] dark:border-white/[0.14] dark:text-zinc-200 dark:hover:text-[#f0c15e]">
                Send feedback
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-black/[0.08] bg-white p-4 dark:border-white/[0.08] dark:bg-white/[0.035]">
            <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-[#9b6b18] dark:text-[#f0c15e]">Daily briefing</p>
            <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-bold">Get the daily scan.</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">One short email with the stories your feed may miss.</p>
            <div className="mt-4">
              <EmailCapture variant="hero" showSocialProof={false} showYesterdayLink={false} source="feed-home-side-card" />
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
