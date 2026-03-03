import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { reactionPages, getReactionPage, getAllReactionSlugs, getRelatedPages } from "@/lib/reaction-pages";
import { EmailCapture } from "@/app/components/email-capture";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllReactionSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getReactionPage(slug);
  if (!page) return {};

  return {
    title: `${page.title} | Albis`,
    description: page.description,
    openGraph: {
      title: page.title,
      description: page.description,
      url: `https://albis.news/perspectives/reactions/${page.slug}`,
      type: "article",
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `https://albis.news/perspectives/reactions/${page.slug}`,
    },
  };
}

export default async function ReactionPage({ params }: Props) {
  const { slug } = await params;
  const page = getReactionPage(slug);
  if (!page) notFound();

  const related = getRelatedPages(page.relatedSlugs);
  const paragraphs = page.content.split("\n\n").filter((p) => p.trim());

  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: page.title,
    description: page.description,
    url: `https://albis.news/perspectives/reactions/${page.slug}`,
    publisher: {
      "@type": "Organization",
      name: "Albis",
      url: "https://albis.news",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://albis.news/perspectives/reactions/${page.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <nav className="mb-10 text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/perspectives" className="hover:underline">
            Perspectives
          </Link>
          <span className="mx-2">/</span>
          <span>Reactions</span>
        </nav>

        <header className="mb-12">
          <div className="mb-4 flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">
              {page.country}
            </span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">
              {page.topic}
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight md:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            {page.title}
          </h1>
          <p className="mt-4 text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {page.description}
          </p>
        </header>

        <article className="prose prose-zinc dark:prose-invert prose-lg max-w-none leading-relaxed">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </article>

        {related.length > 0 && (
          <section className="mt-16 border-t border-zinc-200 pt-10 dark:border-zinc-800">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold mb-6">
              Related Perspectives
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/perspectives/reactions/${r.slug}`}
                  className="group rounded-lg border border-zinc-200 p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                >
                  <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{r.country}</span>
                    <span>·</span>
                    <span>{r.topic}</span>
                  </div>
                  <h3 className="font-medium group-hover:underline leading-snug">
                    {r.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-16 rounded-xl bg-zinc-50 p-8 dark:bg-zinc-900">
          <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-3">
            See beyond your media bubble
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            Get weekly analysis of how the world reports the same story differently.
          </p>
          <EmailCapture />
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Or try the{" "}
            <Link href="/quiz" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
              Media Bias Quiz
            </Link>{" "}
            to test your perspective.
          </p>
        </section>
      </main>
    </>
  );
}
