import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What Is the Global Attention Index (GAI)? — Albis",
  description:
    "The Global Attention Index (GAI) measures whether stories are covered at all across world regions on a 1-10 scale. Learn how Albis reveals the news most of the world never sees.",
  keywords: [
    "what is global attention index",
    "global attention index",
    "GAI",
    "media blind spots",
    "news coverage gaps",
    "Albis GAI",
    "invisible news stories",
  ],
  alternates: {
    canonical: "https://www.albis.news/what-is-global-attention-index",
  },
};

const tributaries = [
  {
    code: "GAI-GP",
    name: "Geopolitics",
    description:
      "Measures coverage gaps in wars, diplomacy, and territorial disputes. A conflict affecting millions can score GAI 8+ if only one or two regions report on it.",
  },
  {
    code: "GAI-IW",
    name: "Information Warfare",
    description:
      "Tracks whether stories about disinformation campaigns, propaganda operations, and media manipulation reach audiences beyond the directly affected region.",
  },
  {
    code: "GAI-WR",
    name: "Women's Rights",
    description:
      "Captures whether women's rights developments — progress or regression — receive attention beyond the region where they occur.",
  },
  {
    code: "GAI-EC",
    name: "Economics",
    description:
      "Measures whether economic crises, trade shifts, and policy changes affecting hundreds of millions receive proportionate global coverage.",
  },
  {
    code: "GAI-TE",
    name: "Technology",
    description:
      "Tracks coverage gaps in AI regulation, surveillance expansion, digital rights, and tech policy that affect billions but may only be reported in one or two regions.",
  },
  {
    code: "GAI-HE",
    name: "Health",
    description:
      "Measures whether health crises, disease outbreaks, and public health developments reach audiences beyond the affected region.",
  },
  {
    code: "GAI-CL",
    name: "Climate",
    description:
      "Captures whether climate disasters, policy shifts, and environmental events receive global attention proportionate to their impact.",
  },
];

const faqs = [
  {
    question: "What does GAI stand for?",
    answer:
      "GAI stands for Global Attention Index. It is a daily measurement created by Albis that quantifies whether news stories are covered across world regions, scored on a scale of 1 to 10. A low score means global coverage; a high score means the story is invisible to most of the world.",
  },
  {
    question: "How is GAI different from PGI?",
    answer:
      "The GAI measures whether a story is covered at all — visibility. The PGI (Perception Gap Index) measures how differently a story is framed — narrative divergence. A story can score GAI 1 (everyone covers it) but PGI 9 (everyone frames it completely differently). They are complementary measurements.",
  },
  {
    question: "What does a GAI score of 10 mean?",
    answer:
      "A GAI of 10 means a story exists in only one region and is almost completely invisible to the rest of the world. Despite potentially affecting millions of people, no other media ecosystem is reporting on it. These are the most significant blind spots in global information systems.",
  },
  {
    question: "Why does the GAI matter for ordinary news readers?",
    answer:
      "If you read news from only one region, you are systematically blind to stories that matter to billions of other people. The GAI reveals what your media ecosystem is not showing you — not because of censorship, but because of structural attention patterns in global media.",
  },
  {
    question: "How does Albis detect stories that are missing from a region?",
    answer:
      "Albis scans media in 9 native languages across 7 world regions three times daily. When a story appears in some regional media ecosystems but not others, the GAI scores that asymmetry. The more regions that miss a story, and the larger the populations in those regions, the higher the GAI score.",
  },
];

export default function WhatIsGAIPage() {
  const definedTermSchema = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: "Global Attention Index",
    alternateName: "GAI",
    description:
      "A daily measurement that quantifies whether news stories are covered across world regions, scoring information visibility asymmetry on a scale of 1 (covered everywhere) to 10 (almost invisible globally).",
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "Albis Media Intelligence Indexes",
      url: "https://www.albis.news/indexes",
    },
    url: "https://www.albis.news/what-is-global-attention-index",
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
              What Is the Global Attention Index (GAI)?
            </p>
            <p className="text-xl text-zinc-500 dark:text-zinc-400">
              A daily measurement of what the world is not seeing — revealing
              the stories most media ecosystems ignore entirely.
            </p>
          </div>

          {/* Definition */}
          <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
            <div className="space-y-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
              <p>
                The Global Attention Index (GAI) is a quantitative measurement
                created by{" "}
                <Link href="/" className="text-[#c8922a] hover:underline">
                  Albis
                </Link>{" "}
                that scores whether news stories are covered at all across world
                regions. It runs on a 1-10 scale, where 1 means every region is
                covering the story and 10 means the story is almost invisible
                globally. The GAI does not measure how a story is framed — that
                is the job of the{" "}
                <Link
                  href="/what-is-perception-gap-index"
                  className="text-[#c8922a] hover:underline"
                >
                  Perception Gap Index (PGI)
                </Link>
                . The GAI measures something more fundamental: whether people
                even know a story exists.
              </p>
              <p>
                Most people assume that if something important happens in the
                world, their news will tell them about it. The GAI proves this
                assumption wrong. A crisis affecting 200 million people can
                receive zero coverage in Western media. An election reshaping a
                continent can be invisible to audiences in Asia. These are not
                minor oversights — they are structural blind spots in how global
                information flows, and the GAI makes them measurable.
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
                Albis scans media sources across{" "}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  7 world regions
                </strong>{" "}
                in{" "}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  9 native languages
                </strong>{" "}
                three times daily. When a story appears in some regional media
                ecosystems but not others, the GAI quantifies that asymmetry.
                The score factors in four dimensions:
              </p>
            </div>

            <div className="mt-space-6 space-y-3">
              {[
                [
                  "Coverage breadth",
                  "How many of the 7 world regions are reporting on the story at all?",
                ],
                [
                  "Prominence disparity",
                  "Where does it appear? Front page in one region, absent in another?",
                ],
                [
                  "Population exposure",
                  "How many people live in the regions that are blind to the story?",
                ],
                [
                  "Significance severity",
                  "How important is the story relative to the people affected?",
                ],
              ].map(([label, desc]) => (
                <div key={label} className="flex gap-4">
                  <span className="font-[family-name:var(--font-source-serif)] text-sm font-semibold text-[#c8922a] whitespace-nowrap w-44 shrink-0">
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

          {/* How GAI Is Scored */}
          <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
            <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
              How GAI Is Scored
            </h2>
            <div className="space-y-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
              <p>
                The GAI uses a{" "}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  1-10 scale
                </strong>{" "}
                to measure information visibility across regions.
              </p>
            </div>

            <div className="mt-space-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-black/[0.05] p-4 dark:border-white/[0.05]">
                <span className="font-[family-name:var(--font-source-serif)] text-2xl font-semibold text-[#c8922a]">
                  1
                </span>
                <p className="mt-1 font-[family-name:var(--font-source-serif)] text-sm text-zinc-600 dark:text-zinc-400">
                  Global spotlight — every region is covering the story. High
                  global awareness. Think major international summits or global
                  natural disasters.
                </p>
              </div>
              <div className="rounded-lg border border-black/[0.05] p-4 dark:border-white/[0.05]">
                <span className="font-[family-name:var(--font-source-serif)] text-2xl font-semibold text-[#c8922a]">
                  3-4
                </span>
                <p className="mt-1 font-[family-name:var(--font-source-serif)] text-sm text-zinc-600 dark:text-zinc-400">
                  Broad awareness — most regions cover it but one or two miss
                  it. A significant trade deal covered everywhere except Africa
                  and Latin America.
                </p>
              </div>
              <div className="rounded-lg border border-black/[0.05] p-4 dark:border-white/[0.05]">
                <span className="font-[family-name:var(--font-source-serif)] text-2xl font-semibold text-[#c8922a]">
                  6-7
                </span>
                <p className="mt-1 font-[family-name:var(--font-source-serif)] text-sm text-zinc-600 dark:text-zinc-400">
                  Information shadow — only two or three regions cover the story.
                  Billions of people are completely unaware it is happening.
                </p>
              </div>
              <div className="rounded-lg border border-black/[0.05] p-4 dark:border-white/[0.05]">
                <span className="font-[family-name:var(--font-source-serif)] text-2xl font-semibold text-[#c8922a]">
                  10
                </span>
                <p className="mt-1 font-[family-name:var(--font-source-serif)] text-sm text-zinc-600 dark:text-zinc-400">
                  Near invisible — a story exists in one region only. The rest
                  of the world has no idea it is happening. A blind spot hiding
                  in plain sight.
                </p>
              </div>
            </div>

            {/* Example */}
            <div className="mt-space-8 rounded-lg border border-[#c8922a]/20 bg-[#c8922a]/[0.03] p-5 dark:border-[#c8922a]/15 dark:bg-[#c8922a]/[0.02]">
              <p className="font-[family-name:var(--font-source-serif)] text-sm font-semibold text-[#c8922a] uppercase tracking-wide mb-2">
                Example — GAI 7.4
              </p>
              <p className="font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                A national election in South Asia reshaping the future of 200
                million people. Covered extensively in South Asian and
                Asia-Pacific media. Virtually invisible in Western, Middle
                Eastern, and African outlets. GAI 7.4. If you only read
                English-language news, this event simply did not happen.
              </p>
            </div>
          </div>

          {/* The 7 GAI Tributaries */}
          <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
            <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-zinc-400 mb-space-6">
              The 7 GAI Tributaries
            </h2>
            <div className="space-y-space-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
              <p>
                Like the{" "}
                <Link
                  href="/what-is-perception-gap-index"
                  className="text-[#c8922a] hover:underline"
                >
                  PGI
                </Link>
                , the GAI is structured as a river system with seven tributaries.
                Each tributary measures attention blindness in a specific domain,
                weighted by regional population to reflect how many people are
                actually reached — or left in the dark.
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
                href="/indexes/gai"
                className="text-[#c8922a] hover:underline"
              >
                GAI dashboard
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
                The stories that receive the least attention are often the most
                important. A famine affecting millions, a democratic crisis
                reshaping a continent, a technological shift that will change how
                billions live — these events can happen in near-total global
                silence if they fall outside the attention patterns of dominant
                media ecosystems.
              </p>
              <p>
                The GAI does not judge why coverage gaps exist. It simply makes
                them visible. When you can see what your media is not showing
                you, you gain the ability to look for it yourself. Albis exists
                to make that possible — to ensure that no story affecting
                millions of people remains invisible simply because it does not
                fit the attention priorities of a few powerful media markets.
              </p>
              <p>
                Combined with the{" "}
                <Link
                  href="/what-is-perception-gap-index"
                  className="text-[#c8922a] hover:underline"
                >
                  PGI
                </Link>
                , the GAI creates a complete picture: not just how stories are
                framed differently, but whether they are seen at all. Together
                they form Albis&apos;s core measurement system for{" "}
                <Link
                  href="/perspectives"
                  className="text-[#c8922a] hover:underline"
                >
                  global information awareness
                </Link>
                .
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-space-16 border-t border-black/5 pt-space-16 dark:border-white/5">
            <div className="rounded-xl border border-[#c8922a]/20 bg-[#c8922a]/5 p-8 text-center dark:border-[#c8922a]/30 dark:bg-[#c8922a]/10">
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                See Live GAI Scores
              </h2>
              <p className="mt-3 font-[family-name:var(--font-source-serif)] text-base text-zinc-600 dark:text-zinc-400">
                Discover what your media is not showing you. Updated three times
                daily with blind spot analysis for every region.
              </p>
              <Link
                href="/indexes/gai"
                className="mt-6 inline-block rounded-lg bg-[#1a3a5c] px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                View the GAI Dashboard
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
                { href: "/indexes/gai", label: "GAI Dashboard — live scores updated 3x daily" },
                { href: "/what-is-perception-gap-index", label: "What Is the Perception Gap Index (PGI)?" },
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
