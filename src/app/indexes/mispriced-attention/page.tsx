import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteSnapshot } from '@/lib/site-snapshot';
import { buildMispricedAttention } from '@/lib/growth-tools/mispriced-attention';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Mispriced Attention Index — Albis',
  description: 'A daily Albis index of candidate stories that appear under-detected across today’s regional media scan.',
};

export default async function MispricedAttentionPage() {
  const snapshot = await getSiteSnapshot();
  const stories = buildMispricedAttention(snapshot.items);
  const top = stories[0];

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#0f0f0f] dark:bg-[#0f0f0f] dark:text-[#f0efec]">
      <section className="border-b border-black/[0.06] bg-gradient-to-b from-[#c8922a]/10 to-transparent dark:border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c8922a]">Albis Index</p>
          <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-playfair)] text-4xl font-bold leading-[1.08] md:text-6xl">
            Mispriced Attention Index
          </h1>
          <p className="mt-5 max-w-2xl font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-xl">
            Markets misprice assets. Media feeds can misprice attention. This page tracks candidate stories that appear important relative to how widely they were detected in today’s Albis scan.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/what-am-i-missing" className="inline-flex h-11 items-center justify-center rounded-full bg-[#c8922a] px-6 text-sm font-semibold text-white hover:bg-[#b17f24]">
              See what your region may miss
            </Link>
            <Link href="/about" className="inline-flex h-11 items-center justify-center rounded-full border border-black/[0.12] px-6 text-sm font-semibold text-zinc-700 hover:border-[#c8922a]/40 hover:text-[#c8922a] dark:border-white/[0.12] dark:text-zinc-300">
              Why this matters
            </Link>
          </div>
        </div>
      </section>

      {top ? (
        <section className="mx-auto max-w-6xl px-6 py-14">
          <div className="rounded-3xl border border-[#c8922a]/25 bg-white p-6 shadow-[0_18px_60px_rgb(0,0,0,0.07)] dark:bg-white/[0.04] dark:shadow-none">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8922a]">Top candidate today</p>
            <div className="mt-4 grid gap-6 md:grid-cols-[1fr_180px] md:items-start">
              <div>
                <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold leading-tight">{top.headline}</h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{top.connection}</p>
                <p className="mt-4 rounded-2xl bg-[#f8f7f4] p-4 text-sm leading-relaxed text-zinc-600 dark:bg-white/[0.04] dark:text-zinc-400">{top.whyCandidate}</p>
              </div>
              <div className="rounded-3xl bg-[#c8922a]/10 p-5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c8922a]">Directional gap signal</p>
                <p className="mt-2 text-5xl font-bold">{top.directionalGapSignal}</p>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Directional Albis signal, not a certainty score.</p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c8922a]">Today&apos;s list</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold">Important, but not evenly detected</h2>
        </div>
        {stories.length ? (
          <div className="grid gap-4">
            {stories.map((story, index) => (
              <article key={`${story.headline}-${index}`} className="rounded-2xl border border-black/[0.07] bg-white p-5 dark:border-white/[0.07] dark:bg-white/[0.03]">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c8922a]">#{index + 1} · {story.categoryLabel}</p>
                    <h3 className="mt-1 font-[family-name:var(--font-playfair)] text-xl font-semibold">{story.headline}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{story.whyCandidate}</p>
                  </div>
                  <div className="min-w-28 rounded-2xl bg-[#f8f7f4] px-4 py-3 text-center dark:bg-white/[0.04]">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">Gap</p>
                    <p className="text-2xl font-bold">{story.directionalGapSignal}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-black/[0.07] bg-white p-8 text-zinc-600 dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-zinc-400">
            The index is waiting for the next Albis scan.
          </div>
        )}
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-14">
        <div className="rounded-3xl border border-black/[0.07] bg-white p-6 text-sm leading-relaxed text-zinc-600 dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-zinc-400">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c8922a]">Methodology note</p>
          <p className="mt-3">This index is a directional ranking, not a formal probability model and not proof that no coverage exists. It uses today’s Albis scan fields — significance label, detected regions, not-detected regions, coverage breadth, and perception-gap data where available.</p>
          <p className="mt-2">“Mispriced attention” is a shorthand for a candidate mismatch between apparent importance and detected coverage breadth. We use softer labels in the data cards because trust matters more than punchy wording.</p>
        </div>
      </section>

    </main>
  );
}
