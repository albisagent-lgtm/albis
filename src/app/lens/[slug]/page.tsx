import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllSlugs, getPostBySlug } from "@/lib/blog";
import { markdownToHtml } from "@/lib/markdown";
import { EmailCapture } from "@/app/components/email-capture";
import { StickyCTA } from "@/app/components/sticky-cta";
import { getRelatedPosts, getRelatedPages } from "@/lib/internal-links";
import { matchTagToTopic } from "@/lib/topics";
import { Breadcrumbs } from "@/app/components/breadcrumbs";
import { SourceTransparency } from "@/app/components/source-transparency";
import { RelativeTime } from "@/app/components/relative-time";
import { CATEGORIES } from "@/lib/categories";
import { getAllPosts } from "@/lib/blog";
import { ExitIntentModal } from "@/app/components/exit-intent-modal";
import Image from "next/image";
import { PerceptionGapVisual } from "@/app/components/perception-gap-visual";
import { CoverageGapVisual } from "@/app/components/coverage-gap-visual";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  const url = `https://www.albis.news/lens/${slug}`;
  return {
    title: post.title,
    description: post.description,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      section: CATEGORIES[post.category as keyof typeof CATEGORIES] || "Analysis",
      tags: post.tags,
      images: [{ url: post.image, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [post.image],
    },
    alternates: { canonical: url },
  };
}

export default async function LensArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const html = markdownToHtml(post.content);
  const url = `https://www.albis.news/lens/${slug}`;

  const relatedPosts = getRelatedPosts(post.tags, slug, 3);
  const relatedPages = getRelatedPages(post.tags);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.description,
    image: post.image.startsWith("http") ? post.image : `https://www.albis.news${post.image}`,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Person", name: post.author, url: "https://www.albis.news/about", jobTitle: "Correspondent" },
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-2xl px-6 py-16 md:py-24">
        {/* Header */}
        <header className="mb-12">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "The Lens", href: "/lens" },
              { label: CATEGORIES[post.category as keyof typeof CATEGORIES] || "Analysis", href: `/lens?category=${post.category}` },
              { label: post.title.length > 50 ? post.title.slice(0, 50) + "…" : post.title },
            ]}
          />
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400 dark:text-zinc-500">
            <time>
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <RelativeTime date={post.date} prefix="· " className="text-sm text-zinc-400 dark:text-zinc-500" />
            <span>&middot;</span>
            <span>{post.readingTime} min read</span>
          </div>
          <h1 className="mt-6 font-[family-name:var(--font-playfair)] text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-[2.75rem]">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {post.description}
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-zinc-400 dark:text-zinc-500">
            <span>By {post.author || "Albis Intelligence Desk"}</span>
          </div>
          {post.image && post.image !== "/og-image.png" && (
            <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-xl">
              <Image
                src={post.image}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 672px"
                unoptimized
                priority
              />
            </div>
          )}
          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-space-4 flex flex-wrap gap-2">
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
          {/* Perception Gap Visuals — graceful when data unavailable */}
          {(() => {
            // These fields may be added to frontmatter later; safe access via cast
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const p = post as any;
            const pgScore = typeof p.perception_gap === "number" ? p.perception_gap : null;
            const found = Array.isArray(p.regions_found) ? (p.regions_found as string[]) : null;
            const absent = Array.isArray(p.regions_absent) ? (p.regions_absent as string[]) : [];
            const significance = p.region_significance as Record<string, number> | undefined;

            if (pgScore == null || !found) return null;

            return (
              <div className="mt-8 space-y-3">
                <PerceptionGapVisual
                  pgi={pgScore}
                  regionsFound={found}
                  regionsAbsent={absent}
                  regionSignificance={significance}
                />
                <CoverageGapVisual
                  regionsFound={found}
                  regionsAbsent={absent}
                />
              </div>
            );
          })()}
        </header>

        {/* Body */}
        <div
          className="blog-prose font-[family-name:var(--font-source-serif)] text-[1.0625rem] leading-[1.8] text-[#1a1a1a] dark:text-[#d4d3d0]"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Source Transparency */}
        <SourceTransparency sources={post.sources} confidence={post.confidence} />

        {/* Quiz CTA */}
        <div className="mt-12 rounded-xl border border-[#1a3a5c]/20 bg-[#1a3a5c]/5 p-5 dark:border-[#7ab0d8]/20 dark:bg-[#7ab0d8]/5">
          <Link href="/quiz" className="flex items-center justify-between group">
            <div>
              <p className="font-medium text-[#1a3a5c] dark:text-[#7ab0d8]">Think you know today&apos;s news?</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Take the daily quiz — 5 questions, 60 seconds</p>
            </div>
            <span className="text-[#1a3a5c] dark:text-[#7ab0d8] group-hover:translate-x-1 transition-transform text-lg">&rarr;</span>
          </Link>
        </div>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <section className="mt-12">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">
              Keep Reading
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/lens/${rp.slug}`}
                  className="group block rounded-xl border border-black/[0.07] p-5 transition-all hover:border-[#c8922a]/30 hover:shadow-sm dark:border-white/[0.06] dark:hover:border-[#c8922a]/30"
                >
                  <div className="mb-3 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                    <time>
                      {new Date(rp.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                    <span>&middot;</span>
                    <span>3 min</span>
                  </div>
                  <h3 className="font-medium leading-snug text-[#0f0f0f] group-hover:text-[#c8922a] dark:text-[#f0efec] dark:group-hover:text-[#c8922a]">{rp.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-2">{rp.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Explore Perspectives */}
        {relatedPages.length > 0 && (
          <section className="mt-12">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">
              Explore Perspectives
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {relatedPages.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-1 rounded-lg border border-black/[0.07] px-3 py-2 text-sm transition-colors hover:border-black/[0.15] dark:border-white/[0.06] dark:hover:border-white/[0.12]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="mt-16 rounded-2xl border border-[#c8922a]/20 bg-[#f8f7f4] p-8 text-center dark:border-[#c8922a]/20 dark:bg-white/[0.03]">
          <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#c8922a]">
            Get this delivered free every morning
          </h3>
          <p className="mx-auto mt-3 max-w-md text-zinc-600 dark:text-zinc-400">
            The daily briefing with perspectives from 7 regions — straight to your inbox.
          </p>
          <div className="mt-6">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-[#c8922a] px-6 py-3 font-medium text-white transition-colors hover:bg-[#b17f24]"
            >
              Get the daily briefing free
            </Link>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-12 text-center">
          <Link
            href="/lens"
            className="text-sm font-medium text-[#1a3a5c] hover:underline dark:text-[#7ab0d8]"
          >
            &larr; All articles
          </Link>
        </div>
      </article>

      <StickyCTA />
      <ExitIntentModal
        articles={getAllPosts().slice(0, 10).map((p) => ({
          slug: p.slug,
          title: p.title,
          description: p.description || "",
          readingTime: p.readingTime,
          category: p.category || "analysis",
        }))}
        currentSlug={slug}
        currentCategory={post.category}
      />
    </>
  );
}
