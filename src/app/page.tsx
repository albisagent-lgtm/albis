import Link from "next/link";
import { getTodayScan } from "@/lib/scan-parser";
import { getAllPosts } from "@/lib/blog";
import {
  normalizeRegion,
  detectBlindspots,
  CATEGORY_META,
  REGION_LABELS,
  DISPLAY_REGIONS,
  type ScanItem,
} from "@/lib/scan-types";
import { EmailCapture } from "./components/email-capture";

export const dynamic = "force-dynamic";

/* ─── Region display helpers ─── */
const REGION_SHORT: Record<string, string> = {
  "western-world": "US/West",
  europe: "Europe",
  "middle-east": "Middle East",
  "south-asia": "South Asia",
  "east-se-asia": "East Asia",
  africa: "Africa",
  "latin-americas": "Latin America",
};

const CATEGORY_NAV: Record<string, string> = {
  "current-events": "world",
  geopolitics: "world",
  conflict: "world",
  governance: "politics",
  "economic-flows": "business",
  "tech-ai": "technology",
  "cyber-info-warfare": "technology",
  health: "health",
  "science-space": "science",
  "weather-climate": "science",
  "natural-world": "science",
  "climate-energy": "science",
};

function buildSlugMatcher(allPosts: ReturnType<typeof getAllPosts>) {
  const articleSlugs: Record<string, string> = {};
  for (const post of allPosts) {
    for (const tag of post.tags || []) {
      articleSlugs[tag.toLowerCase()] = post.slug;
    }
  }
  return function findArticleSlug(item: ScanItem): string | null {
    if ("slug" in item && (item as ScanItem & { slug?: string }).slug)
      return (item as ScanItem & { slug?: string }).slug!;
    const headlineWords = (item.headline || "")
      .toLowerCase()
      .split(/\s+/)
      .filter((w: string) => w.length > 3);
    let bestSlug: string | null = null;
    let bestScore = 0;
    for (const post of allPosts.slice(0, 30)) {
      const titleWords = post.title.toLowerCase().split(/\s+/);
      const overlap = headlineWords.filter((w: string) =>
        titleWords.includes(w)
      ).length;
      if (overlap > bestScore) {
        bestScore = overlap;
        bestSlug = post.slug;
      }
    }
    if (bestScore >= 2) return bestSlug;
    for (const tag of item.tags || []) {
      if (articleSlugs[tag.toLowerCase()])
        return articleSlugs[tag.toLowerCase()];
    }
    return null;
  };
}

function getRegions(item: ScanItem) {
  const regions = Array.isArray(item.regions) ? item.regions : [];
  return [
    ...new Set(
      regions
        .filter((r) => typeof r === "string" && r !== "global")
        .map((r) => normalizeRegion(r))
    ),
  ];
}

function regionList(regions: string[]): string {
  return regions
    .map((r) => REGION_SHORT[r] || REGION_LABELS[r] || r)
    .join(" · ");
}

function getCategoryLabel(category: string): string {
  return CATEGORY_META[category]?.label || "News";
}

function getCategoryAccent(category: string): string {
  return CATEGORY_META[category]?.accent || "#71717a";
}

/* ─── Tiny components ─── */
function CategoryBadge({ category, size = "sm" }: { category: string; size?: "sm" | "xs" }) {
  const label = getCategoryLabel(category);
  const accent = getCategoryAccent(category);
  return (
    <span
      className={`inline-block rounded-sm font-[family-name:var(--font-inter)] font-semibold uppercase tracking-wider text-white ${
        size === "xs" ? "px-1 py-px text-[8px]" : "px-1.5 py-0.5 text-[9px]"
      }`}
      style={{ backgroundColor: accent }}
    >
      {label}
    </span>
  );
}

function RegionDots({ regions }: { regions: string[] }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {DISPLAY_REGIONS.map((r) => (
        <span
          key={r}
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            regions.includes(r)
              ? "bg-[#c8922a]"
              : "bg-zinc-200 dark:bg-zinc-700"
          }`}
          title={REGION_SHORT[r] || r}
        />
      ))}
    </span>
  );
}

function StoryMeta({
  regions,
  significance,
  blindspot,
}: {
  regions: string[];
  significance: string;
  blindspot?: ScanItem["blindspot"];
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-[family-name:var(--font-inter)] text-[10px] text-zinc-400">
      <RegionDots regions={regions} />
      <span>
        {regions.length}/{DISPLAY_REGIONS.length} regions
      </span>
      {significance === "high" && (
        <span className="rounded-sm bg-red-100 px-1 py-px text-[9px] font-semibold uppercase text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Developing
        </span>
      )}
      {blindspot?.isBlindspot && (
        <span className="text-amber-600 dark:text-amber-400">
          Missing from {blindspot.missingFrom
            .slice(0, 2)
            .map((r) => REGION_SHORT[r] || r)
            .join(", ")}
        </span>
      )}
    </div>
  );
}

function StoryLink({
  slug,
  children,
  className = "",
}: {
  slug: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  if (slug) {
    return (
      <Link href={`/lens/${slug}`} className={className}>
        {children}
      </Link>
    );
  }
  return <div className={className}>{children}</div>;
}

/* ═══════════════════════════════════════════════════════════
   HOME PAGE
   ═══════════════════════════════════════════════════════════ */
export default async function Home() {
  const scan = await getTodayScan();
  const allPosts = getAllPosts();
  const findArticleSlug = buildSlugMatcher(allPosts);

  const allItems = scan?.items
    ? detectBlindspots(
        [...scan.items]
          .filter((item) => item && typeof item.headline === "string")
          .sort((a, b) => {
            const order = { high: 0, medium: 1, low: 2 };
            return (order[a.significance] ?? 1) - (order[b.significance] ?? 1);
          })
      )
    : [];

  const leadStory = allItems[0] || null;
  const secondaryStories = allItems.slice(1, 5);
  const moreStories = allItems.slice(5, 11);
  const blindspotStories = allItems.filter((i) => i.blindspot?.isBlindspot);
  const recentArticles = allPosts.slice(0, 8);

  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const scanTime = scan?.date
    ? new Date(scan.date + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <main className="min-h-screen">
      {/* ─── BREAKING TICKER ─── */}
      {allItems.filter((i) => i.significance === "high").length > 0 && (
        <div className="border-b border-red-200/60 bg-red-50/50 dark:border-red-900/20 dark:bg-red-950/20">
          <div className="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-4 py-2 md:px-6">
            <span className="flex-none rounded-sm bg-red-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
              Developing
            </span>
            <div className="flex items-center gap-6 text-sm">
              {allItems
                .filter((i) => i.significance === "high")
                .slice(0, 3)
                .map((item, i) => {
                  const slug = findArticleSlug(item);
                  return (
                    <StoryLink key={i} slug={slug} className="flex-none">
                      <span className="font-medium text-red-900 hover:text-red-700 dark:text-red-200 dark:hover:text-red-100">
                        {item.headline}
                      </span>
                      <span className="ml-2 text-[10px] text-red-400">
                        {getRegions(item).length} regions
                      </span>
                    </StoryLink>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ─── MASTHEAD ─── */}
      <header className="border-b border-black/[0.06] bg-[#f8f7f4] dark:border-white/[0.06] dark:bg-[#0f0f0f]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-baseline gap-3">
            <time className="font-[family-name:var(--font-inter)] text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              {dateString}
            </time>
            {allItems.length > 0 && (
              <span className="hidden text-[11px] text-zinc-300 dark:text-zinc-600 sm:inline">
                {allItems.length} stories scanned across {DISPLAY_REGIONS.length} regions
              </span>
            )}
          </div>
          <Link
            href="/archive"
            className="font-[family-name:var(--font-inter)] text-[11px] text-zinc-400 hover:text-[#c8922a] transition-colors"
          >
            Archive →
          </Link>
        </div>
      </header>

      {/* ─── LEAD STORY + SIDEBAR ─── */}
      <section className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          {allItems.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-[family-name:var(--font-playfair)] text-lg italic text-zinc-400">
                Today&apos;s scan is loading...
              </p>
              <p className="mt-2 text-sm text-zinc-300">
                Check back shortly — scans run at 7am, 1pm, and 7pm NZST.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-12">
              {/* LEAD — spans 7 cols */}
              {leadStory && (
                <div className="lg:col-span-7">
                  <StoryLink
                    slug={findArticleSlug(leadStory)}
                    className="group block"
                  >
                    <CategoryBadge category={leadStory.category} />
                    <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-bold leading-tight tracking-tight text-[#0f0f0f] transition-colors group-hover:text-[#c8922a] dark:text-[#f0efec] md:text-3xl lg:text-[2.25rem]">
                      {leadStory.headline}
                    </h2>
                    {leadStory.connection && (
                      <p className="mt-3 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {String(leadStory.connection)}
                      </p>
                    )}
                    <StoryMeta
                      regions={getRegions(leadStory)}
                      significance={leadStory.significance}
                      blindspot={leadStory.blindspot}
                    />
                  </StoryLink>

                  {/* Below lead: first 2 secondary stories in row */}
                  {secondaryStories.length > 0 && (
                    <div className="mt-8 grid gap-6 border-t border-black/[0.06] pt-8 sm:grid-cols-2 dark:border-white/[0.06]">
                      {secondaryStories.slice(0, 2).map((item, i) => {
                        const regions = getRegions(item);
                        return (
                          <StoryLink
                            key={i}
                            slug={findArticleSlug(item)}
                            className="group block"
                          >
                            <CategoryBadge category={item.category} size="xs" />
                            <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-[15px] font-bold leading-snug text-[#0f0f0f] transition-colors group-hover:text-[#c8922a] dark:text-[#f0efec]">
                              {item.headline}
                            </h3>
                            {item.connection && (
                              <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 line-clamp-2 dark:text-zinc-400">
                                {String(item.connection)}
                              </p>
                            )}
                            <StoryMeta
                              regions={regions}
                              significance={item.significance}
                              blindspot={item.blindspot}
                            />
                          </StoryLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* RIGHT SIDEBAR — spans 5 cols */}
              <div className="lg:col-span-5 lg:border-l lg:border-black/[0.06] lg:pl-8 dark:lg:border-white/[0.06]">
                {/* Secondary stories list */}
                <div className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
                  {secondaryStories.slice(2, 4).map((item, i) => {
                    const regions = getRegions(item);
                    return (
                      <StoryLink
                        key={i}
                        slug={findArticleSlug(item)}
                        className="group block py-5 first:pt-0"
                      >
                        <div className="flex items-center gap-2">
                          <CategoryBadge category={item.category} size="xs" />
                          <span className="font-[family-name:var(--font-inter)] text-[10px] text-zinc-400">
                            {regions.length}/{DISPLAY_REGIONS.length} regions
                          </span>
                        </div>
                        <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-[15px] font-bold leading-snug text-[#0f0f0f] transition-colors group-hover:text-[#c8922a] dark:text-[#f0efec]">
                          {item.headline}
                        </h3>
                        {item.connection && (
                          <p className="mt-1 text-xs text-zinc-500 line-clamp-2 dark:text-zinc-400">
                            {String(item.connection)}
                          </p>
                        )}
                        <StoryMeta
                          regions={regions}
                          significance={item.significance}
                          blindspot={item.blindspot}
                        />
                      </StoryLink>
                    );
                  })}
                </div>

                {/* Subscribe mini card */}
                <div className="mt-6 rounded-xl bg-[#0f0f0f] p-6 dark:bg-[#1a1a1a]">
                  <p className="font-[family-name:var(--font-playfair)] text-sm font-semibold text-[#f0efec]">
                    The world&apos;s news in 2 minutes
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    Scanned from 60 countries · 7 regions · 16 languages
                  </p>
                  <div className="mt-4">
                    <EmailCapture
                      variant="default"
                      showSocialProof={false}
                      showYesterdayLink={false}
                      source="homepage-sidebar"
                    />
                  </div>
                </div>

                {/* Blindspot alert */}
                {blindspotStories.length > 0 && (
                  <div className="mt-6 rounded-xl border border-amber-200/60 bg-amber-50/50 p-5 dark:border-amber-800/30 dark:bg-amber-950/20">
                    <h4 className="flex items-center gap-2 font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      <span className="text-base">⚠️</span> Coverage Blind Spots
                    </h4>
                    <p className="mt-1 text-[10px] text-amber-600/70 dark:text-amber-400/60">
                      Stories covered by some regions but missing from others
                    </p>
                    <div className="mt-3 space-y-3">
                      {blindspotStories.slice(0, 3).map((item, i) => (
                        <StoryLink
                          key={i}
                          slug={findArticleSlug(item)}
                          className="group block"
                        >
                          <p className="text-xs font-medium text-amber-900 transition-colors group-hover:text-[#c8922a] dark:text-amber-100">
                            {item.headline}
                          </p>
                          <p className="mt-0.5 text-[10px] text-amber-600/60 dark:text-amber-400/50">
                            Not in: {item.blindspot?.missingFrom
                              .slice(0, 3)
                              .map((r) => REGION_SHORT[r] || r)
                              .join(", ")}
                          </p>
                        </StoryLink>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── MORE STORIES GRID ─── */}
      {moreStories.length > 0 && (
        <section className="border-t border-black/[0.06] bg-white dark:border-white/[0.06] dark:bg-[#111]">
          <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
            <div className="flex items-baseline justify-between pb-4">
              <h2 className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                More from today&apos;s scan
              </h2>
              <Link
                href="/world"
                className="font-[family-name:var(--font-inter)] text-[11px] text-[#c8922a] hover:underline"
              >
                All stories →
              </Link>
            </div>
            <div className="grid gap-x-8 gap-y-8 sm:gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {moreStories.map((item, i) => {
                const regions = getRegions(item);
                return (
                  <StoryLink
                    key={i}
                    slug={findArticleSlug(item)}
                    className="group block border-t border-black/[0.05] pt-5 dark:border-white/[0.05]"
                  >
                    <div className="flex items-center gap-2">
                      <CategoryBadge category={item.category} size="xs" />
                      <RegionDots regions={regions} />
                    </div>
                    <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-sm font-bold leading-snug text-[#0f0f0f] transition-colors group-hover:text-[#c8922a] dark:text-[#f0efec]">
                      {item.headline}
                    </h3>
                    {item.connection && (
                      <p className="mt-1 text-xs text-zinc-500 line-clamp-2 dark:text-zinc-400">
                        {String(item.connection)}
                      </p>
                    )}
                    <p className="mt-2 font-[family-name:var(--font-inter)] text-[10px] text-zinc-400">
                      {regions.length} regions
                      {item.blindspot?.isBlindspot && (
                        <span className="ml-2 text-amber-500">⚠️ Blind spot</span>
                      )}
                    </p>
                  </StoryLink>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── LATEST ARTICLES ─── */}
      {recentArticles.length > 0 && (
        <section className="border-t border-black/[0.06] bg-[#f8f7f4] dark:border-white/[0.06] dark:bg-[#0f0f0f]">
          <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
            <div className="flex items-baseline justify-between pb-4">
              <h2 className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Latest analysis
              </h2>
              <Link
                href="/lens"
                className="font-[family-name:var(--font-inter)] text-[11px] text-[#c8922a] hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {recentArticles.map((post) => (
                <Link
                  key={post.slug}
                  href={`/lens/${post.slug}`}
                  className="group block"
                >
                  <article>
                    {post.image && (
                      <div className="aspect-[16/9] overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      </div>
                    )}
                    {post.category && (
                      <div className="mt-3">
                        <CategoryBadge category={post.category} size="xs" />
                      </div>
                    )}
                    <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-sm font-bold leading-snug text-[#0f0f0f] transition-colors group-hover:text-[#c8922a] dark:text-[#f0efec]">
                      {post.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500 line-clamp-2 dark:text-zinc-400">
                      {post.description}
                    </p>
                    <p className="mt-2 font-[family-name:var(--font-inter)] text-[10px] text-zinc-400">
                      {post.readingTime} min read · {post.date}
                    </p>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── BOTTOM CTA ─── */}
      <section className="bg-[#0f0f0f] py-14 md:py-20">
        <div className="mx-auto max-w-lg px-6 text-center">
          <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold leading-tight text-[#f0efec] md:text-2xl">
            Start your day informed, not&nbsp;overwhelmed.
          </h2>
          <p className="mt-3 text-sm text-white/40">
            Every region. Every perspective. 2&nbsp;minutes. Free.
          </p>
          <div className="mt-8">
            <EmailCapture
              showSocialProof={true}
              showYesterdayLink={false}
              source="homepage-bottom"
            />
          </div>
          <p className="mt-10 text-[10px] uppercase tracking-[0.2em] text-white/15">
            News intelligence, not noise.
          </p>
        </div>
      </section>
    </main>
  );
}
