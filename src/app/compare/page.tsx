import type { Metadata } from "next";
import Link from "next/link";
import { comparisons } from "./comparisons";
import { multiComparisons } from "./multi-comparisons";

export const metadata: Metadata = {
  title: "Compare Albis — How We Stack Up Against Other News Platforms",
  description:
    "Honest, side-by-side comparisons of Albis with Ground News, 1440, AllSides, Flipboard, Apple News, and more. Best-of guides and alternative roundups.",
  openGraph: {
    title: "Compare Albis — Honest News Platform Comparisons",
    description:
      "Side-by-side comparisons, best-of guides, and alternative roundups. No spin — just honest analysis of which news platform fits you best.",
    url: "https://www.albis.news/compare",
  },
};

const bestOf = multiComparisons.filter((c) => c.type === "best-of");
const alternatives = multiComparisons.filter((c) => c.type === "alternative");

export default function ComparePage() {
  return (
    <main className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          How Albis Compares
        </h1>
        <p className="mt-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          Honest comparisons, best-of guides, and alternative roundups. We
          believe in transparency — so we&apos;ll tell you when a competitor is the
          better choice for your needs.
        </p>

        {/* Head-to-Head */}
        <h2 className="mt-14 font-[family-name:var(--font-playfair)] text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Head-to-Head Comparisons
        </h2>
        <div className="mt-6 space-y-4">
          {comparisons.map((c) => (
            <CompareCard key={c.slug} slug={c.slug} title={c.title} excerpt={c.opening} />
          ))}
        </div>

        {/* Best Of */}
        <h2 className="mt-14 font-[family-name:var(--font-playfair)] text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Best Of Guides
        </h2>
        <div className="mt-6 space-y-4">
          {bestOf.map((c) => (
            <CompareCard key={c.slug} slug={c.slug} title={c.title} excerpt={c.opening} />
          ))}
        </div>

        {/* Alternatives */}
        <h2 className="mt-14 font-[family-name:var(--font-playfair)] text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Alternative Roundups
        </h2>
        <div className="mt-6 space-y-4">
          {alternatives.map((c) => (
            <CompareCard key={c.slug} slug={c.slug} title={c.title} excerpt={c.opening} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-xl border border-[#c8922a]/20 bg-[#c8922a]/5 p-8 text-center dark:border-[#c8922a]/30 dark:bg-[#c8922a]/10">
          <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Try Albis free
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            3 daily scans. 7 world regions. Zero spin. The daily briefing is
            free — no credit card, no commitment.
          </p>
          <Link
            href="/signup"
            className="mt-4 inline-block rounded-lg bg-[#c8922a] px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Get the free briefing
          </Link>
        </div>
      </div>
    </main>
  );
}

function CompareCard({ slug, title, excerpt }: { slug: string; title: string; excerpt: string }) {
  return (
    <Link
      href={`/compare/${slug}`}
      className="block rounded-xl border border-black/[0.06] bg-white p-6 transition-shadow hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.02]"
    >
      <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {excerpt.slice(0, 200)}…
      </p>
      <span className="mt-3 inline-block text-sm font-medium text-[#c8922a]">
        Read comparison →
      </span>
    </Link>
  );
}
