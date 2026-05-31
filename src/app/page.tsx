import Link from "next/link";
import { EmailCapture } from "./components/email-capture";
import { LiveEventFeed } from "./components/live-event-feed";
import { getAllPosts, getPostUrl, type BlogPost } from "@/lib/blog";
import { getLatestSignals, type Signal } from "@/lib/signals";
import latestWeatherRun from "../../public/community-weather/latest.json";

export const revalidate = 300;

type WeatherReport = {
  city: { name: string; country: string; region?: string };
  current: { temperatureC: number | null; description: string };
  daily: { precipitationMm: number | null; maxWindKph: number | null };
  riskReasons: string[];
  status: "routine" | "media-mentioned" | "weather-watch" | "community-watch-needed";
};

type WeatherRun = { date: string; generatedAt: string; reports: WeatherReport[] };

type EventItem = {
  id: string;
  href: string;
  label: string;
  title: string;
  summary?: string | null;
  meta?: string;
  action?: string;
  articleSlug?: string | null;
  commentCount?: number | null;
  weight: number;
};

const weatherRun = latestWeatherRun as WeatherRun;

function fmt(value: number | null | undefined, suffix = "") {
  if (typeof value !== "number" || !Number.isFinite(value)) return "n/a";
  return `${Math.round(value * 10) / 10}${suffix}`;
}

function signalToEvent(signal: Signal, index: number): EventItem {
  const label = signal.category?.replaceAll("-", " ") || "event";
  return {
    id: `signal-${signal.id}`,
    href: `/signals/${signal.slug}`,
    label,
    title: signal.title,
    summary: signal.summary,
    meta: signal.region || undefined,
    action: "Open",
    articleSlug: signal.article_slug,
    commentCount: signal.comment_count,
    weight: 100 - index,
  };
}

function weatherToEvent(report: WeatherReport, index: number): EventItem {
  const line = `${report.current.description}; ${fmt(report.current.temperatureC, "°C")}. Rain ${fmt(report.daily.precipitationMm, "mm")}; wind ${fmt(report.daily.maxWindKph, "km/h")}.`;
  return {
    id: `weather-${report.city.name}-${report.city.country}`,
    href: "/community-weather",
    label: "weather",
    title: `${report.city.name}, ${report.city.country}`,
    summary: report.riskReasons[0] || line,
    meta: report.status.replaceAll("-", " "),
    action: "Open",
    weight: 80 - index,
  };
}

function ReadRow({ post }: { post: BlogPost }) {
  return (
    <Link href={getPostUrl(post)} className="block border-b border-black/[0.08] py-4 last:border-b-0 dark:border-white/[0.08]">
      <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">{post.category.replaceAll("-", " ")}</p>
      <h3 className="mt-1 font-[family-name:var(--font-playfair)] text-lg font-bold leading-tight hover:text-[#b58320]">{post.title}</h3>
    </Link>
  );
}

export default async function Home() {
  const [signals, posts] = await Promise.all([getLatestSignals(18), getAllPosts()]);
  const signalEvents = signals.map(signalToEvent);
  const weatherEvents = weatherRun.reports.filter((report) => report.status !== "routine").slice(0, 4).map(weatherToEvent);
  const events = [...signalEvents.slice(0, 8), ...weatherEvents].sort((a, b) => b.weight - a.weight).slice(0, 12);
  const lead = events[0];
  const feed = events.slice(1);
  const latestPosts = posts.slice(0, 7);

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea]">
      <section className="border-b border-black/[0.08] dark:border-white/[0.08]">
        <div className="mx-auto max-w-7xl px-4 py-5 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight md:text-5xl">Live</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/" className="rounded-full bg-[#111] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-white dark:bg-white dark:text-black">Top</Link>
              <Link href="/signals" className="rounded-full border border-black/[0.12] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-600 dark:border-white/[0.12] dark:text-zinc-300">Events</Link>
              <Link href="/community-weather" className="rounded-full border border-black/[0.12] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-600 dark:border-white/[0.12] dark:text-zinc-300">Weather</Link>
              <Link href="/lens" className="rounded-full border border-black/[0.12] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-600 dark:border-white/[0.12] dark:text-zinc-300">Read</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <LiveEventFeed events={lead ? [lead, ...feed] : feed} />
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-[1.25rem] border border-black/[0.08] bg-white p-4 dark:border-white/[0.08] dark:bg-white/[0.035]">
            <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">Daily briefing</p>
            <div className="mt-3"><EmailCapture variant="hero" showSocialProof={false} showYesterdayLink={false} source="operative-home" /></div>
          </div>

          <div className="rounded-[1.25rem] border border-black/[0.08] bg-white p-4 dark:border-white/[0.08] dark:bg-white/[0.035]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">Read</h2>
              <Link href="/lens" className="font-[family-name:var(--font-inter)] text-xs font-bold text-[#b58320]">More</Link>
            </div>
            <div className="mt-2">{latestPosts.map((post) => <ReadRow key={post.slug} post={post} />)}</div>
          </div>
        </aside>
      </section>
    </main>
  );
}
