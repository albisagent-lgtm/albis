import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicIndexDataset } from '@/lib/growth-tools/public-index-data';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Embeddable Perception Gap Widget — Albis',
  description: 'Embed a lightweight Albis Perception Gap chart on your site, newsletter, or classroom resource.',
};

export default async function PerceptionGapWidgetPage() {
  const dataset = await getPublicIndexDataset(20);
  const stories = dataset.pgiStories.sort((a, b) => b.pgi - a.pgi).slice(0, 5);
  const embed = '<iframe src="https://www.albis.news/widgets/perception-gap/embed" width="100%" height="420" style="border:0;border-radius:16px;overflow:hidden" loading="lazy" title="Albis Perception Gap widget"></iframe>';

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#0f0f0f] dark:bg-[#0f0f0f] dark:text-[#f0efec]">
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c8922a]">Embeddable widget</p>
        <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-playfair)] text-4xl font-bold leading-[1.08] md:text-6xl">
          Add today’s perception-gap chart to your site.
        </h1>
        <p className="mt-5 max-w-2xl font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-xl">
          A lightweight attribution widget for educators, bloggers, newsletters, and researchers who want to show how differently stories are being framed.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-3xl border border-black/[0.07] bg-white p-5 dark:border-white/[0.07] dark:bg-white/[0.03]">
            <WidgetCard stories={stories} />
          </div>
          <div className="space-y-5">
            <div className="rounded-3xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-white/[0.03]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c8922a]">Embed code</p>
              <pre className="mt-4 overflow-x-auto rounded-2xl bg-[#0f0f0f] p-4 text-xs leading-relaxed text-white"><code>{embed}</code></pre>
              <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">Keep the attribution visible. Do not imply Albis endorses your publication or analysis.</p>
            </div>
            <Link href="/datasets/perception-gap-index" className="inline-flex h-11 items-center justify-center rounded-full bg-[#c8922a] px-6 text-sm font-semibold text-white hover:bg-[#b17f24]">View dataset</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function WidgetCard({ stories }: { stories: { scanDate: string; headline: string; pgi: number }[] }) {
  return (
    <div className="rounded-2xl bg-[#f8f7f4] p-5 dark:bg-[#111]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c8922a]">Albis Perception Gap</p>
          <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-semibold">Highest divergence today</h2>
        </div>
        <Link href="/indexes" className="text-xs font-semibold text-[#c8922a]">Data by Albis</Link>
      </div>
      <div className="mt-5 space-y-3">
        {stories.length ? stories.map((story) => (
          <div key={`${story.scanDate}-${story.headline}`} className="rounded-xl bg-white p-4 dark:bg-white/[0.05]">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold leading-snug">{story.headline}</p>
              <span className="rounded-full bg-[#c8922a]/10 px-2 py-1 text-xs font-bold text-[#c8922a]">{story.pgi.toFixed(1)}</span>
            </div>
          </div>
        )) : <p className="text-sm text-zinc-500">Widget data is being prepared.</p>}
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">Directional framing-divergence signal. Not a truth score or endorsement.</p>
    </div>
  );
}
