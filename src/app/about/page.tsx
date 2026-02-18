import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "Albis is pattern-aware news intelligence — built to help you see the world clearly, without the noise.",
};

export default function AboutPage() {
  return (
    <main>
      <section className="border-b border-zinc-200 py-16 dark:border-zinc-800/50 md:py-24">
        <div className="mx-auto max-w-2xl px-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400/80">
            About
          </p>
          <h1 className="mt-4 text-3xl font-light italic leading-snug text-zinc-800 dark:text-zinc-100 md:text-4xl">
            See the world clearly
          </h1>
          <div className="mt-8 space-y-5 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              Albis is a pattern-aware news intelligence service. Every day, we scan
              coverage across 7 regions and 12 topic categories, then surface the patterns
              that traditional news aggregators miss.
            </p>
            <p>
              We built Albis because the information landscape is broken. Most news
              platforms are optimised for engagement — outrage, fear, and doom-scrolling.
              Albis is optimised for understanding.
            </p>
            <p>
              Our approach is different: we do not tell you what to think. We show you the
              patterns, the framing differences, and the gaps in coverage — then let you
              draw your own conclusions.
            </p>
            <p>
              Albis is the anti-doomscroll. Calm, spacious, and typography-first. Information
              without the noise.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            What we believe
          </h2>
          <div className="mt-8 space-y-8">
            {[
              {
                title: "Patterns over headlines",
                body: "A single headline tells you almost nothing. The pattern across dozens of stories across multiple regions tells you something real.",
              },
              {
                title: "Omissions matter",
                body: "What is not being reported is often more revealing than what is. We flag framing differences and coverage gaps so you can see the full picture.",
              },
              {
                title: "Calm over outrage",
                body: "News should inform, not agitate. Albis is designed to be spacious, calm, and respectful of your attention.",
              },
              {
                title: "Honest pricing",
                body: "The free tier is genuinely useful. Premium exists for people who want deeper analysis. No dark patterns, no upsell tricks.",
              },
            ].map((item) => (
              <div key={item.title}>
                <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 dark:border-zinc-800/50">
        <div className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
            Ready to see the patterns?
          </h2>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center rounded-full bg-zinc-900 px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Sign up free
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-full border border-zinc-300 px-8 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
            >
              See today&apos;s scan
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
