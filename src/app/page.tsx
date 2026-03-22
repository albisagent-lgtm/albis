import Link from "next/link";
import Image from "next/image";
import { getTodayScan, type ScanItem } from "@/lib/scan-parser";
import { CATEGORY_META, REGION_LABELS, normalizeRegion, DISPLAY_REGIONS } from "@/lib/scan-types";
import { getAllPosts } from "@/lib/blog";
import { EmailCapture } from "./components/email-capture";
import { RelativeTime } from "./components/relative-time";

export const dynamic = "force-dynamic";

const REGION_FLAGS: Record<string, string> = {
  "western-world": "\u{1F1FA}\u{1F1F8}",
  "europe": "\u{1F1EA}\u{1F1FA}",
  "middle-east": "\u{1F54C}",
  "south-asia": "\u{1F1EE}\u{1F1F3}",
  "east-se-asia": "\u{1F30F}",
  "africa": "\u{1F30D}",
  "latin-americas": "\u{1F30E}",
};

const REGION_SHORT_LABELS: Record<string, string> = {
  "western-world": "US",
  "europe": "EU",
  "middle-east": "MENA",
  "south-asia": "South Asia",
  "east-se-asia": "East Asia",
  "africa": "Africa",
  "latin-americas": "Latin America",
};

export default async function Home() {
  const scan = await getTodayScan();
  const allPosts = getAllPosts();

  // Build article slug lookup
  const articleSlugs: Record<string, string> = {};
  for (const post of allPosts) {
    for (const tag of post.tags || []) {
      articleSlugs[tag.toLowerCase()] = post.slug;
    }
  }

  // Top stories sorted by significance
  const topStories = scan?.items
    ? [...scan.items].sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return (order[a.significance] ?? 1) - (order[b.significance] ?? 1);
      })
    : [];

  const leadStory = topStories[0];
  const secondaryStories = topStories.slice(1, 5);
  const latestPosts = allPosts.slice(0, 3);

  // Build a slug-to-post lookup for images
  const postBySlug: Record<string, (typeof allPosts)[0]> = {};
  for (const post of allPosts) {
    postBySlug[post.slug] = post;
  }

  function findArticleSlug(item: ScanItem): string | null {
    for (const tag of item.tags || []) {
      if (articleSlugs[tag.toLowerCase()]) return articleSlugs[tag.toLowerCase()];
    }
    return null;
  }

  function findArticleImage(item: ScanItem): string | null {
    const slug = findArticleSlug(item);
    if (!slug) return null;
    const post = postBySlug[slug];
    if (post?.image && post.image !== "/og-image.png") return post.image;
    return null;
  }

  function getCategoryAccent(category: string): string {
    return CATEGORY_META[category]?.accent || "#c8922a";
  }

  // Build regional frames for lead story
  const leadFrames: Array<{ flag: string; label: string; frame: string }> = [];
  if (leadStory) {
    for (const displayRegion of DISPLAY_REGIONS) {
      const normalizedLeadRegions = leadStory.regions.map((r) => normalizeRegion(r));
      if (normalizedLeadRegions.includes(displayRegion)) {
        const flag = REGION_FLAGS[displayRegion] || "\u{1F310}";
        const label = REGION_SHORT_LABELS[displayRegion] || REGION_LABELS[displayRegion] || displayRegion;
        // Use connection field as frame
        const frame = leadStory.connection || "";
        if (frame) {
          leadFrames.push({ flag, label, frame });
        }
      }
    }
    // If no region-specific data, show the connection as a general frame
    if (leadFrames.length === 0 && leadStory.connection) {
      // Show up to 3 regions from the story
      const regionsToShow = leadStory.regions
        .map((r) => normalizeRegion(r))
        .filter((r) => r !== "global")
        .slice(0, 3);
      for (const region of regionsToShow) {
        const flag = REGION_FLAGS[region] || "\u{1F310}";
        const label = REGION_SHORT_LABELS[region] || REGION_LABELS[region] || region;
        leadFrames.push({ flag, label, frame: leadStory.connection });
      }
    }
  }

  // Format today's date
  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main>

      {/* ════════════════════════════════════════════════════════
          SECTION 1: GLOBAL PULSE — Above the fold
          ════════════════════════════════════════════════════════ */}
      <section className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
        <div className="mx-auto max-w-3xl px-6 pt-10 pb-12 md:pt-16 md:pb-16">

          {/* Date line */}
          <p className="text-center text-xs tracking-wide text-zinc-400 dark:text-zinc-500">
            {dateString}
          </p>

          {/* Region strip */}
          <div className="mt-4 flex items-center justify-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
            <span>US</span>
            <span className="text-zinc-300 dark:text-zinc-700">&middot;</span>
            <span>EU</span>
            <span className="text-zinc-300 dark:text-zinc-700">&middot;</span>
            <span>MENA</span>
            <span className="text-zinc-300 dark:text-zinc-700">&middot;</span>
            <span>South Asia</span>
            <span className="text-zinc-300 dark:text-zinc-700">&middot;</span>
            <span>East Asia</span>
            <span className="text-zinc-300 dark:text-zinc-700">&middot;</span>
            <span>Africa</span>
            <span className="text-zinc-300 dark:text-zinc-700">&middot;</span>
            <span>Latin America</span>
          </div>

          {/* Value proposition */}
          <div className="mt-10 md:mt-14 text-center">
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.12] tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">
              The world&apos;s news<br />in 2&nbsp;minutes.
            </h1>
            <p className="mt-5 font-[family-name:var(--font-source-serif)] text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
              Scanned from every region, every language, every perspective — so you don&apos;t miss what&nbsp;matters.
            </p>
          </div>

          {/* Lead story — proof of concept */}
          {leadStory && (
            <div className="mt-10 md:mt-12 rounded-xl border border-black/[0.06] bg-white/60 p-6 md:p-8 dark:border-white/[0.06] dark:bg-white/[0.03]">
              <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#c8922a]">
                Today&apos;s lead story
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-xl sm:text-2xl md:text-3xl font-bold leading-[1.15] tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">
                {leadStory.headline}
              </h2>
              {leadStory.connection && (
                <p className="mt-3 font-[family-name:var(--font-source-serif)] text-sm sm:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {leadStory.connection}
                </p>
              )}

              {/* Regional coverage indicator */}
              {leadStory.regions.filter((r) => r !== "global").length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Covered by:
                  </span>
                  {leadStory.regions
                    .map((r) => normalizeRegion(r))
                    .filter((r, idx, arr) => r !== "global" && arr.indexOf(r) === idx)
                    .map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      >
                        {REGION_FLAGS[r]} {REGION_SHORT_LABELS[r] || REGION_LABELS[r] || r}
                      </span>
                    ))}
                </div>
              )}

              {(() => {
                const slug = findArticleSlug(leadStory);
                return slug ? (
                  <Link
                    href={`/lens/${slug}`}
                    className="mt-4 inline-block text-sm font-medium text-[#c8922a] hover:underline"
                  >
                    Read our analysis →
                  </Link>
                ) : null;
              })()}
            </div>
          )}

          {/* Email capture */}
          <div className="mt-10">
            <p className="text-center font-[family-name:var(--font-source-serif)] text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Get your daily briefing every morning. Free.
            </p>
            <EmailCapture variant="hero" showSocialProof={true} showYesterdayLink={true} />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          SECTION 1.5: TODAY'S BRIEFING PREVIEW
          ════════════════════════════════════════════════════════ */}
      {topStories.length > 0 && (
        <section className="border-t border-black/[0.05] bg-[#f8f7f4] dark:border-white/[0.05] dark:bg-[#0f0f0f]">
          <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
                  Today&apos;s Briefing
                </p>
                <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
                  Your 2-minute global scan
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Live
              </span>
            </div>

            <div className="space-y-0">
              {topStories.slice(0, 6).map((item, i) => {
                const slug = findArticleSlug(item);
                const regionCount = item.regions.filter((r) => r !== "global").length;

                const briefingItem = (
                  <div className={`flex gap-4 py-4 ${i < Math.min(topStories.length, 6) - 1 ? "border-b border-black/[0.05] dark:border-white/[0.05]" : ""}`}>
                    <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-[family-name:var(--font-playfair)] text-base md:text-lg font-semibold leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
                        {item.headline}
                      </h3>
                      {item.connection && (
                        <p className="mt-1.5 font-[family-name:var(--font-source-serif)] text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2">
                          {item.connection}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-[10px] text-zinc-400 dark:text-zinc-500">
                        {item.category && (
                          <span
                            className="font-medium tracking-[0.1em] uppercase"
                            style={{ color: getCategoryAccent(item.category) }}
                          >
                            {CATEGORY_META[item.category]?.label || item.category}
                          </span>
                        )}
                        {regionCount > 0 && (
                          <span>{regionCount} region{regionCount !== 1 ? "s" : ""}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );

                return slug ? (
                  <Link key={i} href={`/lens/${slug}`} className="block transition-opacity hover:opacity-75">
                    {briefingItem}
                  </Link>
                ) : (
                  <div key={i}>{briefingItem}</div>
                );
              })}
            </div>

            <div className="mt-8 text-center">
              <p className="font-[family-name:var(--font-source-serif)] text-sm text-zinc-500 dark:text-zinc-400">
                This is what your inbox looks like every morning.
              </p>
              <div className="mt-4">
                <EmailCapture variant="hero" showSocialProof={false} showYesterdayLink={false} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════
          SECTION 2: TODAY'S STORIES
          ════════════════════════════════════════════════════════ */}
      {secondaryStories.length > 0 && (
        <section className="border-t border-black/[0.05] bg-[#f8f7f4] dark:border-white/[0.05] dark:bg-[#0f0f0f]">
          <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
              Today&apos;s Stories
            </p>

            <div className="mt-8 space-y-0">
              {secondaryStories.map((item, i) => {
                const slug = findArticleSlug(item);
                const storyImage = findArticleImage(item);
                const storyContent = (
                  <div className="group flex gap-5 py-6">
                    {/* Image (if article exists with image) */}
                    {storyImage && (
                      <div className="relative hidden sm:block w-28 h-20 md:w-36 md:h-24 flex-shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={storyImage}
                          alt=""
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="144px"
                          unoptimized
                        />
                      </div>
                    )}
                    {/* Text */}
                    <div className="min-w-0">
                      {item.category && (
                        <span
                          className="text-[11px] font-medium tracking-[0.15em] uppercase"
                          style={{ color: getCategoryAccent(item.category) }}
                        >
                          {CATEGORY_META[item.category]?.label || item.category}
                        </span>
                      )}
                      <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-xl md:text-2xl font-semibold leading-snug tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">
                        {item.headline}
                      </h3>
                      {item.connection && (
                        <p className="mt-2 font-[family-name:var(--font-source-serif)] text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                          {item.connection}
                        </p>
                      )}
                    </div>
                  </div>
                );

                return (
                  <div
                    key={i}
                    className={i < secondaryStories.length - 1 ? "border-b border-black/[0.05] dark:border-white/[0.05]" : ""}
                  >
                    {slug ? (
                      <Link href={`/lens/${slug}`} className="block transition-opacity hover:opacity-80">
                        {storyContent}
                      </Link>
                    ) : (
                      storyContent
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════
          SECTION 3: FROM THE LENS — Latest Analysis
          ════════════════════════════════════════════════════════ */}
      {latestPosts.length > 0 && (
        <section className="border-t border-black/[0.05] bg-[#f8f7f4] dark:border-white/[0.05] dark:bg-[#0f0f0f]">
          <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
              Latest Analysis
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-semibold tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">
              From The Lens
            </h2>

            <div className="mt-8 space-y-0">
              {latestPosts.map((post, i) => (
                <div
                  key={post.slug}
                  className={i < latestPosts.length - 1 ? "border-b border-black/[0.05] dark:border-white/[0.05]" : ""}
                >
                  <Link
                    href={`/lens/${post.slug}`}
                    className="group flex gap-5 py-6 transition-opacity hover:opacity-80"
                  >
                    {/* Image */}
                    {post.image && post.image !== "/og-image.png" && (
                      <div className="relative hidden sm:block w-28 h-20 md:w-36 md:h-24 flex-shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={post.image}
                          alt=""
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="144px"
                          unoptimized
                        />
                      </div>
                    )}
                    {/* Text */}
                    <div className="min-w-0">
                      <h3 className="font-[family-name:var(--font-playfair)] text-lg md:text-xl font-semibold leading-snug tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">
                        {post.title}
                      </h3>
                      {post.description && (
                        <p className="mt-2 font-[family-name:var(--font-source-serif)] text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2">
                          {post.description}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                        <RelativeTime date={post.date} />
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link
                href="/lens"
                className="text-sm font-medium text-[#c8922a] hover:text-[#c8922a]/80 transition-colors"
              >
                See all stories &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════
          SECTION 4: FINAL CTA
          ════════════════════════════════════════════════════════ */}
      <section className="bg-[#1a3a5c] py-14 md:py-20">
        <div className="mx-auto max-w-xl px-6 text-center">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-semibold leading-tight text-white">
            Start your day informed,<br />not&nbsp;overwhelmed.
          </h2>
          <p className="mt-3 text-sm text-white/60 font-[family-name:var(--font-source-serif)]">
            Your daily briefing. Every region. Every perspective. 2&nbsp;minutes. Free.
          </p>
          <div className="mt-8">
            <EmailCapture showSocialProof={true} showYesterdayLink={false} />
          </div>
        </div>
      </section>
    </main>
  );
}
