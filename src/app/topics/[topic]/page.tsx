import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TOPICS, getTopicBySlug, matchTopicToScanItem } from "@/lib/topics";
import { getBlogPostsForTopic } from "@/lib/internal-links";
import { EmailCapture } from "@/app/components/email-capture";
import { REGION_LABELS } from "@/lib/scan-types";
import { TopicDataSection } from "./topic-client";
import { Breadcrumbs } from "@/app/components/breadcrumbs";

interface Props {
  params: Promise<{ topic: string }>;
}

export function generateStaticParams() {
  return TOPICS.map((t) => ({ topic: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic: slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) return {};
  const url = `https://albis.news/topics/${slug}`;
  return {
    title: `How the World Reports on ${topic.name} | Albis`,
    description: `See how different regions cover ${topic.name}. Compare framing, coverage gaps, and perspectives across 7 world regions with Albis.`,
    openGraph: {
      title: `How the World Reports on ${topic.name} | Albis`,
      description: `See how different regions cover ${topic.name}. Compare framing and coverage gaps across world regions.`,
      url,
      type: "website",
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
    alternates: { canonical: url },
  };
}

export default async function TopicPage({ params }: Props) {
  const { topic: slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) notFound();

  const relatedPosts = getBlogPostsForTopic(slug, 5);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `How the World Reports on ${topic.name}`,
    description: `See how different regions cover ${topic.name}. Compare framing, coverage gaps, and perspectives.`,
    url: `https://albis.news/topics/${slug}`,
    publisher: {
      "@type": "Organization",
      name: "Albis",
      url: "https://www.albis.news",
      logo: {
        "@type": "ImageObject",
        url: "https://www.albis.news/icon-512.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.albis.news/topics/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Topics", href: "/topics" },
            { label: topic.name },
          ]}
        />

        {/* Hero */}
        <header className="mb-12">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{topic.emoji}</span>
            <div>
              <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight md:text-4xl">
                {topic.name}
              </h1>
              <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
                How the World Sees It
              </p>
            </div>
          </div>
          <p className="mt-6 text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {topic.description}. Explore how media across different regions frame, prioritize, and
            sometimes ignore this topic.
          </p>
        </header>

        {/* Dynamic scan data section (client component for loading state) */}
        <TopicDataSection topicSlug={slug} topicName={topic.name} keywords={topic.keywords} />

        {/* Related Articles from The Lens */}
        {relatedPosts.length > 0 && (
          <section className="mt-12">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">
              Related Articles
            </h2>
            <div className="mt-4 space-y-4">
              {relatedPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block rounded-xl border border-black/[0.07] p-4 transition-colors hover:border-black/[0.15] dark:border-white/[0.06] dark:hover:border-white/[0.12]"
                >
                  <h3 className="font-medium text-[#0f0f0f] dark:text-[#f0efec]">
                    {post.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {post.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related Topics */}
        <section className="mt-12">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">
            Explore More Topics
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {TOPICS.filter((t) => t.slug !== slug)
              .slice(0, 8)
              .map((t) => (
                <Link
                  key={t.slug}
                  href={`/topics/${t.slug}`}
                  className="flex items-center gap-2 rounded-lg border border-black/[0.07] px-3 py-2 text-sm transition-colors hover:border-black/[0.15] dark:border-white/[0.06] dark:hover:border-white/[0.12]"
                >
                  <span>{t.emoji}</span>
                  <span>{t.name}</span>
                </Link>
              ))}
          </div>
        </section>

        {/* Email CTA */}
        <div className="mt-16 rounded-2xl border border-black/[0.07] bg-[#f8f7f4] p-8 text-center dark:border-white/[0.07] dark:bg-white/[0.03]">
          <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">
            See the full picture
          </h3>
          <p className="mx-auto mt-3 max-w-md text-zinc-500 dark:text-zinc-400">
            Get daily perspectives on {topic.name} and more — Albis scans thousands of sources across 7
            regions so you don&apos;t have to.
          </p>
          <div className="mt-6">
            <EmailCapture variant="hero" />
          </div>
        </div>

        {/* Back link */}
        <div className="mt-12 text-center">
          <Link
            href="/topics"
            className="text-sm font-medium text-[#1a3a5c] hover:underline dark:text-[#7ab0d8]"
          >
            &larr; All topics
          </Link>
        </div>
      </main>
    </>
  );
}
