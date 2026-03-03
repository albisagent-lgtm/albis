"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

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
  regions_covering: string[];
  regions_missing: string[];
  region_count: number;
  total_regions: number;
  d1_coverage_breadth: number;
  d2_placement_prominence: number;
  d3_source_diversity: number;
  d4_temporal_persistence: number;
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

// ── Main Component ─────────────────────────────────────────────────

export default function GAIPage() {
  const [daily, setDaily] = useState<GAIDaily | null>(null);
  const [stories, setStories] = useState<GAIStoryScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

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

    // Try fetching today's story scores
    const today = new Date().toISOString().slice(0, 10);
    const { data: storiesData } = await supabase
      .from("gai_story_scores")
      .select("*")
      .eq("scan_date", today)
      .order("story_gai", { ascending: false })
      .limit(10);

    if (storiesData && storiesData.length > 0) {
      setStories(storiesData);
      setHasData(true);
    }

    setLoading(false);
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
      if (s.regions_missing) {
        for (const r of s.regions_missing) {
          counts[r] = (counts[r] || 0) + 1;
        }
      }
    }
    return Object.entries(counts)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count);
  })();

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#d97706]" />
          <p className="text-sm text-zinc-500">Loading Global Attention Index...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 pb-28 md:pb-12">
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
                    <div className="w-20 text-right text-sm text-zinc-500">
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
                          {story.region_count} of {story.total_regions} regions covering
                        </span>
                      </div>
                      <h3 className="text-base font-semibold leading-snug">
                        {story.story_headline}
                      </h3>
                      {story.regions_missing && story.regions_missing.length > 0 && (
                        <div className="mt-2">
                          <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                            Missing from:
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {story.regions_missing.map((r) => (
                              <span
                                key={r}
                                className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] text-red-600 dark:bg-red-900/20 dark:text-red-400"
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

      {/* ── Historical Chart Placeholder ── */}
      <section className="mb-16">
        <h2 className="mb-6 font-[family-name:var(--font-playfair)] text-2xl font-semibold">
          Daily Trend
        </h2>
        <div className="rounded-2xl border border-black/[0.07] bg-white/50 p-8 dark:border-white/[0.06] dark:bg-white/[0.02] flex items-center justify-center min-h-[200px]">
          <p className="text-sm text-zinc-400">
            Historical trend chart will appear here once enough data has been collected.
          </p>
        </div>
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
          className="text-[#d97706] hover:underline"
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
