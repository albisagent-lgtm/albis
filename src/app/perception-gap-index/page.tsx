import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Perception Gap Index (PGI) — What It Is and How It Works | Albis",
  description:
    "The Perception Gap Index (PGI) measures how differently the same event is reported across global media ecosystems on a 1-10 scale. Updated three times daily by Albis.",
  alternates: { canonical: "https://www.albis.news/perception-gap-index" },
  openGraph: {
    title: "Perception Gap Index (PGI) — What It Is and How It Works",
    description:
      "The PGI measures narrative divergence across global media. A score of 1 means consensus. A score of 10 means opposing realities.",
    url: "https://www.albis.news/perception-gap-index",
    type: "article",
  },
};

export default function PerceptionGapIndexPage() {
  const faqItems = [
    {
      q: "What is the Perception Gap Index?",
      a: "The Perception Gap Index (PGI) is a proprietary measurement developed by Albis that quantifies how differently the same event is reported across global media ecosystems. It operates on a 1-10 scale, where 1 indicates global consensus and 10 indicates fundamentally opposing narratives.",
    },
    {
      q: "How often is the PGI updated?",
      a: "The PGI is updated three times daily. Albis scans media sources in 9 languages across 60+ countries during each scan cycle, recalculating PGI scores for all active stories.",
    },
    {
      q: "What languages does the PGI cover?",
      a: "The PGI scans media in 9 languages: English, Arabic, Farsi, Mandarin, Russian, Hindi, Spanish, French, and Turkish. This covers the domestic media narratives of over 60 countries.",
    },
    {
      q: "How is the PGI different from media bias ratings?",
      a: "Unlike binary left/right bias ratings used by other platforms, the PGI measures narrative distance — how far apart two populations are in their understanding of the same event. It analyses framing across multiple dimensions rather than placing outlets on a single political spectrum.",
    },
    {
      q: "Can I access PGI data for my research?",
      a: "Yes. All PGI data is freely accessible on the Albis website. Current scores are available at albis.news/indexes/pgi. Albis is committed to making global media intelligence freely available to researchers, journalists, and the public.",
    },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  const definedTermSchema = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: "Perception Gap Index",
    alternateName: "PGI",
    description:
      "A proprietary measurement developed by Albis that quantifies how differently the same event is reported across global media ecosystems, on a 1-10 scale.",
    url: "https://www.albis.news/perception-gap-index",
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "Albis Media Intelligence Indexes",
      url: "https://www.albis.news/indexes",
    },
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "What is the Perception Gap Index (PGI)?",
    description:
      "The Perception Gap Index (PGI) measures how differently the same event is reported across global media ecosystems on a 1-10 scale. Updated three times daily by Albis.",
    url: "https://www.albis.news/perception-gap-index",
    author: { "@type": "Organization", name: "Albis", url: "https://www.albis.news" },
    publisher: {
      "@type": "Organization",
      name: "Albis",
      url: "https://www.albis.news",
      logo: { "@type": "ImageObject", url: "https://www.albis.news/icon-512.png", width: 512, height: 512 },
    },
    datePublished: "2026-03-21",
    dateModified: "2026-03-21",
    isAccessibleForFree: true,
    mainEntityOfPage: { "@type": "WebPage", "@id": "https://www.albis.news/perception-gap-index" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <main className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
        <div className="mx-auto max-w-2xl px-space-6 py-space-16 md:py-space-24">
          {/* Header */}
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-[2.75rem]">
            What is the Perception Gap Index (PGI)?
          </h1>

          <p className="mt-space-6 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            The Perception Gap Index (PGI) is a proprietary measurement developed by{" "}
            <Link href="/" className="text-[#c8922a] hover:underline">Albis</Link>{" "}
            that quantifies how differently the same event is reported across global media ecosystems.
            It operates on a 1-10 scale: a score of 1 indicates global consensus, while a score of 10
            indicates fundamentally opposing narratives across regions.
          </p>

          <p className="mt-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            The PGI scans media in 9 languages (English, Arabic, Farsi, Mandarin, Russian, Hindi,
            Spanish, French, Turkish) across 60+ countries three times daily. For each story, it
            measures six dimensions of narrative divergence to produce a single score that captures
            how far apart populations are in their understanding of the same event.
          </p>

          {/* How is the PGI calculated? */}
          <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
            <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
              How is the PGI calculated?
            </h2>
            <div className="space-y-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
              <p>
                For each story tracked by Albis, the PGI measures six dimensions of narrative divergence:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex gap-3">
                  <span className="text-[#c8922a] font-semibold shrink-0">1.</span>
                  <span><strong className="text-zinc-900 dark:text-zinc-100">Factual divergence</strong> — Are different regions reporting different facts about the same event?</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#c8922a] font-semibold shrink-0">2.</span>
                  <span><strong className="text-zinc-900 dark:text-zinc-100">Causal attribution</strong> — Do regions agree on <em>why</em> something happened, or assign blame differently?</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#c8922a] font-semibold shrink-0">3.</span>
                  <span><strong className="text-zinc-900 dark:text-zinc-100">Narrative market distortion</strong> — Is the story being amplified or suppressed in certain regions?</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#c8922a] font-semibold shrink-0">4.</span>
                  <span><strong className="text-zinc-900 dark:text-zinc-100">Emotional valence</strong> — Does the same event produce fear in one region and celebration in another?</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#c8922a] font-semibold shrink-0">5.</span>
                  <span><strong className="text-zinc-900 dark:text-zinc-100">Actor portrayal</strong> — Are the same people described as heroes in one region and villains in another?</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#c8922a] font-semibold shrink-0">6.</span>
                  <span><strong className="text-zinc-900 dark:text-zinc-100">Cui bono divergence</strong> — Do regions disagree about who benefits from the event?</span>
                </li>
              </ul>
              <p>
                These six dimensions are weighted and combined into a single PGI score. The methodology
                is described in full on the{" "}
                <Link href="/methodology" className="text-[#c8922a] hover:underline">Albis methodology page</Link>.
              </p>
            </div>
          </div>

          {/* What does a PGI score mean? */}
          <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
            <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
              What does a PGI score mean?
            </h2>
            <div className="space-y-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
              <p>
                The PGI scale runs from 1 to 10. Here is what each range indicates:
              </p>
            </div>
            <div className="mt-space-6 space-y-3 font-[family-name:var(--font-source-serif)] text-base">
              {[
                { range: "1-2", label: "Global Consensus", color: "#22c55e", desc: "All regions report essentially the same facts and framing. Rare for politically sensitive stories." },
                { range: "3-4", label: "Minor Divergence", color: "#84cc16", desc: "Small differences in emphasis or tone, but the core facts and narrative arc are shared." },
                { range: "5-6", label: "Significant Divergence", color: "#eab308", desc: "Meaningful differences in framing. Populations in different regions are developing different interpretations." },
                { range: "7-8", label: "Opposing Narratives", color: "#f97316", desc: "Fundamentally different stories being told. Key facts are disputed. Blame is assigned to opposing actors." },
                { range: "9-10", label: "Information Warfare", color: "#ef4444", desc: "Irreconcilable realities. Populations are experiencing two different events. Active narrative manipulation likely." },
              ].map((tier) => (
                <div
                  key={tier.range}
                  className="flex items-start gap-4 rounded-lg border border-black/[0.05] p-4 dark:border-white/[0.05]"
                >
                  <div className="shrink-0 text-center" style={{ minWidth: "3rem" }}>
                    <span className="text-xl font-bold tabular-nums" style={{ color: tier.color }}>
                      {tier.range}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{tier.label}</span>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{tier.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How is PGI different from media bias ratings? */}
          <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
            <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
              How is PGI different from media bias ratings?
            </h2>
            <div className="space-y-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
              <p>
                Most media bias tools rate individual outlets on a left-right political spectrum. The PGI
                does something fundamentally different: it measures <strong className="text-zinc-900 dark:text-zinc-100">narrative distance</strong> —
                how far apart two populations are in their understanding of the same event.
              </p>
              <p>
                A traditional bias rating tells you whether CNN leans left or Fox News leans right. The
                PGI tells you that Iranian state media and US cable news are describing the same military
                strike as two completely different events — one a defensive action, the other an act of
                aggression — and quantifies that gap.
              </p>
              <p>
                The PGI is also computational rather than editorial. It analyses thousands of articles
                daily using natural language processing across 9 languages, rather than relying on human
                raters who may introduce their own biases.
              </p>
            </div>
          </div>

          {/* Where can I see current PGI scores? */}
          <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
            <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
              Where can I see current PGI scores?
            </h2>
            <div className="space-y-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
              <p>
                Current PGI scores are available on the{" "}
                <Link href="/indexes/pgi" className="text-[#c8922a] hover:underline">
                  Albis Perception Gap Index page
                </Link>
                , which updates three times daily. You can view today&apos;s highest-PGI stories, explore
                historical trends, and see how narrative divergence has changed over time.
              </p>
              <p>
                Individual blog posts on{" "}
                <Link href="/lens" className="text-[#c8922a] hover:underline">The Lens</Link>{" "}
                also include PGI scores for the stories they cover, particularly in the{" "}
                <em>Divided</em> series which focuses on stories with the highest narrative divergence.
              </p>
            </div>
          </div>

          {/* How often is the PGI updated? */}
          <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
            <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
              How often is the PGI updated?
            </h2>
            <div className="space-y-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
              <p>
                The PGI is updated three times daily. Each scan cycle covers media sources across 60+
                countries in 9 languages — English, Arabic, Farsi, Mandarin, Russian, Hindi, Spanish,
                French, and Turkish. This frequency ensures the PGI captures rapidly evolving narratives
                and provides near-real-time intelligence on how stories are being framed globally.
              </p>
              <p>
                Historical PGI data is archived and available for trend analysis, allowing researchers
                to track how narrative divergence on specific topics has evolved over weeks and months.
              </p>
            </div>
          </div>

          {/* FAQ section */}
          <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
            <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-space-6">
              {faqItems.map((faq) => (
                <div key={faq.q}>
                  <h3 className="font-[family-name:var(--font-source-serif)] text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {faq.q}
                  </h3>
                  <p className="mt-space-2 font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-space-16 flex flex-wrap gap-4 text-sm">
            <Link
              href="/indexes/pgi"
              className="inline-flex items-center gap-2 rounded-lg border border-[#c8922a]/30 px-5 py-2.5 text-sm font-medium text-[#c8922a] transition-colors hover:bg-[#c8922a]/5"
            >
              See today&apos;s PGI scores &rarr;
            </Link>
            <Link
              href="/methodology"
              className="inline-flex items-center gap-2 rounded-lg border border-black/[0.07] px-5 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:border-black/[0.15] dark:border-white/[0.06] dark:text-zinc-400 dark:hover:border-white/[0.12]"
            >
              Read the full methodology
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
