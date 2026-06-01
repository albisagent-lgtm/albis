import Link from "next/link";
import { EmailCapture } from "./components/email-capture";
import { LiveEventFeed, type LiveFeedEvent } from "./components/live-event-feed";
import { getAllPosts, getPostUrl, type BlogPost } from "@/lib/blog";
import { getLatestSignals, type Signal } from "@/lib/signals";
import latestWeatherRun from "../../public/community-weather/latest.json";

export const revalidate = 300;

type FeedFilter = "all" | "albis" | "people" | "following" | "weather";

type WeatherReport = {
  city: { name: string; country: string; region?: string };
  current: { temperatureC: number | null; description: string };
  daily: { precipitationMm: number | null; maxWindKph: number | null };
  riskReasons: string[];
  status: "routine" | "media-mentioned" | "weather-watch" | "community-watch-needed";
};

type WeatherRun = { date: string; generatedAt: string; reports: WeatherReport[] };

type FeedItem = LiveFeedEvent & { bucket: Exclude<FeedFilter, "all" | "following">; weight: number };

const weatherRun = latestWeatherRun as WeatherRun;
const filters: Array<{ key: FeedFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "albis", label: "Albis" },
  { key: "people", label: "People" },
  { key: "following", label: "Following" },
  { key: "weather", label: "Weather" },
];

const peopleCards: FeedItem[] = [
  {
    id: "people-weather-report",
    href: "/create",
    label: "people",
    title: "Share what is happening where you are",
    summary: "Post a short card, paste a link, or add local context to something Albis is watching.",
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
    title: "Independent writing can live beside Albis scans",
    summary: "Read is for Albis articles and thoughtful work from people who want calmer discussion around useful information.",
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

function signalToCard(signal: Signal, index: number): FeedItem {
  const label = signal.category?.replaceAll("-", " ") || "albis";
  return {
    id: `signal-${signal.id}`,
    href: `/signals/${signal.slug}`,
    label,
    title: signal.title,
    summary: signal.summary,
    author: "Albis",
    source: signal.region || undefined,
    timestamp: prettyTime(signal.published_at),
    action: signal.article_slug ? "Open" : "Discuss",
    articleSlug: signal.article_slug,
    commentCount: signal.comment_count,
    bucket: "albis",
    weight: 100 - index,
  };
}

function weatherToCard(report: WeatherReport, index: number): FeedItem {
  const line = `${report.current.description}; ${fmt(report.current.temperatureC, "°C")}. Rain ${fmt(report.daily.precipitationMm, "mm")}; wind ${fmt(report.daily.maxWindKph, "km/h")}.`;
  return {
    id: `weather-${report.city.name}-${report.city.country}`,
    href: "/community-weather",
    label: "weather",
    title: `${report.city.name}, ${report.city.country}`,
    summary: report.riskReasons[0] || line,
    author: "Albis Weather",
    source: report.status.replaceAll("-", " "),
    timestamp: prettyTime(weatherRun.generatedAt),
    action: "Open",
    commentCount: 0,
    bucket: "weather",
    weight: 86 - index,
  };
}

function postToCard(post: BlogPost, index: number): FeedItem {
  return {
    id: `post-${post.slug}`,
    href: getPostUrl(post),
    label: "read",
    title: post.title,
    summary: post.description,
    author: post.author || "Albis",
    timestamp: prettyTime(post.date),
    action: "Read",
    commentCount: 0,
    bucket: "albis",
    weight: 64 - index,
  };
}

function FilterChip({ item, active }: { item: { key: FeedFilter; label: string }; active: boolean }) {
  const href = item.key === "all" ? "/" : `/?filter=${item.key}`;
  return (
    <Link href={href} className={`rounded-full px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold ${active ? "bg-[#111] text-white dark:bg-white dark:text-black" : "border border-black/[0.12] text-zinc-600 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300"}`}>
      {item.label}
    </Link>
  );
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
  const activeFilter = filters.some((item) => item.key === params?.filter) ? params?.filter as FeedFilter : "all";
  const [signals, posts] = await Promise.all([getLatestSignals(18), getAllPosts()]);
  const signalCards = signals.map(signalToCard);
  const weatherCards = weatherRun.reports.filter((report) => report.status !== "routine").slice(0, 6).map(weatherToCard);
  const readCards = posts.slice(0, 4).map(postToCard);
  const cards = [...signalCards.slice(0, 8), ...weatherCards, ...peopleCards, ...readCards].sort((a, b) => b.weight - a.weight);
  const visibleCards = activeFilter === "all"
    ? cards.slice(0, 14)
    : activeFilter === "following"
      ? cards.slice(0, 5)
      : cards.filter((card) => card.bucket === activeFilter).slice(0, 14);
  const latestPosts = posts.slice(0, 5);

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea]">
      <section className="border-b border-black/[0.08] dark:border-white/[0.08]">
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.16em] text-[#b58320]">Albis Feed</p>
              <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight md:text-6xl">Cards</h1>
            </div>
            <Link href="/create" className="rounded-full bg-[#c8922a] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-black hover:bg-[#b58320]">
              Create
            </Link>
          </div>
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
            {filters.map((item) => <FilterChip key={item.key} item={item} active={activeFilter === item.key} />)}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          {activeFilter === "following" ? (
            <div className="mb-3 rounded-2xl border border-black/[0.08] bg-white px-4 py-3 text-sm text-zinc-500 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-zinc-400">
              Following is a placeholder for now. It will become the cards from people and topics you follow.
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
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-3xl border border-black/[0.08] bg-white p-4 dark:border-white/[0.08] dark:bg-white/[0.035]">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">Read</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Latest articles and briefings.</p>
            <div className="mt-2">{latestPosts.map((post) => <ReadRow key={post.slug} post={post} />)}</div>
            <Link href="/read" className="mt-3 inline-flex font-[family-name:var(--font-inter)] text-xs font-bold text-[#b58320]">More writing</Link>
          </div>

          <div className="rounded-3xl border border-black/[0.08] bg-white p-4 dark:border-white/[0.08] dark:bg-white/[0.035]">
            <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">Daily briefing</p>
            <div className="mt-3"><EmailCapture variant="hero" showSocialProof={false} showYesterdayLink={false} source="feed-home" /></div>
          </div>
        </aside>
      </section>
    </main>
  );
}
