import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllSlugs, getPostBySlug } from "@/lib/blog";
import { markdownToHtml } from "@/lib/markdown";
import { EmailCapture } from "@/app/components/email-capture";
import { ReadingProgress } from "@/components/ReadingProgress";
import { getRelatedPosts, getRelatedPages } from "@/lib/internal-links";
import { matchTagToTopic } from "@/lib/topics";
import { Breadcrumbs } from "@/app/components/breadcrumbs";
import { SourceTransparency } from "@/app/components/source-transparency";
import { RelativeTime } from "@/app/components/relative-time";
import { CATEGORIES } from "@/lib/categories";
import { getAllPosts } from "@/lib/blog";

import { getClustersForArticle } from "@/lib/stories";

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
  const url = `https://www.albis.news/blog/${slug}`;
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

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const html = markdownToHtml(post.content);
  const url = `https://www.albis.news/blog/${slug}`;

  const relatedPosts = getRelatedPosts(post.tags, slug, 5);
  const relatedPages = getRelatedPages(post.tags);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.description,
    url,
    image: post.image.startsWith("http") ? post.image : `https://www.albis.news${post.image}`,
    datePublished: post.date,
    dateModified: post.updatedDate || post.date,
    author: { "@type": "Organization", name: "Albis", url: "https://www.albis.news" },
    publisher: {
      "@type": "Organization",
      name: "Albis",
      url: "https://www.albis.news",
      logo: { "@type": "ImageObject", url: "https://www.albis.news/icon-512.png", width: 512, height: 512 },
    },
    keywords: post.tags.join(", "),
    isAccessibleForFree: true,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(post.sources.length > 0 ? {
      citation: post.sources.filter(s => s.url).map(s => ({
        "@type": "WebPage",
        name: s.name,
        url: s.url,
      })),
    } : {}),
  };

  // FAQ structured data if available
  const faqJsonLd = post.faqs && post.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faqs.map((faq) => ({
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

      <article className="mx-auto max-w-[680px] px-space-6 py-space-16 md:py-space-24">
        {/* Header */}
        <header className="mb-space-12">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "The Lens", href: "/lens" },
              { label: CATEGORIES[post.category as keyof typeof CATEGORIES] || "All", href: `/lens?category=${post.category}` },
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
          <h1 className="mt-space-6 font-[family-name:var(--font-playfair)] text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-[2.75rem]">
            {post.title}
          </h1>
          <p className="mt-space-4 text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {post.description}
          </p>
          <div className="mt-space-4 flex items-center gap-2 text-sm text-zinc-400 dark:text-zinc-500">
            <span>By {post.author || "Albis Intelligence Desk"}</span>
          </div>
          {post.updatedDate && post.updatedDate !== post.date && (
            <div className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">
              Updated {new Date(post.updatedDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })} · <RelativeTime date={post.updatedDate} className="text-sm text-emerald-600 dark:text-emerald-400" />
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
        </header>

        {/* Story Cluster Banner */}
        {(() => {
          const clusters = getClustersForArticle(post);
          if (clusters.length === 0) return null;
          return (
            <div className="mb-space-8 rounded-lg border border-[#c8922a]/20 bg-[#c8922a]/5 p-4">
              {clusters.map((c) => (
                <Link
                  key={c.slug}
                  href={`/stories/${c.slug}`}
                  className="flex items-center justify-between gap-3 text-sm group"
                >
                  <span className="text-zinc-600 dark:text-zinc-300">
                    Part of the <span className="font-semibold text-[#c8922a] group-hover:underline">{c.title}</span> story
                  </span>
                  <span className="text-[#c8922a] font-medium whitespace-nowrap">
                    Follow timeline →
                  </span>
                </Link>
              ))}
            </div>
          );
        })()}

        {/* Body */}
        <div
          className="blog-prose font-[family-name:var(--font-source-serif)] text-[1.0625rem] leading-[1.8] text-[#1a1a1a] dark:text-[#d4d3d0]"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Source Transparency */}
        <SourceTransparency sources={post.sources} confidence={post.confidence} />

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <section className="mt-space-16">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">
              Keep Reading
            </h2>
            <div className="mt-space-8 grid gap-space-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/blog/${rp.slug}`}
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
          <section className="mt-space-12">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">
              Explore Perspectives
            </h2>
            <div className="mt-space-4 flex flex-wrap gap-space-2">
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
        <div className="mt-space-16 rounded-2xl border border-[#c8922a]/20 bg-[#f8f7f4] p-space-8 text-center dark:border-[#c8922a]/20 dark:bg-white/[0.03]">
          <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#c8922a]">
            Get this delivered free every morning
          </h3>
          <p className="mx-auto mt-space-3 max-w-md text-zinc-600 dark:text-zinc-400">
            The daily briefing with perspectives from 7 regions — straight to your inbox.
          </p>
          <div className="mt-space-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-[#c8922a] px-space-6 py-3 font-medium text-white transition-colors hover:bg-[#b17f24]"
            >
              Get the daily briefing free
            </Link>
            <a
              href="https://t.me/albisdaily"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-[#c8922a]/30 px-space-6 py-3 font-medium text-[#c8922a] transition-colors hover:bg-[#c8922a]/5"
            >
              Join the community →
            </a>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-space-12 text-center">
          <Link
            href="/blog"
            className="text-sm font-medium text-[#c8922a] hover:underline dark:text-[#c8922a]"
          >
            &larr; All articles
          </Link>
        </div>
      </article>

      <ReadingProgress />

    </>
  );
}
