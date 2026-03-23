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

  function postToScanItem(p: typeof allPosts[0]): ScanItem & { slug: string } {
    return {
      headline: p.title,
      connection: p.description,
      regions: [] as string[],
      tags: p.tags || [],
      patterns: [],
      significance: "high" as const,
      category: p.category || "analysis",
      slug: p.slug,
    };
  }
  const leadStory = topStories[0] || (allPosts[0] ? postToScanItem(allPosts[0]) : null);
  const secondaryStories = topStories.length > 1
    ? topStories.slice(1, 5)
    : allPosts.slice(1, 5).map(postToScanItem);
  // Pick 6 articles from different categories for variety
  const lensPosts: typeof allPosts = [];
  const usedCategories = new Set<string>();
  for (const post of allPosts) {
    if (lensPosts.length >= 4) break;
    const cat = post.category || "uncategorised";
    if (!usedCategories.has(cat)) {
      lensPosts.push(post);
      usedCategories.add(cat);
    }
  }
  // If we don't have 4 unique categories, fill with latest
  if (lensPosts.length < 4) {
    for (const post of allPosts) {
      if (lensPosts.length >= 4) break;
      if (!lensPosts.includes(post)) {
        lensPosts.push(post);
      }
    }
  }

  // Build a slug-to-post lookup for images
  const postBySlug: Record<string, (typeof allPosts)[0]> = {};
  for (const post of allPosts) {
    postBySlug[post.slug] = post;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function findArticleSlug(item: any): string | null {
    if (item.slug) return item.slug;
    // Try to find an article whose title shares key words with the headline
    const headlineWords = (item.headline || "").toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    let bestSlug: string | null = null;
    let bestScore = 0;
    // Only check recent articles (first 30 = newest)
    for (const post of allPosts.slice(0, 30)) {
      const titleWords = post.title.toLowerCase().split(/\s+/);
      const overlap = headlineWords.filter((w: string) => titleWords.includes(w)).length;
      if (overlap > bestScore) {
        bestScore = overlap;
        bestSlug = post.slug;
      }
    }
    if (bestScore >= 2) return bestSlug;
    // Fallback to tag matching
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
          <p className="text-center text-xs tracking-wide text-zinc-500 dark:text-zinc-400">
            {dateString}
          </p>

          {/* Region strip — subtle proof of coverage breadth */}
          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] tracking-[0.15em] uppercase text-zinc-400 dark:text-zinc-500">
            <span>US</span>
            <span>·</span>
            <span>Europe</span>
            <span>·</span>
            <span>Middle East</span>
            <span>·</span>
            <span>Asia</span>
            <span>·</span>
            <span>Africa</span>
            <span>·</span>
            <span>Americas</span>
          </div>

          {/* Value proposition */}
          <div className="mt-10 md:mt-14 text-center">
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.12] tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">
              The world&apos;s news<br />in 2&nbsp;minutes.
            </h1>
            <p className="mt-5 font-[family-name:var(--font-source-serif)] text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
              A free daily briefing covering every region and perspective. 2&nbsp;minutes. Every&nbsp;morning.
            </p>
          </div>

          {/* Lead story — proof of concept */}
          {leadStory && (
            <div className="mt-10 md:mt-12 rounded-xl border border-black/[0.06] bg-white/60 p-6 md:p-8 dark:border-white/[0.06] dark:bg-white/[0.03]">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
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
                  <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Covered by:
                  </span>
                  {leadStory.regions
                    .map((r) => normalizeRegion(r))
                    .filter((r, idx, arr) => r !== "global" && arr.indexOf(r) === idx)
                    .map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
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
            <EmailCapture variant="hero" showSocialProof={true} showYesterdayLink={true} source="homepage-hero" />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          SECTION 1.5: TODAY'S BRIEFING — Full Preview
          ════════════════════════════════════════════════════════ */}
      {topStories.length > 0 && (
        <section className="border-t border-black/[0.05] bg-[#f8f7f4] dark:border-white/[0.05] dark:bg-[#141414]">
          <div className="mx-auto max-w-2xl px-6 py-12 md:py-16">

            {/* Briefing header — like an email */}
            <div className="text-center mb-10">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
                Today&apos;s Briefing
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                {dateString}
              </h2>
              <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
                {scan?.items ? `${topStories.length} stories · 7 regions · ` : ""}2 min read
              </p>
            </div>

            {/* Quick Hits — the scannable section */}
            {secondaryStories.length > 0 && (
              <div className="mb-8">
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#c8922a] mb-4">
                  Quick Hits
                </p>
                <div className="space-y-4">
                  {secondaryStories.slice(0, 5).map((item, i) => {
                    const slug = findArticleSlug(item);
                    const content = (
                      <div className="flex gap-3">
                        <span className="mt-0.5 text-lg leading-none text-zinc-300 dark:text-zinc-600 font-[family-name:var(--font-playfair)]">
                          ▸
                        </span>
                        <div>
                          <p className="font-[family-name:var(--font-source-serif)] text-sm leading-relaxed text-[#0f0f0f] dark:text-[#f0efec]">
                            <span className="font-semibold">{item.headline}.</span>
                            {item.connection && (
                              <span className="text-zinc-500 dark:text-zinc-400"> {item.connection}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    );

                    return slug ? (
                      <Link key={i} href={`/lens/${slug}`} className="block hover:opacity-75 transition-opacity">
                        {content}
                      </Link>
                    ) : (
                      <div key={i}>{content}</div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Scan metadata — the framing insight */}
            {scan?.framingNote && (
              <div className="mb-8 pb-8 border-t border-b border-black/[0.08] dark:border-white/[0.08] py-6">
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#c8922a] mb-3">
                  How The World Sees It
                </p>
                <p className="font-[family-name:var(--font-source-serif)] text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 italic">
                  {scan.framingNote}
                </p>
              </div>
            )}

            {/* End of briefing preview — soft gate */}
            <div className="text-center pt-6 border-t border-black/[0.06] dark:border-white/[0.06]">
              <p className="font-[family-name:var(--font-source-serif)] text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                That&apos;s a taste. The full briefing hits your inbox every morning.
              </p>
              <div className="mt-4">
                <Link
                  href="#subscribe"
                  className="inline-flex h-11 items-center rounded-full bg-[#c8922a] px-8 text-sm font-medium text-[#0f0f0f] shadow-[0_2px_12px_rgb(200,146,42,0.3)] hover:bg-[#b17f24] transition-colors"
                >
                  Get the free briefing →
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════
          SECTION 2: FROM THE LENS — Latest Analysis
          ════════════════════════════════════════════════════════ */}
      {lensPosts.length > 0 && (
        <section className="border-t border-black/[0.05] bg-[#f8f7f4] dark:border-white/[0.05] dark:bg-[#0f0f0f]">
          <div className="mx-auto max-w-4xl px-6 py-12 md:py-16">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
              Latest Analysis
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-semibold tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">
              From The Lens
            </h2>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {lensPosts.map((post, idx) => (
                <Link
                  key={post.slug}
                  href={`/lens/${post.slug}`}
                  className="group block overflow-hidden rounded-lg border border-black/[0.06] transition-all hover:border-[#c8922a]/30 hover:shadow-sm dark:border-white/[0.06]"
                >
                  {post.image && post.image !== "/og-image.png" && (
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, 384px"
                        {...(idx < 2 ? { priority: true } : {})}
                      />
                    </div>
                  )}
                  <div className="p-4">
                    {post.category && (
                      <span
                        className="text-xs font-medium tracking-[0.15em] uppercase"
                        style={{ color: getCategoryAccent(post.category) }}
                      >
                        {CATEGORY_META[post.category]?.label || post.category}
                      </span>
                    )}
                    <h3 className="mt-1.5 font-[family-name:var(--font-playfair)] text-base font-semibold leading-snug tracking-tight text-[#0f0f0f] dark:text-[#f0efec] line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                      <RelativeTime
                        date={post.date}
                        fallback={<span>{new Date(post.date).toLocaleDateString("en-NZ", { month: "short", day: "numeric" })}</span>}
                      />
                    </p>
                  </div>
                </Link>
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
      <section className="bg-[#0f0f0f] py-14 md:py-20">
        <div className="mx-auto max-w-xl px-6 text-center">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl font-semibold leading-tight text-[#f0efec]">
            Start your day informed,<br />not&nbsp;overwhelmed.
          </h2>
          <p className="mt-3 text-sm text-[#f0efec]/60 font-[family-name:var(--font-source-serif)]">
            Your daily briefing. Every region. Every perspective. 2&nbsp;minutes. Free.
          </p>
          <div className="mt-8">
            <EmailCapture showSocialProof={true} showYesterdayLink={false} source="homepage-bottom" />
          </div>
        </div>
      </section>
    </main>
  );
}
