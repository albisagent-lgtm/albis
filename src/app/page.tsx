import Link from "next/link";
import { getTodayScan, type ScanItem } from "@/lib/scan-parser";
import { CATEGORY_META, REGION_LABELS, hasFramingWatch } from "@/lib/scan-types";
import { getAllPosts } from "@/lib/blog";
import { EmailCapture } from "./components/email-capture";
import { DateLine } from "./components/date-line";
import { TabbedArticles } from "./components/tabbed-articles";
import { CrisisHero } from "./components/crisis-hero";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Helper function to get PGI tier information
function getPgiTier(pgi: number) {
  if (pgi <= 2.0) return { name: "Global Consensus", color: "bg-emerald-500", explanation: "The world largely agrees on what's happening today." };
  if (pgi <= 4.0) return { name: "Different Lenses", color: "bg-amber-500", explanation: "Same events, slightly different emphasis across regions." };
  if (pgi <= 6.0) return { name: "Diverging Narratives", color: "bg-orange-500", explanation: "Regions are telling noticeably different stories about the same events." };
  if (pgi <= 8.0) return { name: "Competing Realities", color: "bg-red-500", explanation: "The world is seeing the same events through very different lenses today." };
  return { name: "Parallel Universes", color: "bg-zinc-900 dark:bg-zinc-100", explanation: "Regions are describing completely different realities about the same events." };
}

// Helper function to format PGI date
function formatPgiDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Fetch latest PGI data with trend
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

// Fetch active breaking news from Supabase (recent items only, < 6 hours)
async function getBreakingNews() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from("breaking_news")
      .select("*")
      .eq("active", true)
      .gte("created_at", sixHoursAgo)
      .or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching breaking news:", error);
      return null;
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (e) {
    console.error("Breaking news fetch failed:", e);
    return null;
  }
}

export default async function Home() {
  const scan = await getTodayScan();
  const breakingNews = await getBreakingNews();
  const pgiData = await getLatestPGI();

  // Build article slug lookup from blog posts for linking
  const allPosts = getAllPosts();
  const articleSlugs: Record<string, string> = {};
  for (const post of allPosts) {
    for (const tag of post.tags || []) {
      articleSlugs[tag.toLowerCase()] = post.slug;
    }
  }

  // Get top stories from scan
  const topStories = scan?.items ? [...scan.items].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.significance] ?? 1) - (order[b.significance] ?? 1);
  }) : [];

  const leadStory = topStories[0];
  const secondaryStories = topStories.slice(1, 4);

  // Find matching article slug for a headline
  function findArticleSlug(item: ScanItem): string | null {
    const tags = item.tags || [];
    for (const tag of tags) {
      if (articleSlugs[tag.toLowerCase()]) {
        return articleSlugs[tag.toLowerCase()];
      }
    }
    // Check headline keywords
    const words = item.headline.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (word.length > 4 && articleSlugs[word]) {
        return articleSlugs[word];
      }
    }
    return null;
  }

  return (
    <main className="overflow-hidden">

      {/* ── DATE LINE ────────────────────────────────────────── */}
      <DateLine />

      {/* ── CONTENT-FORWARD HERO ─────────────────────────────── */}
      {breakingNews ? (
        <CrisisHero 
          headline={breakingNews.headline} 
          url={breakingNews.url} 
          mode="breaking"
        />
      ) : leadStory ? (
        <section className="relative bg-[#f8f7f4] dark:bg-[#0f0f0f] py-space-16 md:py-space-24">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/20 to-transparent" />
          
          <div className="mx-auto max-w-5xl px-space-6">
            {/* Lead Story */}
            <article className="mb-space-12">
              <div className="flex flex-wrap items-center gap-space-2 mb-space-4">
                {leadStory.category && (
                  <span className="text-xs font-medium tracking-[0.15em] uppercase text-[#c8922a]">
                    {leadStory.category}
                  </span>
                )}
                {leadStory.significance === "high" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-950/30 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    High significance
                  </span>
                )}
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {leadStory.regions.filter(r => r !== "global").length || "Global"} {leadStory.regions.filter(r => r !== "global").length === 1 ? "region" : "regions"}
                </span>
              </div>

              <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.15] tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">
                {leadStory.headline}
              </h1>

              {leadStory.connection && (
                <p className="mt-space-3 font-[family-name:var(--font-source-serif)] text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-3xl">
                  {leadStory.connection}
                </p>
              )}

              {(() => {
                const slug = findArticleSlug(leadStory);
                return slug ? (
                  <Link
                    href={`/lens/${slug}`}
                    className="mt-space-6 inline-block text-sm font-medium text-[#c8922a] hover:underline"
                  >
                    Read our analysis &rarr;
                  </Link>
                ) : null;
              })()}
            </article>

            {/* Secondary Stories */}
            {secondaryStories.length > 0 && (
              <div className="grid gap-space-6 sm:grid-cols-2 lg:grid-cols-3 border-t border-black/5 dark:border-white/5 pt-space-12">
                {secondaryStories.map((item, i) => (
                  <article key={i} className="group">
                    {item.category && (
                      <span className="text-xs font-medium tracking-[0.15em] uppercase text-[#c8922a]">
                        {item.category}
                      </span>
                    )}
                    <h3 className="mt-space-2 font-[family-name:var(--font-playfair)] text-xl md:text-2xl font-semibold leading-snug text-[#0f0f0f] dark:text-[#f0efec] group-hover:text-[#1a3a5c] dark:group-hover:text-[#7ab0d8] transition-colors">
                      {item.headline}
                    </h3>
                    {item.connection && (
                      <p className="mt-space-2 text-sm leading-relaxed text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400 line-clamp-2">
                        {item.connection}
                      </p>
                    )}
                    <div className="mt-space-2 flex items-center gap-space-2 text-xs text-zinc-400 dark:text-zinc-500">
                      <span>{item.regions.filter(r => r !== "global").length || "Global"} regions</span>
                      {item.significance === "high" && (
                        <>
                          <span>•</span>
                          <span className="text-red-500">High significance</span>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* View More Link */}
            <div className="mt-space-12 text-center">
              <Link
                href="/lens"
                className="inline-flex items-center gap-space-2 rounded-full bg-[#1a3a5c] px-space-6 py-2.5 text-sm font-medium text-white shadow-[0_2px_12px_rgb(26,58,92,0.3)] hover:bg-[#243f66] transition-colors"
              >
                See all stories
              </Link>
            </div>
          </div>
        </section>
      ) : (
        // Empty state - no stories available
        <section className="relative bg-[#f8f7f4] dark:bg-[#0f0f0f] min-h-[50svh] flex flex-col justify-center">
          <div className="pointer-events-none absolute inset-0 bg-subtle-grid opacity-60" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/60 via-transparent to-transparent dark:from-amber-950/15 dark:via-transparent" />
          
          <div className="relative mx-auto w-full max-w-2xl px-space-6 py-space-24 text-center">
            <h1 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl font-semibold leading-tight tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">
              News from 7 regions.<br />All perspectives. 5 minutes.
            </h1>
            <p className="mt-space-4 text-lg text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
              Get the full picture without the bias. Free, daily, in your inbox.
            </p>
            <div className="mt-space-12">
              <EmailCapture variant="hero" />
            </div>
            <p className="mt-space-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
              100% free · No spam · Unsubscribe anytime
            </p>
          </div>
        </section>
      )}

      {/* ── EMAIL CAPTURE — Inline, Between Content ──────────── */}
      {leadStory && (
        <section className="relative bg-[#f8f7f4] dark:bg-[#0f0f0f] py-space-16 border-y border-black/5 dark:border-white/5">
          <div className="mx-auto max-w-3xl px-space-6 text-center">
            <p className="text-base text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400 mb-space-6">
              Every morning. 7 regions. All perspectives. Free.
            </p>
            <div className="max-w-lg mx-auto">
              <EmailCapture variant="hero" />
            </div>
            <p className="mt-space-3 text-xs text-zinc-400 dark:text-zinc-500">
              Free · Daily · Unsubscribe anytime
            </p>
          </div>
        </section>
      )}

      {/* ── PGI WIDGET ────────────────────────────────────── */}
      {pgiData && (
        <section className="relative bg-[#f8f7f4] dark:bg-[#0f0f0f] py-space-16 md:py-space-24 border-t border-black/5 dark:border-white/5">
          <div className="mx-auto max-w-3xl px-space-6 text-center">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
              Perception Gap Index
            </p>
            
            {(() => {
              const tier = getPgiTier(pgiData.pgi);
              return (
                <>
                  {/* Big PGI Number */}
                  <div className="mt-space-6 flex items-center justify-center gap-space-4">
                    <span className={`h-4 w-4 rounded-full ${tier.color}`} />
                    <span className="font-[family-name:var(--font-playfair)] text-6xl md:text-7xl font-bold tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">
                      {pgiData.pgi.toFixed(1)}
                    </span>
                  </div>
                  
                  {/* Tier Name */}
                  <p className="mt-space-3 text-lg font-medium text-[#0f0f0f] dark:text-[#f0efec]">
                    {tier.name}
                  </p>
                  
                  {/* Trend */}
                  {pgiData.delta !== null && (
                    <p className="mt-space-2 text-sm text-zinc-400 dark:text-zinc-500">
                      {pgiData.delta >= 0 ? '▲' : '▼'} {Math.abs(pgiData.delta).toFixed(1)} from yesterday
                    </p>
                  )}
                  
                  {/* Human explanation */}
                  <p className="mt-space-4 text-sm text-zinc-500 dark:text-zinc-400 font-[family-name:var(--font-source-serif)] max-w-md mx-auto">
                    {tier.explanation}
                  </p>
                  
                  {/* Links */}
                  <div className="mt-space-6 flex items-center justify-center gap-space-6">
                    <Link href="/indexes" className="text-sm font-medium text-[#c8922a] hover:text-[#c8922a]/80 transition-colors">
                      What is this? →
                    </Link>
                    <span className="text-xs text-zinc-300 dark:text-zinc-600">
                      Updated {formatPgiDate(pgiData.date)}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </section>
      )}

      {/* ── TODAY'S BRIEFING PREVIEW ─────────────────────────── */}
      <section className="relative bg-[#f8f7f4] py-space-16 dark:bg-[#0f0f0f] md:py-space-24 border-t border-black/5 dark:border-white/5">
        <div className="mx-auto max-w-3xl px-space-6">
          <p className="text-center text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
            Today&apos;s intelligence
          </p>
          <h2 className="mt-space-4 text-center font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[#0f0f0f] md:text-4xl dark:text-[#f0efec]">
            Today&apos;s briefing
          </h2>

          <div className="mt-space-12 rounded-2xl border border-black/[0.07] bg-white p-space-6 md:p-space-8 dark:border-white/[0.07] dark:bg-white/[0.03]">
            {scan && scan.items.length > 0 ? (
              <>
                <div className="flex flex-wrap items-center gap-space-3 text-sm">
                  <span className="inline-flex items-center gap-space-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-500" />
                    Live
                  </span>
                  <time dateTime={scan.date} className="text-zinc-400 dark:text-zinc-500 text-sm">
                    {scan.displayDate}
                  </time>
                </div>

                {scan.patternOfDay && (
                  <div className="mt-space-6 pb-space-6 border-b border-black/[0.06] dark:border-white/[0.06]">
                    <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#c8922a]">
                      Pattern of the Day
                    </p>
                    {scan.patternOfDay.title && (
                      <h3 className="mt-space-3 font-[family-name:var(--font-playfair)] text-xl font-semibold italic leading-snug text-[#0f0f0f] md:text-2xl dark:text-[#f0efec]">
                        {scan.patternOfDay.title}
                      </h3>
                    )}
                    <p className="mt-space-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-3">
                      {scan.patternOfDay.body}
                    </p>
                  </div>
                )}

                <div className="mt-space-6 space-y-space-3">
                  {scan.items.filter((i: ScanItem) => i.significance === "high").slice(0, 4).map((item: ScanItem, i: number) => (
                    <div key={i} className="flex gap-space-3 py-space-2">
                      <span className="mt-1.5 block h-2 w-2 flex-shrink-0 rounded-full bg-[#c8922a]" />
                      <div>
                        <h4 className="text-sm font-medium leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
                          {item.headline}
                        </h4>
                        {item.connection && (
                          <p className="mt-space-1 text-xs leading-relaxed text-zinc-400 dark:text-zinc-500 line-clamp-2">
                            {item.connection}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-space-6 flex flex-col items-center gap-space-3">
                  <Link
                    href="/lens"
                    className="inline-flex items-center gap-space-2 rounded-full bg-[#1a3a5c] px-space-6 py-2.5 text-sm font-medium text-white shadow-[0_2px_12px_rgb(26,58,92,0.3)] hover:bg-[#243f66] transition-colors"
                  >
                    Read today&apos;s full briefing
                  </Link>
                  <Link
                    href="/archive"
                    className="text-sm font-medium text-[#c8922a] hover:text-[#c8922a]/80 transition-colors"
                  >
                    Browse all briefings →
                  </Link>
                </div>
              </>
            ) : (
              <div className="py-space-6 text-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-[family-name:var(--font-source-serif)]">
                  Today&apos;s briefing publishes at 7:00am NZDT.
                </p>
                <p className="mt-space-3 text-xs text-zinc-400 dark:text-zinc-500">
                  Get it in your inbox — free, every morning.
                </p>
                <div className="mt-space-6 max-w-sm mx-auto">
                  <EmailCapture variant="hero" />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── REGIONAL STORY GRID ─────────────────────────────── */}
      {(() => {
        // Region flag mapping
        const REGION_FLAGS: Record<string, string> = {
          "south-asia": "🇮🇳",
          "western-world": "🇺🇸",
          "middle-east": "🕌",
          "eastern-europe": "🇪🇺",
          "africa": "🌍",
          "east-se-asia": "🌏",
          "latin-americas": "🌎",
        };

        // Extract one story per region
        if (!scan || !scan.items || scan.items.length === 0) return null;

        // Group stories by region
        const regionStories: Array<{
          region: string;
          label: string;
          flag: string;
          story: ScanItem;
        }> = [];

        const significanceOrder = { high: 0, medium: 1, low: 2 };

        // For each region (excluding 'global'), find the best story
        for (const [regionKey, regionLabel] of Object.entries(REGION_LABELS)) {
          if (regionKey === "global") continue;

          // Find all stories that include this region
          const storiesForRegion = scan.items.filter((item) =>
            item.regions.includes(regionKey)
          );

          if (storiesForRegion.length === 0) continue;

          // Sort by significance (high > medium > low), then by order in scan (assuming most recent first)
          const bestStory = storiesForRegion.sort((a, b) => {
            const sigDiff = (significanceOrder[a.significance] ?? 1) - (significanceOrder[b.significance] ?? 1);
            return sigDiff;
          })[0];

          regionStories.push({
            region: regionKey,
            label: regionLabel,
            flag: REGION_FLAGS[regionKey] || "🌐",
            story: bestStory,
          });
        }

        if (regionStories.length === 0) return null;

        return (
          <section className="relative bg-[#f8f7f4] py-space-16 dark:bg-[#0f0f0f] md:py-space-24 border-t border-black/5 dark:border-white/5">
            <div className="mx-auto max-w-5xl px-space-6">
              <p className="text-center text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
                Around the World
              </p>
              <h2 className="mt-space-4 text-center font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[#0f0f0f] md:text-4xl dark:text-[#f0efec]">
                Today from each region
              </h2>

              <div className="mt-space-12 grid gap-space-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {regionStories.map(({ region, label, flag, story }) => {
                  const slug = findArticleSlug(story);
                  const CardContent = (
                    <>
                      <div className="flex items-center gap-space-2 mb-space-3">
                        <span className="text-lg">{flag}</span>
                        <span className="text-xs font-medium tracking-[0.1em] uppercase text-zinc-400 dark:text-zinc-500">
                          {label}
                        </span>
                      </div>
                      <h3 className="font-[family-name:var(--font-playfair)] text-base font-semibold leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
                        {story.headline}
                      </h3>
                      {story.connection && (
                        <p className="mt-space-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2">
                          {story.connection}
                        </p>
                      )}
                      {story.category && (
                        <span className="mt-space-3 inline-block text-[10px] font-medium tracking-[0.15em] uppercase text-[#c8922a]">
                          {story.category}
                        </span>
                      )}
                    </>
                  );

                  return slug ? (
                    <Link
                      key={region}
                      href={`/lens/${slug}`}
                      className="group rounded-xl border border-black/[0.07] p-space-5 transition-all hover:border-[#c8922a]/30 hover:shadow-sm dark:border-white/[0.06] dark:hover:border-[#c8922a]/30"
                    >
                      {CardContent}
                    </Link>
                  ) : (
                    <article
                      key={region}
                      className="group rounded-xl border border-black/[0.07] p-space-5 transition-all hover:border-[#c8922a]/30 hover:shadow-sm dark:border-white/[0.06] dark:hover:border-[#c8922a]/30"
                    >
                      {CardContent}
                    </article>
                  );
                })}
              </div>

              {/* Link to perspectives */}
              <div className="mt-space-8 text-center">
                <Link
                  href="/perspectives"
                  className="text-sm font-medium text-[#c8922a] hover:text-[#c8922a]/80 transition-colors"
                >
                  Explore all 195 country perspectives →
                </Link>
              </div>
            </div>
          </section>
        );
      })()}

      {/* ── LATEST FROM THE LENS (Tabbed) ─────────────────────── */}
      {(() => {
        const posts = getAllPosts().slice(0, 30);
        if (posts.length === 0) return null;
        const articleData = posts.map((p) => ({
          slug: p.slug,
          title: p.title,
          description: p.description || "",
          date: p.date,
          tags: p.tags || [],
        }));
        return (
          <section className="relative bg-[#f8f7f4] py-space-16 dark:bg-[#0f0f0f] md:py-space-24 border-t border-black/5 dark:border-white/5">
            <div className="mx-auto max-w-4xl px-space-6">
              <p className="text-center text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
                From The Lens
              </p>
              <h2 className="mt-space-4 text-center font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[#0f0f0f] md:text-4xl dark:text-[#f0efec]">
                Latest analysis
              </h2>

              <TabbedArticles articles={articleData} />
            </div>
          </section>
        );
      })()}

      {/* ── SECOND EMAIL CAPTURE ────────────────────────────── */}
      <section className="relative bg-[#f8f7f4] dark:bg-[#0f0f0f] py-space-12 border-t border-black/5 dark:border-white/5">
        <div className="mx-auto max-w-2xl px-space-6 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-[family-name:var(--font-source-serif)]">
            Like what you see? Get this in your inbox every morning.
          </p>
          <div className="mt-space-4 max-w-sm mx-auto">
            <EmailCapture variant="hero" />
          </div>
          <p className="mt-space-3 text-xs text-zinc-400 dark:text-zinc-500">
            Free · Daily · Unsubscribe anytime
          </p>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#1a3a5c] py-space-16 md:py-space-24">
        <div className="pointer-events-none absolute inset-0 bg-subtle-grid opacity-30" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-[#c8922a]/10 blur-3xl" />

        <div className="relative mx-auto max-w-xl px-space-6 text-center">
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-white md:text-4xl">
            News from 7 regions. Zero bias.
          </h2>
          <p className="mt-space-4 text-base text-white/60 font-[family-name:var(--font-source-serif)]">
            Join thousands of readers who start their day with clarity.
          </p>

          <div className="mt-space-8">
            <EmailCapture />
          </div>

          <p className="mt-space-4 text-sm text-white/40">
            100% free · No spam · Unsubscribe anytime
          </p>

          <div className="mt-space-6">
            <Link
              href="/archive"
              className="text-sm text-white/50 hover:text-white/70 transition-colors"
            >
              See yesterday&apos;s briefing →
            </Link>
          </div>
        </div>
      </section>

      {/* Scan metadata */}
      {scan?.scanMeta && (
        <div className="border-t border-zinc-200/50 bg-[#f8f7f4] py-space-3 dark:border-zinc-800/30 dark:bg-[#0f0f0f]">
          <p className="text-center font-[family-name:var(--font-geist-mono)] text-[10px] text-zinc-300 dark:text-zinc-700">
            {scan.scanMeta}
          </p>
        </div>
      )}
    </main>
  );
}
