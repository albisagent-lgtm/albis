import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Albis is news intelligence built to help you see the world clearly — without the noise, the anxiety, or the spin.",
};

const values = [
  {
    number: "01",
    title: "Patterns over headlines",
    body: "A single headline tells you almost nothing. The pattern across dozens of stories across multiple regions tells you something real. We surface the signal, not the noise.",
  },
  {
    number: "02",
    title: "Omissions matter",
    body: "What's not being reported is often more revealing than what is. We flag framing differences and coverage gaps so you can see the full picture — not just one version of it.",
  },
  {
    number: "03",
    title: "Calm over outrage",
    body: "News should inform, not agitate. Albis is designed to be spacious, calm, and respectful of your attention. No infinite scroll. No red alerts. No engagement bait.",
  },
  {
    number: "04",
    title: "Honest pricing",
    body: "The free tier is genuinely useful. Premium exists for people who want deeper analysis. No dark patterns, no manufactured urgency, no upsell tricks.",
  },
];

export default function AboutPage() {
  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#f8f7f4] py-24 dark:bg-[#0f0f0f] md:py-36">
        {/* Gradient wash */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/50 via-transparent to-transparent dark:from-amber-950/10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/30 to-transparent" />

        <div className="relative mx-auto max-w-3xl px-6">
          <p className="animate-fade-in text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
            About Albis
          </p>

          <h1 className="animate-fade-in-up delay-100 mt-5 font-[family-name:var(--font-playfair)] text-4xl font-light italic leading-[1.1] text-[#0f0f0f]/70 md:text-5xl lg:text-6xl dark:text-white/60">
            See the world clearly.
            <br />
            <span className="font-bold not-italic text-[#0f0f0f] dark:text-[#f0efec]">
              Without the noise.
            </span>
          </h1>

          <p className="animate-fade-in-up delay-200 mt-7 max-w-xl text-lg leading-relaxed text-zinc-500 dark:text-zinc-400">
            Albis is a pattern-aware news intelligence service — built for
            people who want to understand the world, not be consumed by it.
          </p>
        </div>
      </section>

      {/* ── Brand story ────────────────────────────────────────── */}
      <section className="bg-[#f8f7f4] py-16 dark:bg-[#0f0f0f] md:py-20">
        <div className="mx-auto max-w-2xl px-6">
          <div className="space-y-6 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p className="text-lg font-light text-zinc-700 dark:text-zinc-300">
              We built Albis because the information landscape is broken.
            </p>
            <p>
              Most news platforms are optimised for engagement. Engagement
              means outrage, fear, and doom-scrolling. The algorithm doesn&apos;t
              care whether you&apos;re informed — it cares whether you keep
              scrolling. Albis is optimised for understanding.
            </p>
            <p>
              Every day, Albis scans coverage across 7 regions and 12 topic
              categories, then surfaces the patterns that traditional news
              aggregators miss. Not just what happened — but what it means,
              who&apos;s telling it differently, and what&apos;s being left out
              entirely.
            </p>
            <p>
              Our approach is different: we don&apos;t tell you what to think.
              We show you the patterns, the framing differences, and the gaps
              in coverage — then let you draw your own conclusions.
            </p>
            <div className="border-l-2 border-[#c8922a]/40 pl-5 italic text-zinc-500 dark:text-zinc-400">
              <p className="font-[family-name:var(--font-playfair)] text-lg">
                &ldquo;The anti-doomscroll. Calm, spacious, and
                typography-first. Information without the noise.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Divider ────────────────────────────────────────────── */}
      <div className="mx-auto max-w-2xl px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-black/[0.08] to-transparent dark:via-white/[0.08]" />
      </div>

      {/* ── Values ─────────────────────────────────────────────── */}
      <section className="bg-[#f8f7f4] py-16 dark:bg-[#0f0f0f] md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
            What we believe
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] md:text-3xl">
            The principles behind every decision.
          </h2>

          <div className="mt-12 space-y-10">
            {values.map((v) => (
              <div key={v.number} className="flex gap-7">
                <span className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#c8922a]/25 leading-none mt-1 flex-shrink-0 dark:text-[#c8922a]/20">
                  {v.number}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {v.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats / numbers ────────────────────────────────────── */}
      <section className="bg-[#f2f0eb] py-16 dark:bg-[#111111] md:py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { value: "7", label: "Regions scanned daily" },
              { value: "12", label: "Topic categories" },
              { value: "Daily", label: "Intelligence updates" },
              { value: "0", label: "Outrage algorithms" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="rounded-2xl border border-black/[0.06] bg-white p-6 text-center dark:border-white/[0.06] dark:bg-white/[0.03]"
              >
                <p className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-[#1a3a5c] dark:text-[#4a7baa]">
                  {value}
                </p>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What we're not ─────────────────────────────────────── */}
      <section className="bg-[#0f0f0f] py-20 md:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]/70">
            A different kind of news
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-white md:text-3xl">
            What Albis is not.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                not: "Not a news feed",
                is: "A daily intelligence briefing — curated, contextualised, calm.",
              },
              {
                not: "Not algorithmically ranked",
                is: "Pattern-aware curation that surfaces what matters, not what enrages.",
              },
              {
                not: "Not politically aligned",
                is: "We show you all sides. You decide what to think.",
              },
            ].map(({ not, is }) => (
              <div
                key={not}
                className="rounded-xl border border-white/[0.07] bg-white/[0.04] p-5 text-left"
              >
                <p className="text-xs font-semibold line-through text-zinc-600">
                  {not}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {is}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="bg-[#f8f7f4] py-20 dark:bg-[#0f0f0f] md:py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] md:text-3xl">
            Ready to see the patterns?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-zinc-500 dark:text-zinc-400">
            Start free. No credit card. Get your first briefing today.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#1a3a5c] px-8 text-sm font-semibold text-white shadow-[0_4px_16px_rgb(26,58,92,0.3)] hover:bg-[#243f66]"
            >
              Start free →
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 items-center rounded-full border border-black/[0.1] px-8 text-sm font-medium text-zinc-600 hover:bg-zinc-100/80 dark:border-white/[0.1] dark:text-zinc-400 dark:hover:bg-white/[0.05]"
            >
              See today&apos;s scan
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
