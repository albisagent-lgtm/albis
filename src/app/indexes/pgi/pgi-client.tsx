"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea, BarChart, Bar, Cell,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────

interface SignaturePiece {
  date: string;
  daily_pgi: number;
  tier: string;
  emoji: string;
  author: string;
  content_md: string;
  word_count: number | null;
  avg_d1_factual: number | null;
  avg_d2_causal: number | null;
  avg_d3_framing: number | null;
  avg_d4_emotional: number | null;
  avg_d5_actor: number | null;
  avg_d6_cui_bono: number | null;
  story_count: number | null;
  region_count: number | null;
  top_stories: string[];
}

interface StoryScore {
  id: string;
  scan_date: string;
  scan_period: string;
  story_slug: string;
  story_headline: string;
  category: string;
  regions_covered: string[];
  region_count: number;
  d1_factual: number;
  d2_causal: number;
  d3_framing: number;
  d4_emotional: number;
  d5_actor_context: number;
  d6_cui_bono: number;
  story_pgi: number;
  significance: number;
  scoring_rationale: string | null;
}

interface RegionPair {
  id: string;
  region_a: string;
  region_b: string;
  pair_pgi: number;
  scan_date: string;
}

interface DailyAvg {
  date: string;
  pgi: number;
}

interface ScanSummary {
  period: string;
  avgPgi: number;
  storyCount: number;
}

// ── Helpers ─────────────────────────────────────────────────────────

function getTier(pgi: number) {
  if (pgi <= 3) return { name: "Shared Understanding", emoji: "", color: "#22c55e", explanation: "The world is largely aligned on today's major events." };
  if (pgi <= 5) return { name: "Different Angles", emoji: "", color: "#71717a", explanation: "Regions are viewing the same events through distinct but not opposing lenses." };
  if (pgi <= 7) return { name: "Diverging Narratives", emoji: "", color: "#f59e0b", explanation: "The world saw today's events through increasingly different lenses." };
  if (pgi <= 10) return { name: "Competing Realities", emoji: "", color: "#ef4444", explanation: "Major events are being framed as fundamentally different stories across regions." };
  return { name: "Competing Realities", emoji: "", color: "#ef4444", explanation: "Major events are being framed as fundamentally different stories across regions." };
}

function getTierColor(pgi: number) {
  return getTier(pgi).color;
}

const PGI_TRIBUTARIES = [
  { code: "GP", name: "Geopolitical", cats: ["current-events", "geopolitics"] },
  { code: "IW", name: "Information Warfare", cats: ["cybersecurity", "information-warfare"] },
  { code: "WR", name: "Women's Rights", cats: ["womens-rights", "migration-demographics"] },
  { code: "EC", name: "Economics", cats: ["economic-flows", "food-agriculture"] },
  { code: "TE", name: "Technology & Ethics", cats: ["tech-ai"] },
  { code: "HE", name: "Health & Environment", cats: ["health"] },
  { code: "CL", name: "Climate", cats: ["clean-energy", "climate"] },
];

const PERIOD_LABELS: Record<string, string> = {
  am: "AM Scan",
  midday: "Midday Scan",
  pm: "PM Scan",
};

const PERIOD_ORDER = ["am", "midday", "pm"];

const DIMENSION_LABELS = [
  { key: "d1_factual", short: "Factual", full: "Factual Divergence", sigKey: "avg_d1_factual" },
  { key: "d2_causal", short: "Causal", full: "Causal Attribution", sigKey: "avg_d2_causal" },
  { key: "d3_framing", short: "Framing", full: "Framing & Emphasis", sigKey: "avg_d3_framing" },
  { key: "d4_emotional", short: "Emotional", full: "Emotional Tone", sigKey: "avg_d4_emotional" },
  { key: "d5_actor_context", short: "Actor", full: "Actor Portrayal", sigKey: "avg_d5_actor" },
  { key: "d6_cui_bono", short: "Cui Bono", full: "Who Benefits", sigKey: "avg_d6_cui_bono" },
];

function renderMarkdown(md: string) {
  return md
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("### "))
        return `<h4 class="text-lg font-semibold mt-6 mb-2">${trimmed.slice(4)}</h4>`;
      if (trimmed.startsWith("## "))
        return `<h3 class="text-xl font-semibold mt-8 mb-space-3 font-[family-name:var(--font-playfair)]">${trimmed.slice(3)}</h3>`;
      if (trimmed.startsWith("# "))
        return `<h2 class="text-2xl font-semibold mt-8 mb-space-3 font-[family-name:var(--font-playfair)]">${trimmed.slice(2)}</h2>`;
      if (trimmed.startsWith("> "))
        return `<blockquote class="border-l-3 border-[#c8922a] pl-4 italic text-zinc-500 dark:text-zinc-400 my-4">${trimmed.slice(2)}</blockquote>`;
      const formatted = trimmed
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/\n/g, "<br/>");
      return `<p class="mb-4 leading-relaxed">${formatted}</p>`;
    })
    .join("");
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-NZ", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-NZ", { day: "numeric", month: "short" });
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}

// ── Main Component ─────────────────────────────────────────────────

export function PGIClient() {
  const [signature, setSignature] = useState<SignaturePiece | null>(null);
  const [stories, setStories] = useState<StoryScore[]>([]);
  const [regionPairs, setRegionPairs] = useState<RegionPair[]>([]);
  const [dailyAvgs, setDailyAvgs] = useState<DailyAvg[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStory, setExpandedStory] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);

    // Fetch signature piece (latest), stories, pairs, and historical data in parallel
    const [sigRes, storiesRes, pairsRes, allStoriesRes] = await Promise.all([
      supabase
        .from("pgi_signature_pieces")
        .select("*")
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("pgi_story_scores")
        .select("*")
        .eq("scan_date", today)
        .eq("is_latest", true)
        .order("story_pgi", { ascending: false }),
      supabase
        .from("pgi_region_pairs")
        .select("*")
        .eq("scan_date", today)
        .order("pair_pgi", { ascending: false }),
      supabase
        .from("pgi_story_scores")
        .select("scan_date, story_pgi")
        .eq("is_latest", true)
        .order("scan_date", { ascending: true }),
    ]);

    if (sigRes.data) setSignature(sigRes.data);
    if (storiesRes.data) setStories(storiesRes.data);
    if (pairsRes.data) setRegionPairs(pairsRes.data);

    if (allStoriesRes.data) {
      const byDate: Record<string, number[]> = {};
      for (const s of allStoriesRes.data) {
        (byDate[s.scan_date] ||= []).push(Number(s.story_pgi));
      }
      setDailyAvgs(
        Object.entries(byDate)
          .map(([date, vals]) => ({
            date,
            pgi: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100,
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Derived data ──────────────────────────────────────────────────

  const todayPgi = signature?.daily_pgi
    ?? (stories.length > 0
      ? Math.round((stories.reduce((a, s) => a + Number(s.story_pgi), 0) / stories.length) * 100) / 100
      : null);

  const tier = todayPgi !== null ? getTier(todayPgi) : null;
  const displayDate = signature?.date || new Date().toISOString().slice(0, 10);

  const scanSummaries: ScanSummary[] = PERIOD_ORDER.map((p) => {
    const periodStories = stories.filter((s) => s.scan_period === p);
    return {
      period: p,
      avgPgi: periodStories.length > 0
        ? Math.round((periodStories.reduce((a, s) => a + Number(s.story_pgi), 0) / periodStories.length) * 100) / 100
        : 0,
      storyCount: periodStories.length,
    };
  }).filter((s) => s.storyCount > 0);

  // Dimensional breakdown — prefer signature averages, fall back to computing from stories
  const dimData = (() => {
    if (signature) {
      const vals = DIMENSION_LABELS.map((d) => ({
        name: d.short,
        fullName: d.full,
        value: Number((signature as unknown as Record<string, unknown>)[d.sigKey] ?? 0),
      }));
      if (vals.some((v) => v.value > 0)) return vals;
    }
    if (stories.length === 0) return [];
    return DIMENSION_LABELS.map((d) => ({
      name: d.short,
      fullName: d.full,
      value: avg(stories.map((s) => Number(s[d.key as keyof StoryScore] ?? 0))),
    }));
  })();

  // Region pair averages
  const pairAverages = (() => {
    const map: Record<string, number[]> = {};
    for (const rp of regionPairs) {
      const key = `${rp.region_a} ↔ ${rp.region_b}`;
      (map[key] ||= []).push(Number(rp.pair_pgi));
    }
    return Object.entries(map)
      .map(([pair, vals]) => ({
        pair,
        pgi: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100,
      }))
      .sort((a, b) => b.pgi - a.pgi)
      .slice(0, 10);
  })();

  // Past 7 days for archive section
  const pastDays = dailyAvgs
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  // ── Render ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-space-6 py-space-16 md:py-space-24">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#c8922a]" />
          <p className="text-sm text-zinc-500">Loading Perception Gap Index…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-space-6 py-space-16 md:py-space-24 pb-28 md:pb-space-12">

      {/* ── Hero Metric Section ── */}
      <section className="mb-space-16 text-center">
        <p className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400">
          PERCEPTION GAP INDEX
        </p>

        {todayPgi !== null && tier ? (
          <div className="mt-8 flex flex-col items-center gap-3">
            <div
              className="font-[family-name:var(--font-geist-mono)] text-7xl md:text-8xl font-bold tabular-nums leading-none"
              style={{ color: tier.color }}
            >
              {todayPgi.toFixed(1)}
            </div>
            <div className="text-lg font-medium mt-2" style={{ color: tier.color }}>
              {tier.name}
            </div>
            {dailyAvgs.length > 1 && (() => {
              const yesterday = dailyAvgs[dailyAvgs.length - 2];
              const change = todayPgi - yesterday.pgi;
              const changeSymbol = change > 0 ? "↑" : change < 0 ? "↓" : "→";
              return (
                <p className="text-sm text-zinc-400 mt-1">
                  {changeSymbol} {Math.abs(change).toFixed(1)} from yesterday
                </p>
              );
            })()}
            <p className="mt-4 max-w-2xl text-base font-[family-name:var(--font-source-serif)] text-zinc-600 dark:text-zinc-400 italic">
              "{tier.explanation}"
            </p>
            {signature && (
              <p className="mt-3 text-xs text-zinc-400">
                {signature.story_count} stories scored · {signature.region_count} regions tracked
              </p>
            )}
          </div>
        ) : (
          <div className="mt-10 text-zinc-500">No data available for today yet.</div>
        )}
      </section>

      {/* ── Daily Trend Chart ── */}
      {dailyAvgs.length > 1 && (
        <section className="mt-space-16 pt-space-16 border-t border-black/5 dark:border-white/5">
          <h2 className="mb-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold">
            Daily Trend
          </h2>
          <p className="mb-6 text-sm text-zinc-500 font-[family-name:var(--font-source-serif)]">
            How the perception gap has shifted over the past 30 days.
          </p>
          <div className="rounded-2xl border border-black/[0.07] bg-white/50 p-space-8 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyAvgs} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <ReferenceArea y1={0} y2={2} fill="#22c55e" fillOpacity={0.06} />
                <ReferenceArea y1={2} y2={4} fill="#eab308" fillOpacity={0.06} />
                <ReferenceArea y1={4} y2={6} fill="#f97316" fillOpacity={0.06} />
                <ReferenceArea y1={6} y2={8} fill="#ef4444" fillOpacity={0.06} />
                <ReferenceArea y1={8} y2={10} fill="#1f2937" fillOpacity={0.06} />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#999" }}
                  tickFormatter={(v) => {
                    const d = new Date(v + "T00:00:00");
                    return d.toLocaleDateString("en-NZ", { day: "numeric", month: "short" });
                  }}
                />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: "#999" }} />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a1a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#f0efec",
                    fontSize: "13px",
                  }}
                  formatter={(value: number | undefined) => [value !== undefined ? value.toFixed(2) : "—", "PGI"]}
                  labelFormatter={(label) => {
                    const d = new Date(label + "T00:00:00");
                    return d.toLocaleDateString("en-NZ", {
                      weekday: "short", day: "numeric", month: "short",
                    });
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="pgi"
                  stroke="#c8922a"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#c8922a", stroke: "#0f0f0f", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* ── Signature Piece ── */}
      {signature?.content_md && (
        <section className="mt-space-16 pt-space-16 border-t border-black/5 dark:border-white/5 mx-auto max-w-3xl">
          <article
            className="prose prose-zinc dark:prose-invert max-w-none text-[15px] leading-[1.75]"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(signature.content_md) }}
          />
          <div className="mt-8 flex items-center gap-space-3 border-t border-black/[0.07] pt-6 dark:border-white/[0.06]">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#c8922a] to-[#b17f24] flex items-center justify-center text-white text-sm font-bold">
              LT
            </div>
            <div>
              <p className="text-sm font-semibold">{signature.author}</p>
              <p className="text-xs text-zinc-400">AI Media Analyst · Albis</p>
            </div>
          </div>
        </section>
      )}

      {/* ── River System: Tributaries ── */}
      {stories.length > 0 && (
        <section className="mt-space-16 pt-space-16 border-t border-black/5 dark:border-white/5">
          <h2 className="mb-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold">
            The River System
          </h2>
          <p className="mb-8 text-sm text-zinc-500 font-[family-name:var(--font-source-serif)]">
            Seven tributaries feed the PGI, each measuring narrative divergence in a different category of news.
          </p>
          <div className="grid gap-space-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {PGI_TRIBUTARIES.map((t) => {
              const catStories = stories.filter((s) =>
                t.cats.includes((s as unknown as Record<string, string>).category)
              );
              const avg =
                catStories.length > 0
                  ? catStories.reduce((sum, s) => sum + Number(s.story_pgi), 0) / catStories.length
                  : null;
              const tierInfo = avg !== null ? getTier(avg) : null;
              return (
                <div
                  key={t.code}
                  className="rounded-2xl border border-black/[0.07] bg-white/50 p-space-6 dark:border-white/[0.06] dark:bg-white/[0.02]"
                >
                  <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
                    PGI-{t.code}
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    {t.name}
                  </p>
                  {tierInfo && avg !== null ? (
                    <>
                      <div
                        className="mt-3 text-3xl font-bold tabular-nums"
                        style={{ color: tierInfo.color }}
                      >
                        {avg.toFixed(1)}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: tierInfo.color }}
                        />
                        <span style={{ color: tierInfo.color }}>{tierInfo.name}</span>
                      </div>
                    </>
                  ) : (
                    <p className="mt-3 text-2xl font-bold tabular-nums text-zinc-500">--</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Today's Scans ── */}
      {scanSummaries.length > 0 && (
        <section className="mt-space-16 pt-space-16 border-t border-black/5 dark:border-white/5">
          <h2 className="mb-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold">
            Today&apos;s Scans
          </h2>
          <p className="mb-6 text-sm text-zinc-500 font-[family-name:var(--font-source-serif)]">
            Three daily snapshots show how narratives shift throughout the day.
          </p>
          <div className="grid gap-space-4 sm:grid-cols-3">
            {scanSummaries.map((s) => {
              const t = getTier(s.avgPgi);
              return (
                <div
                  key={s.period}
                  className="rounded-2xl border border-black/[0.07] bg-white/50 p-space-6 dark:border-white/[0.06] dark:bg-white/[0.02]"
                >
                  <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
                    {PERIOD_LABELS[s.period] || s.period}
                  </p>
                  <div className="mt-2 text-4xl font-bold tabular-nums" style={{ color: t.color }}>
                    {s.avgPgi.toFixed(1)}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-sm">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="text-zinc-500 dark:text-zinc-400">{t.name}</span>
                  </div>
                  <p className="mt-3 text-xs text-zinc-400">
                    {s.storyCount} {s.storyCount === 1 ? "story" : "stories"} scored
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Top Stories ── */}
      {stories.length > 0 && (
        <section className="mt-space-16 pt-space-16 border-t border-black/5 dark:border-white/5">
          <h2 className="mb-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold">
            Top Stories by Perception Gap
          </h2>
          <p className="mb-6 text-sm text-zinc-500 font-[family-name:var(--font-source-serif)]">
            Stories ranked by how differently they're being reported across regions.
          </p>
          <div className="space-y-space-4">
            {stories.slice(0, 15).map((story) => {
              const t = getTier(Number(story.story_pgi));
              const isExpanded = expandedStory === story.id;
              const dims = DIMENSION_LABELS.map((d) => ({
                label: d.short,
                value: Number(story[d.key as keyof StoryScore]),
              }));

              return (
                <div
                  key={story.id}
                  className="rounded-2xl border border-black/[0.07] bg-white/50 p-space-6 dark:border-white/[0.06] dark:bg-white/[0.02]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mb-1">
                        <span className="rounded-full bg-black/[0.04] px-2 py-0.5 dark:bg-white/[0.06]">
                          {story.category}
                        </span>
                        <span>{PERIOD_LABELS[story.scan_period] || story.scan_period}</span>
                        <span>·</span>
                        <span>{story.region_count} regions</span>
                      </div>
                      <h3 className="text-base font-semibold leading-snug">
                        {story.story_headline}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {story.regions_covered.map((r) => (
                          <span
                            key={r}
                            className="rounded bg-black/[0.03] px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-white/[0.04] dark:text-zinc-400"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className="text-3xl font-bold tabular-nums"
                        style={{ color: t.color }}
                      >
                        {Number(story.story_pgi).toFixed(1)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-zinc-400"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />{t.name}</div>
                    </div>
                  </div>

                  {/* Mini dimension bars */}
                  <div className="mt-4 grid grid-cols-5 gap-2">
                    {dims.map((d) => (
                      <div key={d.label}>
                        <div className="h-1.5 w-full rounded-full bg-black/[0.04] dark:bg-white/[0.04] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(d.value / 10) * 100}%`,
                              backgroundColor: getTierColor(d.value),
                            }}
                          />
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400">{d.label}</span>
                          <span
                            className="text-xs font-semibold tabular-nums"
                            style={{ color: getTierColor(d.value) }}
                          >
                            {d.value.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Expandable rationale */}
                  {story.scoring_rationale && (
                    <div className="mt-3">
                      <button
                        onClick={() => setExpandedStory(isExpanded ? null : story.id)}
                        className="text-xs text-[#c8922a] hover:underline"
                      >
                        {isExpanded ? "Hide rationale ▴" : "Why this score? ▾"}
                      </button>
                      {isExpanded && (
                        <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                          {story.scoring_rationale}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Most Divergent Region Pairs ── */}
      {pairAverages.length > 0 && (
        <section className="mt-space-16 pt-space-16 border-t border-black/5 dark:border-white/5">
          <h2 className="mb-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold">
            Most Divergent Region Pairs
          </h2>
          <p className="mb-6 text-sm text-zinc-500 font-[family-name:var(--font-source-serif)]">
            Which regions see the world most differently from each other today.
          </p>
          <div className="rounded-2xl border border-black/[0.07] bg-white/50 p-space-8 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <div className="space-y-3">
              {pairAverages.map((p) => {
                const t = getTier(p.pgi);
                const pct = (p.pgi / 10) * 100;
                return (
                  <div key={p.pair} className="flex items-center gap-4">
                    <div className="w-40 shrink-0 text-sm text-zinc-600 dark:text-zinc-300 truncate">
                      {p.pair}
                    </div>
                    <div className="flex-1 h-6 rounded-full bg-black/[0.04] dark:bg-white/[0.04] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${t.color}88, ${t.color})`,
                        }}
                      />
                    </div>
                    <div
                      className="w-12 text-right text-sm font-semibold tabular-nums"
                      style={{ color: t.color }}
                    >
                      {p.pgi.toFixed(1)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Past Days Archive ── */}
      {pastDays.length > 1 && (
        <section className="mt-space-16 pt-space-16 border-t border-black/5 dark:border-white/5">
          <h2 className="mb-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold">
            Past 7 Days
          </h2>
          <p className="mb-6 text-sm text-zinc-500 font-[family-name:var(--font-source-serif)]">
            A quick look at how the perception gap has evolved over the past week.
          </p>
          <div className="grid gap-space-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {pastDays.map((day) => {
              const t = getTier(day.pgi);
              return (
                <div
                  key={day.date}
                  className="rounded-xl border border-black/[0.07] bg-white/50 p-space-4 dark:border-white/[0.06] dark:bg-white/[0.02]"
                >
                  <p className="text-xs text-zinc-400">{formatDateShort(day.date)}</p>
                  <div className="mt-1 text-2xl font-bold tabular-nums" style={{ color: t.color }}>
                    {day.pgi.toFixed(1)}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="text-zinc-400">{t.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── About the PGI ── */}
      <section className="mt-space-16 pt-space-16 border-t border-black/5 dark:border-white/5 rounded-2xl border border-black/[0.07] bg-white/50 p-space-8 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <h2 className="mb-6 font-[family-name:var(--font-playfair)] text-2xl font-semibold">
          About the PGI
        </h2>
        <div className="grid gap-space-8 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">
              Six Dimensions
            </h3>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
              <li><strong>Factual Divergence</strong> — Do regions report different core facts?</li>
              <li><strong>Causal Attribution</strong> — Who or what is blamed for events?</li>
              <li><strong>Framing &amp; Emphasis</strong> — What angle dominates the coverage?</li>
              <li><strong>Emotional Tone</strong> — How charged is the language?</li>
              <li><strong>Actor &amp; Context Portrayal</strong> — How are key actors and context presented?</li>
              <li><strong>Cui Bono</strong> — Whose interests does the framing serve?</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">
              The Scale
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-[#22c55e] shrink-0" />
                <span className="text-[#22c55e] font-medium">0–2</span>
                <span className="text-zinc-500 dark:text-zinc-400">Global Consensus</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-[#eab308] shrink-0" />
                <span className="text-[#eab308] font-medium">2.1–4</span>
                <span className="text-zinc-500 dark:text-zinc-400">Different Lenses</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-[#f97316] shrink-0" />
                <span className="text-[#f97316] font-medium">4.1–6</span>
                <span className="text-zinc-500 dark:text-zinc-400">Diverging Narratives</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-[#ef4444] shrink-0" />
                <span className="text-[#ef4444] font-medium">6.1–8</span>
                <span className="text-zinc-500 dark:text-zinc-400">Competing Realities</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-[#1f2937] shrink-0" />
                <span className="text-zinc-400 font-medium">8.1–10</span>
                <span className="text-zinc-500 dark:text-zinc-400">Parallel Universes</span>
              </li>
            </ul>
            <p className="mt-6 text-xs text-zinc-400">
              Methodology grounded in Entman&apos;s framing theory (1993), extended with cui bono analysis. Updated 3× daily from
              scans of 60+ sources across 7 regions.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
