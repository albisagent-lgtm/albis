import Link from "next/link";
import { EmailCapture } from "./components/email-capture";
import { type FollowSuggestion } from "./components/follow-discovery";
import { FollowingFeed } from "./components/following-feed";
import { LiveEventFeed, type LiveFeedEvent } from "./components/live-event-feed";
import { getPostUrl, getRecentPosts, type BlogPost } from "@/lib/blog";
import { authorProfileHandle, getLatestSignals, type Signal } from "@/lib/signals";
import latestWeatherRun from "../../public/community-weather/latest.json";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 300;

type FeedFilter = "top" | "latest" | "following" | "discussed";

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
  { key: "top", label: "Top" },
  { key: "latest", label: "Latest" },
  { key: "following", label: "Following" },
  { key: "discussed", label: "Discussed" },
];

const filters = primaryFilters;

const peopleCards: FeedItem[] = [
  {
    id: "people-weather-report",
    href: "/create",
    label: "people",
    title: "Post an update, link, or note",
    summary: "Short cards from people can sit beside Albis reports and articles.",
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
  const authorName = typeof signal.metadata?.author_name === "string" ? signal.metadata.author_name : "Albis";
  const authorHandle = authorProfileHandle(authorName);
  const aiReviewStatus = typeof signal.metadata?.ai_review_status === "string" ? signal.metadata.ai_review_status : null;
  const isPeopleCard = label.startsWith("people");
  return {
    id: `signal-${signal.id}`,
    cardSlug,
    href: `/signals/${signal.slug}`,
    label,
    title: signal.title,
    summary: signal.summary,
    author: authorName,
    authorHref: authorHandle && authorName !== "Albis" ? `/u/${authorHandle}` : null,
    source: signal.region || (isPeopleCard ? "reader card" : undefined),
    sourceHref: signal.article_url || undefined,
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

function weatherAgeLabel() {
  const generated = new Date(weatherRun.generatedAt || `${weatherRun.date}T12:00:00Z`);
  if (Number.isNaN(generated.getTime())) return null;
  const hours = Math.floor((Date.now() - generated.getTime()) / (1000 * 60 * 60));
  if (hours < 0) return null;
  if (hours < 24) return `Weather scan updated ${hours || 1}h ago`;
  return `Weather scan is ${Math.floor(hours / 24)}d old`;
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
  const href = item.key === "top" ? "/" : `/?filter=${item.key}`;
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
        description: "Follow this person’s cards and comments when they post on Albis.",
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
        description: "Follow this topic to pull more related cards into your feed.",
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
        description: "Follow this tag to pull more related cards into your feed.",
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
    { id: "person:zinfinite", type: "person", label: "@zinfinite", title: "@zinfinite", description: "Follow Ignatius’s cards and early community posts." },
    { id: "topic:life-systems", type: "topic", label: "Life Systems", title: "Life Systems", description: "Follow food, water, energy, climate, infrastructure, health, supply chain, and resilience cards." },
    { id: "topic:human-nature", type: "topic", label: "Human Nature", title: "Human Nature", description: "Follow reflections, links, and discussion around human behaviour and meaning." },
    { id: "topic:weather", type: "topic", label: "Weather", title: "Weather", description: "Follow local weather-watch and community-risk cards." },
    { id: "source:albis", type: "source", label: "Albis", title: "Albis", description: "Follow official Albis cards, briefings, and source intelligence." },
  ];
  for (const item of starter) if (!suggestions.has(item.id)) suggestions.set(item.id, item);
  return [...suggestions.values()].slice(0, 8);
}

export default async function Home({ searchParams }: { searchParams?: Promise<{ filter?: string }> }) {
  const params = await searchParams;
  const activeFilter = filters.some((item) => item.key === params?.filter) ? params?.filter as FeedFilter : "top";
  const [signals, posts, scoreMap] = await Promise.all([getLatestSignals(50), getRecentPosts(24), getFeedScoreMap()]);
  const signalCards = signals.map(signalToCard);
  const activeWeatherReports = weatherRun.reports.filter((report) => report.status !== "routine");
  const weatherReportsForFeed = (activeWeatherReports.length ? activeWeatherReports : weatherRun.reports).slice(0, 36);
  const weatherCards = weatherReportsForFeed.map(weatherToCard);
  const readCards = posts.slice(0, 12).map(postToCard);
  const cards = applyScores([...signalCards, ...weatherCards, ...peopleCards, ...readCards], scoreMap);
  const topCards = [...cards].sort((a, b) => b.weight - a.weight);
  const latestCards = [...cards].sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime() || b.weight - a.weight);
  const discussedCards = [...cards].sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0) || (b.score || 0) - (a.score || 0) || b.weight - a.weight);
  const visibleCards = activeFilter === "top"
    ? topCards.slice(0, 48)
    : activeFilter === "latest"
      ? latestCards.slice(0, 48)
      : activeFilter === "discussed"
        ? discussedCards.slice(0, 48)
        : [];
  const followSuggestions = buildFollowSuggestions(signals);
  const weatherStatus = weatherAgeLabel();

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea]">
      <section className="border-b border-black/[0.08] dark:border-white/[0.08]">
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.16em] text-[#b58320]">Albis</p>
              <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight md:text-6xl">Cards</h1>
            </div>
            <Link href="/create" className="rounded-full bg-[#c8922a] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-black hover:bg-[#b58320]">
              Create
            </Link>
          </div>
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
            {primaryFilters.map((item) => <FilterChip key={item.key} item={item} active={activeFilter === item.key} />)}
          </div>
          <p className="mt-2 font-[family-name:var(--font-inter)] text-xs text-zinc-500 dark:text-zinc-400">
            Start with the main pulse, jump to the newest cards, follow people/topics, or open active discussions.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-4 md:px-6">
        <div className="rounded-3xl border border-[#c8922a]/25 bg-[#fff8e6] p-4 shadow-sm dark:border-[#f0c15e]/20 dark:bg-[#f0c15e]/10">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-[#9b6b18] dark:text-[#f0c15e]">Daily briefing</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">Keep the feed clean; get the summary by email.</p>
              <p className="mt-1 font-[family-name:var(--font-inter)] text-xs font-semibold text-zinc-500 dark:text-zinc-400">Free · Daily · Unsubscribe anytime</p>
            </div>
            <div className="w-full md:max-w-sm">
              <EmailCapture variant="hero" showSocialProof={false} showYesterdayLink={false} source="feed-home-briefing-strip" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-5 md:px-6">
        {activeFilter === "following" ? (
          <FollowingFeed cards={topCards.slice(0, 48)} suggestions={followSuggestions} />
        ) : (
          <>
            {activeFilter === "top" && weatherStatus ? (
              <div className="mb-3 rounded-2xl border border-black/[0.08] bg-white px-4 py-3 font-[family-name:var(--font-inter)] text-sm text-zinc-500 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-zinc-400">
                {weatherStatus}. Weather cards are folded into the main feed rather than split into a separate tab.
              </div>
            ) : null}
            {visibleCards.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-black/10 bg-white/50 px-6 py-14 text-center dark:border-white/10 dark:bg-white/[0.025]">
                <p className="font-[family-name:var(--font-playfair)] text-2xl font-bold">No cards here yet.</p>
                <Link href="/create" className="mt-4 inline-flex rounded-full bg-[#111] px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-black">Create one</Link>
              </div>
            ) : (
              <LiveEventFeed events={visibleCards} />
            )}
          </>
        )}
      </section>
    </main>
  );
}
