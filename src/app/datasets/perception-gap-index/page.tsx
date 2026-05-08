import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicIndexDataset } from '@/lib/growth-tools/public-index-data';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Perception Gap Index Dataset — Albis',
  description: 'Download and cite the Albis Perception Gap Index story-score dataset for research, journalism, and media-literacy work.',
};

export default async function PerceptionGapDatasetPage() {
  const dataset = await getPublicIndexDataset(30);
  const topStories = dataset.pgiStories.sort((a, b) => b.pgi - a.pgi).slice(0, 8);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Albis Perception Gap Index story scores',
    description: 'A public dataset of Albis story-level Perception Gap Index scores, measuring how differently regions frame the same story.',
    url: 'https://www.albis.news/datasets/perception-gap-index',
    creator: { '@type': 'Organization', name: 'Albis', url: 'https://www.albis.news' },
    distribution: [
      { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: 'https://www.albis.news/api/datasets/perception-gap-index' },
      { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: 'https://www.albis.news/api/datasets/perception-gap-index?format=csv' },
    ],
    license: 'https://www.albis.news/terms',
    dateModified: dataset.generatedAt,
  };

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#0f0f0f] dark:bg-[#0f0f0f] dark:text-[#f0efec]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="border-b border-black/[0.06] bg-gradient-to-b from-[#c8922a]/10 to-transparent dark:border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c8922a]">Public dataset</p>
          <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-playfair)] text-4xl font-bold leading-[1.08] md:text-6xl">
            Perception Gap Index dataset
          </h1>
          <p className="mt-5 max-w-2xl font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-xl">
            A citable dataset for researchers, journalists, librarians, and educators studying how the same story is framed differently across regions.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="/api/datasets/perception-gap-index" className="inline-flex h-11 items-center justify-center rounded-full bg-[#c8922a] px-6 text-sm font-semibold text-white hover:bg-[#b17f24]">Download JSON</a>
            <a href="/api/datasets/perception-gap-index?format=csv" className="inline-flex h-11 items-center justify-center rounded-full border border-black/[0.12] px-6 text-sm font-semibold text-zinc-700 hover:border-[#c8922a]/40 hover:text-[#c8922a] dark:border-white/[0.12] dark:text-zinc-300">Download CSV</a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c8922a]">Latest high-divergence stories</p>
          <div className="mt-5 grid gap-4">
            {topStories.length ? topStories.map((story) => (
              <article key={`${story.scanDate}-${story.headline}`} className="rounded-2xl border border-black/[0.07] bg-white p-5 dark:border-white/[0.07] dark:bg-white/[0.03]">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">{story.scanDate}</p>
                <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-xl font-semibold leading-tight">{story.headline}</h2>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">PGI score: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{story.pgi.toFixed(1)}</span></p>
              </article>
            )) : <p className="rounded-2xl bg-white p-5 text-zinc-500 dark:bg-white/[0.03]">Dataset rows are being prepared.</p>}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-white/[0.03]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c8922a]">Use and citation</p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Suggested citation: Albis, “Perception Gap Index story scores,” accessed {new Date(dataset.generatedAt).toISOString().split('T')[0]}, https://www.albis.news/datasets/perception-gap-index.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
              Attribution is requested. Do not imply Albis endorses your analysis. Dataset rows are directional research signals and should be interpreted with the methodology and limitations in mind.
            </p>
          </div>
          <div className="rounded-3xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-white/[0.03]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c8922a]">Methodology</p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              PGI is a directional Albis measure of framing divergence. It is not a truth score, bias score, or claim that one region is correct.
            </p>
            <Link href="/methodology" className="mt-4 inline-block text-sm font-semibold text-[#c8922a] hover:text-[#b17f24]">Read methodology →</Link>
          </div>
        </aside>
      </section>
    </main>
  );
}
