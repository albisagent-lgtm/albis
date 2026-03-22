import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What Is the Perception Gap Index (PGI)? — Albis",
  description:
    "The Perception Gap Index (PGI) measures how differently world regions frame the same news event on a 1-10 scale. Learn how Albis scans 60+ countries in 9 languages to reveal narrative divergence.",
  keywords: [
    "what is perception gap index",
    "perception gap index",
    "PGI",
    "media perception gap",
    "narrative divergence",
    "Albis PGI",
    "global news framing",
  ],
  alternates: {
    canonical: "https://www.albis.news/what-is-perception-gap-index",
  },
};

const tributaries = [
  {
    code: "PGI-GP",
    name: "Geopolitics",
    description:
      "Measures framing divergence in wars, diplomacy, sanctions, and territorial disputes. Carries the heaviest weight because geopolitical framing shapes how populations understand threats and alliances.",
  },
  {
    code: "PGI-IW",
    name: "Information Warfare",
    description:
      "Tracks how state media, propaganda narratives, and information operations create opposing realities about the same events across different regions.",
  },
  {
    code: "PGI-WR",
    name: "Women's Rights",
    description:
      "Captures how women's rights stories are framed differently — from progress narratives in some regions to cultural resistance framing in others.",
  },
  {
    code: "PGI-EC",
    name: "Economics",
    description:
      "Measures how economic events — trade wars, sanctions, inflation — are framed as opportunity in one region and threat in another.",
  },
  {
    code: "PGI-TE",
    name: "Technology",
    description:
      "Tracks divergence in how AI, surveillance, and tech regulation are framed — innovation vs. threat, freedom vs. control.",
  },
  {
    code: "PGI-HE",
    name: "Health",
    description:
      "Measures framing gaps in health crises, pandemics, pharmaceutical access, and public health narratives across regions.",
  },
  {
    code: "PGI-CL",
    name: "Climate",
    description:
      "Captures how climate events and policy are framed — existential crisis in one region, economic burden in another, or ignored entirely.",
  },
];

const faqs = [
  {
    question: "What does PGI stand for?",
    answer:
      "PGI stands for Perception Gap Index. It is a daily measurement created by Albis that quantifies how differently the same news event is framed across world regions, scored on a scale of 1 to 10.",
  },
  {
    question: "How often is the PGI updated?",
    answer:
      "The PGI is updated three times daily — at 7am, 1pm, and 7pm NZST. Each scan covers 60+ countries across 7 world regions in 9 languages, producing fresh scores with every cycle.",
  },
  {
    question: "What is the difference between PGI and GAI?",
    answer:
      "The PGI measures how differently a story is framed across regions (narrative divergence). The GAI (Global Attention Index) measures whether a story is covered at all. A story can have a low PGI (everyone agrees on framing) but a high GAI (most regions ignore it entirely).",
  },
  {
    question: "What does a PGI score of 10 mean?",
    answer:
      "A PGI of 10 means completely opposed narratives — the same event is described in fundamentally contradictory ways by different regions. One side's liberation is another side's invasion. These scores are rare and indicate deep ideological fractures in global information systems.",
  },
  {
    question: "Can I use PGI data for research?",
    answer:
      "Yes. Albis publishes PGI scores openly and provides raw data access. The methodology is fully transparent and documented on the Albis methodology page. Researchers, journalists, and educators are welcome to cite and build on PGI data.",
  },
];

export default function WhatIsPGIPage() {
  const definedTermSchema = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: "Perception Gap Index",
    alternateName: "PGI",
    description:
      "A daily measurement that quantifies narrative divergence in global media coverage, scoring how differently world regions frame the same event on a scale of 1 (global consensus) to 10 (completely opposed narratives).",
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "Albis Media Intelligence Indexes",
      url: "https://www.albis.news/indexes",
    },
    url: "https://www.albis.news/what-is-perception-gap-index",
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
        <div className="mx-auto max-w-2xl px-space-6 py-space-16 md:py-space-24">
          {/* Hero */}
          <h1 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400">
            Definition
          </h1>

          <div className="mt-space-12 space-y-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            <p className="font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-zinc-900 dark:text-zinc-100 md:text-4xl">
              What Is the Perception Gap Index (PGI)?
            </p>
            <p className="text-xl text-zinc-500 dark:text-zinc-400">
              A daily measurement of how differently the world reports the same
              events — making narrative divergence visible for the first time.
            </p>
          </div>

          {/* Definition */}
          <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
            <div className="space-y-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
              <p>
                The Perception Gap Index (PGI) is a quantitative measurement
                created by{" "}
                <Link href="/" className="text-[#c8922a] hover:underline">
                  Albis
                </Link>{" "}
                that scores how differently world regions frame the same news
                event. It runs on a 1-10 scale, where 1 means global consensus
                and 10 means completely opposed narratives. The PGI reveals what
                traditional media analysis cannot: the invisible distance between
                what different populations believe about the same reality.
              </p>
              <p>
                Every day, Albis scans media sources across seven world regions
                in nine native languages. When the same event produces
                fundamentally different narratives in different regions — one
                side&apos;s self-defence is another side&apos;s aggression, one
                region&apos;s economic opportunity is another&apos;s existential
                threat — the PGI captures that divergence in a single, trackable
                number. Over time, PGI trends reveal whether the world is
                converging toward shared understanding or fragmenting into
                incompatible information realities.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
            <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
              How It Works
            </h2>
            <div className="space-y-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
              <p>
                Albis runs{" "}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  three scans daily
                </strong>{" "}
                — at 7am, 1pm, and 7pm NZST — covering more than{" "}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  60 countries
                </strong>{" "}
                across 7 world regions. Each scan reads media in{" "}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  9 native languages
                </strong>
                : English, Arabic, Farsi, Mandarin, Russian, Hindi, Spanish,
                French, and Turkish.
              </p>
              <p>
                This is not translation of English-language sources. Albis reads
                Iranian media in Farsi, Chinese outlets in Mandarin, and Arabic
                sources in Arabic — capturing the domestic narrative that
                English-language coverage misses entirely. Each story is
                evaluated across six dimensions: source framing, emotional tone,
                causal attribution, actor portrayal, solution framing, and
                omission patterns. The result is a PGI score that reflects the
                true distance between regional narratives.
              </p>
            </div>

            <div className="mt-space-6 space-y-3">
              {[
                ["7 regions", "US, EU, Middle East, Asia-Pacific, South Asia, Africa, Latin America"],
                ["60+ countries", "Scanned per cycle across all regions"],
                ["9 languages", "Native-language scanning, not English translations"],
                ["3x daily", "Fresh scores at 7am, 1pm, and 7pm NZST"],
              ].map(([label, desc]) => (
                <div key={label} className="flex gap-4">
                  <span className="font-[family-name:var(--font-source-serif)] text-sm font-semibold text-[#c8922a] whitespace-nowrap w-40 shrink-0">
                    {label}
                  </span>
                  <span className="font-[family-name:var(--font-source-serif)] text-sm text-zinc-600 dark:text-zinc-400">
                    {desc}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-space-6 font-[family-name:var(--font-source-serif)] text-sm text-zinc-500 dark:text-zinc-400">
              Read the full technical process on the{" "}
              <Link
                href="/methodology"
                className="text-[#c8922a] hover:underline"
              >
                methodology page
              </Link>
              .
            </p>
          </div>

          {/* How PGI Is Scored */}
          <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
            <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
              How PGI Is Scored
            </h2>
            <div className="space-y-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
              <p>
                The PGI uses a{" "}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  1-10 scale
                </strong>{" "}
                to measure narrative distance between regions on any given story.
              </p>
            </div>

            <div className="mt-space-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-black/[0.05] p-4 dark:border-white/[0.05]">
                <span className="font-[family-name:var(--font-source-serif)] text-2xl font-semibold text-[#c8922a]">
                  1
                </span>
                <p className="mt-1 font-[family-name:var(--font-source-serif)] text-sm text-zinc-600 dark:text-zinc-400">
                  Global consensus — the same framing everywhere. A natural
                  disaster where every region reports the facts identically.
                </p>
              </div>
              <div className="rounded-lg border border-black/[0.05] p-4 dark:border-white/[0.05]">
                <span className="font-[family-name:var(--font-source-serif)] text-2xl font-semibold text-[#c8922a]">
                  3-4
                </span>
                <p className="mt-1 font-[family-name:var(--font-source-serif)] text-sm text-zinc-600 dark:text-zinc-400">
                  Mild divergence — similar facts but different emphasis.
                  Economic data where regions highlight different implications.
                </p>
              </div>
              <div className="rounded-lg border border-black/[0.05] p-4 dark:border-white/[0.05]">
                <span className="font-[family-name:var(--font-source-serif)] text-2xl font-semibold text-[#c8922a]">
                  6-7
                </span>
                <p className="mt-1 font-[family-name:var(--font-source-serif)] text-sm text-zinc-600 dark:text-zinc-400">
                  Significant divergence — different causal explanations and
                  actor portrayals. The same trade policy framed as protectionism
                  or sovereignty.
                </p>
              </div>
              <div className="rounded-lg border border-black/[0.05] p-4 dark:border-white/[0.05]">
                <span className="font-[family-name:var(--font-source-serif)] text-2xl font-semibold text-[#c8922a]">
                  10
                </span>
                <p className="mt-1 font-[family-name:var(--font-source-serif)] text-sm text-zinc-600 dark:text-zinc-400">
                  Completely opposed narratives — the same event described as
                  opposite realities. One region&apos;s liberation is
                  another&apos;s invasion.
                </p>
              </div>
            </div>

            {/* Example */}
            <div className="mt-space-8 rounded-lg border border-[#c8922a]/20 bg-[#c8922a]/[0.03] p-5 dark:border-[#c8922a]/15 dark:bg-[#c8922a]/[0.02]">
              <p className="font-[family-name:var(--font-source-serif)] text-sm font-semibold text-[#c8922a] uppercase tracking-wide mb-2">
                Example — PGI 8.4
              </p>
              <p className="font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                A military conflict scores PGI 8.4. Western media frames
                precision strikes targeting military infrastructure. Middle
                Eastern media frames civilian casualties and humanitarian crisis.
                Chinese media frames declining US hegemony and the rise of
                multipolarity. Same day, same events — three fundamentally
                different realities consumed by billions of people.
              </p>
            </div>
          </div>

          {/* The 7 PGI Tributaries */}
          <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
            <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
              The 7 PGI Tributaries
            </h2>
            <div className="space-y-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
              <p>
                The PGI is not a single number — it is a river fed by seven
                tributaries, each measuring narrative divergence in a specific
                domain. Together they form the composite daily PGI. This
                structure allows analysts to see exactly where in the information
                ecosystem the largest gaps are forming.
              </p>
            </div>

            <div className="mt-space-6 space-y-4">
              {tributaries.map((t) => (
                <div
                  key={t.code}
                  className="rounded-lg border border-black/[0.05] p-4 dark:border-white/[0.05]"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-[family-name:var(--font-source-serif)] text-sm font-semibold text-[#c8922a]">
                      {t.code}
                    </span>
                    <span className="font-[family-name:var(--font-source-serif)] text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {t.name}
                    </span>
                  </div>
                  <p className="mt-2 font-[family-name:var(--font-source-serif)] text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {t.description}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-space-6 font-[family-name:var(--font-source-serif)] text-sm text-zinc-500 dark:text-zinc-400">
              Explore all seven tributaries with live scores on the{" "}
              <Link
                href="/indexes/pgi"
                className="text-[#c8922a] hover:underline"
              >
                PGI dashboard
              </Link>
              .
            </p>
          </div>

          {/* Why It Matters */}
          <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
            <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
              Why It Matters
            </h2>
            <div className="space-y-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
              <p>
                Information shapes perception. Perception shapes decisions.
                Decisions shape the world. Yet most people consume news from a
                single region, in a single language, and assume they are seeing
                the full picture. They are not.
              </p>
              <p>
                The PGI makes the invisible visible. When a conflict scores PGI
                8+, it means billions of people are reading fundamentally
                contradictory accounts of the same reality — and most of them
                have no idea the other accounts exist. This is not about who is
                right. It is about making the gap itself visible so people can
                think more clearly about what they believe and why.
              </p>
              <p>
                By tracking PGI over time, Albis reveals whether the world is
                converging toward shared understanding or splitting into
                incompatible information realities. That data is available to
                everyone — researchers, journalists, educators, and anyone who
                wants to{" "}
                <Link
                  href="/perspectives"
                  className="text-[#c8922a] hover:underline"
                >
                  see the world more clearly
                </Link>
                .
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
            <div className="rounded-xl border border-[#c8922a]/20 bg-[#c8922a]/5 p-8 text-center dark:border-[#c8922a]/30 dark:bg-[#c8922a]/10">
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                See Live PGI Scores
              </h2>
              <p className="mt-3 font-[family-name:var(--font-source-serif)] text-base text-zinc-600 dark:text-zinc-400">
                Updated three times daily. Watch narrative divergence unfold in
                real time across seven world regions.
              </p>
              <Link
                href="/indexes/pgi"
                className="mt-6 inline-block rounded-lg bg-[#1a3a5c] px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                View the PGI Dashboard
              </Link>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
            <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-space-8">
              {faqs.map((faq) => (
                <div key={faq.question}>
                  <h3 className="font-[family-name:var(--font-source-serif)] text-base font-semibold text-zinc-800 dark:text-zinc-200">
                    {faq.question}
                  </h3>
                  <p className="mt-2 font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Internal Links */}
          <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
            <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
              Continue Exploring
            </h2>
            <div className="space-y-3">
              {[
                { href: "/indexes/pgi", label: "PGI Dashboard — live scores updated 3x daily" },
                { href: "/what-is-global-attention-index", label: "What Is the Global Attention Index (GAI)?" },
                { href: "/methodology", label: "Full Methodology — how Albis scans and scores" },
                { href: "/perspectives", label: "Perspectives — see stories from every region" },
                { href: "/blog", label: "The Lens — daily analysis and articles" },
              ].map((link) => (
                <div key={link.href} className="flex gap-3">
                  <span className="text-[#c8922a] mt-0.5 shrink-0">&rarr;</span>
                  <Link
                    href={link.href}
                    className="font-[family-name:var(--font-source-serif)] text-base text-zinc-700 hover:text-[#c8922a] dark:text-zinc-300 dark:hover:text-[#c8922a]"
                  >
                    {link.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
