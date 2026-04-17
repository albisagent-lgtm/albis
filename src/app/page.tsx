import Link from "next/link";
import { getSiteSnapshot } from "@/lib/site-snapshot";
import { getAllPosts, getPostUrl, getPostsBySection, getPostSection } from "@/lib/blog";
import type { BlogPost } from "@/lib/blog";
import {
  normalizeRegion,
  detectBlindspots,
  CATEGORY_META,
  REGION_LABELS,
  DISPLAY_REGIONS,
  type ScanItem,
} from "@/lib/scan-types";
import { EmailCapture } from "./components/email-capture";

export const revalidate = 300;

/* ─── Helpers ─── */

const REGION_SHORT: Record<string, string> = {
  "western-world": "US/West",
  europe: "Europe",
  "middle-east": "Middle East",
  "south-asia": "South Asia",
  "east-se-asia": "East Asia",
  africa: "Africa",
  "latin-americas": "Latin America",
};

function getRegions(item: ScanItem) {
  return [
    ...new Set(
      (Array.isArray(item.regions) ? item.regions : [])
        .filter((r) => typeof r === "string" && r !== "global")
        .map((r) => normalizeRegion(r))
    ),
  ];
}

function getCategoryLabel(category: string): string {
  return CATEGORY_META[category]?.label || "News";
}

function getCategoryAccent(category: string): string {
  return CATEGORY_META[category]?.accent || "#71717a";
}

function buildSlugMatcher(allPosts: BlogPost[]) {
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

/* ─── Tiny components ─── */

function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className="inline-block font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.12em]"
      style={{ color: getCategoryAccent(category) }}
    >
      {getCategoryLabel(category)}
    </span>
  );
}

function SectionDivider() {
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6">
      <hr className="border-t border-black/[0.08] dark:border-white/[0.08]" />
    </div>
  );
}

function SectionHeading({
  title,
  link,
  dark = false,
}: {
  title: string;
  link?: string;
  dark?: boolean;
}) {
  return (
    <div className="mb-6 flex items-baseline justify-between border-b-2 border-black/[0.1] pb-3 dark:border-white/[0.1]">
      <h2
        className={`font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.18em] ${
          dark
            ? "text-white/50"
            : "text-zinc-500 dark:text-zinc-400"
        }`}
      >
        {title}
      </h2>
      {link && (
        <Link
          href={link}
          className="font-[family-name:var(--font-inter)] text-[11px] font-medium text-[#c8922a] transition-colors hover:text-[#b17f24]"
        >
          See all &rarr;
        </Link>
      )}
    </div>
  );
}

function ArticleCard({
  post,
  showImage = true,
  showExcerpt = true,
  size = "default",
}: {
  post: BlogPost;
  showImage?: boolean;
  showExcerpt?: boolean;
  size?: "default" | "large" | "compact";
}) {
  const url = getPostUrl(post);
  return (
    <Link href={url} className="group block">
      {showImage && post.image && post.image !== "/og-image.png" && (
        <div
          className={`mb-3 overflow-hidden bg-zinc-100 dark:bg-zinc-800 ${
            size === "large" ? "aspect-[16/9]" : "aspect-[3/2]"
          }`}
        >
          <img
            src={post.image}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </div>
      )}
      {showImage && (!post.image || post.image === "/og-image.png") && (
        <div
          className={`mb-3 overflow-hidden ${
            size === "large" ? "aspect-[16/9]" : "aspect-[3/2]"
          }`}
          style={{
            background: `linear-gradient(135deg, ${getCategoryAccent(post.category)}22, ${getCategoryAccent(post.category)}08)`,
          }}
        >
          <div className="flex h-full items-center justify-center">
            <span className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {getCategoryLabel(post.category)}
            </span>
          </div>
        </div>
      )}
      <CategoryBadge category={post.category} />
      <h3
        className={`mt-1.5 font-[family-name:var(--font-playfair)] font-bold leading-snug text-[#0f0f0f] transition-colors group-hover:text-[#c8922a] dark:text-[#f0efec] ${
          size === "large"
            ? "text-xl md:text-2xl lg:text-[1.75rem]"
            : size === "compact"
              ? "text-sm"
              : "text-base"
        }`}
      >
        {post.title}
      </h3>
      {showExcerpt && post.description && (
        <p
          className={`mt-1.5 leading-relaxed text-zinc-600 dark:text-zinc-400 ${
            size === "large"
              ? "line-clamp-3 text-[15px]"
              : "line-clamp-2 text-sm"
          }`}
        >
          {post.description}
        </p>
      )}
      <p className="mt-2 font-[family-name:var(--font-inter)] text-[11px] text-zinc-400">
        {post.readingTime} min read
      </p>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════
   HOME PAGE
   ═══════════════════════════════════════════════════════════ */
export default async function Home() {
  // Single read replaces getTodayScan() + a second admin read for briefings.
  // See docs/Cloudflare_Execution_Plan.md § D for the snapshot contract and
  // supabase/migrations/20260416_site_snapshot.sql for the row shape.
  const snapshot = await getSiteSnapshot();
  const allPosts = getAllPosts();
  const findArticleSlug = buildSlugMatcher(allPosts);

  // Scan items for blind spot section
  const allItems = snapshot.items.length > 0
    ? detectBlindspots(
        [...snapshot.items]
          .filter((item) => item && typeof item.headline === "string")
          .sort((a, b) => {
            const order = { high: 0, medium: 1, low: 2 };
            return (order[a.significance] ?? 1) - (order[b.significance] ?? 1);
          })
      )
    : [];
  const blindspotStories = allItems.filter((i) => i.blindspot?.isBlindspot);

  // Section posts
  const worldPosts = getPostsBySection("world");
  const moneyPosts = getPostsBySection("money");
  const techPosts = getPostsBySection("tech");
  const climatePosts = getPostsBySection("climate");
  const lifePosts = getPostsBySection("life-systems");
  const perspectivesPosts = getPostsBySection("perspectives");

  // Today's top stories: latest 5
  const topStories = allPosts.slice(0, 5);
  const leadStory = topStories[0];
  const secondaryStories = topStories.slice(1, 5);

  // "What your media missed" — blindspot scan items OR perspectives posts as fallback
  const missedStories =
    blindspotStories.length > 0
      ? blindspotStories.slice(0, 5)
      : null;
  const missedArticles =
    !missedStories
      ? perspectivesPosts.slice(0, 5)
      : null;

  // PGI data
  const pgiItem = allItems.find(
    (i) => i.perception_gap && i.perception_gap > 0
  );

  // Briefing taster — reconstructed from snapshot fields so the JSX below
  // (existing shape: { title, top_stories, story_count, date }) is unchanged.
  const briefing: { title: string; top_stories: Array<{ region: string; headline: string }>; story_count: number; date: string } | null =
    snapshot.briefingTitle && snapshot.briefingDate
      ? {
          title: snapshot.briefingTitle,
          top_stories: snapshot.briefingTopStories,
          story_count: snapshot.briefingStoryCount ?? 0,
          date: snapshot.briefingDate,
        }
      : null;

  // Date
  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const todayISO = today.toISOString().split("T")[0];

  return (
    <main className="min-h-screen">
      {/* ═══════════════════════════════════════════════════════
          1. HERO — EMAIL CAPTURE
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
        <div className="mx-auto max-w-3xl px-4 pb-14 pt-16 text-center md:pb-20 md:pt-24">
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold leading-[1.15] tracking-tight text-[#0f0f0f] dark:text-[#f0efec] md:text-[2.75rem] lg:text-5xl">
            We scan 60&nbsp;countries every morning so you don&apos;t miss what&nbsp;matters.
          </h1>
          <p className="mx-auto mt-5 max-w-lg font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-500 dark:text-zinc-400 md:text-xl">
            The world&apos;s news in 2&nbsp;minutes. Free.
          </p>
          <div className="mx-auto mt-8 max-w-lg">
            <EmailCapture
              variant="hero"
              showSocialProof={false}
              showYesterdayLink={false}
              source="homepage-hero"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          BRIEFING TASTER — preview of what subscribers get.
          Gated on snapshot.hasBriefing so the briefing renders whenever
          a briefing row exists, independent of scan presence.
          Empty-state: calm "being prepared" message when no briefing yet.
          See src/lib/site-snapshot.ts.
          ═══════════════════════════════════════════════════════ */}
      {!snapshot.hasBriefing ? (
        <section className="border-t border-black/[0.06] bg-[#f5f3ee] dark:border-white/[0.06] dark:bg-[#141414]">
          <div className="mx-auto max-w-2xl px-4 py-10 text-center md:px-6 md:py-12">
            <p className="font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-zinc-500 dark:text-zinc-400 md:text-lg">
              Today&apos;s briefing is being prepared.
            </p>
          </div>
        </section>
      ) : briefing && briefing.top_stories && briefing.top_stories.length > 0 ? (
        <section className="border-t border-black/[0.06] bg-[#f5f3ee] dark:border-white/[0.06] dark:bg-[#141414]">
          <div className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-12">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-lg">📧</span>
              <h2 className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.15em] text-[#c8922a]">
                Today&apos;s Briefing Preview
              </h2>
            </div>
            <p className="mb-6 font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-[#0f0f0f] dark:text-[#e8e6e1] md:text-lg">
              {briefing.title}
            </p>
            <ol className="space-y-3 border-l-2 border-[#c8922a]/30 pl-4">
              {briefing.top_stories.slice(0, 5).map((story, i) => (
                <li key={i} className="font-[family-name:var(--font-source-serif)] text-sm leading-snug text-zinc-700 dark:text-zinc-300">
                  <span className="mr-2 font-[family-name:var(--font-inter)] text-[10px] font-semibold uppercase tracking-wider text-[#c8922a]">
                    {story.region}
                  </span>
                  {story.headline}
                </li>
              ))}
            </ol>
            <div className="mt-6 text-center">
              <p className="mb-3 font-[family-name:var(--font-inter)] text-xs text-zinc-400">
                Delivered free every morning
              </p>
              <EmailCapture
                showSocialProof={false}
                variant="default"
                source="homepage-briefing-taster"
              />
            </div>
          </div>
        </section>
      ) : null}

      <SectionDivider />

      {/* ═══════════════════════════════════════════════════════
          2. TODAY'S TOP STORIES
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
          {/* Date header */}
          <div className="mb-8 text-center">
            <time className="font-[family-name:var(--font-inter)] text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              {dateString}
            </time>
            <div className="mx-auto mt-3 h-px w-16 bg-[#c8922a]/40" />
          </div>

          {leadStory ? (
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
              {/* Lead story — 7 cols */}
              <div className="lg:col-span-7">
                <ArticleCard post={leadStory} size="large" />
              </div>

              {/* 4 secondary stories — 5 cols, 2x2 grid */}
              <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:col-span-5">
                {secondaryStories.map((post) => (
                  <ArticleCard
                    key={post.slug}
                    post={post}
                    size="compact"
                  />
                ))}
              </div>
            </div>
          ) : (
            /* Fallback when no posts */
            <p className="py-20 text-center font-[family-name:var(--font-source-serif)] text-zinc-400">
              Stories loading&hellip;
            </p>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          3. WHAT YOUR MEDIA MISSED (dark block)
          ═══════════════════════════════════════════════════════ */}
      <section className="border-y-2 border-[#c8922a]/20 bg-[#0f0f0f] dark:border-[#c8922a]/30">
        <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
          <div className="mb-8">
            <div className="mb-1 h-0.5 w-12 bg-[#c8922a]" />
            <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-bold text-white md:text-3xl">
              What Your Media Missed
            </h2>
            <p className="mt-2 font-[family-name:var(--font-source-serif)] text-sm leading-relaxed text-white/50 md:text-base">
              Stories from our scan that got zero English-language coverage
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {missedStories
              ? missedStories.map((item, i) => {
                  const slug = findArticleSlug(item);
                  const regions = getRegions(item);
                  const coveredLangs = regions
                    .map((r) => REGION_LABELS[r] || r)
                    .slice(0, 3);
                  const href = slug ? getPostUrl({ slug, category: item.category }) : null;
                  const Wrapper = href ? Link : "div";
                  const wrapperProps = href
                    ? { href, className: "group block rounded-lg border border-white/[0.06] bg-white/[0.03] p-5 transition-colors hover:border-[#c8922a]/30 hover:bg-white/[0.05]" }
                    : { className: "block rounded-lg border border-white/[0.06] bg-white/[0.03] p-5" };
                  return (
                    // @ts-expect-error - dynamic wrapper
                    <Wrapper key={i} {...wrapperProps}>
                      <span
                        className="inline-block font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.12em]"
                        style={{ color: getCategoryAccent(item.category) }}
                      >
                        {getCategoryLabel(item.category)}
                      </span>
                      <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-[15px] font-bold leading-snug text-white transition-colors group-hover:text-[#c8922a]">
                        {item.headline}
                      </h3>
                      {item.connection && (
                        <p className="mt-2 text-sm leading-relaxed text-white/40 line-clamp-2">
                          {String(item.connection)}
                        </p>
                      )}
                      {coveredLangs.length > 0 && (
                        <p className="mt-3 font-[family-name:var(--font-inter)] text-[10px] uppercase tracking-wider text-[#c8922a]/70">
                          Covered in: {coveredLangs.join(", ")}
                        </p>
                      )}
                    </Wrapper>
                  );
                })
              : missedArticles?.map((post) => (
                  <Link
                    key={post.slug}
                    href={getPostUrl(post)}
                    className="group block rounded-lg border border-white/[0.06] bg-white/[0.03] p-5 transition-colors hover:border-[#c8922a]/30 hover:bg-white/[0.05]"
                  >
                    <CategoryBadge category={post.category} />
                    <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-[15px] font-bold leading-snug text-white transition-colors group-hover:text-[#c8922a]">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/40 line-clamp-2">
                      {post.description}
                    </p>
                    <p className="mt-3 font-[family-name:var(--font-inter)] text-[11px] text-white/30">
                      {post.readingTime} min read
                    </p>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          4. SECTION RIVER
          ═══════════════════════════════════════════════════════ */}

      {/* ─── WORLD: 3 cards in a row ─── */}
      {worldPosts.length > 0 && (
        <section className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
            <SectionHeading title="World" link="/world" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {worldPosts.slice(0, 3).map((post) => (
                <ArticleCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      <SectionDivider />

      {/* ─── MONEY: 1 featured large + 2 small stacked ─── */}
      {moneyPosts.length > 0 && (
        <section className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
            <SectionHeading title="Money" link="/money" />
            <div className="grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <ArticleCard post={moneyPosts[0]} size="large" />
              </div>
              {moneyPosts.length > 1 && (
                <div className="flex flex-col gap-8 lg:col-span-5 lg:border-l lg:border-black/[0.08] lg:pl-8 dark:lg:border-white/[0.08]">
                  {moneyPosts.slice(1, 3).map((post) => (
                    <ArticleCard
                      key={post.slug}
                      post={post}
                      size="compact"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <SectionDivider />

      {/* ─── TECH: removed from homepage — accessible via nav ─── */}

      <SectionDivider />

      {/* ─── CLIMATE + LIFE SYSTEMS: side by side ─── */}
      {(climatePosts.length > 0 || lifePosts.length > 0) && (
        <section className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              {/* Climate */}
              {climatePosts.length > 0 && (
                <div>
                  <SectionHeading title="Climate" link="/climate" />
                  <div className="grid gap-6 sm:grid-cols-2">
                    {climatePosts.slice(0, 2).map((post) => (
                      <ArticleCard
                        key={post.slug}
                        post={post}
                        size="compact"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Life Systems */}
              {lifePosts.length > 0 && (
                <div className="lg:border-l lg:border-black/[0.08] lg:pl-12 dark:lg:border-white/[0.08]">
                  <SectionHeading title="Life Systems" link="/life-systems" />
                  <div className="grid gap-6 sm:grid-cols-2">
                    {lifePosts.slice(0, 2).map((post) => (
                      <ArticleCard
                        key={post.slug}
                        post={post}
                        size="compact"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <SectionDivider />

      {/* ─── PERSPECTIVES: full-width featured piece ─── */}
      {perspectivesPosts.length > 0 && (
        <section className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
            <SectionHeading title="Perspectives" link="/perspectives" />
            <Link
              href={getPostUrl(perspectivesPosts[0])}
              className="group block"
            >
              <div className="grid items-center gap-6 lg:grid-cols-12 lg:gap-10">
                {perspectivesPosts[0].image &&
                  perspectivesPosts[0].image !== "/og-image.png" && (
                    <div className="overflow-hidden lg:col-span-5">
                      <div className="aspect-[3/2] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        <img
                          src={perspectivesPosts[0].image}
                          alt={perspectivesPosts[0].title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  )}
                <div
                  className={
                    perspectivesPosts[0].image &&
                    perspectivesPosts[0].image !== "/og-image.png"
                      ? "lg:col-span-7"
                      : "lg:col-span-12"
                  }
                >
                  <CategoryBadge category={perspectivesPosts[0].category} />
                  <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-xl font-bold leading-snug text-[#0f0f0f] transition-colors group-hover:text-[#c8922a] dark:text-[#f0efec] md:text-2xl lg:text-3xl">
                    {perspectivesPosts[0].title}
                  </h3>
                  <p className="mt-3 max-w-2xl font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-lg line-clamp-4">
                    {perspectivesPosts[0].description}
                  </p>
                  <p className="mt-3 font-[family-name:var(--font-inter)] text-[11px] text-zinc-400">
                    {perspectivesPosts[0].readingTime} min read
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          5. MID-PAGE EMAIL CAPTURE
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-[#c8922a]/[0.06] to-[#c8922a]/[0.02] dark:from-[#c8922a]/[0.08] dark:to-transparent">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center md:py-24">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#0f0f0f] dark:text-[#f0efec] md:text-3xl">
            Like what you see?
          </h2>
          <p className="mx-auto mt-4 max-w-md font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-zinc-500 dark:text-zinc-400 md:text-lg">
            Get this delivered every morning. 2&nbsp;minutes. 60&nbsp;countries. Free.
          </p>
          <div className="mx-auto mt-8 max-w-lg">
            <EmailCapture
              variant="hero"
              showSocialProof={false}
              showYesterdayLink={false}
              source="homepage-mid"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          6. TODAY'S PERCEPTION GAP (compact card)
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
        <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
          <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#161616]">
            <div className="border-b border-black/[0.06] px-6 py-4 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#c8922a]" />
                <h3 className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400">
                  Today&apos;s Perception Gap
                </h3>
              </div>
            </div>
            <div className="p-6">
              {pgiItem ? (
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-[#0f0f0f] dark:text-[#f0efec]">
                      {typeof pgiItem.perception_gap === "number"
                        ? pgiItem.perception_gap.toFixed(1)
                        : "—"}
                    </span>
                    <span className="font-[family-name:var(--font-inter)] text-sm text-zinc-400">
                      PGI score
                    </span>
                  </div>
                  <h4 className="mt-3 font-[family-name:var(--font-playfair)] text-base font-bold text-[#0f0f0f] dark:text-[#f0efec]">
                    {pgiItem.headline}
                  </h4>
                  {pgiItem.connection && (
                    <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                      {String(pgiItem.connection)}
                    </p>
                  )}
                  {getRegions(pgiItem).length > 0 && (
                    <p className="mt-3 font-[family-name:var(--font-inter)] text-[10px] uppercase tracking-wider text-zinc-400">
                      Divergent framing:{" "}
                      {getRegions(pgiItem)
                        .map((r) => REGION_LABELS[r] || r)
                        .slice(0, 3)
                        .join(" vs ")}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-[#0f0f0f] dark:text-[#f0efec]">
                      7.2
                    </span>
                    <span className="font-[family-name:var(--font-inter)] text-sm text-zinc-400">
                      PGI score
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                    The Perception Gap Index measures how differently regions
                    frame the same story. Higher = more divergence.
                  </p>
                </div>
              )}
              <Link
                href={`/indexes/pgi/${todayISO}`}
                className="mt-4 inline-block font-[family-name:var(--font-inter)] text-[11px] font-medium text-[#c8922a] transition-colors hover:text-[#b17f24]"
              >
                Explore today&apos;s PGI &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          7. FOOTER CTA + FOOTER
          ═══════════════════════════════════════════════════════ */}
      <section className="bg-[#0f0f0f]">
        <div className="mx-auto max-w-lg px-6 py-20 text-center md:py-28">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold leading-tight text-[#f0efec] md:text-3xl">
            News intelligence, not&nbsp;noise.
          </h2>
          <p className="mt-4 font-[family-name:var(--font-source-serif)] text-base text-white/40">
            Every region. Every perspective. Every&nbsp;morning.
          </p>
          <div className="mt-8">
            <EmailCapture
              showSocialProof={false}
              showYesterdayLink={false}
              source="homepage-footer"
            />
          </div>
          <nav className="mt-14 flex items-center justify-center gap-6 font-[family-name:var(--font-inter)] text-[11px] tracking-wider text-white/20">
            <Link
              href="/about"
              className="transition-colors hover:text-white/40"
            >
              About
            </Link>
            <span className="text-white/10">&middot;</span>
            <Link
              href="/terms"
              className="transition-colors hover:text-white/40"
            >
              Terms
            </Link>
            <span className="text-white/10">&middot;</span>
            <Link
              href="/privacy"
              className="transition-colors hover:text-white/40"
            >
              Privacy
            </Link>
          </nav>
        </div>
      </section>
    </main>
  );
}
