import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteSnapshot } from '@/lib/site-snapshot';
import { buildMarketAttentionBoard } from '@/lib/growth-tools/market-attention';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Market Attention Watch — Albis',
  description: 'A public-interest watch board comparing prediction-market attention with Albis coverage-gap signals. Not betting or trading advice.',
  alternates: { canonical: 'https://www.albis.news/market-attention' },
  openGraph: {
    title: 'Market Attention Watch — Albis',
    description: 'Prediction-market attention compared with Albis coverage-gap signals. Not betting or trading advice.',
    url: 'https://www.albis.news/market-attention',
  },
};

function formatNumber(value: number | null) {
  if (value === null) return 'not available';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return Math.round(value).toLocaleString('en-US');
}

function formatPrice(value: number | null) {
  if (value === null) return 'not available';
  return `${Math.round(value * 100)}% implied by market price`;
}

function formatMove(value: number | null) {
  if (value === null) return 'not available';
  const sign = value > 0 ? '+' : '';
  return `${sign}${Math.round(value * 100)} pts`;
}

export default async function MarketAttentionPage() {
  const snapshot = await getSiteSnapshot();
  const board = await buildMarketAttentionBoard(snapshot.items);

  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#101010] dark:bg-[#0f0f0f] dark:text-[#f0efec]">
      <section className="border-b border-black/[0.06] bg-gradient-to-b from-[#c8922a]/10 to-transparent dark:border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c8922a]">Public-interest monitor · no advice</p>
          <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-playfair)] text-4xl font-bold leading-[1.08] md:text-6xl">
            Market Attention Watch
          </h1>
          <p className="mt-5 max-w-3xl font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-xl">
            A plain-English board comparing public prediction-market attention with Albis coverage-gap signals. It is designed to show where attention is clustering, not what anyone should buy, sell, bet on, or believe.
          </p>
          <div className="mt-8 rounded-3xl border border-[#c8922a]/30 bg-white/85 p-5 text-sm leading-relaxed text-zinc-700 shadow-sm dark:bg-white/[0.04] dark:text-zinc-300">
            <strong className="text-zinc-950 dark:text-white">Important:</strong> this page is journalism-adjacent signal analysis only. It is not betting advice, trading advice, investment research, a recommendation, or a prediction of what will happen. Prediction markets can be wrong, thin, playful, manipulated, or simply noisy.
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/market-attention/methodology" className="inline-flex h-11 items-center justify-center rounded-full bg-[#c8922a] px-6 text-sm font-semibold text-white hover:bg-[#b17f24]">Read the methodology</Link>
            <Link href="/indexes/mispriced-attention" className="inline-flex h-11 items-center justify-center rounded-full border border-black/[0.12] px-6 text-sm font-semibold text-zinc-700 hover:border-[#c8922a]/40 hover:text-[#c8922a] dark:border-white/[0.12] dark:text-zinc-300">See Albis attention gaps</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-3 md:grid-cols-3">
          {board.sourceStatus.map((status) => (
            <div key={status} className="rounded-2xl border border-black/[0.06] bg-white p-4 text-xs leading-relaxed text-zinc-600 dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-zinc-400">
              {status}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">Updated {new Date(board.updatedAt).toLocaleString('en-GB', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' })} UTC. Public listings only; no user or account data.</p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-5">
          {board.rows.map((row, index) => (
            <article key={`${row.market.id}-${index}`} className="rounded-3xl border border-black/[0.07] bg-white p-6 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.03]">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c8922a]">#{index + 1} · {row.market.venue} · {row.label}</p>
                  <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight md:text-3xl">{row.market.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{row.plainEnglish}</p>
                  {row.market.url ? (
                    <a href={row.market.url} rel="nofollow noreferrer" target="_blank" className="mt-3 inline-flex text-sm font-semibold text-[#a56f16] hover:text-[#7d5411]">
                      Public market listing ↗
                    </a>
                  ) : null}
                </div>
                <div className="grid min-w-52 gap-3 rounded-3xl bg-[#c8922a]/10 p-5 text-center">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c8922a]">Attention score</p>
                    <p className="mt-1 text-4xl font-bold">{row.attentionScore}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-zinc-600 dark:text-zinc-400">
                    <span>Market {row.marketSignal}</span>
                    <span>Albis {row.albisSignal}</span>
                    <span>Gap {row.gapSignal}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 text-sm md:grid-cols-4">
                <div className="rounded-2xl bg-[#f8f7f4] p-4 dark:bg-white/[0.04]"><span className="font-semibold">Price: </span>{formatPrice(row.market.price)}</div>
                <div className="rounded-2xl bg-[#f8f7f4] p-4 dark:bg-white/[0.04]"><span className="font-semibold">Volume: </span>{formatNumber(row.market.volume)}</div>
                <div className="rounded-2xl bg-[#f8f7f4] p-4 dark:bg-white/[0.04]"><span className="font-semibold">Liquidity: </span>{formatNumber(row.market.liquidity)}</div>
                <div className="rounded-2xl bg-[#f8f7f4] p-4 dark:bg-white/[0.04]"><span className="font-semibold">Movement: </span>{formatMove(row.market.movement)}</div>
              </div>

              <div className="mt-5 rounded-2xl border border-black/[0.06] p-4 text-sm leading-relaxed dark:border-white/[0.07]">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">Nearest Albis context</p>
                {row.matchedStory ? (
                  <p className="mt-2 text-zinc-600 dark:text-zinc-400">{row.matchedStory.headline} — {row.matchedStory.whyCandidate}</p>
                ) : (
                  <p className="mt-2 text-zinc-600 dark:text-zinc-400">No close match in the current Albis public scan. That may mean the market is outside today’s coverage, too narrow, too new, or simply not connected to a clear news signal.</p>
                )}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-blue-500/15 bg-blue-500/[0.04] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">Evidence used</p>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {row.evidence.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
                <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.04] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-700 dark:text-red-300">Limits</p>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {row.caveats.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
