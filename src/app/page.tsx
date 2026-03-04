import Link from "next/link";
import { getTodayScan, type ScanItem } from "@/lib/scan-parser";
import { CATEGORY_META, REGION_LABELS, normalizeRegion, DISPLAY_REGIONS, detectBlindspots } from "@/lib/scan-types";
import { getAllPosts } from "@/lib/blog";
import { EmailCapture } from "./components/email-capture";
import { DateLine } from "./components/date-line";
import { CrisisHero } from "./components/crisis-hero";
import { RelativeTime, BriefingTime } from "./components/relative-time";
import { NextBriefingCountdown } from "./components/next-briefing-countdown";
import { ExitIntentModal } from "./components/exit-intent-modal";
import { PgiBar } from "./components/pgi-bar";
import { Testimonials } from "./components/testimonials";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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

// Fetch active breaking news
async function getBreakingNews() {
  try {
    const supabase = createAdminClient();
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

    if (error) return null;
    return data && data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}

export default async function Home() {
  const scan = await getTodayScan();
  const breakingNews = await getBreakingNews();
  const pgiData = await getLatestPGI();

  // Build article slug lookup
  const allPosts = getAllPosts();
  const articleSlugs: Record<string, string> = {};
  for (const post of allPosts) {
    for (const tag of post.tags || []) {
      articleSlugs[tag.toLowerCase()] = post.slug;
    }
  }

  // Get top stories sorted by significance
  const topStories = scan?.items
    ? [...scan.items].sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return (order[a.significance] ?? 1) - (order[b.significance] ?? 1);
      })
    : [];

  const leadStory = topStories[0];
  const secondaryStories = topStories.slice(1, 4);

  // Get 5 briefing headlines (high-significance first)
  const briefingHeadlines = topStories.slice(0, 5);

  function findArticleSlug(item: ScanItem): string | null {
    for (const tag of item.tags || []) {
      if (articleSlugs[tag.toLowerCase()]) return articleSlugs[tag.toLowerCase()];
    }
    return null;
  }

  function getCategoryAccent(category: string): string {
    return CATEGORY_META[category]?.accent || "#c8922a";
  }

  // ── REGION GRID: group stories by normalised region ──
  const regionStories: Array<{
    region: string;
    label: string;
    flag: string;
    story: ScanItem;
  }> = [];

  const REGION_FLAGS: Record<string, string> = {
    "western-world": "🇺🇸",
    "europe": "🇪🇺",
    "middle-east": "🕌",
    "south-asia": "🇮🇳",
    "east-se-asia": "🌏",
    "africa": "🌍",
    "latin-americas": "🌎",
  };

  if (scan?.items) {
    const significanceOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

    for (const displayRegion of DISPLAY_REGIONS) {
      // Find stories whose normalised regions include this display region
      const storiesForRegion = scan.items.filter((item) =>
        item.regions.some((r) => normalizeRegion(r) === displayRegion)
      );
      if (storiesForRegion.length === 0) continue;

      const bestStory = storiesForRegion.sort(
        (a, b) => (significanceOrder[a.significance] ?? 1) - (significanceOrder[b.significance] ?? 1)
      )[0];

      regionStories.push({
        region: displayRegion,
        label: REGION_LABELS[displayRegion] || displayRegion,
        flag: REGION_FLAGS[displayRegion] || "🌐",
        story: bestStory,
      });
    }
  }

  // Latest articles for the Lens section (featured + grid)
  const latestPosts = allPosts.slice(0, 7);
  const featuredPost = latestPosts[0];
  const gridPosts = latestPosts.slice(1, 7);

  return (
    <main className="overflow-hidden">
      <DateLine />

      {/* ── BREAKING NEWS (if active) ──────────────────────── */}
      {breakingNews && (
        <CrisisHero
          headline={breakingNews.headline}
          url={breakingNews.url}
          mode="breaking"
        />
      )}

      {/* ════════════════════════════════════════════════════════
          ABOVE THE FOLD — Conversion-focused hero
          One clear value prop. One email capture. Done.
          ════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#f8f7f4] dark:bg-[#0f0f0f]">
        <div className="pointer-events-none absolute inset-0 bg-subtle-grid opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/40 via-transparent to-transparent dark:from-amber-950/10" />

        <div className="relative mx-auto max-w-2xl px-6 pt-12 pb-10 md:pt-20 md:pb-14 text-center">
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl md:text-5xl font-semibold leading-[1.15] tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">
            The world&apos;s news.<br />All perspectives. 5&nbsp;minutes.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400 max-w-lg mx-auto">
            See how 7 regions cover the same story — free daily briefing with zero&nbsp;bias.
          </p>
          <div className="mt-8">
            <EmailCapture variant="hero" showSocialProof={true} showYesterdayLink={true} />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          BELOW THE FOLD — Content for scrollers
          ════════════════════════════════════════════════════════ */}

      {/* ── LEAD + SECONDARY STORIES ──────────────────────── */}
      {leadStory && (
        <section className="bg-[#f8f7f4] dark:bg-[#0f0f0f] border-t border-black/5 dark:border-white/5">
          <div className="mx-auto max-w-5xl px-6 py-10 md:py-14">
            {/* Lead story */}
            <article className="mb-8">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {leadStory.category && (
                  <span
                    className="text-xs font-medium tracking-[0.15em] uppercase"
                    style={{ color: getCategoryAccent(leadStory.category) }}
                  >
                    {CATEGORY_META[leadStory.category]?.label || leadStory.category}
                  </span>
                )}
                {leadStory.significance === "high" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-950/30 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    Top story
                  </span>
                )}
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {(() => {
                    const count = leadStory.regions.filter((r) => r !== "global").length;
                    if (count === 0) return "Global";
                    return `${count} region${count === 1 ? "" : "s"}`;
                  })()}
                </span>
              </div>

              <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl md:text-4xl font-bold leading-[1.15] tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">
                {leadStory.headline}
              </h2>

              {leadStory.connection && (
                <p className="mt-3 font-[family-name:var(--font-source-serif)] text-base sm:text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-3xl">
                  {leadStory.connection}
                </p>
              )}

              {(() => {
                const slug = findArticleSlug(leadStory);
                return slug ? (
                  <Link href={`/lens/${slug}`} className="mt-4 inline-block text-sm font-medium text-[#c8922a] hover:underline">
                    Read our analysis →
                  </Link>
                ) : null;
              })()}
            </article>

            {/* Secondary stories — 3 cards */}
            {secondaryStories.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 border-t border-black/5 dark:border-white/5 pt-8">
                {secondaryStories.map((item, i) => {
                  const slug = findArticleSlug(item);
                  const content = (
                    <>
                      {item.category && (
                        <span
                          className="text-[11px] font-medium tracking-[0.15em] uppercase"
                          style={{ color: getCategoryAccent(item.category) }}
                        >
                          {CATEGORY_META[item.category]?.label || item.category}
                        </span>
                      )}
                      <h3 className="mt-1.5 font-[family-name:var(--font-playfair)] text-lg md:text-xl font-semibold leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
                        {item.headline}
                      </h3>
                      {item.connection && (
                        <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400 line-clamp-2">
                          {item.connection}
                        </p>
                      )}
                    </>
                  );
                  return slug ? (
                    <Link key={i} href={`/lens/${slug}`} className="group block rounded-lg border-l-2 pl-4 py-1 transition-colors hover:border-[#c8922a]" style={{ borderLeftColor: getCategoryAccent(item.category) + "40" }}>
                      {content}
                    </Link>
                  ) : (
                    <article key={i} className="rounded-lg border-l-2 pl-4 py-1" style={{ borderLeftColor: getCategoryAccent(item.category) + "40" }}>
                      {content}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── PGI BAR (compact) ─────────────────────────────── */}
      {pgiData && (
        <section className="bg-[#f8f7f4] dark:bg-[#0f0f0f] border-t border-black/5 dark:border-white/5">
          <div className="mx-auto max-w-3xl px-6 py-6">
            <PgiBar pgi={pgiData.pgi} delta={pgiData.delta} date={pgiData.date} />
          </div>
        </section>
      )}

      {/* ── BRIEFING PREVIEW ──────────────────────────────── */}
      <section className="bg-[#f8f7f4] dark:bg-[#0f0f0f] border-t border-black/5 dark:border-white/5">
        <div className="mx-auto max-w-3xl px-6 py-10 md:py-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
                Today&apos;s Briefing
              </h3>
              {scan?.date && (
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  <BriefingTime date={scan.date} fallback={scan.displayDate} />
                </p>
              )}
            </div>
            {scan && scan.items.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-500" />
                Live
              </span>
            )}
          </div>

          {briefingHeadlines.length > 0 ? (
            <>
              <div className="space-y-3">
                {briefingHeadlines.map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span
                      className="mt-2 block h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: getCategoryAccent(item.category) }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
                        {item.headline}
                      </p>
                      {item.connection && (
                        <p className="mt-0.5 text-xs leading-relaxed text-zinc-400 dark:text-zinc-500 line-clamp-1">
                          {item.connection}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {scan?.patternOfDay && (
                <div className="mt-6 pt-5 border-t border-black/[0.05] dark:border-white/[0.05]">
                  <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-[#c8922a]">
                    Pattern of the Day
                  </p>
                  {scan.patternOfDay.title && (
                    <h4 className="mt-2 font-[family-name:var(--font-playfair)] text-lg font-semibold italic leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
                      {scan.patternOfDay.title}
                    </h4>
                  )}
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {scan.patternOfDay.body}
                  </p>
                </div>
              )}

              <div className="mt-6 flex items-center gap-4">
                <Link
                  href="/lens"
                  className="inline-flex items-center gap-2 rounded-full bg-[#1a3a5c] px-6 py-2.5 text-sm font-medium text-white shadow-[0_2px_12px_rgb(26,58,92,0.3)] hover:bg-[#243f66] transition-colors"
                >
                  Read full briefing
                </Link>
                <Link href="/archive" className="text-sm font-medium text-[#c8922a] hover:text-[#c8922a]/80 transition-colors">
                  Past briefings →
                </Link>
              </div>
              <NextBriefingCountdown />
            </>
          ) : (
            <div className="rounded-xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-white/[0.03] text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-[family-name:var(--font-source-serif)]">
                Today&apos;s briefing publishes at 7:00am NZDT.
              </p>
              <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                Get it in your inbox — free, every morning.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── REGIONAL STORY GRID ───────────────────────────── */}
      {regionStories.length > 0 && (
        <section className="bg-[#f8f7f4] dark:bg-[#0f0f0f] border-t border-black/5 dark:border-white/5">
          <div className="mx-auto max-w-5xl px-6 py-10 md:py-14">
            <div className="text-center mb-8">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
                Around the World
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                Today from each region
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {regionStories.map(({ region, label, flag, story }) => {
                const slug = findArticleSlug(story);
                const card = (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">{flag}</span>
                      <span className="text-xs font-medium tracking-[0.1em] uppercase text-zinc-400 dark:text-zinc-500">
                        {label}
                      </span>
                    </div>
                    <h3 className="font-[family-name:var(--font-playfair)] text-sm font-semibold leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
                      {story.headline}
                    </h3>
                    {story.connection && (
                      <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {story.connection}
                      </p>
                    )}
                  </>
                );

                return slug ? (
                  <Link
                    key={region}
                    href={`/lens/${slug}`}
                    className="group rounded-lg border border-black/[0.06] p-4 transition-all hover:border-[#c8922a]/30 hover:shadow-sm dark:border-white/[0.06]"
                  >
                    {card}
                  </Link>
                ) : (
                  <article
                    key={region}
                    className="rounded-lg border border-black/[0.06] p-4 dark:border-white/[0.06]"
                  >
                    {card}
                  </article>
                );
              })}
            </div>

            <div className="mt-6 text-center">
              <Link href="/perspectives" className="text-sm font-medium text-[#c8922a] hover:text-[#c8922a]/80 transition-colors">
                Explore all 195 country perspectives →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── UNDER THE RADAR TEASER ──────────────────────── */}
      {(() => {
        if (!scan?.items) return null;
        const withBlindspots = detectBlindspots(scan.items);
        const blindspots = withBlindspots
          .filter((item) => item.blindspot?.isBlindspot === true)
          .slice(0, 2);
        if (blindspots.length === 0) return null;

        return (
          <section className="bg-[#f8f7f4] dark:bg-[#0f0f0f] border-t border-black/5 dark:border-white/5">
            <div className="mx-auto max-w-3xl px-6 py-10 md:py-14">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
                    Under the Radar
                  </p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Stories the rest of the world isn&apos;t seeing
                  </p>
                </div>
                <Link href="/under-the-radar" className="text-xs font-medium text-[#c8922a] hover:text-[#c8922a]/80 transition-colors">
                  See all →
                </Link>
              </div>
              <div className="space-y-3">
                {blindspots.map((item, i) => {
                  const coveredBy = item.blindspot?.coveredBy || [];
                  return (
                    <div key={i} className="rounded-lg border border-black/[0.06] p-4 dark:border-white/[0.06]">
                      <p className="text-sm font-medium leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
                        {item.headline}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-400 dark:text-zinc-500">
                        <span className="font-medium uppercase tracking-wider">Only seen by:</span>
                        {coveredBy.map((r) => (
                          <span key={r} className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                            {REGION_LABELS[r] || REGION_LABELS[normalizeRegion(r)] || r}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })()}

      {/* ── LATEST FROM THE LENS (Featured + Grid) ────────── */}
      {featuredPost && (
        <section className="bg-[#f8f7f4] dark:bg-[#0f0f0f] border-t border-black/5 dark:border-white/5">
          <div className="mx-auto max-w-5xl px-6 py-10 md:py-14">
            <div className="text-center mb-8">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
                From The Lens
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                Latest analysis
              </h2>
            </div>

            {/* Featured article — full width */}
            <Link
              href={`/lens/${featuredPost.slug}`}
              className="group block rounded-xl border border-black/[0.06] p-6 md:p-8 mb-4 transition-all hover:border-[#c8922a]/30 hover:shadow-sm dark:border-white/[0.06]"
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {featuredPost.category && (
                  <span
                    className="text-xs font-medium tracking-[0.15em] uppercase"
                    style={{ color: getCategoryAccent(featuredPost.category) }}
                  >
                    {CATEGORY_META[featuredPost.category]?.label || featuredPost.category}
                  </span>
                )}
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  <RelativeTime date={featuredPost.date} />
                </span>
              </div>
              <h3 className="font-[family-name:var(--font-playfair)] text-xl md:text-2xl font-bold leading-snug text-[#0f0f0f] dark:text-[#f0efec] group-hover:text-[#1a3a5c] dark:group-hover:text-[#7ab0d8] transition-colors">
                {featuredPost.title}
              </h3>
              {featuredPost.description && (
                <p className="mt-2 text-sm sm:text-base leading-relaxed text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400 line-clamp-2">
                  {featuredPost.description}
                </p>
              )}
            </Link>

            {/* Grid articles */}
            {gridPosts.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {gridPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/lens/${post.slug}`}
                    className="group block rounded-lg border border-black/[0.06] p-4 transition-all hover:border-[#c8922a]/30 hover:shadow-sm dark:border-white/[0.06]"
                  >
                    {post.category && (
                      <span
                        className="text-[11px] font-medium tracking-[0.15em] uppercase"
                        style={{ color: getCategoryAccent(post.category) }}
                      >
                        {CATEGORY_META[post.category]?.label || post.category}
                      </span>
                    )}
                    <h4 className="mt-1 font-[family-name:var(--font-playfair)] text-sm font-semibold leading-snug text-[#0f0f0f] dark:text-[#f0efec] group-hover:text-[#1a3a5c] dark:group-hover:text-[#7ab0d8] transition-colors">
                      {post.title}
                    </h4>
                    <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                      <RelativeTime date={post.date} />
                    </p>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-6 text-center">
              <Link
                href="/lens"
                className="inline-flex items-center gap-2 rounded-full bg-[#1a3a5c] px-6 py-2.5 text-sm font-medium text-white shadow-[0_2px_12px_rgb(26,58,92,0.3)] hover:bg-[#243f66] transition-colors"
              >
                See all stories
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ─────────────────────────────────── */}
      <section className="bg-[#f8f7f4] dark:bg-[#0f0f0f] border-t border-black/5 dark:border-white/5">
        <div className="mx-auto max-w-3xl px-6 py-10 md:py-14">
          <p className="text-center text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-6">
            What readers say
          </p>
          <Testimonials />
        </div>
      </section>

      {/* ── FINAL CTA — Navy section ──────────────────────── */}
      <section className="relative overflow-hidden bg-[#1a3a5c] py-12 md:py-16">
        <div className="pointer-events-none absolute inset-0 bg-subtle-grid opacity-30" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-80 -translate-x-1/2 rounded-full bg-[#c8922a]/10 blur-3xl" />

        <div className="relative mx-auto max-w-xl px-6 text-center">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-semibold leading-tight text-white">
            Start your day with clarity, not&nbsp;noise.
          </h2>
          <p className="mt-3 text-sm text-white/60 font-[family-name:var(--font-source-serif)]">
            7 regions. Zero bias. Free forever.
          </p>

          <div className="mt-6">
            <EmailCapture showSocialProof={true} showYesterdayLink={true} />
          </div>
        </div>
      </section>

      {/* Scan metadata */}
      {scan?.scanMeta && (
        <div className="border-t border-zinc-200/50 bg-[#f8f7f4] py-2 dark:border-zinc-800/30 dark:bg-[#0f0f0f]">
          <p className="text-center font-[family-name:var(--font-geist-mono)] text-[10px] text-zinc-300 dark:text-zinc-700">
            {scan.scanMeta}
          </p>
          {scan.date && (
            <p className="text-center text-[10px] text-zinc-300 dark:text-zinc-700 mt-0.5">
              <RelativeTime date={scan.date} prefix="Last scanned " />
            </p>
          )}
        </div>
      )}

      <ExitIntentModal
        articles={allPosts.slice(0, 10).map((p) => ({
          slug: p.slug,
          title: p.title,
          description: p.description || "",
          readingTime: p.readingTime,
          category: p.category || "analysis",
        }))}
      />
    </main>
  );
}
