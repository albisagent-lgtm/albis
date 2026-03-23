"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { SeriesArticleFeed, type TaggedArticle } from "@/components/SeriesArticleFeed";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────

interface GAIDaily {
  date: string;
  daily_gai: number;
  gai_gp: number | null;
  gai_iw: number | null;
  gai_wr: number | null;
  gai_ec: number | null;
  gai_te: number | null;
  gai_he: number | null;
  gai_cl: number | null;
}

interface GAIStoryScore {
  id: string;
  scan_date: string;
  story_headline: string;
  category: string;
  regions_found: string[];
  regions_absent: string[];
  coverage_breadth: number;
  d1_coverage_breadth: number;
  d2_prominence_disparity: number;
  d3_population_exposure: number;
  d4_significance_severity: number;
  story_gai: number;
}

// ── Helpers ─────────────────────────────────────────────────────────

function getGAITier(gai: number) {
  if (gai <= 2) return { name: "Global Spotlight", color: "#22c55e" };
  if (gai <= 4) return { name: "Broad Awareness", color: "#eab308" };
  if (gai <= 6) return { name: "Selective Visibility", color: "#f97316" };
  if (gai <= 8) return { name: "Information Shadow", color: "#ef4444" };
  return { name: "Near Invisible", color: "#1f2937" };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-NZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const TRIBUTARIES = [
  { code: "GP", name: "Geopolitical", key: "gai_gp" },
  { code: "IW", name: "Information Warfare", key: "gai_iw" },
  { code: "WR", name: "Women's Rights", key: "gai_wr" },
  { code: "EC", name: "Economics", key: "gai_ec" },
  { code: "TE", name: "Technology & Ethics", key: "gai_te" },
  { code: "HE", name: "Health & Environment", key: "gai_he" },
  { code: "CL", name: "Climate", key: "gai_cl" },
];

// ── Blind Spots ────────────────────────────────────────────────────

const REGIONS = [
  { id: "us", label: "US", emoji: "🇺🇸", pop: 0.34 },
  { id: "eu", label: "EU", emoji: "🇪🇺", pop: 0.45 },
  { id: "middle-east", label: "Middle East", emoji: "🌍", pop: 0.41 },
  { id: "asia-pacific", label: "Asia-Pacific", emoji: "🌏", pop: 2.3 },
  { id: "south-asia", label: "South Asia", emoji: "🇮🇳", pop: 1.9 },
  { id: "africa", label: "Africa", emoji: "🌍", pop: 1.46 },
  { id: "latin-america", label: "Latin America", emoji: "🌎", pop: 0.66 },
] as const;

// Map slug → possible region_absent values
function regionIdToAbsentNames(id: string): string[] {
  const map: Record<string, string[]> = {
    "us": ["US", "United States"],
    "eu": ["EU", "Europe"],
    "middle-east": ["Middle East"],
    "asia-pacific": ["Asia-Pacific", "Asia Pacific"],
    "south-asia": ["South Asia"],
    "africa": ["Africa"],
    "latin-america": ["Latin America"],
  };
  return map[id] || [id];
}

// ── Main Component ─────────────────────────────────────────────────

export default function GAIPage() {
  return (
    <Suspense>
      <GAIPageInner />
    </Suspense>
  );
}

function GAIPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const regionParam = searchParams.get("region");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(regionParam);
  const [daily, setDaily] = useState<GAIDaily | null>(null);
  const [stories, setStories] = useState<GAIStoryScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [unseenArticles, setUnseenArticles] = useState<TaggedArticle[]>([]);
  const [gaiHistory, setGaiHistory] = useState<GAIDaily[]>([]);

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    // Try fetching latest daily GAI
    const { data: dailyData } = await supabase
      .from("gai_daily")
      .select("*")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dailyData) {
      setDaily(dailyData);
      setHasData(true);
    }

    // Try fetching latest story scores (today first, then fall back to most recent date)
    const today = new Date().toISOString().slice(0, 10);
    let { data: storiesData } = await supabase
      .from("gai_story_scores")
      .select("*")
      .eq("scan_date", today)
      .order("story_gai", { ascending: false })
      .limit(20);

    // If no stories today, get the most recent date that has data
    if (!storiesData || storiesData.length === 0) {
      const { data: latestStories } = await supabase
        .from("gai_story_scores")
        .select("*")
        .order("scan_date", { ascending: false })
        .order("story_gai", { ascending: false })
        .limit(20);
      storiesData = latestStories;
    }

    if (storiesData && storiesData.length > 0) {
      setStories(storiesData);
      setHasData(true);

      // If no daily record, calculate live GAI from stories
      if (!dailyData) {
        const sum = storiesData.reduce((acc, s) => acc + (Number(s.story_gai) || 0), 0);
        const liveGai = Number((sum / storiesData.length).toFixed(2));
        setDaily({
          date: storiesData[0].scan_date,
          daily_gai: liveGai,
          gai_gp: null, gai_iw: null, gai_wr: null,
          gai_ec: null, gai_te: null, gai_he: null, gai_cl: null,
        });
      }
    }

    // Fetch historical GAI data for charts
    const { data: historyData } = await supabase
      .from("gai_daily")
      .select("*")
      .order("date", { ascending: true })
      .limit(30);
    if (historyData && historyData.length > 0) {
      setGaiHistory(historyData);
    }

    setLoading(false);

    // Fetch unseen articles
    fetch("/api/articles/tagged?tag=unseen&limit=5")
      .then((r) => r.json())
      .then((d) => setUnseenArticles(d.articles || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const todayGai = daily?.daily_gai ?? null;
  const tier = todayGai !== null ? getGAITier(todayGai) : null;

  // Region blindness: count how often each region appears in regions_missing
  const regionBlindness = (() => {
    if (stories.length === 0) return [];
    const counts: Record<string, number> = {};
    for (const s of stories) {
      if (s.regions_absent) {
        for (const r of s.regions_absent) {
          counts[r] = (counts[r] || 0) + 1;
        }
      }
    }
    return Object.entries(counts)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count);
  })();

  const handleRegionSelect = (id: string) => {
    const next = selectedRegion === id ? null : id;
    setSelectedRegion(next);
    const url = next ? `/indexes/gai?region=${next}` : "/indexes/gai";
    router.replace(url, { scroll: false });
  };

  const blindSpotStories = selectedRegion
    ? stories.filter((s) =>
        s.regions_absent?.some((r) =>
          regionIdToAbsentNames(selectedRegion).some(
            (name) => r.toLowerCase() === name.toLowerCase()
          )
        )
      ).sort((a, b) => Number(b.story_gai) - Number(a.story_gai))
    : [];

  const selectedRegionInfo = REGIONS.find((r) => r.id === selectedRegion);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#c8922a]" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading Global Attention Index...</p>
        </div>
      </main>
    );
  }

  const gaiDatasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": "https://www.albis.news/indexes/gai",
    name: "Global Attention Index (GAI)",
    alternateName: "GAI",
    description:
      "The Global Attention Index measures whether stories are covered at all across regions, revealing information gaps and selective attention patterns worldwide. Updated three times daily.",
    url: "https://www.albis.news/indexes/gai",
    creator: { "@type": "Organization", name: "Albis", url: "https://www.albis.news" },
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    updateFrequency: "Three times daily",
    measurementTechnique:
      "Real-time analysis of article volume, prominence, and coverage breadth across geographic media clusters in 9 languages",
    variableMeasured: "Information visibility asymmetry across global media ecosystems",
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 pb-28 md:pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gaiDatasetSchema) }}
      />
      {/* ── Hero ── */}
      <section className="mb-16 text-center">
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight md:text-5xl">
          Global Attention Index
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-500 dark:text-zinc-400">
          The GAI measures whether you see a story at all. The PGI measures how differently you see it.
        </p>

        {hasData && todayGai !== null && tier ? (
          <div className="mt-10 flex flex-col items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
              {formatDate(daily!.date)}
            </p>
            <div
              className="text-7xl font-bold tabular-nums md:text-9xl leading-none"
              style={{ color: tier.color }}
            >
              {todayGai.toFixed(1)}
            </div>
            <div className="flex items-center gap-2 text-xl">
              <span
                className="inline-block h-5 w-5 rounded-full"
                style={{ backgroundColor: tier.color }}
              />
              <span className="font-semibold" style={{ color: tier.color }}>
                {tier.name}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-black/[0.07] bg-white/50 p-8 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <p className="text-lg font-medium text-zinc-600 dark:text-zinc-300">
              First GAI readings coming soon
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Data collection begins today. The Global Attention Index will update here as scores are calculated.
            </p>
          </div>
        )}
      </section>

      {/* ── Your Blind Spots ── */}
      {stories.length > 0 && (
        <section className="mb-16">
          <h2 className="mb-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold">
            Your Blind Spots
          </h2>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            Pick your region to discover what your media isn&apos;t showing you.
          </p>

          {/* Region selector */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {REGIONS.map((r) => (
              <button
                key={r.id}
                onClick={() => handleRegionSelect(r.id)}
                className={`rounded-2xl border p-4 text-center transition-all cursor-pointer ${
                  selectedRegion === r.id
                    ? "border-[#c8922a] bg-[#c8922a]/10 dark:bg-[#c8922a]/5"
                    : "border-black/[0.07] bg-white/50 hover:border-zinc-300 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.12]"
                }`}
              >
                <div className="text-2xl">{r.emoji}</div>
                <div className={`mt-1 text-xs font-medium ${
                  selectedRegion === r.id ? "text-[#c8922a]" : "text-zinc-500 dark:text-zinc-400"
                }`}>
                  {r.label}
                </div>
              </button>
            ))}
          </div>

          {/* Results */}
          {selectedRegion && selectedRegionInfo && (
            <div className="mt-8">
              <h3 className="mb-4 text-lg font-semibold text-zinc-700 dark:text-zinc-200">
                If you read {selectedRegionInfo.label} media, you&apos;re probably missing{" "}
                <span className="text-[#c8922a]">{blindSpotStories.length} stories</span> today
              </h3>

              {blindSpotStories.length === 0 ? (
                <div className="rounded-2xl border border-black/[0.07] bg-white/50 p-6 text-center dark:border-white/[0.06] dark:bg-white/[0.02]">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">No blind spots detected for {selectedRegionInfo.label} today — good coverage!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {blindSpotStories.map((story) => {
                    const t = getGAITier(Number(story.story_gai));
                    return (
                      <div
                        key={story.id}
                        className="rounded-2xl border border-black/[0.07] bg-white/50 p-5 dark:border-white/[0.06] dark:bg-white/[0.02]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-semibold leading-snug">
                              {story.story_headline}
                            </h4>
                            {story.regions_found && story.regions_found.length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs uppercase tracking-wider text-zinc-400">
                                  Covered by:
                                </span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {story.regions_found.map((r) => (
                                    <span
                                      key={r}
                                      className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                                    >
                                      {r}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <p className="mt-2 text-xs text-zinc-400">
                              {selectedRegionInfo.pop.toFixed(2)}B people in your region don&apos;t know about this
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <div
                              className="text-3xl font-bold tabular-nums"
                              style={{ color: t.color }}
                            >
                              {Number(story.story_gai).toFixed(1)}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-zinc-400">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: t.color }}
                              />
                              {t.name}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!selectedRegion && (
            <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white/30 p-8 text-center dark:border-zinc-700 dark:bg-white/[0.01]">
              <p className="text-sm text-zinc-400">
                👆 Pick your region to discover your blind spots
              </p>
            </div>
          )}
        </section>
      )}

      {/* ── River System: Tributaries ── */}
      <section className="mb-16">
        <h2 className="mb-6 font-[family-name:var(--font-playfair)] text-2xl font-semibold">
          The River System
        </h2>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          Seven tributaries feed the GAI, each measuring attention blindness in a different category of news.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {TRIBUTARIES.map((t) => {
            const val = daily ? Number((daily as unknown as Record<string, unknown>)[t.key] ?? 0) : null;
            const tierInfo = val !== null && val > 0 ? getGAITier(val) : null;
            return (
              <div
                key={t.code}
                className="rounded-2xl border border-black/[0.07] bg-white/50 p-6 dark:border-white/[0.06] dark:bg-white/[0.02]"
              >
                <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
                  GAI-{t.code}
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                  {t.name}
                </p>
                {tierInfo && val ? (
                  <>
                    <div
                      className="mt-3 text-3xl font-bold tabular-nums"
                      style={{ color: tierInfo.color }}
                    >
                      {val.toFixed(1)}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: tierInfo.color }}
                      />
                      <span className="text-zinc-400">{tierInfo.name}</span>
                    </div>
                  </>
                ) : (
                  <div className="mt-3 text-2xl font-bold text-zinc-300 dark:text-zinc-600">
                    --
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Region Blindness ── */}
      {regionBlindness.length > 0 && (
        <section className="mb-16">
          <h2 className="mb-6 font-[family-name:var(--font-playfair)] text-2xl font-semibold">
            Region Blindness
          </h2>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            Which regions miss the most stories? Regions that appear here are systematically blind to news that others cover.
          </p>
          <div className="rounded-2xl border border-black/[0.07] bg-white/50 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <div className="space-y-3">
              {regionBlindness.slice(0, 10).map((r) => {
                const pct = (r.count / stories.length) * 100;
                return (
                  <div key={r.region} className="flex items-center gap-4">
                    <div className="w-40 shrink-0 text-sm text-zinc-600 dark:text-zinc-300 truncate">
                      {r.region}
                    </div>
                    <div className="flex-1 h-6 rounded-full bg-black/[0.04] dark:bg-white/[0.04] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#ef4444]/70"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-20 text-right text-sm text-zinc-500 dark:text-zinc-400">
                      {r.count} of {stories.length} stories
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Most Invisible Stories ── */}
      {stories.length > 0 && (
        <section className="mb-16">
          <h2 className="mb-6 font-[family-name:var(--font-playfair)] text-2xl font-semibold">
            Most Invisible Stories
          </h2>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            Stories with the highest GAI scores — the news most of the world never sees.
          </p>
          <div className="space-y-4">
            {stories.slice(0, 5).map((story) => {
              const t = getGAITier(Number(story.story_gai));
              return (
                <div
                  key={story.id}
                  className="rounded-2xl border border-black/[0.07] bg-white/50 p-5 dark:border-white/[0.06] dark:bg-white/[0.02]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mb-1">
                        <span className="rounded-full bg-black/[0.04] px-2 py-0.5 dark:bg-white/[0.06]">
                          {story.category}
                        </span>
                        <span>
                          {story.coverage_breadth} of 7 regions covering
                        </span>
                      </div>
                      <h3 className="text-base font-semibold leading-snug">
                        {story.story_headline}
                      </h3>
                      {story.regions_absent && story.regions_absent.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs uppercase tracking-wider text-zinc-400">
                            Missing from:
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {story.regions_absent.map((r) => (
                              <span
                                key={r}
                                className="rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className="text-3xl font-bold tabular-nums"
                        style={{ color: t.color }}
                      >
                        {Number(story.story_gai).toFixed(1)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-zinc-400">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: t.color }}
                        />
                        {t.name}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Unseen Article Feed ── */}
      <SeriesArticleFeed
        tag="unseen"
        title="Unseen: Stories the World Missed"
        subtitle="Full articles investigating the stories most of the world never sees. Published 3× daily."
        accentColor="#c8922a"
        articles={unseenArticles}
      />

      {/* ── Daily Trend Chart ── */}
      <section className="mb-16">
        <h2 className="mb-6 font-[family-name:var(--font-playfair)] text-2xl font-semibold">
          Daily Trend
        </h2>
        {gaiHistory.length >= 2 ? (
          <>
            <div className="rounded-2xl border border-black/[0.07] bg-white/50 p-6 dark:border-white/[0.06] dark:bg-white/[0.02]">
              <div className="h-72 w-full md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={gaiHistory} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gaiTrendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c8922a" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#c8922a" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    {[
                      { y1: 0, y2: 2, fill: "#22c55e" },
                      { y1: 2, y2: 4, fill: "#eab308" },
                      { y1: 4, y2: 6, fill: "#f97316" },
                      { y1: 6, y2: 8, fill: "#ef4444" },
                      { y1: 8, y2: 10, fill: "#71717a" },
                    ].map((b) => (
                      <ReferenceArea key={b.y1} y1={b.y1} y2={b.y2} fill={b.fill} fillOpacity={0.04} ifOverflow="extendDomain" />
                    ))}
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d: string) => {
                        const dt = new Date(d + "T00:00:00");
                        return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
                      }}
                      tick={{ fontSize: 11, fill: "#a1a1aa" }}
                      axisLine={false}
                      tickLine={false}
                      interval={gaiHistory.length <= 10 ? 0 : Math.floor(gaiHistory.length / 8)}
                    />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} ticks={[0, 2, 4, 6, 8, 10]} width={32} />
                    <Tooltip
                      content={({ active, payload, label }: { active?: boolean; payload?: readonly { value: number }[]; label?: string | number }) => {
                        if (!active || !payload?.[0] || !label) return null;
                        const score = payload[0].value;
                        const t = getGAITier(score);
                        const dt = new Date(String(label) + "T00:00:00");
                        return (
                          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</p>
                            <p className="mt-1 text-2xl font-bold" style={{ color: "#c8922a" }}>{score.toFixed(2)}</p>
                            <p className="text-xs font-medium" style={{ color: t.color }}>{t.name}</p>
                          </div>
                        );
                      }}
                    />
                    <Area type="monotone" dataKey="daily_gai" stroke="#c8922a" strokeWidth={2} fill="url(#gaiTrendGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#c8922a" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Tributary Sparklines ── */}
            <h3 className="mt-8 mb-4 font-[family-name:var(--font-playfair)] text-lg font-semibold">
              Tributary Trends
            </h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {TRIBUTARIES.map((t) => {
                const latestVal = gaiHistory.length > 0
                  ? Number((gaiHistory[gaiHistory.length - 1] as unknown as Record<string, unknown>)[t.key] ?? 0)
                  : 0;
                const tierInfo = latestVal > 0 ? getGAITier(latestVal) : null;
                const hasAnyData = gaiHistory.some(
                  (d) => Number((d as unknown as Record<string, unknown>)[t.key] ?? 0) > 0
                );
                return (
                  <div
                    key={t.code}
                    className="rounded-2xl border border-black/[0.07] bg-white/50 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]"
                  >
                    <div className="flex items-baseline justify-between">
                      <p className="text-xs font-medium text-zinc-400">GAI-{t.code}</p>
                      {tierInfo && latestVal > 0 ? (
                        <span className="text-lg font-bold tabular-nums" style={{ color: tierInfo.color }}>
                          {latestVal.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-lg font-bold text-zinc-300 dark:text-zinc-600">--</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">{t.name}</p>
                    {hasAnyData ? (
                      <div className="h-12 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={gaiHistory} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                            <Line
                              type="monotone"
                              dataKey={t.key}
                              stroke={tierInfo ? tierInfo.color : "#a1a1aa"}
                              strokeWidth={1.5}
                              dot={false}
                              connectNulls
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex h-12 items-center justify-center">
                        <p className="text-xs text-zinc-300 dark:text-zinc-600">No data yet</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Region Blindness Trend ── */}
            {(() => {
              // Check if we have multi-date story data
              const uniqueDates = new Set(stories.map((s) => s.scan_date));
              if (uniqueDates.size < 2) {
                return (
                  <div className="mt-8 rounded-2xl border border-black/[0.07] bg-white/50 p-6 text-center dark:border-white/[0.06] dark:bg-white/[0.02]">
                    <p className="text-sm text-zinc-400">
                      📊 Region blindness trends — more data coming soon
                    </p>
                  </div>
                );
              }
              // Find most-blind region across all days
              const counts: Record<string, number> = {};
              for (const s of stories) {
                if (s.regions_absent) {
                  for (const r of s.regions_absent) {
                    counts[r] = (counts[r] || 0) + 1;
                  }
                }
              }
              const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
              if (sorted.length === 0) return null;
              const [blindest] = sorted[0];
              const totalDays = uniqueDates.size;
              return (
                <div className="mt-8 rounded-2xl border border-black/[0.07] bg-white/50 p-6 dark:border-white/[0.06] dark:bg-white/[0.02]">
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    <span className="font-semibold text-[#c8922a]">{blindest}</span> has been the
                    blindest region over the last{" "}
                    <span className="font-semibold">{totalDays} days</span> of data,
                    missing the most stories consistently.
                  </p>
                </div>
              );
            })()}
          </>
        ) : (
          <div className="rounded-2xl border border-black/[0.07] bg-white/50 p-8 dark:border-white/[0.06] dark:bg-white/[0.02] flex items-center justify-center min-h-[200px]">
            <p className="text-sm text-zinc-400">
              Historical trend chart will appear here once enough data has been collected.
            </p>
          </div>
        )}
      </section>

      {/* ── Methodology ── */}
      <section className="rounded-2xl border border-black/[0.07] bg-white/50 p-8 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <h2 className="mb-6 font-[family-name:var(--font-playfair)] text-2xl font-semibold">
          Methodology
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">
              Four Dimensions
            </h3>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
              <li>
                <strong>D1: Coverage Breadth</strong> — How many of the world&apos;s
                regions cover this story at all?
              </li>
              <li>
                <strong>D2: Placement Prominence</strong> — Where does it appear?
                Front page or buried sidebar?
              </li>
              <li>
                <strong>D3: Source Diversity</strong> — How many independent sources
                within each region pick it up?
              </li>
              <li>
                <strong>D4: Temporal Persistence</strong> — Does it stay in the news
                or vanish after one cycle?
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">
              The Scale
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-[#22c55e] shrink-0" />
                <span className="text-[#22c55e] font-medium">0-2</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  Global Spotlight — everyone sees it
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-[#eab308] shrink-0" />
                <span className="text-[#eab308] font-medium">2.1-4</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  Broad Awareness — most regions cover it
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-[#f97316] shrink-0" />
                <span className="text-[#f97316] font-medium">4.1-6</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  Selective Attention — coverage is patchy
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-[#ef4444] shrink-0" />
                <span className="text-[#ef4444] font-medium">6.1-8</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  Information Shadow — most regions are blind
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-[#1f2937] shrink-0" />
                <span className="text-zinc-400 font-medium">8.1-10</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  Attention Desert — almost nobody covers it
                </span>
              </li>
            </ul>
            <p className="mt-6 text-xs text-zinc-400">
              The GAI complements the PGI. While the PGI measures how differently
              regions frame a story, the GAI measures whether they see it at all.
            </p>
          </div>
        </div>
      </section>

      {/* ── Links ── */}
      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        <Link
          href="/indexes/gai/data"
          className="text-[#c8922a] hover:underline"
        >
          View raw GAI data →
        </Link>
        <Link
          href="/indexes"
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          ← Back to Indexes
        </Link>
      </div>
    </main>
  );
}
