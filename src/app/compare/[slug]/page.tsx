import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { comparisons, getComparison } from "../comparisons";
import { multiComparisons, getMultiComparison } from "../multi-comparisons";

export function generateStaticParams() {
  const vsSlugs = comparisons.map((c) => ({ slug: c.slug }));
  const multiSlugs = multiComparisons.map((c) => ({ slug: c.slug }));
  return [...vsSlugs, ...multiSlugs];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vs = getComparison(slug);
  const multi = getMultiComparison(slug);
  const c = vs || multi;
  if (!c) return {};
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    keywords: [...c.targetQueries, "news comparison", "news platform comparison", "unbiased news"],
    openGraph: {
      title: c.metaTitle,
      description: c.metaDescription,
      url: `https://www.albis.news/compare/${c.slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: c.metaTitle,
      description: c.metaDescription,
    },
    alternates: {
      canonical: `https://www.albis.news/compare/${c.slug}`,
    },
  };
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vs = getComparison(slug);
  const multi = getMultiComparison(slug);

  if (!vs && !multi) notFound();

  if (vs) return <VsPage c={vs} />;
  return <MultiPage c={multi!} />;
}

// ===== VS (2-product) page =====
import type { Comparison } from "../comparisons";

function VsPage({ c }: { c: Comparison }) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "Review",
    name: c.title,
    url: `https://www.albis.news/compare/${c.slug}`,
    itemReviewed: {
      "@type": "SoftwareApplication",
      name: c.competitor,
      applicationCategory: "News & Media",
      url: c.competitorUrl,
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: "4",
      bestRating: "5",
      worstRating: "1",
    },
    author: {
      "@type": "Organization",
      name: "Albis",
      url: "https://www.albis.news",
    },
    publisher: {
      "@type": "Organization",
      name: "Albis",
      url: "https://www.albis.news",
    },
  };

  return (
    <main className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }} />
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <nav className="mb-8 text-sm text-zinc-400">
          <Link href="/compare" className="hover:text-[#c8922a]">Compare</Link>
          <span className="mx-2">›</span>
          <span className="text-zinc-600 dark:text-zinc-300">Albis vs {c.competitor}</span>
        </nav>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{c.title}</h1>
        <p className="mt-6 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">{c.opening}</p>

        {/* Comparison Table */}
        <div className="mt-12 overflow-hidden rounded-xl border border-black/[0.06] dark:border-white/[0.06]">
          <div className="grid grid-cols-3 bg-zinc-100/80 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:bg-white/[0.03] dark:text-zinc-400">
            <div className="px-4 py-3">Feature</div>
            <div className="px-4 py-3">Albis</div>
            <div className="px-4 py-3">{c.competitor}</div>
          </div>
          {c.features.map((f, i) => (
            <div key={i} className={`grid grid-cols-3 text-sm ${i % 2 === 0 ? "bg-white dark:bg-white/[0.01]" : "bg-zinc-50/50 dark:bg-white/[0.02]"}`}>
              <div className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">{f.feature}</div>
              <div className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{f.albis}</div>
              <div className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{f.competitor}</div>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="mt-16 space-y-12">
          {c.sections.map((section, i) => (
            <div key={i} className="border-t border-black/5 pt-8 dark:border-white/5">
              <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-zinc-900 dark:text-zinc-100">{section.heading}</h2>
              <div className="mt-4 space-y-4 font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                {section.content.split("\n\n").map((p, j) => <p key={j}>{p}</p>)}
              </div>
            </div>
          ))}
        </div>

        {/* Who Should Use */}
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-black/[0.06] bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-400">Choose {c.competitor} if…</h3>
            <p className="mt-3 font-[family-name:var(--font-source-serif)] text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{c.whoShouldUseCompetitor}</p>
          </div>
          <div className="rounded-xl border border-[#c8922a]/20 bg-[#c8922a]/5 p-6 dark:border-[#c8922a]/30 dark:bg-[#c8922a]/10">
            <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-[#c8922a]">Choose Albis if…</h3>
            <p className="mt-3 font-[family-name:var(--font-source-serif)] text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{c.whoShouldUseAlbis}</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 border-t border-black/5 pt-12 dark:border-white/5">
          <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-zinc-900 dark:text-zinc-100">Frequently Asked Questions</h2>
          <div className="mt-6 space-y-6">
            {c.faqs.map((faq, i) => (
              <div key={i}>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{faq.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <CtaBlock />
      </div>
    </main>
  );
}

// ===== Multi-product page =====
import type { MultiComparison } from "../multi-comparisons";

function MultiPage({ c }: { c: MultiComparison }) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  // Review schemas for each non-Albis product in the comparison
  const reviewSchemas = c.products
    .filter((p) => p.name !== "Albis")
    .map((p) => ({
      "@context": "https://schema.org",
      "@type": "Review",
      name: `${p.name} Review — ${c.title}`,
      url: `https://www.albis.news/compare/${c.slug}`,
      itemReviewed: {
        "@type": "SoftwareApplication",
        name: p.name,
        applicationCategory: "News & Media",
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: "4",
        bestRating: "5",
        worstRating: "1",
      },
      author: {
        "@type": "Organization",
        name: "Albis",
        url: "https://www.albis.news",
      },
      publisher: {
        "@type": "Organization",
        name: "Albis",
        url: "https://www.albis.news",
      },
    }));

  const productNames = c.products.map((p) => p.name);

  return (
    <main className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      {reviewSchemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <div className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <nav className="mb-8 text-sm text-zinc-400">
          <Link href="/compare" className="hover:text-[#c8922a]">Compare</Link>
          <span className="mx-2">›</span>
          <span className="text-zinc-600 dark:text-zinc-300">{c.title}</span>
        </nav>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{c.title}</h1>
        <p className="mt-6 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">{c.opening}</p>

        {/* Product Cards */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.products.map((p, i) => (
            <div key={i} className={`rounded-xl border p-4 ${p.name === "Albis" ? "border-[#c8922a]/20 bg-[#c8922a]/5 dark:border-[#c8922a]/30 dark:bg-[#c8922a]/10" : "border-black/[0.06] bg-white dark:border-white/[0.06] dark:bg-white/[0.02]"}`}>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{p.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{p.description}</p>
            </div>
          ))}
        </div>

        {/* Multi-product Comparison Table */}
        <div className="mt-12 overflow-x-auto rounded-xl border border-black/[0.06] dark:border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-100/80 dark:bg-white/[0.03]">
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 whitespace-nowrap">Feature</th>
                {productNames.map((name) => (
                  <th key={name} className={`px-3 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap ${name === "Albis" ? "text-[#c8922a]" : "text-zinc-500 dark:text-zinc-400"}`}>{name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.features.map((f, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-white/[0.01]" : "bg-zinc-50/50 dark:bg-white/[0.02]"}>
                  <td className="px-3 py-3 font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">{f.feature}</td>
                  {productNames.map((name) => (
                    <td key={name} className="px-3 py-3 text-zinc-600 dark:text-zinc-400">{f.values[name] || "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sections */}
        <div className="mt-16 space-y-12">
          {c.sections.map((section, i) => (
            <div key={i} className="border-t border-black/5 pt-8 dark:border-white/5">
              <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-zinc-900 dark:text-zinc-100">{section.heading}</h2>
              <div className="mt-4 space-y-4 font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                {section.content.split("\n\n").map((p, j) => <p key={j}>{p}</p>)}
              </div>
            </div>
          ))}
        </div>

        {/* Verdict */}
        <div className="mt-16 rounded-xl border border-black/[0.06] bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-400">Our Verdict</h2>
          <p className="mt-3 font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-zinc-700 dark:text-zinc-300">{c.verdict}</p>
        </div>

        {/* FAQ */}
        <div className="mt-16 border-t border-black/5 pt-12 dark:border-white/5">
          <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-zinc-900 dark:text-zinc-100">Frequently Asked Questions</h2>
          <div className="mt-6 space-y-6">
            {c.faqs.map((faq, i) => (
              <div key={i}>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{faq.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <CtaBlock />
      </div>
    </main>
  );
}

// ===== Shared CTA =====
function CtaBlock() {
  return (
    <>
      <div className="mt-16 rounded-xl border border-[#c8922a]/20 bg-[#c8922a]/5 p-8 text-center dark:border-[#c8922a]/30 dark:bg-[#c8922a]/10">
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-zinc-900 dark:text-zinc-100">See the world clearly</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">3 daily scans. 7 world regions. Zero spin. The Albis briefing is free — no credit card, no commitment.</p>
        <Link href="/signup" className="mt-4 inline-block rounded-lg bg-[#c8922a] px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90">Get the free briefing</Link>
      </div>
      <div className="mt-8 text-center">
        <Link href="/compare" className="text-sm text-zinc-400 hover:text-[#c8922a]">← All comparisons</Link>
      </div>
    </>
  );
}
