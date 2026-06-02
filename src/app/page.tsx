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

type FeedFilter = "top" | "latest" | "human" | "ai" | "discussed" | "weather" | "following" | "saved";

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
];

const secondaryFilters: Array<{ key: FeedFilter; label: string }> = [
  { key: "human", label: "Human" },
  { key: "ai", label: "AI-reviewed" },
  { key: "discussed", label: "Discussed" },
  { key: "weather", label: "Weather" },
  { key: "saved", label: "Saved" },
];

const filters = [...primaryFilters, ...secondaryFilters];

const missionCards = [
  ["Scanned media", "Albis watches outlets, regions, languages, weather, and public signals so no single feed becomes the whole story."],
  ["Cards first", "Each event becomes a clear shared object: source, context, uncertainty, discussion, and optional deeper reading."],
  ["People complete it", "Community feedback, local knowledge, questions, comments, and contributor articles help reveal what the cycle missed."],
];

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
    timestamp: prettyTime(signal.published_at),
    tags: signal.tags || [],
    aiReviewStatus,
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

function ReadRow({ post }: { post: BlogPost }) {
  return (
    <Link href={getPostUrl(post)} className="block border-b border-black/[0.08] py-4 last:border-b-0 dark:border-white/[0.08]">
      <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">{post.author || "Albis"} · {post.category.replaceAll("-", " ")}</p>
      <h3 className="mt-1 font-[family-name:var(--font-playfair)] text-lg font-bold leading-tight hover:text-[#b58320]">{post.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">{post.description}</p>
    </Link>
  );
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
    ? topCards.slice(0, 30)
    : activeFilter === "latest"
      ? latestCards.slice(0, 30)
      : activeFilter === "human"
        ? topCards.filter((card) => card.bucket === "people" && !card.aiReviewStatus).slice(0, 30)
        : activeFilter === "ai"
          ? topCards.filter((card) => card.aiReviewStatus && card.aiReviewStatus !== "not_requested").slice(0, 30)
          : activeFilter === "discussed"
            ? discussedCards.slice(0, 30)
            : activeFilter === "weather"
              ? topCards.filter((card) => card.bucket === "weather").slice(0, 36)
              : [];
  const latestPosts = posts.slice(0, 5);
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
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {primaryFilters.map((item) => <FilterChip key={item.key} item={item} active={activeFilter === item.key} />)}
            </div>
            <div className="hidden h-6 w-px bg-black/10 dark:bg-white/10 sm:block" />
            <div className="flex gap-2 overflow-x-auto pb-1">
              {secondaryFilters.map((item) => <FilterChip key={item.key} item={item} active={activeFilter === item.key} />)}
            </div>
          </div>
          <p className="mt-2 font-[family-name:var(--font-inter)] text-xs text-zinc-500 dark:text-zinc-400">
            Start with Top, Latest, or Following. Narrow by Human, AI-reviewed, Discussed, Weather, or Saved when you need a specific lens.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {missionCards.map(([title, text]) => (
              <Link key={title} href="/about" className="rounded-3xl border border-black/[0.08] bg-white/70 p-4 transition hover:border-[#c8922a]/40 dark:border-white/[0.08] dark:bg-white/[0.035]">
                <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          {activeFilter === "following" ? (
            <FollowingFeed cards={topCards.slice(0, 24)} suggestions={followSuggestions} />
          ) : (
            <>
              {activeFilter === "saved" ? (
                <div className="mb-3 rounded-2xl border border-black/[0.08] bg-white px-4 py-3 text-sm text-zinc-500 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-zinc-400">
                  Saved cards will appear here once account saves are connected.
                </div>
              ) : null}
              {activeFilter === "weather" && weatherStatus ? (
                <div className="mb-3 rounded-2xl border border-black/[0.08] bg-white px-4 py-3 font-[family-name:var(--font-inter)] text-sm text-zinc-500 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-zinc-400">
                  {weatherStatus}. Showing {visibleCards.length} city weather cards from the latest community-weather scan.
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
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-3xl border border-black/[0.08] bg-[#101010] p-4 text-[#f4f1ea] dark:border-white/[0.08] dark:bg-white/[0.04]">
            <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-[#c8922a]">Mission</p>
            <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-bold">Truth, trust, clarity.</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">Scanned news cycles become cards. People add context. Albis keeps sources, uncertainty, and framing visible.</p>
            <Link href="/about" className="mt-3 inline-flex font-[family-name:var(--font-inter)] text-xs font-bold text-[#c8922a]">How Albis works →</Link>
          </div>

          <div className="rounded-3xl border border-black/[0.08] bg-white p-4 dark:border-white/[0.08] dark:bg-white/[0.035]">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">Read</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Latest articles and briefings.</p>
            <div className="mt-2">{latestPosts.map((post) => <ReadRow key={post.slug} post={post} />)}</div>
            <Link href="/read" className="mt-3 inline-flex font-[family-name:var(--font-inter)] text-xs font-bold text-[#b58320]">More writing</Link>
          </div>

          <div className="rounded-3xl border border-black/[0.08] bg-white p-4 dark:border-white/[0.08] dark:bg-white/[0.035]">
            <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">Daily briefing</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Keep the feed clean; get the summary by email.</p>
            <div className="mt-3"><EmailCapture variant="hero" showSocialProof={false} showYesterdayLink={false} source="feed-home-right-rail" /></div>
          </div>
        </aside>
      </section>
    </main>
  );
}
