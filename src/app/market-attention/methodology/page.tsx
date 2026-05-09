import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Market Attention Watch methodology — Albis',
  description: 'How Albis compares public prediction-market attention with coverage-gap signals, and the limits of the method.',
  alternates: { canonical: 'https://www.albis.news/market-attention/methodology' },
};

export default function MarketAttentionMethodologyPage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#101010] dark:bg-[#0f0f0f] dark:text-[#f0efec]">
      <section className="border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c8922a]">Methodology</p>
          <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-4xl font-bold leading-[1.08] md:text-6xl">How Market Attention Watch works</h1>
          <p className="mt-5 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-xl">
            The aim is simple: show where public prediction-market attention and Albis news-attention signals appear to overlap or diverge. It is an editorial research tool, not a betting product.
          </p>
          <div className="mt-8 rounded-3xl border border-[#c8922a]/30 bg-white/85 p-5 text-sm leading-relaxed text-zinc-700 dark:bg-white/[0.04] dark:text-zinc-300">
            Albis does not recommend betting, trading, investing, hedging, or acting on a market price. The scores are a way to organise public signals for readers.
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-8 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
          <section className="rounded-3xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-white/[0.03]">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-zinc-950 dark:text-white">1. Public market listings</h2>
            <p className="mt-3">The page requests open, unauthenticated listings from Polymarket and Kalshi. It normalises only broad public fields where available: title, venue, price, volume, liquidity, short-term movement, category, close time, and public URL.</p>
            <p className="mt-3">If those public endpoints fail, the page uses clearly labelled local sample data so the product can still be viewed without implying that live market data was loaded.</p>
          </section>

          <section className="rounded-3xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-white/[0.03]">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-zinc-950 dark:text-white">2. Albis attention context</h2>
            <p className="mt-3">The comparison layer uses the same public scan snapshot that powers Albis growth tools. It builds a set of “mispriced attention” candidates: stories with signs of significance, perception gap, or uneven regional coverage.</p>
            <p className="mt-3">Market titles are matched to Albis stories using conservative text overlap. A match is a nearby context signal, not proof that the market and story are the same event.</p>
          </section>

          <section className="rounded-3xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-white/[0.03]">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-zinc-950 dark:text-white">3. Scoring</h2>
            <p className="mt-3">The market signal gives weight to available public indicators: volume, liquidity, price, and recent movement. The Albis signal comes from coverage-gap and perception-gap strength. The gap signal rises when market attention appears stronger than current Albis coverage context.</p>
            <p className="mt-3">The final attention score is bounded between 0 and 100. It is deliberately labelled as an attention score, not a probability, confidence estimate, forecast, or expected return.</p>
          </section>

          <section className="rounded-3xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-white/[0.03]">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-zinc-950 dark:text-white">4. Limits</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Prediction markets can be thin, volatile, playful, manipulated, or dominated by a small group of users.</li>
              <li>Prices are not verified by Albis and should not be treated as facts.</li>
              <li>Coverage gaps can reflect source availability, timing, language, or classification limits.</li>
              <li>Text matching can miss relevant stories or connect items that are only loosely related.</li>
              <li>The board is for media literacy and attention research only.</li>
            </ul>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/market-attention" className="inline-flex h-11 items-center justify-center rounded-full bg-[#c8922a] px-6 text-sm font-semibold text-white hover:bg-[#b17f24]">Back to Market Attention Watch</Link>
            <Link href="/disclaimer" className="inline-flex h-11 items-center justify-center rounded-full border border-black/[0.12] px-6 text-sm font-semibold text-zinc-700 hover:border-[#c8922a]/40 hover:text-[#c8922a] dark:border-white/[0.12] dark:text-zinc-300">Read disclaimer</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
