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
import { getPostUrl } from "@/lib/blog";

export const revalidate = 300; // re-fetch scan data every 5 minutes

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
      className={`inline-block font-[family-name:var(--font-inter)] font-semibold uppercase tracking-wider ${
        size === "xs" ? "px-1 py-px text-[8px]" : "px-1.5 py-0.5 text-[9px]"
      }`}
      style={{ color: accent }}
    >
      {label}
    </span>
  );
}

function SectionHeader({ title, link, linkLabel }: { title: string; link?: string; linkLabel?: string }) {
  return (
    <div className="mb-5 border-b border-black/[0.1] pb-3 dark:border-white/[0.1]">
      <div className="flex items-baseline justify-between">
        <h2 className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">
          {title}
        </h2>
        {link && (
          <Link
            href={link}
            className="font-[family-name:var(--font-inter)] text-[11px] text-[#c8922a] hover:underline"
          >
            {linkLabel || "View all →"}
          </Link>
        )}
      </div>
    </div>
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
  const latestPosts = allPosts.slice(0, 12);
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

      {/* ─── HERO CAPTURE ─── */}
      <section className="border-b border-black/[0.06] bg-[#0f0f0f] dark:border-white/[0.06]">
        <div className="mx-auto max-w-3xl px-4 py-6 text-center md:py-8">
          <h1 className="font-[family-name:var(--font-playfair)] text-lg font-bold leading-snug text-[#f0efec] md:text-xl">
            The world&apos;s news in 2&nbsp;minutes
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/50">
            Every morning, we scan news from 60&nbsp;countries in 16&nbsp;languages and send you what matters — free, in one&nbsp;email.
          </p>
          <div className="mx-auto mt-4 max-w-md">
            <EmailCapture
              variant="default"
              showSocialProof={true}
              showYesterdayLink={false}
              source="homepage-hero"
            />
          </div>
        </div>
      </section>

      {/* ─── LEAD STORY + SIDEBAR ─── */}
      <section className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          {allItems.length === 0 ? (
            /* ─── FALLBACK: show latest articles when no scan data ─── */
            <div>
              <SectionHeader title="Latest stories" link="/analysis" linkLabel="All articles →" />
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {latestPosts.slice(0, 9).map((post) => (
                  <Link
                    key={post.slug}
                    href={getPostUrl(post)}
                    className="group block border-b border-black/[0.06] pb-5 dark:border-white/[0.06]"
                  >
                    <span className="font-[family-name:var(--font-inter)] text-[9px] font-semibold uppercase tracking-wider text-[#c8922a]">
                      {CATEGORY_META[post.category]?.label || post.category}
                    </span>
                    <h3 className="mt-1 font-[family-name:var(--font-playfair)] text-base font-bold leading-snug text-[#1a1a1a] group-hover:text-[#c8922a] transition-colors dark:text-[#f0efec]">
                      {post.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {post.description}
                    </p>
                    <time className="mt-2 block text-[11px] text-zinc-400">{post.date}</time>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-0 lg:grid-cols-12">
              {/* LEAD — spans 8 cols */}
              {leadStory && (
                <div className="lg:col-span-8 lg:pr-8">
                  <StoryLink
                    slug={findArticleSlug(leadStory)}
                    className="group block"
                  >
                    {/* Featured image placeholder */}
                    <div className="mb-5 aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800">
                      <div className="flex h-full items-center justify-center">
                        <span className="font-[family-name:var(--font-inter)] text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                          {getCategoryLabel(leadStory.category)}
                        </span>
                      </div>
                    </div>
                    <CategoryBadge category={leadStory.category} />
                    <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-bold leading-tight tracking-tight text-[#0f0f0f] dark:text-[#f0efec] md:text-3xl lg:text-[2.5rem]">
                      <span className="transition-colors group-hover:text-[#c8922a]">
                        {leadStory.headline}
                      </span>
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

                  {/* Below lead: first 2 secondary stories separated by dividers */}
                  {secondaryStories.length > 0 && (
                    <div className="mt-8 grid gap-0 border-t border-black/[0.08] sm:grid-cols-2 dark:border-white/[0.08]">
                      {secondaryStories.slice(0, 2).map((item, i) => {
                        const regions = getRegions(item);
                        return (
                          <StoryLink
                            key={i}
                            slug={findArticleSlug(item)}
                            className={`group block pt-6 pb-6 ${i === 0 ? "sm:pr-6 sm:border-r sm:border-black/[0.08] dark:sm:border-white/[0.08]" : "sm:pl-6"} ${i > 0 ? "border-t border-black/[0.08] sm:border-t-0 dark:border-white/[0.08]" : ""}`}
                          >
                            <CategoryBadge category={item.category} size="xs" />
                            <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-[15px] font-bold leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
                              <span className="transition-colors group-hover:text-[#c8922a]">
                                {item.headline}
                              </span>
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

              {/* RIGHT RAIL — spans 4 cols */}
              <div className="lg:col-span-4 lg:border-l lg:border-black/[0.08] lg:pl-8 dark:lg:border-white/[0.08]">
                {/* Secondary stories list — divider separated */}
                <div className="divide-y divide-black/[0.08] dark:divide-white/[0.08]">
                  {secondaryStories.slice(2, 4).map((item, i) => {
                    const regions = getRegions(item);
                    return (
                      <StoryLink
                        key={i}
                        slug={findArticleSlug(item)}
                        className="group block py-5 first:pt-0"
                      >
                        <CategoryBadge category={item.category} size="xs" />
                        <h3 className="mt-1.5 font-[family-name:var(--font-playfair)] text-sm font-bold leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
                          <span className="transition-colors group-hover:text-[#c8922a]">
                            {item.headline}
                          </span>
                        </h3>
                        {item.connection && (
                          <p className="mt-1 text-xs text-zinc-500 line-clamp-1 dark:text-zinc-400">
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

                {/* Subscribe — subtle text-based */}
                <div className="mt-6 border-t border-black/[0.08] pt-6 dark:border-white/[0.08]">
                  <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                    Newsletter
                  </p>
                  <p className="mt-2 font-[family-name:var(--font-source-serif)] text-sm text-zinc-600 dark:text-zinc-400">
                    The world&apos;s news in 2 minutes. Free.
                  </p>
                  <div className="mt-3">
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
                  <div className="mt-6 border-t border-amber-200/40 pt-5 dark:border-amber-800/20">
                    <h4 className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.15em] text-amber-700 dark:text-amber-400">
                      Coverage blind spots
                    </h4>
                    <p className="mt-1 text-[10px] text-amber-600/70 dark:text-amber-400/60">
                      Stories covered by some regions but missing from others
                    </p>
                    <div className="mt-3 divide-y divide-amber-200/30 dark:divide-amber-800/20">
                      {blindspotStories.slice(0, 3).map((item, i) => (
                        <StoryLink
                          key={i}
                          slug={findArticleSlug(item)}
                          className="group block py-3 first:pt-0"
                        >
                          <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                            <span className="transition-colors group-hover:text-[#c8922a]">
                              {item.headline}
                            </span>
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
        <section className="border-t border-black/[0.08] bg-white dark:border-white/[0.08] dark:bg-[#111]">
          <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
            <SectionHeader title="More from today's scan" link="/world" linkLabel="All stories →" />
            <div className="grid gap-x-0 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
              {moreStories.map((item, i) => {
                const regions = getRegions(item);
                const col = i % 3;
                return (
                  <StoryLink
                    key={i}
                    slug={findArticleSlug(item)}
                    className={`group block border-t border-black/[0.08] py-5 dark:border-white/[0.08] ${
                      col === 1 ? "lg:border-l lg:border-r lg:px-6" : col === 2 ? "lg:pl-6" : "lg:pr-6"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CategoryBadge category={item.category} size="xs" />
                      <RegionDots regions={regions} />
                    </div>
                    <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-sm font-bold leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
                      <span className="transition-colors group-hover:text-[#c8922a]">
                        {item.headline}
                      </span>
                    </h3>
                    {item.connection && (
                      <p className="mt-1 text-xs text-zinc-500 line-clamp-2 dark:text-zinc-400">
                        {String(item.connection)}
                      </p>
                    )}
                    <p className="mt-2 font-[family-name:var(--font-inter)] text-[10px] text-zinc-400">
                      {regions.length} regions
                      {item.blindspot?.isBlindspot && (
                        <span className="ml-2 text-amber-500">Blind spot</span>
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
        <section className="border-t border-black/[0.08] bg-[#f8f7f4] dark:border-white/[0.08] dark:bg-[#0f0f0f]">
          <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
            <SectionHeader title="Latest news" link="/lens" linkLabel="All articles →" />
            <div className="grid gap-x-8 gap-y-0 sm:grid-cols-2 lg:grid-cols-4">
              {recentArticles.map((post) => (
                <Link
                  key={post.slug}
                  href={getPostUrl(post)}
                  className="group block border-t border-black/[0.06] py-5 dark:border-white/[0.06]"
                >
                  <article>
                    {post.image && (
                      <div className="aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    {post.category && (
                      <div className="mt-3">
                        <CategoryBadge category={post.category} size="xs" />
                      </div>
                    )}
                    <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-sm font-bold leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
                      <span className="transition-colors group-hover:text-[#c8922a]">
                        {post.title}
                      </span>
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
            Every region. Every perspective. Every&nbsp;morning.
          </h2>
          <p className="mt-3 text-sm text-white/40">
            The daily briefing, free.
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
