import Link from "next/link";
import { EmailCapture } from "./components/email-capture";
import { SignalCardV2 } from "./components/signal-card-v2";
import { getAllPosts, getPostUrl, type BlogPost } from "@/lib/blog";
import { getLatestSignals, type Signal } from "@/lib/signals";
import latestWeatherRun from "../../public/community-weather/latest.json";

export const revalidate = 300;

type WeatherReport = {
  city: { name: string; country: string; region?: string };
  current: { temperatureC: number | null; description: string };
  daily: { precipitationMm: number | null; maxWindKph: number | null };
  riskLevel: "low" | "watch" | "elevated" | "high";
  riskReasons: string[];
  status: "routine" | "media-mentioned" | "weather-watch" | "community-watch-needed";
};

type WeatherRun = {
  date: string;
  generatedAt: string;
  reports: WeatherReport[];
};

const weatherRun = latestWeatherRun as WeatherRun;

function fmt(value: number | null | undefined, suffix = "") {
  if (typeof value !== "number" || !Number.isFinite(value)) return "n/a";
  return `${Math.round(value * 10) / 10}${suffix}`;
}

function EventShell({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "warm" }) {
  return (
    <article className={`rounded-[1.35rem] border p-4 transition hover:border-[#c8922a]/40 md:p-5 ${tone === "warm" ? "border-[#c8922a]/25 bg-[#fffaf0] dark:bg-[#c8922a]/[0.07]" : "border-black/[0.08] bg-white dark:border-white/[0.08] dark:bg-white/[0.035]"}`}>
      {children}
    </article>
  );
}

function WeatherEvent({ report }: { report: WeatherReport }) {
  const label = report.status === "community-watch-needed" ? "context needed" : report.status.replaceAll("-", " ");
  return (
    <EventShell tone="warm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-[#9b6b18] dark:text-[#f0c15e]">Weather · {report.city.country}</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-xl font-bold leading-tight">{report.city.name}</h2>
        </div>
        <span className="rounded-full border border-[#c8922a]/30 px-2.5 py-1 font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.12em] text-[#8a6417] dark:text-[#f0c15e]">{label}</span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {report.current.description}; {fmt(report.current.temperatureC, "°C")}. Rain {fmt(report.daily.precipitationMm, "mm")}; wind {fmt(report.daily.maxWindKph, "km/h")}.
      </p>
      {report.riskReasons[0] ? <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{report.riskReasons[0]}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/community-weather" className="rounded-full bg-[#111] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-white hover:bg-[#b58320] dark:bg-white dark:text-black">Open</Link>
        <Link href="https://t.me/albisdaily" className="rounded-full border border-black/[0.1] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-600 hover:border-[#c8922a]/40 hover:text-[#b58320] dark:border-white/[0.1] dark:text-zinc-300">Add context</Link>
      </div>
    </EventShell>
  );
}

function ReadCard({ post }: { post: BlogPost }) {
  return (
    <Link href={getPostUrl(post)} className="group block rounded-[1.25rem] border border-black/[0.08] bg-white p-4 transition hover:border-[#c8922a]/40 dark:border-white/[0.08] dark:bg-white/[0.035]">
      <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">{post.category.replaceAll("-", " ")}</p>
      <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-xl font-bold leading-tight group-hover:text-[#b58320]">{post.title}</h3>
      {post.description ? <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{post.description}</p> : null}
    </Link>
  );
}

function MiniSignal({ signal }: { signal: Signal }) {
  return (
    <Link href={`/signals/${signal.slug}`} className="block border-b border-black/[0.08] py-4 last:border-b-0 dark:border-white/[0.08]">
      <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">{signal.category?.replaceAll("-", " ") || "event"}</p>
      <h3 className="mt-1 font-[family-name:var(--font-playfair)] text-lg font-bold leading-tight hover:text-[#b58320]">{signal.title}</h3>
      {signal.summary ? <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{signal.summary}</p> : null}
    </Link>
  );
}

export default async function Home() {
  const [signals, posts] = await Promise.all([getLatestSignals(10), getAllPosts()]);
  const activeWeather = weatherRun.reports.filter((report) => report.status !== "routine").slice(0, 3);
  const featuredSignals = signals.slice(0, 4);
  const quietSignals = signals.slice(4, 10);
  const latestPosts = posts.slice(0, 6);

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea]">
      <section className="border-b border-black/[0.08] bg-white/70 dark:border-white/[0.08] dark:bg-white/[0.03]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:px-6 md:py-12 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="flex flex-wrap items-center gap-2 font-[family-name:var(--font-inter)] text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <span>Live</span><span>·</span><span>Events</span><span>·</span><span>Read</span>
            </div>
            <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-playfair)] text-4xl font-bold leading-[1.02] tracking-tight md:text-6xl lg:text-7xl">
              What’s happening now.
            </h1>
            <div className="mt-7 flex flex-wrap gap-2">
              <Link href="/" className="rounded-full bg-[#111] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-white dark:bg-white dark:text-black">Top</Link>
              <Link href="/community-weather" className="rounded-full border border-black/[0.1] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-600 hover:border-[#c8922a]/40 hover:text-[#b58320] dark:border-white/[0.1] dark:text-zinc-300">Weather</Link>
              <Link href="/life-systems" className="rounded-full border border-black/[0.1] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-600 hover:border-[#c8922a]/40 hover:text-[#b58320] dark:border-white/[0.1] dark:text-zinc-300">Life systems</Link>
              <Link href="/signals" className="rounded-full border border-black/[0.1] px-4 py-2 font-[family-name:var(--font-inter)] text-xs font-bold text-zinc-600 hover:border-[#c8922a]/40 hover:text-[#b58320] dark:border-white/[0.1] dark:text-zinc-300">All events</Link>
            </div>
          </div>
          <aside className="rounded-[1.35rem] border border-black/[0.08] bg-[#fbfaf7] p-5 dark:border-white/[0.08] dark:bg-white/[0.035]">
            <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">Daily briefing</p>
            <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-bold">2 minutes.</h2>
            <div className="mt-4"><EmailCapture variant="hero" showSocialProof={false} showYesterdayLink={false} source="live-home-hero" /></div>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:px-6 md:py-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {featuredSignals.map((signal, index) => <SignalCardV2 key={signal.id} signal={signal} rank={index + 1} variant={index === 0 ? "feature" : "feed"} />)}
          {activeWeather.map((report) => <WeatherEvent key={`${report.city.name}-${report.city.country}`} report={report} />)}
        </div>
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-[1.35rem] border border-black/[0.08] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.035]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">Latest</h2>
              <Link href="/signals" className="font-[family-name:var(--font-inter)] text-xs font-bold text-[#b58320]">All →</Link>
            </div>
            <div className="mt-2">
              {quietSignals.map((signal) => <MiniSignal key={signal.id} signal={signal} />)}
            </div>
          </div>
        </aside>
      </section>

      <section className="border-y border-black/[0.08] bg-white/65 dark:border-white/[0.08] dark:bg-white/[0.025]">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">Read</h2>
            <Link href="/lens" className="font-[family-name:var(--font-inter)] text-xs font-bold text-[#b58320]">More →</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {latestPosts.map((post) => <ReadCard key={post.slug} post={post} />)}
          </div>
        </div>
      </section>
    </main>
  );
}
