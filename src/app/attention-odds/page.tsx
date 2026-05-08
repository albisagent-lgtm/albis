import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteSnapshot } from '@/lib/site-snapshot';
import { buildAttentionOddsBoard } from '@/lib/growth-tools/attention-odds';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Attention Odds Board — Albis',
  description: 'A daily Albis attention-intelligence board for undercovered stories, coverage momentum, and narrative blind spots. Not betting odds.',
  alternates: { canonical: 'https://www.albis.news/attention-odds' },
  openGraph: {
    title: 'Attention Odds Board — Albis',
    description: 'A daily attention-intelligence board for undercovered stories and coverage momentum. Not betting odds.',
    url: 'https://www.albis.news/attention-odds',
  },
};

export default async function AttentionOddsPage() {
  const snapshot = await getSiteSnapshot();
  const stories = buildAttentionOddsBoard(snapshot.items);

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#0f0f0f] dark:bg-[#0f0f0f] dark:text-[#f0efec]">
      <section className="border-b border-black/[0.06] bg-gradient-to-b from-[#c8922a]/10 to-transparent dark:border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c8922a]">Attention intelligence · not betting</p>
          <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-playfair)] text-4xl font-bold leading-[1.08] md:text-6xl">
            Albis Attention Odds Board
          </h1>
          <p className="mt-5 max-w-2xl font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-xl">
            A daily watch board for stories that look under-attended relative to their detected significance, regional absence, or perception gap.
          </p>
          <div className="mt-8 rounded-3xl border border-[#c8922a]/25 bg-white/80 p-5 text-sm leading-relaxed text-zinc-600 dark:bg-white/[0.04] dark:text-zinc-400">
            These are not gambling odds, financial predictions, or certainty claims. They are directional Albis signals about attention, coverage momentum, and possible narrative blind spots.
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/tools/undercovered-story-finder" className="inline-flex h-11 items-center justify-center rounded-full bg-[#c8922a] px-6 text-sm font-semibold text-white hover:bg-[#b17f24]">Find undercovered stories</Link>
            <Link href="/free-company-scan" className="inline-flex h-11 items-center justify-center rounded-full border border-black/[0.12] px-6 text-sm font-semibold text-zinc-700 hover:border-[#c8922a]/40 hover:text-[#c8922a] dark:border-white/[0.12] dark:text-zinc-300">Get a company scan</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-5">
          {stories.map((story, index) => (
            <article key={`${story.headline}-${index}`} className="rounded-3xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-white/[0.03]">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c8922a]">#{index + 1} · {story.categoryLabel} · {story.forecastWindow}</p>
                  <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight md:text-3xl">{story.headline}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{story.connection}</p>
                </div>
                <div className="min-w-40 rounded-3xl bg-[#c8922a]/10 px-5 py-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c8922a]">Attention signal</p>
                  <p className="mt-1 text-4xl font-bold">{story.attentionSignal}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{story.signalLabel}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 text-sm md:grid-cols-3">
                <div className="rounded-2xl bg-[#f8f7f4] p-4 dark:bg-white/[0.04]"><span className="font-semibold">Detected in: </span>{story.coveredBy.join(', ') || 'limited sources'}</div>
                <div className="rounded-2xl bg-[#f8f7f4] p-4 dark:bg-white/[0.04]"><span className="font-semibold">Thin / not detected in: </span>{story.missingFrom.join(', ') || 'not enough data'}</div>
                <div className="rounded-2xl bg-[#f8f7f4] p-4 dark:bg-white/[0.04]"><span className="font-semibold">Why candidate: </span>{story.whyCandidate}</div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-green-500/15 bg-green-500/[0.04] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700 dark:text-green-300">Would confirm</p>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {story.confirmSignals.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
                <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.04] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700 dark:text-red-300">Would weaken</p>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {story.denySignals.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-black/[0.06] p-4 text-xs leading-relaxed text-zinc-500 dark:border-white/[0.07] dark:text-zinc-400">
                <p><span className="font-semibold text-zinc-800 dark:text-zinc-200">Evidence basis:</span> {story.evidenceBasis}</p>
                {story.evidenceWarnings.length ? <p className="mt-1">Limit: {story.evidenceWarnings.join(' ')}</p> : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
