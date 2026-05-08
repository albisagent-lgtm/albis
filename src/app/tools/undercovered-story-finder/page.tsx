import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteSnapshot } from '@/lib/site-snapshot';
import { buildMissingStories } from '@/lib/growth-tools/coverage-gap';
import UndercoveredStoryFinderClient from './undercovered-story-finder-client';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Undercovered Story Finder — Albis',
  description: 'Find candidate undercovered global stories and media blind spots using Albis regional coverage data.',
};

export default async function UndercoveredStoryFinderPage() {
  const snapshot = await getSiteSnapshot();
  const stories = buildMissingStories(snapshot.items);
  const categories = [...new Set(stories.map((story) => story.category))].sort();

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#0f0f0f] dark:bg-[#0f0f0f] dark:text-[#f0efec]">
      <section className="border-b border-black/[0.06] bg-gradient-to-b from-[#c8922a]/10 to-transparent dark:border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c8922a]">Research tool</p>
          <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-playfair)] text-4xl font-bold leading-[1.08] md:text-6xl">
            Undercovered Story Finder
          </h1>
          <p className="mt-5 max-w-2xl font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-xl">
            Explore candidate media blind spots from today’s Albis scan: stories detected in some regional lenses but not detected, or only thinly detected, in others.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/datasets/perception-gap-index" className="inline-flex h-11 items-center justify-center rounded-full bg-[#c8922a] px-6 text-sm font-semibold text-white hover:bg-[#b17f24]">Use the dataset</Link>
            <Link href="/widgets/perception-gap" className="inline-flex h-11 items-center justify-center rounded-full border border-black/[0.12] px-6 text-sm font-semibold text-zinc-700 hover:border-[#c8922a]/40 hover:text-[#c8922a] dark:border-white/[0.12] dark:text-zinc-300">Embed a widget</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <UndercoveredStoryFinderClient stories={stories} categories={categories} />
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-3xl border border-black/[0.07] bg-white p-6 text-sm leading-relaxed text-zinc-600 dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-zinc-400">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c8922a]">Evidence note</p>
          <p className="mt-3">This is a directional research tool, not proof that no coverage exists. “Not detected / thin” means the story was not detected, or was only lightly detected, in today’s Albis scan for that regional lens.</p>
          <p className="mt-2">For company, client, route, or sector relevance, use this as a starting point and configure a private Company Daily Scan around the actual watchlist.</p>
        </div>
      </section>
    </main>
  );
}
