import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ShareButtons, EmbedCode } from "../../components/share-buttons";

export const dynamic = "force-dynamic";

function getTier(pgi: number) {
  if (pgi <= 2.0) return { name: "Global Consensus", color: "#22c55e", bg: "bg-emerald-50 dark:bg-emerald-950/20", text: "text-emerald-700 dark:text-emerald-400" };
  if (pgi <= 4.0) return { name: "Different Lenses", color: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-700 dark:text-amber-400" };
  if (pgi <= 6.0) return { name: "Diverging Narratives", color: "#f97316", bg: "bg-orange-50 dark:bg-orange-950/20", text: "text-orange-700 dark:text-orange-400" };
  if (pgi <= 8.0) return { name: "Competing Realities", color: "#ef4444", bg: "bg-red-50 dark:bg-red-950/20", text: "text-red-700 dark:text-red-400" };
  return { name: "Parallel Universes", color: "#71717a", bg: "bg-zinc-100 dark:bg-zinc-800/20", text: "text-zinc-700 dark:text-zinc-400" };
}

const DIMENSION_LABELS: Record<string, string> = {
  d1_factual: "Factual Divergence",
  d2_causal: "Causal Attribution",
  d3_framing: "Framing & Emphasis",
  d4_emotional: "Emotional Valence",
  d5_actor_context: "Actor Portrayal",
};

interface PageProps {
  params: Promise<{ date: string }>;
}

async function fetchDayData(date: string) {
  const supabase = createAdminClient();

  const [dailyRes, storiesRes, prevRes] = await Promise.all([
    supabase.from("pgi_daily").select("*").eq("date", date).single(),
    supabase
      .from("pgi_story_scores")
      .select("*")
      .eq("scan_date", date)
      .order("story_pgi", { ascending: false }),
    supabase
      .from("pgi_daily")
      .select("date, daily_pgi")
      .lt("date", date)
      .order("date", { ascending: false })
      .limit(1),
  ]);

  return {
    daily: dailyRes.data,
    stories: storiesRes.data || [],
    previous: prevRes.data?.[0] || null,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase.from("pgi_daily").select("daily_pgi").eq("date", date).single();

  const pgi = data ? Number(data.daily_pgi) : 0;
  const tier = getTier(pgi);
  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString("en-NZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const title = `PGI ${pgi.toFixed(1)} — ${tier.name} | ${formattedDate}`;
  const description = `The Perception Gap Index was ${pgi.toFixed(1)} (${tier.name}) on ${formattedDate}. See how 7 regions covered the same stories differently.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `/api/og/pgi?pgi=${pgi}&date=${date}`,
          width: 1200,
          height: 630,
          alt: `PGI ${pgi.toFixed(1)} — ${tier.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/api/og/pgi?pgi=${pgi}&date=${date}`],
    },
  };
}

export default async function PgiDatePage({ params }: PageProps) {
  const { date } = await params;

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const { daily, stories, previous } = await fetchDayData(date);
  if (!daily) notFound();

  const pgi = Number(daily.daily_pgi);
  const tier = getTier(pgi);
  const delta = previous ? pgi - Number(previous.daily_pgi) : null;
  const position = Math.min(Math.max((pgi / 10) * 100, 5), 95);

  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString("en-NZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const prevDate = previous?.date || null;
  // Calculate next date
  const nextDateObj = new Date(date + "T00:00:00");
  nextDateObj.setDate(nextDateObj.getDate() + 1);
  const nextDateStr = nextDateObj.toISOString().split("T")[0];

  const shareUrl = `https://www.albis.news/pgi/${date}`;
  const shareTitle = `PGI ${pgi.toFixed(1)} — ${tier.name} (${formattedDate})`;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 md:py-14 pb-28 md:pb-14">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-zinc-400 dark:text-zinc-500">
        <Link href="/indexes" className="hover:text-[#c8922a] transition-colors">Indexes</Link>
        <span className="mx-2">›</span>
        <Link href="/indexes/pgi" className="hover:text-[#c8922a] transition-colors">PGI</Link>
        <span className="mx-2">›</span>
        <span className="text-zinc-600 dark:text-zinc-300">{date}</span>
      </nav>

      {/* Date + navigation */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-bold text-[#0f0f0f] dark:text-[#f0efec]">
            {formattedDate}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Perception Gap Index — Daily Report
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {prevDate && (
            <Link href={`/pgi/${prevDate}`} className="rounded-lg border border-black/[0.06] px-3 py-1.5 text-zinc-500 hover:border-[#c8922a]/30 hover:text-[#c8922a] transition-colors dark:border-white/[0.06] dark:text-zinc-400">
              ← Prev
            </Link>
          )}
          {(() => {
            const today = new Date().toISOString().split("T")[0];
            return nextDateStr <= today ? (
              <Link href={`/pgi/${nextDateStr}`} className="rounded-lg border border-black/[0.06] px-3 py-1.5 text-zinc-500 hover:border-[#c8922a]/30 hover:text-[#c8922a] transition-colors dark:border-white/[0.06] dark:text-zinc-400">
                Next →
              </Link>
            ) : null;
          })()}
        </div>
      </div>

      {/* PGI Score Card */}
      <div className="rounded-2xl border border-black/[0.07] bg-white p-6 md:p-8 mb-6 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Score */}
          <div className="flex items-center gap-4">
            <div className="h-5 w-5 rounded-full" style={{ backgroundColor: tier.color }} />
            <span className="font-[family-name:var(--font-playfair)] text-6xl md:text-7xl font-bold tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">
              {pgi.toFixed(1)}
            </span>
          </div>

          {/* Tier + details */}
          <div className="flex-1">
            <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${tier.bg} ${tier.text}`}>
              {tier.name}
            </span>
            {delta !== null && (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)} from{" "}
                {previous?.date ? (
                  <Link href={`/pgi/${previous.date}`} className="text-[#c8922a] hover:underline">yesterday</Link>
                ) : (
                  "yesterday"
                )}
              </p>
            )}
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              Based on {stories.length} stories across today&apos;s scans
            </p>
          </div>
        </div>

        {/* Gauge */}
        <div className="mt-6 relative h-2 w-full rounded-full" style={{ background: "linear-gradient(to right, #86efac, #fcd34d, #fdba74, #fca5a5)" }}>
          <div
            className="absolute top-1/2 h-4 w-4 rounded-full ring-2 ring-white dark:ring-[#0f0f0f] shadow-sm"
            style={{ left: `${position}%`, transform: "translate(-50%, -50%)", backgroundColor: tier.color }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-zinc-300 dark:text-zinc-600">
          <span>0 — Consensus</span>
          <span>10 — Parallel Universes</span>
        </div>
      </div>

      {/* Share */}
      <div className="mb-8">
        <ShareButtons url={shareUrl} title={shareTitle} description={`How differently did the world see today's stories? PGI: ${pgi.toFixed(1)}`} />
      </div>

      {/* Top Divergent Stories */}
      {stories.length > 0 && (
        <section className="mb-8">
          <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] mb-4">
            Most Divergent Stories
          </h2>
          <div className="space-y-3">
            {stories.slice(0, 10).map((story: any, i: number) => {
              const storyTier = getTier(story.story_pgi);
              return (
                <div
                  key={story.id || i}
                  className="rounded-xl border border-black/[0.06] p-4 dark:border-white/[0.06]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-[#0f0f0f] dark:text-[#f0efec] leading-snug">
                        {story.story_headline}
                      </h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                        <span>{story.category}</span>
                        <span>•</span>
                        <span>{story.region_count || story.regions_covered?.length || 0} regions</span>
                        {story.scoring_rationale && (
                          <>
                            <span>•</span>
                            <span className="text-zinc-500 dark:text-zinc-400 line-clamp-1">{story.scoring_rationale}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-[family-name:var(--font-playfair)] text-xl font-bold" style={{ color: storyTier.color }}>
                        {Number(story.story_pgi).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* 5 dimensions */}
                  <div className="mt-3 grid grid-cols-5 gap-1.5">
                    {Object.entries(DIMENSION_LABELS).map(([key, label]) => {
                      const val = Number(story[key] || 0);
                      return (
                        <div key={key} className="text-center">
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">{label.split(" ")[0]}</div>
                          <div className="mt-0.5 mx-auto h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden" style={{ width: "100%" }}>
                            <div className="h-full rounded-full" style={{ width: `${val * 10}%`, backgroundColor: storyTier.color }} />
                          </div>
                          <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">{val.toFixed(1)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Embed */}
      <section className="mb-8">
        <h2 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[#0f0f0f] dark:text-[#f0efec] mb-3">
          Embed the PGI
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
          Add the live Perception Gap Index to your website, blog, or classroom materials.
        </p>
        <EmbedCode src="https://www.albis.news/embed/pgi" width={400} height={180} />
      </section>

      {/* Methodology link */}
      <div className="rounded-xl border border-black/[0.06] bg-zinc-50/50 p-5 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <h3 className="text-sm font-semibold text-[#0f0f0f] dark:text-[#f0efec] mb-1">About the PGI</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-2">
          The Perception Gap Index measures how differently 7 world regions cover the same stories,
          scored across 5 dimensions based on Entman&apos;s framing theory (1993): Factual Divergence,
          Causal Attribution, Framing &amp; Emphasis, Emotional Valence, and Actor Portrayal.
        </p>
        <Link href="/perception-gap/about" className="text-xs font-medium text-[#c8922a] hover:underline">
          Full methodology →
        </Link>
      </div>
    </main>
  );
}
