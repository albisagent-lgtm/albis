import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/lib/blog";
import { getPostUrl, getPostSection } from "@/lib/blog";
import { markdownToHtml } from "@/lib/markdown";
import { EmailCapture } from "@/app/components/email-capture";
import { getRelatedPosts } from "@/lib/internal-links";
import { matchTagToTopic } from "@/lib/topics";
import { Breadcrumbs } from "@/app/components/breadcrumbs";
import { SourceTransparency } from "@/app/components/source-transparency";
import { RelativeTime } from "@/app/components/relative-time";
import { RegionBar } from "@/app/components/region-bar";
import { ReadingProgress } from "@/app/components/reading-progress";
import { normalizeRegion, CATEGORY_META } from "@/lib/scan-types";
import { ShareButtons } from "@/app/components/share-buttons";
import { getPostBySlug } from "@/lib/blog";

const SECTION_LABELS: Record<string, string> = {
  world: "World",
  politics: "Politics",
  business: "Business",
  technology: "Technology",
  health: "Health",
  science: "Science",
  analysis: "Analysis",
};

function getCategoryDisplay(category: string): { label: string; accent: string } {
  if (CATEGORY_META[category]) {
    return { label: CATEGORY_META[category].label, accent: CATEGORY_META[category].accent };
  }
  const NAV_MAP: Record<string, string[]> = {
    world: ["current-events", "geopolitics", "conflict"],
    politics: ["governance"],
    business: ["economic-flows"],
    technology: ["tech-ai", "cyber-info-warfare"],
    health: ["health"],
    science: ["science-space"],
  };
  for (const [navCat, scanCats] of Object.entries(NAV_MAP)) {
    if (scanCats.includes(category)) {
      return { label: navCat.charAt(0).toUpperCase() + navCat.slice(1), accent: CATEGORY_META[scanCats[0]]?.accent || "#c8922a" };
    }
  }
  return { label: category, accent: "#c8922a" };
}

export function ArticlePage({ post }: { post: BlogPost }) {
  const html = markdownToHtml(post.content);
  const section = getPostSection(post.category);
  const sectionLabel = SECTION_LABELS[section] || "Analysis";
  const url = `https://www.albis.news${getPostUrl(post)}`;

  const relatedPostMeta = getRelatedPosts(post.tags, post.slug, 3);
  const relatedPosts = relatedPostMeta
    .map((rp) => getPostBySlug(rp.slug))
    .filter((p): p is NonNullable<typeof p> => p !== null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pAny = post as any;
  const regionsFound: string[] = Array.isArray(pAny.regions_found)
    ? pAny.regions_found.map((r: string) => normalizeRegion(r))
    : [];
  const regionsAbsent: string[] = Array.isArray(pAny.regions_absent)
    ? pAny.regions_absent.map((r: string) => normalizeRegion(r))
    : [];
  const regionCount = regionsFound.length;

  const cat = getCategoryDisplay(post.category);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.description,
    image: post.image.startsWith("http") ? post.image : `https://www.albis.news${post.image}`,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": post.author === "Albis" || post.author === "Harry Wenham" ? "Organization" : "Person", name: post.author || "Albis", url: "https://www.albis.news/about" },
    publisher: {
      "@type": "Organization",
      name: "Albis",
      url: "https://www.albis.news",
      logo: { "@type": "ImageObject", url: "https://www.albis.news/icon-512.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(post.sources.length > 0 ? {
      citation: post.sources.filter(s => s.url).map(s => ({
        "@type": "WebPage",
        name: s.name,
        url: s.url,
      })),
    } : {}),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const faqs = (post as any).faqs;
  const faqJsonLd = faqs && faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq: { q: string; a: string }) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  } : null;

  return (
    <>
      <ReadingProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <article className="mx-auto max-w-[680px] px-5 py-8 md:px-6 md:py-20">
        {/* Header */}
        <header className="mb-10 md:mb-12">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: sectionLabel, href: `/${section}` },
              { label: post.title.length > 50 ? post.title.slice(0, 50) + "\u2026" : post.title },
            ]}
          />

          {/* Category tag */}
          <div className="mt-6">
            <Link
              href={`/${section}`}
              className="inline-block rounded-full px-3 py-1 font-[family-name:var(--font-inter)] text-[11px] font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: cat.accent }}
            >
              {cat.label}
            </Link>
          </div>

          {/* Headline */}
          <h1 className="mt-5 font-[family-name:var(--font-playfair)] text-[1.65rem] font-bold leading-[1.2] tracking-tight sm:text-[2rem] md:text-[2.5rem] lg:text-[2.75rem]">
            {post.title}
          </h1>

          {/* Description */}
          <p className="mt-3 font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-zinc-500 sm:mt-4 sm:text-lg dark:text-zinc-400">
            {post.description}
          </p>

          {/* Meta line */}
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-[family-name:var(--font-inter)] text-[13px] text-zinc-500 sm:mt-6 sm:text-sm dark:text-zinc-400">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {post.author || "Albis"}
            </span>
            <span className="text-zinc-300 dark:text-zinc-600">&middot;</span>
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <RelativeTime date={post.date} prefix="· " className="text-sm text-zinc-400 dark:text-zinc-500" />
            <span className="text-zinc-300 dark:text-zinc-600">&middot;</span>
            <span>{post.readingTime} min read</span>
            {regionCount > 0 && (
              <>
                <span className="text-zinc-300 dark:text-zinc-600">&middot;</span>
                <span className="font-medium text-[#c8922a]">
                  Scanned from {regionCount} region{regionCount !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>

          {/* Region bar */}
          {regionsFound.length > 0 && (
            <div className="mt-5">
              <RegionBar regions={regionsFound} />
              {regionsAbsent.length > 0 && (
                <p className="mt-1.5 font-[family-name:var(--font-inter)] text-[11px] text-zinc-400 dark:text-zinc-500">
                  Not covered in {regionsAbsent.length} region{regionsAbsent.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}

          {/* Featured image */}
          {post.image && post.image !== "/og-image.png" && (
            <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 680px"
                priority
                unoptimized
              />
            </div>
          )}

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {post.tags.slice(0, 5).map((tag) => {
                const match = matchTagToTopic(tag);
                if (match) {
                  return (
                    <Link
                      key={tag}
                      href={`/topics/${match.slug}`}
                      className="inline-flex items-center rounded-full border border-black/[0.07] px-2.5 py-1 text-xs font-medium text-zinc-600 hover:border-[#c8922a]/30 hover:text-[#c8922a] transition-colors dark:border-white/[0.06] dark:text-zinc-400 dark:hover:border-[#c8922a]/30 dark:hover:text-[#c8922a]"
                    >
                      {tag}
                    </Link>
                  );
                }
                return (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-black/[0.07] px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-white/[0.06] dark:text-zinc-400"
                  >
                    {tag}
                  </span>
                );
              })}
              {post.tags.length > 5 && (
                <span className="inline-flex items-center rounded-full border border-black/[0.07] px-2.5 py-1 text-xs font-medium text-zinc-500 dark:border-white/[0.06] dark:text-zinc-500">
                  +{post.tags.length - 5} more
                </span>
              )}
            </div>
          )}
        </header>

        {/* Article body */}
        <div
          className="blog-prose font-[family-name:var(--font-source-serif)] text-[1.0625rem] leading-[1.8] text-[#1a1a1a] dark:text-[#d4d3d0]"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Source Transparency */}
        <SourceTransparency sources={post.sources} confidence={post.confidence} />

        {/* How regions covered this */}
        {(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const p = post as any;
          const frames = p.region_frames as Record<string, string> | undefined;
          const found: string[] = Array.isArray(p.regions_found) ? p.regions_found : [];
          const absent: string[] = Array.isArray(p.regions_absent) ? p.regions_absent : [];

          if (!frames || Object.keys(frames).length === 0) return null;

          const FRAME_DISPLAY: Record<string, { flag: string; label: string }> = {
            us: { flag: "\u{1F1FA}\u{1F1F8}", label: "North America" },
            eu: { flag: "\u{1F1EA}\u{1F1FA}", label: "Europe" },
            middle_east: { flag: "\u{1F54C}", label: "Middle East" },
            south_asia: { flag: "\u{1F1EE}\u{1F1F3}", label: "South Asia" },
            asia_pacific: { flag: "\u{1F30F}", label: "East Asia & Pacific" },
            africa: { flag: "\u{1F30D}", label: "Africa" },
            latam: { flag: "\u{1F30E}", label: "Latin America" },
          };

          const absentWithoutFrame = absent.filter((r) => !frames[r]);

          return (
            <section className="mt-14 rounded-xl border border-black/[0.06] bg-black/[0.015] p-6 md:p-8 dark:border-white/[0.06] dark:bg-white/[0.02]">
              <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] md:text-2xl">
                How regions covered this
              </h2>
              <p className="mt-1.5 font-[family-name:var(--font-inter)] text-sm text-zinc-400 dark:text-zinc-500">
                The same story, framed differently around the world
              </p>
              <div className="mt-5 space-y-0 divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                {Object.entries(frames).map(([region, frame]) => {
                  const display = FRAME_DISPLAY[region];
                  return (
                    <div key={region} className="flex items-start gap-3.5 py-4">
                      <span className="mt-0.5 text-lg leading-none">{display?.flag || "\u{1F310}"}</span>
                      <div className="min-w-0 flex-1">
                        <span className="font-[family-name:var(--font-inter)] text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          {display?.label || region}
                        </span>
                        <p className="mt-1 font-[family-name:var(--font-source-serif)] text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                          {frame}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {absentWithoutFrame.map((region) => {
                  const display = FRAME_DISPLAY[region];
                  return (
                    <div key={region} className="flex items-start gap-3.5 py-4 opacity-50">
                      <span className="mt-0.5 text-lg leading-none grayscale">{display?.flag || "\u{1F310}"}</span>
                      <div className="min-w-0 flex-1">
                        <span className="font-[family-name:var(--font-inter)] text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          {display?.label || region}
                        </span>
                        <p className="mt-1 font-[family-name:var(--font-source-serif)] text-sm leading-relaxed text-zinc-400 italic dark:text-zinc-500">
                          Not covered in this region
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Region bar */}
              <div className="mt-5 border-t border-black/[0.06] pt-4 dark:border-white/[0.06]">
                <p className="mb-2 font-[family-name:var(--font-inter)] text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Coverage map
                </p>
                <RegionBar regions={found.map((r: string) => normalizeRegion(r))} />
              </div>
            </section>
          );
        })()}

        {/* Share */}
        <div className="mt-10 flex items-center justify-between border-t border-black/[0.06] pt-6 dark:border-white/[0.06]">
          <p className="font-[family-name:var(--font-inter)] text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Share this story
          </p>
          <ShareButtons url={url} title={post.title} />
        </div>

        {/* Email capture */}
        <div className="mt-12 rounded-2xl border border-[#c8922a]/20 bg-[#f8f7f4] p-8 text-center dark:border-[#c8922a]/20 dark:bg-white/[0.03]">
          <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-[#c8922a] md:text-2xl">
            Get the daily briefing free
          </h3>
          <p className="mx-auto mt-3 max-w-md font-[family-name:var(--font-source-serif)] text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            News from 7 regions and 16 languages, delivered to your inbox every morning.
          </p>
          <div className="mt-6">
            <EmailCapture variant="hero" showSocialProof={false} showYesterdayLink={false} source="article-bottom" />
          </div>
        </div>

        {/* Related Stories */}
        {relatedPosts.length > 0 && (
          <section className="mt-14">
            <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] md:text-2xl">
              Related Stories
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {relatedPosts.slice(0, 3).map((rp) => {
                const rpCat = getCategoryDisplay(rp.category);
                return (
                  <Link
                    key={rp.slug}
                    href={getPostUrl(rp)}
                    className="group block overflow-hidden border-t border-black/[0.08] bg-white pt-4 dark:border-white/[0.08] dark:bg-transparent"
                  >
                    {rp.image && rp.image !== "/og-image.png" && (
                      <div className="relative aspect-[16/9] w-full overflow-hidden">
                        <Image
                          src={rp.image}
                          alt={rp.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 240px"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="pt-3">
                      <span
                        className="inline-block font-[family-name:var(--font-inter)] text-[9px] font-semibold uppercase tracking-wider"
                        style={{ color: rpCat.accent }}
                      >
                        {rpCat.label}
                      </span>
                      <h3 className="mt-1.5 font-[family-name:var(--font-playfair)] text-sm font-bold leading-snug text-[#0f0f0f] dark:text-[#f0efec] line-clamp-2">
                        <span className="transition-colors group-hover:text-[#c8922a]">{rp.title}</span>
                      </h3>
                      <div className="mt-2 flex items-center gap-2 font-[family-name:var(--font-inter)] text-[11px] text-zinc-400 dark:text-zinc-500">
                        <span>{rp.readingTime} min read</span>
                        <span>&middot;</span>
                        <time>
                          {new Date(rp.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </time>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Back link */}
        <div className="mt-12 text-center">
          <Link
            href={`/${section}`}
            className="font-[family-name:var(--font-inter)] text-sm font-medium text-[#c8922a] hover:underline"
          >
            &larr; More {sectionLabel.toLowerCase()} stories
          </Link>
        </div>
      </article>
    </>
  );
}

/* ─── Metadata generator (reusable by all routes) ─── */

export function generateArticleMetadata(post: BlogPost) {
  const url = `https://www.albis.news${getPostUrl(post)}`;
  const ogImageUrl = post.image && post.image !== "/og-image.png"
    ? `https://www.albis.news${post.image}`
    : `https://www.albis.news/og-image.png`;

  const CATEGORIES: Record<string, string> = {
    analysis: "Analysis",
    perspectives: "Perspectives",
    "media-literacy": "Media Literacy",
    data: "Data",
    breaking: "Breaking",
    research: "Research",
  };

  return {
    title: post.title,
    description: post.description,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article" as const,
      publishedTime: isNaN(new Date(post.date).getTime()) ? undefined : new Date(post.date).toISOString(),
      authors: [post.author],
      section: CATEGORIES[post.category] || "Analysis",
      tags: post.tags,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: post.title,
      description: post.description,
      images: [ogImageUrl],
    },
    alternates: { canonical: url },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...((post as any).noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
