import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTodayScan } from "@/lib/scan-parser";
import { PgiChart, GaiChart, DivergenceChart } from "./charts";
import { PgiHero } from "../components/pgi-hero";
import { PgiBar } from "../components/pgi-bar";
import { PgiGaiQuadrant, type QuadrantStory } from "../components/pgi-gai-quadrant";
import { PgiTimeline } from "../components/pgi-timeline";

export const metadata: Metadata = {
  title: "Press Indexes | Albis",
  description:
    "The Albis Press Indexes: PGI measures how differently regions frame the same story. GAI measures what stories are invisible to entire populations. Nobody else measures this.",
  openGraph: {
    title: "Press Indexes | Albis",
    description:
      "Two original indexes measuring perception gaps and attention blindness across 7 world regions.",
  },
};

export const revalidate = 3600;

/* ── data fetching (unchanged logic) ── */

interface MatrixStory {
  headline: string;
  pgi: number;
  gai: number;
}

async function fetchMatrixData(): Promise<{ quadrants: MatrixStory[][]; scanDate: string | null }> {
  try {
    const supabase = createAdminClient();
    const [pgiDates, gaiDates] = await Promise.all([
    supabase.from("pgi_story_scores").select("scan_date").order("scan_date", { ascending: false }).limit(100),
    supabase.from("gai_story_scores").select("scan_date").order("scan_date", { ascending: false }).limit(100),
  ]);
  const pgiDateSet = new Set((pgiDates.data ?? []).map((r) => r.scan_date));
  const gaiDateList = (gaiDates.data ?? []).map((r) => r.scan_date);
  const commonDate = gaiDateList.find((d) => pgiDateSet.has(d));
  if (!commonDate) return { quadrants: [[], [], [], []], scanDate: null };

  const [pgiStories, gaiStories] = await Promise.all([
    supabase.from("pgi_story_scores").select("story_headline, story_pgi").eq("scan_date", commonDate),
    supabase.from("gai_story_scores").select("story_headline, story_gai").eq("scan_date", commonDate),
  ]);

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const gaiMap = new Map<string, number>();
  for (const g of gaiStories.data ?? []) gaiMap.set(normalize(g.story_headline), Number(g.story_gai));

  const matched: MatrixStory[] = [];
  for (const p of pgiStories.data ?? []) {
    const norm = normalize(p.story_headline);
    let gaiScore = gaiMap.get(norm);
    if (gaiScore === undefined) {
      for (const [key, val] of gaiMap) {
        if (norm.includes(key.slice(0, 20)) || key.includes(norm.slice(0, 20))) { gaiScore = val; break; }
      }
    }
    if (gaiScore !== undefined) matched.push({ headline: p.story_headline, pgi: Number(p.story_pgi), gai: gaiScore });
  }

  const quadrants: MatrixStory[][] = [[], [], [], []];
  for (const s of matched) {
    const highPgi = s.pgi >= 5, highGai = s.gai >= 5;
    if (highPgi && !highGai) quadrants[0].push(s);
    else if (!highPgi && highGai) quadrants[1].push(s);
    else if (highPgi && highGai) quadrants[2].push(s);
    else quadrants[3].push(s);
  }
    return { quadrants, scanDate: commonDate };
  } catch (e) {
    console.error("Matrix data fetch failed:", e);
    return { quadrants: [[], [], [], []], scanDate: null };
  }
}

async function fetchIndexData() {
  try {
    const supabase = createAdminClient();
    const [pgiRes, gaiRes] = await Promise.all([
    supabase.from("pgi_daily").select("date, daily_pgi").order("date", { ascending: true }),
    supabase.from("gai_daily").select("date, daily_gai").order("date", { ascending: true }),
  ]);

  const pgiData = (pgiRes.data ?? []).map((r) => ({ date: r.date, daily_pgi: Number(r.daily_pgi) }));
  let gaiData = (gaiRes.data ?? []).map((r) => ({ date: r.date, daily_gai: Number(r.daily_gai) }));

  if (gaiData.length === 0) {
    const { data: storyScores } = await supabase.from("gai_story_scores").select("scan_date, story_gai").order("scan_date", { ascending: true });
    if (storyScores && storyScores.length > 0) {
      const byDate = new Map<string, number[]>();
      for (const s of storyScores) { const arr = byDate.get(s.scan_date) ?? []; arr.push(Number(s.story_gai)); byDate.set(s.scan_date, arr); }
      gaiData = Array.from(byDate.entries()).map(([date, scores]) => ({ date, daily_gai: Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)) }));
    }
  }

  const dateMap = new Map<string, { pgi?: number; gai?: number }>();
  for (const p of pgiData) dateMap.set(p.date, { ...dateMap.get(p.date), pgi: p.daily_pgi });
  for (const g of gaiData) dateMap.set(g.date, { ...dateMap.get(g.date), gai: g.daily_gai });
  const combinedData = Array.from(dateMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, vals]) => ({ date, ...vals }));

    return { pgiData, gaiData, combinedData };
  } catch (e) {
    console.error("Index data fetch failed:", e);
    return { pgiData: [], gaiData: [], combinedData: [] };
  }
}

// Fetch latest PGI with trend for PgiHero + PgiBar
async function getLatestPGI() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("pgi_daily")
      .select("date, daily_pgi")
      .order("date", { ascending: false })
      .limit(2);

    if (!data || data.length === 0) return null;

    const latest = { date: data[0].date, pgi: Number(data[0].daily_pgi) };
    const previous = data.length > 1 ? Number(data[1].daily_pgi) : null;
    const delta = previous !== null ? latest.pgi - previous : null;

    return { ...latest, delta };
  } catch (e) {
    console.error("PGI fetch failed:", e);
    return null;
  }
}

// Fetch PGI timeline data (last 14 days)
async function getPgiTimelineData() {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("pgi_daily")
      .select("date, daily_pgi")
      .order("date", { ascending: false })
      .limit(14);

    if (!data) return [];
    return data.map((r) => ({ date: r.date, pgi: Number(r.daily_pgi) }));
  } catch {
    return [];
  }
}

/* ── page ── */

export default async function IndexesPage() {
  const [{ pgiData, gaiData, combinedData }, { quadrants, scanDate }, pgiLatest, timelineData, scan] = await Promise.all([
    fetchIndexData(),
    fetchMatrixData(),
    getLatestPGI(),
    getPgiTimelineData(),
    getTodayScan(),
  ]);

  // Build quadrant stories from scan data for PgiGaiQuadrant
  const quadrantStories: QuadrantStory[] = (scan?.items ?? [])
    .filter((item) => {
      const pgi = item.perception_gap;
      const breadth = item.coverage_breadth;
      return pgi != null && pgi > 0 && breadth != null && breadth > 0;
    })
    .map((item) => {
      const pgi = item.perception_gap!;
      const gai = 10 - ((item.coverage_breadth! / 7) * 9);
      const slug = item.tags?.[0] || item.headline
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);
      return {
        headline: item.headline,
        slug,
        pgi,
        gai: Math.round(gai * 10) / 10,
        category: item.category,
      };
    })
    .slice(0, 15);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 pb-28 md:pb-12">

      {/* ━━ Hero ━━ */}
      <section className="mb-20 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#c8922a]">
          Original Research
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight md:text-6xl">
          The Albis Press Indexes
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-500 dark:text-zinc-400">
          Two measurements that answer the question traditional media can&apos;t:
          <br className="hidden sm:block" />
          <em>How well does the world actually understand itself?</em>
        </p>
      </section>

      {/* ━━ Perception Gap Index — Dashboard ━━ */}
      <section className="mb-16">
        <p className="text-center text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-6">
          Perception Gap Index
        </p>

        {/* PgiHero — today's score */}
        <PgiHero pgi={pgiLatest?.pgi ?? null} delta={pgiLatest?.delta ?? null} date={pgiLatest?.date ?? null} />

        {/* PgiBar — compact bar visualisation */}
        {pgiLatest && (
          <div className="mx-auto max-w-3xl mt-6">
            <PgiBar pgi={pgiLatest.pgi} delta={pgiLatest.delta} date={pgiLatest.date} />
          </div>
        )}

        {/* PgiTimeline — 14-day trend */}
        {timelineData.length > 0 && (
          <div className="mx-auto max-w-3xl mt-6">
            <PgiTimeline data={timelineData} title="14-Day Trend" height={200} />
          </div>
        )}

        {/* PgiGaiQuadrant — scatter plot */}
        {quadrantStories.length >= 3 && (
          <div className="mx-auto max-w-3xl mt-8">
            <div className="text-center mb-4">
              <h3 className="font-[family-name:var(--font-playfair)] text-xl md:text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                Today&apos;s Information Landscape
              </h3>
            </div>
            <PgiGaiQuadrant stories={quadrantStories} date={scan?.displayDate} />
          </div>
        )}
      </section>

      {/* ━━ PGI Explainer ━━ */}
      <section className="mb-20">
        <div className="rounded-2xl border border-[#c8922a]/20 bg-[#c8922a]/[0.03] p-8 md:p-12">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c8922a]/10 text-lg font-bold text-[#c8922a]">P</span>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8922a]">
              Perception Gap Index
            </p>
          </div>

          <h2 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight md:text-4xl">
            The same event, told 7 different ways
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            The PGI measures how differently 7 world regions frame the <em>same</em> story.
            A trade deal, a protest, a natural disaster — every region reports it,
            but the emphasis, blame, emotion, and facts they highlight can be radically different.
            The PGI quantifies that gap on a 1–10 scale, updated 3× daily.
          </p>

          {/* Scale */}
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { range: "1 – 3", label: "Similar Lenses", color: "#22c55e", desc: "Regions broadly agree on framing and facts." },
              { range: "4 – 6", label: "Different Lenses", color: "#eab308", desc: "Noticeable divergence in emphasis or blame." },
              { range: "7 – 10", label: "Fractured Reality", color: "#ef4444", desc: "Regions are telling fundamentally different stories." },
            ].map((tier) => (
              <div key={tier.range} className="rounded-xl border border-black/[0.06] bg-white/60 p-5 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: tier.color }} />
                  <span className="text-sm font-bold" style={{ color: tier.color }}>{tier.range}</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-zinc-700 dark:text-zinc-200">{tier.label}</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{tier.desc}</p>
              </div>
            ))}
          </div>

          {/* Five Dimensions */}
          <div className="mt-10">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400">
              Six Dimensions of Framing
            </h3>
            <p className="mb-4 text-xs text-zinc-400">
              Based on Entman&apos;s framing theory — each dimension scored independently across regions
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "Factual Divergence", desc: "Do regions agree on the basic facts?" },
                { name: "Causal Attribution", desc: "Who or what do they blame?" },
                { name: "Framing & Emphasis", desc: "What aspect gets the spotlight?" },
                { name: "Emotional Valence", desc: "Outrage, sympathy, indifference?" },
                { name: "Actor Portrayal", desc: "Hero, villain, or invisible?" },
                { name: "Cui Bono", desc: "Whose interests does the framing serve?" },
              ].map((d) => (
                <div key={d.name} className="rounded-xl border border-black/[0.05] bg-white/40 p-4 dark:border-white/[0.05] dark:bg-white/[0.01]">
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{d.name}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{d.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Explore link */}
          <div className="mt-8">
            <Link href="/indexes/pgi" className="inline-flex items-center gap-2 text-sm font-medium text-[#c8922a] hover:underline">
              Explore live PGI data &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ━━ GAI Explainer ━━ */}
      <section className="mb-20">
        <div className="rounded-2xl border border-[#c8922a]/20 bg-[#c8922a]/[0.03] p-8 md:p-12">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c8922a]/10 text-lg font-bold text-[#c8922a]">G</span>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8922a]">
              Global Awareness Index
            </p>
          </div>

          <h2 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight md:text-4xl">
            You can&apos;t form an opinion on something you never heard about
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            The GAI measures <strong>information absence</strong> — stories that are covered in some regions
            but completely invisible in others. This is what makes Albis unique: nobody else systematically
            measures what&apos;s <em>missing</em> from your news diet. A high GAI means billions of people
            will never know this story happened.
          </p>

          {/* Scale */}
          <div className="mt-8">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400">
              GAI Score — 1 to 10
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { score: "1–2", label: "Global Spotlight", color: "#22c55e" },
                { score: "2.1–4", label: "Broad Awareness", color: "#eab308" },
                { score: "4.1–6", label: "Selective Visibility", color: "#f97316" },
                { score: "6.1–8", label: "Information Shadow", color: "#ef4444" },
                { score: "8.1–10", label: "Attention Desert", color: "#1f2937" },
              ].map((tier) => (
                <div key={tier.score} className="flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/60 px-4 py-2 dark:border-white/[0.06] dark:bg-white/[0.02]">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
                  <span className="text-sm font-bold" style={{ color: tier.color }}>{tier.score}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{tier.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {["US", "Europe", "Middle East", "Asia-Pacific", "South Asia", "Africa", "Latin America"].map((r) => (
                <div key={r} className="rounded-lg border border-black/[0.05] bg-white/40 px-3 py-2 text-center text-xs text-zinc-600 dark:border-white/[0.05] dark:bg-white/[0.01] dark:text-zinc-400">
                  {r}
                </div>
              ))}
            </div>
          </div>

          {/* Why it matters */}
          <div className="mt-8 rounded-xl border border-[#c8922a]/10 bg-[#c8922a]/[0.03] p-6">
            <p className="text-sm font-semibold text-[#c8922a]">Why this matters</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Media bias research focuses on <em>how</em> stories are covered. Almost nobody asks <em>whether</em> they&apos;re
              covered at all. The GAI fills that gap. If 5 billion people in Asia never see a story that
              dominates European headlines, that&apos;s not bias — it&apos;s a blind spot. And blind spots shape geopolitics.
            </p>
          </div>

          <div className="mt-8">
            <Link href="/indexes/gai" className="inline-flex items-center gap-2 text-sm font-medium text-[#c8922a] hover:underline">
              Explore live GAI data &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ━━ The Chain ━━ */}
      <section className="mb-20 text-center">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight md:text-3xl">
          The information chain
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
          Before you disagree about a story, you have to see it. The Albis indexes measure two fundamental links in the chain.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
          <span className="rounded-full bg-[#c8922a]/10 px-5 py-2 text-[#c8922a]">
            Attention (GAI)
          </span>
          <span className="text-zinc-300 dark:text-zinc-600">&rarr;</span>
          <span className="rounded-full bg-[#c8922a]/10 px-5 py-2 text-[#c8922a]">
            Perception (PGI)
          </span>
          <span className="text-zinc-300 dark:text-zinc-600">&rarr;</span>
          <span className="rounded-full bg-zinc-100 px-5 py-2 text-zinc-400 dark:bg-white/[0.04]">
            Belief
          </span>
          <span className="text-zinc-300 dark:text-zinc-600">&rarr;</span>
          <span className="rounded-full bg-zinc-100 px-5 py-2 text-zinc-400 dark:bg-white/[0.04]">
            Action
          </span>
        </div>
      </section>

      {/* ━━ Live Data Section ━━ */}
      <section className="mb-8">
        <div className="mb-10 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">Live Data</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight md:text-4xl">
            Today&apos;s Numbers
          </h2>
        </div>
      </section>

      {/* PGI Chart */}
      <Link href="/indexes/pgi" className="group mb-10 block rounded-2xl border border-black/[0.07] bg-white/50 p-6 transition-all hover:border-[#c8922a]/30 hover:shadow-lg md:p-8 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-[#c8922a]/40">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[#c8922a]">
              Perception Gap Index
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              How differently the world frames the same story
            </p>
          </div>
          <span className="text-sm font-medium text-[#c8922a] group-hover:underline">
            Explore PGI &rarr;
          </span>
        </div>
        <PgiChart data={pgiData} />
      </Link>

      {/* GAI Chart */}
      <Link href="/indexes/gai" className="group mb-10 block rounded-2xl border border-black/[0.07] bg-white/50 p-6 transition-all hover:border-[#c8922a]/30 hover:shadow-lg md:p-8 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-[#c8922a]/40">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[#c8922a]">
              Global Awareness Index
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Whether a story reaches you in the first place
            </p>
          </div>
          <span className="text-sm font-medium text-[#c8922a] group-hover:underline">
            Explore GAI &rarr;
          </span>
        </div>
        <GaiChart data={gaiData} />
      </Link>

      {/* Divergence Chart */}
      <section className="mb-16 rounded-2xl border border-black/[0.07] bg-white/50 p-6 md:p-8 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <DivergenceChart data={combinedData} hasPgi={pgiData.length > 0} hasGai={gaiData.length > 0} />
        <p className="mt-6 border-t border-zinc-100 pt-6 text-sm leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          When lines diverge, information fails differently. High PGI + low GAI means the world sees the story but disagrees about what it means. High GAI + low PGI means the few who see it agree — but most of the world is blind to it entirely.
        </p>
      </section>

      {/* PGI × GAI Matrix */}
      {scanDate && (
        <section className="mb-16">
          <div className="mb-6 text-center">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight md:text-3xl">
              PGI × GAI Matrix
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Where today&apos;s stories sit across both indexes
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {([
              { idx: 0, label: "High Perception Gap, Low Attention Gap", desc: "Everyone sees it. Nobody agrees.", bg: "bg-[#c8922a]/5", border: "border-[#c8922a]/20", text: "text-[#c8922a]", dot: "bg-[#c8922a]" },
              { idx: 2, label: "High Perception Gap, High Attention Gap", desc: "Invisible AND distorted. The danger zone.", bg: "bg-red-500/5", border: "border-red-500/20", text: "text-red-600", dot: "bg-red-500" },
              { idx: 3, label: "Low Perception Gap, Low Attention Gap", desc: "Global consensus. Rare.", bg: "bg-emerald-500/5", border: "border-emerald-500/20", text: "text-emerald-600", dot: "bg-emerald-500" },
              { idx: 1, label: "Low Perception Gap, High Attention Gap", desc: "Where covered, people agree. But most don't see it.", bg: "bg-[#c8922a]/5", border: "border-[#c8922a]/20", text: "text-[#c8922a]", dot: "bg-[#c8922a]" },
            ] as const).map((q) => (
              <div key={q.idx} className={`rounded-2xl border ${q.border} ${q.bg} p-5 dark:border-white/[0.06]`}>
                <div className="mb-3">
                  <p className={`text-xs font-medium uppercase tracking-widest ${q.text}`}>{q.label}</p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{q.desc}</p>
                </div>
                {quadrants[q.idx].length === 0 ? (
                  <p className="text-xs italic text-zinc-400 dark:text-zinc-500">No stories in this quadrant today</p>
                ) : (
                  <>
                    <ul className="space-y-2">
                      {quadrants[q.idx].slice(0, 3).map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${q.dot}`} />
                          <div>
                            <span className="text-zinc-700 dark:text-zinc-300">{s.headline}</span>
                            <span className="ml-2 text-xs text-zinc-400">PGI {s.pgi.toFixed(1)} · GAI {s.gai.toFixed(1)}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-zinc-400">{quadrants[q.idx].length} {quadrants[q.idx].length === 1 ? "story" : "stories"} today</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ━━ For Press / Researchers ━━ */}
      <section className="rounded-2xl border border-black/[0.07] bg-white/50 p-8 md:p-12 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight md:text-3xl">
          For Journalists &amp; Researchers
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          The Albis indexes are open data. We scan 100+ sources across 7 world regions, 3 times daily.
          Every score is derived from automated comparative analysis using structured AI evaluation.
          If you&apos;re writing about media bias, information ecosystems, or global news coverage —
          these indexes provide quantifiable, daily evidence.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link href="/methodology" className="rounded-lg border border-[#c8922a]/30 px-4 py-2 text-sm font-medium text-[#c8922a] transition-colors hover:bg-[#c8922a]/5">
            Methodology →
          </Link>
          <Link href="/indexes/pgi/data" className="rounded-lg border border-[#c8922a]/30 px-4 py-2 text-sm font-medium text-[#c8922a] transition-colors hover:bg-[#c8922a]/5">
            Raw PGI Data →
          </Link>
          <Link href="/indexes/gai/data" className="rounded-lg border border-[#c8922a]/30 px-4 py-2 text-sm font-medium text-[#c8922a] transition-colors hover:bg-[#c8922a]/5">
            Raw GAI Data →
          </Link>
          <Link href="/about" className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-white/[0.03]">
            About Albis →
          </Link>
        </div>
      </section>
    </main>
  );
}
