import type { Metadata } from 'next';
import FreeCompanyScanClient from './free-company-scan-client';

export const metadata: Metadata = {
  title: 'Free sample narrative-risk scan — Albis',
  description: 'Preview how Albis turns global coverage gaps, regional framing, and evidence patterns into a company-specific daily narrative-risk scan.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Free sample narrative-risk scan — Albis',
    description: 'See what a Company Daily Scan could catch for a PR, logistics, public affairs, or research team.',
  },
};

const demoHref =
  'mailto:harry@albis.news?subject=Company%20Daily%20Scan%20demo&body=Hi%20Harry%2C%0A%0AI%27d%20like%20to%20book%20a%20Company%20Daily%20Scan%20demo.%0A%0ACompany%2Fteam%3A%0AWhat%20we%20track%3A%0AUseful%20times%3A%0A';

const bullets = [
  'A practical preview of what Albis catches beyond ordinary monitoring.',
  'Built around evidence patterns, coverage gaps, and what to watch next.',
  'Designed for teams tracking markets, policy, operations, reputation, supply chains, customers, and opportunities.',
];

export default function FreeCompanyScanPage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#0f0f0f] dark:bg-[#0f0f0f] dark:text-[#f0efec]">
      <section className="border-b border-black/[0.06] bg-gradient-to-b from-[#c8922a]/10 to-transparent dark:border-white/[0.06] dark:from-[#c8922a]/15">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="font-[family-name:var(--font-inter)] text-xs font-semibold uppercase tracking-[0.22em] text-[#c8922a]">Free sample scan</p>
            <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl">
              See the outside-world signals normal monitoring misses.
            </h1>
            <p className="mt-5 max-w-xl font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-xl">
              Albis shows how public signals are covered differently across regions, what coverage is missing, and what that could mean for your company, client, sector, market, route, or issue.
            </p>
            <div className="mt-7 space-y-3">
              {bullets.map((bullet) => (
                <div key={bullet} className="flex gap-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#c8922a]" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={demoHref} className="inline-flex h-11 items-center justify-center rounded-full bg-[#c8922a] px-6 text-sm font-semibold text-white shadow-[0_3px_14px_rgb(200,146,42,0.28)] transition-colors hover:bg-[#b17f24]">
                Book a demo
              </a>
              <a href="#sample" className="inline-flex h-11 items-center justify-center rounded-full border border-black/[0.12] px-6 text-sm font-semibold text-zinc-700 transition-colors hover:border-[#c8922a]/40 hover:text-[#c8922a] dark:border-white/[0.12] dark:text-zinc-300">
                Preview sample
              </a>
            </div>
            <p className="mt-4 max-w-xl text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
              These are illustrative examples, not live findings or professional advice. A real Company Daily Scan is configured around your company, markets, regions, operations, reputation, supply chains, customers, opportunities, watchlist, and current sources.
            </p>
          </div>
          <div id="sample">
            <FreeCompanyScanClient />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          <Card title="Why this drives growth" text="It gives buyers the aha moment before a sales conversation: Albis is not keyword alerts, it is outside-world intelligence with source-backed context." />
          <Card title="Why it drives revenue" text="The CTA is not generic. It points high-fit teams toward a demo or founder pilot around one company, market, client, sector, or route." />
          <Card title="Why it stays trustworthy" text="The sample uses careful language, shows implications without overclaiming, and sends people to the full Company Daily Scan flow." />
        </div>
      </section>
    </main>
  );
}

function Card({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-white/[0.03]">
      <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{text}</p>
    </div>
  );
}
