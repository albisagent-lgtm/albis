import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Company Daily Scan — Albis",
  description:
    "A private daily briefing for your organisation, built from the global Albis scan. Track external risk, source gaps, sector movement, regions, and watchlists.",
  openGraph: {
    title: "Company Daily Scan — Albis",
    description:
      "The global picture, translated for your organisation. 10 source-backed stories delivered at your chosen local time.",
  },
};

const sampleItems = [
  {
    label: "Supply chain",
    title: "Port delays widen beyond the headline lane",
    body:
      "Regional sources connect the disruption to labour pressure and customs backlogs, while English-language coverage focuses mainly on shipping prices. For a logistics team, the useful signal is the route fragility, not the market headline.",
  },
  {
    label: "Policy",
    title: "New tariff language appears first in domestic outlets",
    body:
      "The earliest signal is not a formal rule change yet, but repeated framing from ministry-linked sources. Albis flags it because procurement and pricing teams may need a watch window before the policy hardens.",
  },
  {
    label: "Reputation",
    title: "A local story begins crossing into international feeds",
    body:
      "Coverage is still uneven, but the story has moved from local reporting into regional aggregators. That pattern often matters before the issue reaches major global outlets.",
  },
];

const useCases = [
  "Founders and operators who need a clean morning read",
  "PR and reputation teams watching narrative shifts",
  "Supply-chain teams tracking ports, routes, tariffs, and disruption",
  "Public affairs teams following policy and regional framing",
  "Researchers and analysts who need source trails, not noise",
  "Global organisations exposed to fast-changing regional risk",
];

export default function CompanyDailyScanPage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#0f0f0f] dark:bg-[#0f0f0f] dark:text-[#f0efec]">
      <section className="border-b border-black/[0.06] bg-gradient-to-b from-[#c8922a]/10 to-transparent dark:border-white/[0.06] dark:from-[#c8922a]/15">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="font-[family-name:var(--font-inter)] text-xs font-semibold uppercase tracking-[0.22em] text-[#c8922a]">
              Company Daily Scan
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl">
              The global picture, translated for your organisation.
            </h1>
            <p className="mt-5 max-w-xl font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-xl">
              Albis scans global news, source frames, and coverage gaps, then turns the useful signals into a private daily briefing for your sector, regions, risks, and watchlist.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#c8922a] px-6 text-sm font-semibold text-white shadow-[0_3px_14px_rgb(200,146,42,0.28)] transition-colors hover:bg-[#b17f24]"
              >
                Start 3-day trial
              </Link>
              <a
                href="#sample"
                className="inline-flex h-11 items-center justify-center rounded-full border border-black/[0.12] px-6 text-sm font-semibold text-zinc-700 transition-colors hover:border-[#c8922a]/40 hover:text-[#c8922a] dark:border-white/[0.12] dark:text-zinc-300"
              >
                See sample scan
              </a>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
              Built from the same intelligence layer that powers the public Albis briefing.
            </p>
            <p className="mt-3 max-w-xl text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">
              Company Daily Scan is an informational intelligence briefing, not legal, financial, investment, compliance, or professional advice. You remain responsible for decisions made from any briefing.
            </p>
          </div>

          <div className="rounded-3xl border border-black/[0.07] bg-white p-5 shadow-[0_16px_50px_rgb(0,0,0,0.08)] dark:border-white/[0.07] dark:bg-white/[0.04] dark:shadow-none">
            <div className="rounded-2xl border border-[#c8922a]/20 bg-[#f8f7f4] p-5 dark:bg-[#111]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c8922a]">
                    Private morning scan
                  </p>
                  <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold">
                    Meridian Logistics
                  </h2>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  10 signals
                </span>
              </div>
              <div className="mt-5 space-y-4">
                {sampleItems.map((item, i) => (
                  <div key={item.title} className="border-t border-black/[0.06] pt-4 dark:border-white/[0.07]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                      {String(i + 1).padStart(2, "0")} · {item.label}
                    </p>
                    <h3 className="mt-1 font-[family-name:var(--font-playfair)] text-lg font-semibold leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-5 rounded-xl bg-[#c8922a]/10 p-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                Each send is gated by source depth, editorial quality, subscription/trial state, and your chosen delivery time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          <Feature title="10 useful stories" text="Not an alert dump. A concise daily briefing with the company-relevant items that passed quality checks." />
          <Feature title="Source-backed" text="Open source links, source trails, and regional framing context when the wider picture matters." />
          <Feature title="Timed to your day" text="Delivered at your chosen local hour, with the dashboard archive waiting whenever you need it." />
        </div>
      </section>

      <section className="border-y border-black/[0.06] bg-white/55 dark:border-white/[0.06] dark:bg-white/[0.03]">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-2 md:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8922a]">
              How it fits Albis
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl font-bold md:text-4xl">
              The public briefing shows what is happening. The company scan shows what matters to you.
            </h2>
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-base">
            <p>
              Open Albis remains free: today&apos;s briefing, public articles, PGI, GAI, and the wider information-awareness mission.
            </p>
            <p>
              The Company Daily Scan is the private layer: the same global scan filtered through your organisation&apos;s sector, regions, exposures, risks, and watchlist.
            </p>
            <p>
              That means the business product does not replace the public side. It grows out of it.
            </p>
          </div>
        </div>
      </section>

      <section id="sample" className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8922a]">
            Sample structure
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl font-bold md:text-4xl">
            Source signal → company relevance → perception gap → practical implication.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            The scan is written to explain why a story matters for the organisation, not just that a headline exists.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-4">
          <Step number="01" title="Source signal" text="What credible sources are reporting, and where the signal first appeared." />
          <Step number="02" title="Company relevance" text="Why this touches your sector, geography, supply chain, reputation, or watchlist." />
          <Step number="03" title="Coverage gap" text="Where regions or source types are seeing the story differently — or not seeing it at all." />
          <Step number="04" title="Implication" text="What to watch next, without overclaiming or turning the scan into noise." />
        </div>
      </section>

      <section className="bg-[#0f0f0f] text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[0.9fr_1.1fr] md:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8922a]">
              Who it helps
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl font-bold md:text-4xl">
              Built for people who need signal before the day fills with noise.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {useCases.map((useCase) => (
              <div key={useCase} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-sm leading-relaxed text-white/70">
                {useCase}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center md:py-24">
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold md:text-4xl">
          Start with three free days.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 md:text-base">
          Set up your company profile, choose your delivery time, and let Albis prepare the first private daily scan when the next cycle runs.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/pricing" className="inline-flex h-11 items-center justify-center rounded-full bg-[#c8922a] px-6 text-sm font-semibold text-white hover:bg-[#b17f24]">
            View plans
          </Link>
          <Link href="/" className="inline-flex h-11 items-center justify-center rounded-full border border-black/[0.12] px-6 text-sm font-semibold text-zinc-700 hover:border-[#c8922a]/40 hover:text-[#c8922a] dark:border-white/[0.12] dark:text-zinc-300">
            Read today&apos;s public briefing
          </Link>
        </div>
        <p className="mx-auto mt-5 max-w-xl text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
          Albis helps surface source-backed signals and gaps, but no scan can guarantee complete coverage of every risk, source, region, or event. See our <Link href="/disclaimer" className="text-[#c8922a] underline decoration-[#c8922a]/30 underline-offset-2">disclaimer</Link>.
        </p>
      </section>
    </main>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-white/[0.03]">
      <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{text}</p>
    </div>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-5 dark:border-white/[0.07] dark:bg-white/[0.03]">
      <p className="text-xs font-bold tracking-[0.18em] text-[#c8922a]">{number}</p>
      <h3 className="mt-3 font-[family-name:var(--font-playfair)] text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{text}</p>
    </div>
  );
}
