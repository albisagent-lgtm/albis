import fs from "fs";
import path from "path";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Weather — Albis",
  description:
    "A daily Albis community weather watchlist for major world cities: official weather data, traditional media signals, and where on-the-ground human context is needed.",
};

export const revalidate = 900;

type RiskLevel = "low" | "watch" | "elevated" | "high";
type Status = "routine" | "media-mentioned" | "weather-watch" | "community-watch-needed";

type WeatherReport = {
  city: { name: string; country: string; region?: string; latitude: number; longitude: number };
  observedAt: string;
  current: {
    temperatureC: number | null;
    apparentTemperatureC: number | null;
    precipitationMm: number | null;
    windKph: number | null;
    weatherCode: number | null;
    description: string;
  };
  daily: {
    maxTempC: number | null;
    minTempC: number | null;
    precipitationMm: number | null;
    maxWindKph: number | null;
  };
  riskLevel: RiskLevel;
  riskReasons: string[];
  mediaSignals: Array<{ title: string; url: string; domain?: string; source?: string }>;
  communityLearning: string[];
  status: Status;
};

type WeatherRun = {
  date: string;
  generatedAt: string;
  scope: string;
  methodology: string[];
  reports: WeatherReport[];
  socialPost: string;
};

const statusCopy: Record<Status, { label: string; className: string; summary: string }> = {
  routine: {
    label: "Routine",
    className: "border-zinc-200 bg-white text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300",
    summary: "No automated threshold or fresh media signal in this pass.",
  },
  "media-mentioned": {
    label: "Media mentioned",
    className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-300/20 dark:bg-blue-400/10 dark:text-blue-200",
    summary: "Traditional media is mentioning local weather or disruption themes.",
  },
  "weather-watch": {
    label: "Weather watch",
    className: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-300/25 dark:bg-amber-400/10 dark:text-amber-100",
    summary: "Weather thresholds and media signals suggest this city needs closer attention.",
  },
  "community-watch-needed": {
    label: "Community watch needed",
    className: "border-red-200 bg-red-50 text-red-700 dark:border-red-300/25 dark:bg-red-400/10 dark:text-red-100",
    summary: "Automated weather risk is present but traditional media is thin; local human context matters here.",
  },
};

function loadWeatherRun(): WeatherRun | null {
  const filePath = path.join(process.cwd(), "public", "community-weather", "latest.json");
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as WeatherRun;
  } catch {
    return null;
  }
}

function fmt(value: number | null | undefined, suffix = "") {
  if (typeof value !== "number" || !Number.isFinite(value)) return "n/a";
  return `${Math.round(value * 10) / 10}${suffix}`;
}

function statusCounts(reports: WeatherReport[]) {
  return reports.reduce<Record<Status, number>>(
    (acc, report) => {
      acc[report.status] += 1;
      return acc;
    },
    { routine: 0, "media-mentioned": 0, "weather-watch": 0, "community-watch-needed": 0 },
  );
}

function cityPriority(report: WeatherReport) {
  const statusWeight: Record<Status, number> = {
    "community-watch-needed": 4,
    "weather-watch": 3,
    "media-mentioned": 2,
    routine: 1,
  };
  const riskWeight: Record<RiskLevel, number> = { high: 4, elevated: 3, watch: 2, low: 1 };
  return statusWeight[report.status] * 10 + riskWeight[report.riskLevel] + report.mediaSignals.length;
}

function CityCard({ report }: { report: WeatherReport }) {
  const status = statusCopy[report.status];
  return (
    <article className="rounded-[1.35rem] border border-black/[0.08] bg-white p-5 shadow-sm shadow-black/[0.02] dark:border-white/[0.08] dark:bg-white/[0.035]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.18em] text-[#b58320]">
            {report.city.country}{report.city.region ? ` · ${report.city.region}` : ""}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-bold leading-tight">{report.city.name}</h2>
        </div>
        <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${status.className}`}>{status.label}</span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{status.summary}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <Metric label="Now" value={`${fmt(report.current.temperatureC, "°C")}`} />
        <Metric label="Feels" value={`${fmt(report.current.apparentTemperatureC, "°C")}`} />
        <Metric label="Rain" value={`${fmt(report.daily.precipitationMm, "mm")}`} />
        <Metric label="Wind" value={`${fmt(report.daily.maxWindKph, "km/h")}`} />
      </div>

      <div className="mt-5 rounded-2xl bg-[#f8f7f4] p-4 text-sm leading-relaxed text-zinc-700 dark:bg-white/[0.04] dark:text-zinc-200">
        <strong className="block text-zinc-950 dark:text-white">What Albis is learning</strong>
        <ul className="mt-2 space-y-1.5">
          {report.communityLearning.map((line) => <li key={line}>• {line}</li>)}
        </ul>
      </div>

      {report.riskReasons.length ? (
        <p className="mt-4 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          <strong>Automated reason:</strong> {report.riskReasons.join("; ")}
        </p>
      ) : null}

      {report.mediaSignals.length ? (
        <div className="mt-4 border-t border-black/[0.08] pt-4 dark:border-white/[0.08]">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">Traditional media signals</p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed">
            {report.mediaSignals.slice(0, 3).map((signal) => (
              <li key={signal.url}>
                <a href={signal.url} target="_blank" rel="noopener noreferrer" className="text-zinc-700 underline decoration-zinc-300 underline-offset-4 hover:text-[#b58320] dark:text-zinc-200 dark:decoration-zinc-600">
                  {signal.title}
                </a>
                {signal.domain ? <span className="text-zinc-400"> — {signal.domain}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-[#fbfaf7] p-3 dark:border-white/[0.08] dark:bg-white/[0.025]">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-playfair)] text-xl font-bold">{value}</p>
    </div>
  );
}

export default function CommunityWeatherPage() {
  const run = loadWeatherRun();
  const reports = run?.reports || [];
  const counts = statusCounts(reports);
  const activeReports = reports.filter((report) => report.status !== "routine").sort((a, b) => cityPriority(b) - cityPriority(a));
  const routineReports = reports.filter((report) => report.status === "routine").slice(0, 24);
  const featured = activeReports.length ? activeReports : reports.slice().sort((a, b) => cityPriority(b) - cityPriority(a)).slice(0, 6);

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea]">
      <section className="border-b border-black/[0.08] bg-white/75 dark:border-white/[0.08] dark:bg-white/[0.03]">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-18">
          <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.22em] text-[#b58320]">
            Community Weather
          </p>
          <h1 className="mt-4 max-w-5xl font-[family-name:var(--font-playfair)] text-4xl font-bold leading-tight md:text-6xl">
            What the world’s cities are experiencing — official data first, human context next.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            Albis scans major world cities every day for weather disruption signals, then marks where community updates could complete the picture: what people are seeing on the ground, what media may be missing, and what needs verification.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/signals/weather-risk" className="rounded-full bg-[#111] px-5 py-3 text-sm font-bold text-white hover:bg-[#b58320] dark:bg-white dark:text-black dark:hover:bg-[#f0c15e]">
              Weather & Risk method
            </Link>
            <Link href="https://t.me/albisdaily" className="rounded-full border border-black/[0.12] px-5 py-3 text-sm font-bold hover:border-[#b58320] hover:text-[#b58320] dark:border-white/[0.15]">
              Share a local update
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        {run ? (
          <div className="grid gap-4 md:grid-cols-5">
            <Metric label="Run date" value={run.date} />
            <Metric label="Cities" value={String(reports.length)} />
            <Metric label="Watch" value={String(counts["weather-watch"] + counts["community-watch-needed"])} />
            <Metric label="Media" value={String(counts["media-mentioned"])} />
            <Metric label="Routine" value={String(counts.routine)} />
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-black/[0.12] bg-white p-8 text-zinc-600 dark:border-white/[0.12] dark:bg-white/[0.035] dark:text-zinc-300">
            Community weather data has not been generated yet. The daily system writes to <code>public/community-weather/latest.json</code>.
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 md:px-6 md:pb-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-black/[0.08] pb-3 dark:border-white/[0.08]">
          <div>
            <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.18em] text-[#b58320]">Daily community watchlist</p>
            <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight md:text-3xl">
              {activeReports.length ? "Cities needing attention" : "No major watch signals in this pass"}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              The first layer is automated and conservative. The important next layer is human: local comments, corrections, photos, and lived context that can be checked together.
            </p>
          </div>
          {run ? <p className="text-xs text-zinc-400">Generated {new Date(run.generatedAt).toLocaleString("en-GB", { timeZone: "UTC" })} UTC</p> : null}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {featured.map((report) => <CityCard key={`${report.city.name}-${report.city.country}`} report={report} />)}
        </div>
      </section>

      {routineReports.length ? (
        <section className="border-t border-black/[0.08] bg-white/65 dark:border-white/[0.08] dark:bg-white/[0.025]">
          <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold md:text-3xl">Routine scan sample</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {routineReports.map((report) => (
                <div key={`${report.city.name}-${report.city.country}`} className="rounded-2xl border border-black/[0.07] bg-white p-4 dark:border-white/[0.08] dark:bg-white/[0.035]">
                  <p className="text-xs font-bold text-[#b58320]">{report.city.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">{report.city.country}</p>
                  <p className="mt-3 text-sm font-semibold">{report.current.description}; {fmt(report.current.temperatureC, "°C")}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-[#111] text-white">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center md:px-6 md:py-18">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] text-[#f0c15e]">What we are testing</p>
          <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl font-bold md:text-4xl">Can community truth become useful public intelligence?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/65">
            Weather is the safest proving ground: practical, repeated, verifiable, and human. The goal is not to replace traditional media — it is to add trusted local context around it.
          </p>
        </div>
      </section>
    </main>
  );
}
