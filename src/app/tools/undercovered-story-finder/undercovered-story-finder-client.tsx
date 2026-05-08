'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { DISPLAY_REGIONS, REGION_LABELS } from '@/lib/scan-types';
import type { MissingStory } from '@/lib/growth-tools/coverage-gap';

export default function UndercoveredStoryFinderClient({ stories, categories }: { stories: MissingStory[]; categories: string[] }) {
  const [region, setRegion] = useState('all');
  const [category, setCategory] = useState('all');
  const [highOnly, setHighOnly] = useState(false);

  const filtered = useMemo(() => stories.filter((story) => {
    const regionOk = region === 'all' || story.missingFrom.includes(REGION_LABELS[region] || region.replace(/-/g, ' '));
    const categoryOk = category === 'all' || story.category === category;
    const highOk = !highOnly || story.directionalGapSignal >= 65 || (story.perceptionGap ?? 0) >= 6;
    return regionOk && categoryOk && highOk;
  }), [stories, region, category, highOnly]);

  return (
    <div>
      <div className="rounded-3xl border border-black/[0.07] bg-white p-5 dark:border-white/[0.07] dark:bg-white/[0.03]">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-semibold">
            Region lens
            <select value={region} onChange={(event) => setRegion(event.target.value)} className="mt-2 w-full rounded-xl border border-black/[0.1] bg-white px-3 py-2 text-sm dark:border-white/[0.1] dark:bg-[#111]">
              <option value="all">All regions</option>
              {DISPLAY_REGIONS.map((item) => <option key={item} value={item}>{REGION_LABELS[item]}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-xl border border-black/[0.1] bg-white px-3 py-2 text-sm dark:border-white/[0.1] dark:bg-[#111]">
              <option value="all">All categories</option>
              {categories.map((item) => <option key={item} value={item}>{item.replace(/-/g, ' ')}</option>)}
            </select>
          </label>
          <label className="flex items-end gap-3 rounded-xl border border-black/[0.07] p-3 text-sm dark:border-white/[0.07]">
            <input type="checkbox" checked={highOnly} onChange={(event) => setHighOnly(event.target.checked)} />
            High-signal only
          </label>
        </div>
      </div>

      <div className="mt-8 grid gap-5">
        {filtered.length ? filtered.map((story, index) => (
          <article key={`${story.headline}-${index}`} className="rounded-3xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-white/[0.03]">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c8922a]">{String(index + 1).padStart(2, '0')} · {story.categoryLabel}</p>
                <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight">{story.headline}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{story.connection}</p>
              </div>
              <div className="rounded-2xl bg-[#c8922a]/10 px-4 py-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c8922a]">Directional signal</p>
                <p className="mt-1 text-2xl font-bold">{story.directionalGapSignal}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded-2xl bg-[#f8f7f4] p-4 dark:bg-white/[0.04]"><span className="font-semibold">Detected in: </span>{story.coveredBy.join(', ') || 'limited sources'}</div>
              <div className="rounded-2xl bg-[#f8f7f4] p-4 dark:bg-white/[0.04]"><span className="font-semibold">Not detected / thin in: </span>{story.missingFrom.join(', ') || 'not enough data'}</div>
            </div>
            <div className="mt-4 rounded-2xl border border-black/[0.06] p-4 text-xs leading-relaxed text-zinc-500 dark:border-white/[0.07] dark:text-zinc-400">
              <p><span className="font-semibold text-zinc-800 dark:text-zinc-200">Evidence basis:</span> {story.evidenceBasis}</p>
              {story.evidenceWarnings.length ? <p className="mt-1">Limit: {story.evidenceWarnings.join(' ')}</p> : null}
            </div>
            <Link href="/free-company-scan" className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-[#c8922a] px-5 text-sm font-semibold text-white hover:bg-[#b17f24]">
              Translate this for a company/client
            </Link>
          </article>
        )) : (
          <div className="rounded-3xl border border-black/[0.07] bg-white p-8 text-zinc-600 dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-zinc-400">
            No stories match those filters yet. Try a broader region/category or check after the next Albis scan.
          </div>
        )}
      </div>
    </div>
  );
}
