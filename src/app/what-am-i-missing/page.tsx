import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteSnapshot } from '@/lib/site-snapshot';
import { DISPLAY_REGIONS, REGION_LABELS } from '@/lib/scan-types';
import { buildMissingStories } from '@/lib/growth-tools/coverage-gap';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'What Am I Missing? — Albis',
  description: 'See undercovered global stories and directional coverage gaps that ordinary news feeds may miss.',
};

export default async function WhatAmIMissingPage({ searchParams }: { searchParams?: Promise<{ region?: string }> }) {
  const params = await searchParams;
  const region = params?.region || 'western-world';
  const snapshot = await getSiteSnapshot();
  const stories = buildMissingStories(snapshot.items, region);
  const label = REGION_LABELS[region] || region.replace(/-/g, ' ');

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#0f0f0f] dark:bg-[#0f0f0f] dark:text-[#f0efec]">
      <section className="border-b border-black/[0.06] bg-gradient-to-b from-[#c8922a]/10 to-transparent dark:border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c8922a]">What Am I Missing?</p>
          <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-playfair)] text-4xl font-bold leading-[1.08] md:text-6xl">
            Candidate stories your region may not be seeing clearly yet.
          </h1>
          <p className="mt-5 max-w-2xl font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-xl">
            Albis compares regional coverage to surface candidate coverage gaps: stories detected in some regional lenses but not detected, or only thinly detected, in others.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {DISPLAY_REGIONS.map((item) => (
              <Link key={item} href={`/what-am-i-missing?region=${item}`} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${item === region ? 'border-[#c8922a] bg-[#c8922a] text-white' : 'border-black/[0.1] bg-white text-zinc-700 hover:border-[#c8922a]/50 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-zinc-300'}`}>
                {REGION_LABELS[item]}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c8922a]">Current lens</p>
            <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold">What {label} may be missing</h2>
          </div>
          <Link href="/create" className="inline-flex h-10 items-center justify-center rounded-full bg-[#c8922a] px-5 text-sm font-semibold text-white hover:bg-[#b17f24]">
            Share a missing angle
          </Link>
        </div>

        {stories.length ? (
          <div className="grid gap-5">
            {stories.map((story, index) => (
              <article key={`${story.headline}-${index}`} className="rounded-3xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-white/[0.03]">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c8922a]">{String(index + 1).padStart(2, '0')} · {story.categoryLabel}</p>
                    <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight">{story.headline}</h3>
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{story.connection}</p>
                  </div>
                  <div className="rounded-2xl bg-[#c8922a]/10 px-4 py-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c8922a]">Directional gap signal</p>
                    <p className="mt-1 text-2xl font-bold">{story.directionalGapSignal}</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-2xl bg-[#f8f7f4] p-4 dark:bg-white/[0.04]"><span className="font-semibold">Covered by: </span>{story.coveredBy.join(', ') || 'limited sources'}</div>
                  <div className="rounded-2xl bg-[#f8f7f4] p-4 dark:bg-white/[0.04]"><span className="font-semibold">Not detected / thin in: </span>{story.missingFrom.join(', ') || 'not enough data'}</div>
                </div>
                <div className="mt-4 rounded-2xl border border-black/[0.06] p-4 text-xs leading-relaxed text-zinc-500 dark:border-white/[0.07] dark:text-zinc-400">
                  <p><span className="font-semibold text-zinc-800 dark:text-zinc-200">Evidence basis:</span> {story.evidenceBasis}</p>
                  {story.evidenceWarnings.length ? <p className="mt-1">Limit: {story.evidenceWarnings.join(' ')}</p> : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-black/[0.07] bg-white p-8 text-zinc-600 dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-zinc-400">
            Today&apos;s coverage-gap view is still being prepared. Check back after the next Albis scan.
          </div>
        )}
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-14">
        <div className="rounded-3xl border border-black/[0.07] bg-white p-6 text-sm leading-relaxed text-zinc-600 dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-zinc-400">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c8922a]">Methodology note</p>
          <p className="mt-3">This is a directional Albis view, not a claim that no coverage exists anywhere. “Not detected / thin” means the story was not detected, or was only lightly detected, in today’s Albis scan for that regional lens.</p>
          <p className="mt-2">The signal uses available scan fields such as significance label, detected regions, not-detected regions, coverage breadth, and perception-gap data where available. Items with thin evidence are held back or caveated.</p>
        </div>
      </section>

    </main>
  );
}
