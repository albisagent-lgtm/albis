import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How Albis Works — Our Editorial Process",
  description:
    "Learn how Albis scans 60+ countries in 16 languages to deliver unbiased global news, powered by AI and human editorial oversight.",
  alternates: {
    canonical: "https://www.albis.news/editorial",
  },
};

export default function EditorialPage() {
  return (
    <main className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-2xl px-6 py-16 md:py-24">
        {/* Header */}
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
          Editorial Process
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold leading-[1.15] tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">
          How Albis Works
        </h1>
        <p className="mt-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          Albis is a global news intelligence platform. We scan media from over
          60&nbsp;countries in 16&nbsp;languages, three times daily, to show you
          how the same stories are told differently around the world.
        </p>

        {/* How the scanner works */}
        <div className="mt-16 border-t border-black/5 pt-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-6">
            The Scanner
          </h2>
          <div className="space-y-5 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              Our AI-powered scanner reviews news sources across{" "}
              <strong className="text-zinc-800 dark:text-zinc-200">
                7&nbsp;regions
              </strong>
              ,{" "}
              <strong className="text-zinc-800 dark:text-zinc-200">
                60+ countries
              </strong>
              , and{" "}
              <strong className="text-zinc-800 dark:text-zinc-200">
                16&nbsp;languages
              </strong>{" "}
              — including English, Arabic, Farsi, Mandarin, Russian, Hindi,
              Spanish, French, Turkish, Portuguese, Japanese, Korean, Urdu,
              Bengali, Kiswahili, and Bahasa Indonesia.
            </p>
            <p>
              Each scan captures how regional outlets frame events, what language
              they use, what they emphasise, and — critically — what they leave
              out. We run this cycle three times every day.
            </p>
          </div>
        </div>

        {/* Editorial process */}
        <div className="mt-16 border-t border-black/5 pt-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-6">
            Editorial Pipeline
          </h2>
          <div className="space-y-5 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              Every article published on Albis passes through a three-stage
              process:
            </p>
            <ol className="list-decimal list-outside ml-6 space-y-3">
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">
                  Automated scanning.
                </strong>{" "}
                AI agents read hundreds of sources in their original languages,
                identifying stories with significant cross-regional framing
                differences.
              </li>
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">
                  Editorial filter.
                </strong>{" "}
                Stories are assessed for significance, verified against multiple
                regional sources, and prioritised by global relevance.
              </li>
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">
                  Opus-level editorial rewrite.
                </strong>{" "}
                Each article is rewritten to editorial standard — clear, concise,
                balanced, and free of any single regional framing. Every claim is
                attributed to its source.
              </li>
            </ol>
            <p>
              This pipeline ensures that what you read on Albis is not a
              copy-paste of any single outlet, but an original synthesis drawn
              from multiple perspectives.
            </p>
          </div>
        </div>

        {/* Sourcing */}
        <div className="mt-16 border-t border-black/5 pt-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-6">
            Sourcing &amp; Attribution
          </h2>
          <div className="space-y-5 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              Every article on Albis cites original regional sources. We
              don&apos;t report unnamed claims or rely on single-source
              reporting. When a story is covered in five different regions using
              five different framings, we show all five — with attribution.
            </p>
            <p>
              Albis cross-references coverage across regions to identify{" "}
              <strong className="text-zinc-800 dark:text-zinc-200">
                perception gaps
              </strong>
              : places where the same event is told so differently that audiences
              in different countries form fundamentally different understandings
              of what happened.
            </p>
          </div>
        </div>

        {/* Perception Gap Index */}
        <div className="mt-16 border-t border-black/5 pt-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-6">
            The Perception Gap Index (PGI)
          </h2>
          <div className="space-y-5 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              The PGI is Albis&apos;s proprietary metric for measuring{" "}
              <strong className="text-zinc-800 dark:text-zinc-200">
                narrative distance
              </strong>{" "}
              between regions on the same story. Scored on a 1–10 scale, it
              quantifies how differently events are framed, interpreted, and
              weighted around the world.
            </p>
            <p>
              The index tracks seven tributaries, each capturing a distinct
              dimension of global narrative divergence:
            </p>
            <ul className="list-disc list-outside ml-6 space-y-2">
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">
                  Geopolitics
                </strong>{" "}
                — power, conflict, sovereignty, alliances
              </li>
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">
                  Information warfare
                </strong>{" "}
                — propaganda, censorship, narrative control
              </li>
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">
                  Women&apos;s rights
                </strong>{" "}
                — gender policy, bodily autonomy, representation
              </li>
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">
                  Economics
                </strong>{" "}
                — trade, markets, inequality, sanctions
              </li>
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">
                  Technology
                </strong>{" "}
                — AI, surveillance, digital rights, innovation
              </li>
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">
                  Health
                </strong>{" "}
                — pandemics, access, pharmaceutical geopolitics
              </li>
              <li>
                <strong className="text-zinc-800 dark:text-zinc-200">
                  Climate
                </strong>{" "}
                — emissions, adaptation, environmental justice
              </li>
            </ul>
            <p>
              A PGI of 2 means broad consensus. A PGI of 8+ means the world is
              seeing completely different realities on the same event.
            </p>
          </div>
        </div>

        {/* Global Attention Index */}
        <div className="mt-16 border-t border-black/5 pt-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-6">
            The Global Attention Index (GAI)
          </h2>
          <div className="space-y-5 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              The GAI measures whether stories receive{" "}
              <strong className="text-zinc-800 dark:text-zinc-200">
                any coverage at all
              </strong>{" "}
              across regions. Some of the world&apos;s most consequential events
              are covered by only one or two regions while billions of people
              never hear about them.
            </p>
            <p>
              The GAI makes these blind spots visible. When a story scores low on
              the GAI, it means most of the world isn&apos;t watching — and
              that&apos;s often where the most important stories are hiding.
            </p>
          </div>
        </div>

        {/* About the founder */}
        <div className="mt-16 border-t border-black/5 pt-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-4">
            About the Founder
          </h2>
          <p className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
            Harry Wenham
          </p>
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
            Independent journalist &amp; media analyst · New Zealand
          </p>
          <div className="mt-5 space-y-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              Harry Wenham is an independent journalist and media analyst based
              in New Zealand. He built Albis to help people understand how
              information shapes perception worldwide — not by telling them what
              to think, but by showing them what they&apos;re not being shown.
            </p>
            <p>
              Albis grew from research into how media framing influences public
              understanding across borders. The goal is simple: give everyone
              access to the full picture, regardless of which country or language
              they happen to read in.
            </p>
          </div>
        </div>

        {/* Corrections policy */}
        <div className="mt-16 border-t border-black/5 pt-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-6">
            Corrections Policy
          </h2>
          <div className="space-y-5 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              Albis is committed to accuracy. If we get something wrong, we
              correct it promptly and transparently. Corrections are noted
              directly on the affected article.
            </p>
            <p>
              To report an error or request a correction, contact us at{" "}
              <a
                href="mailto:harry@albis.news"
                className="text-[#c8922a] hover:underline"
              >
                harry@albis.news
              </a>
              .
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-16 border-t border-black/5 pt-12 dark:border-white/5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#c8922a] hover:underline"
          >
            ← Back to Albis
          </Link>
        </div>
      </div>
    </main>
  );
}
