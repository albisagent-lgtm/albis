import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Weather & Risk Signals — Albis",
  description:
    "Physical risk, market-implied signals, media attention, and missing context — a calm Albis signal desk for what may affect daily life.",
};

const fiveQuestions = [
  "What is happening physically?",
  "Who or what is exposed?",
  "What are markets pricing or watching?",
  "What is media coverage missing?",
  "What changed since yesterday?",
];

const signalTiles = [
  { title: "Physical risk", detail: "Official forecasts, warnings, observations, and verified event updates come first." },
  { title: "Exposure", detail: "People, infrastructure, food, water, energy, health, shipping, and supply chains." },
  { title: "Market signal", detail: "Kalshi, Polymarket, commodities, insurance, and other pricing/attention signals where relevant." },
  { title: "Media attention", detail: "Whether coverage is low, rising, high, overheated, or mismatched with severity." },
  { title: "Missing context", detail: "The local, historical, human, economic, or preparedness context early coverage may leave out." },
];

const missingTypes = [
  "Local-source gap",
  "Human-impact gap",
  "Market-impact gap",
  "Historical-context gap",
  "Preparedness-policy gap",
  "Compounding-risk gap",
  "Attention-severity mismatch",
];

const sourceHierarchy = [
  { tier: "1", title: "Official physical-risk sources", body: "Meteorological agencies, emergency authorities, public-health bodies, shipping/aviation warnings, and official observations." },
  { tier: "2", title: "Local and regional reporting", body: "Ground-level exposure, disruption, preparedness, and human impact. If this is missing, Albis says so." },
  { tier: "3", title: "International reporting", body: "Useful for diplomatic, economic, and cross-border context — but not enough alone for high-risk physical claims." },
  { tier: "4", title: "Market-implied signals", body: "Polymarket, Kalshi, and relevant public markets can show attention and probability, not truth or advice." },
];

const exampleSignals = [
  {
    title: "Hormuz shipping risk",
    risk: "Energy and shipping exposure",
    market: "Prediction markets may show whether participants expect naval movement, disruption, or diplomatic escalation.",
    missing: "Commercial shipping detail and regional-source context can lag behind headline geopolitics.",
  },
  {
    title: "Heat, drought, and food stress",
    risk: "Agriculture, water, health, and power demand",
    market: "Weather and commodity-linked markets can reveal where economic attention is clustering.",
    missing: "Coverage often reports the heat but misses vulnerable populations, crop timing, or power-grid exposure.",
  },
  {
    title: "Outbreak and travel disruption",
    risk: "Health systems, ports, tracing, tourism, and local capacity",
    market: "Markets may react faster to uncertainty than public reporting explains it.",
    missing: "The key gap is usually what is known, what is speculative, and who is exposed locally.",
  },
];

export default function WeatherRiskSignalsPage() {
  return (
    <main className="bg-[#f8f7f4] text-[#0f0f0f] dark:bg-[#0f0f0f] dark:text-[#f0efec]">
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.22em] text-[#c8922a]">
          Weather & Risk Signals
        </p>
        <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-playfair)] text-4xl font-bold leading-tight md:text-6xl">
          Physical risk, market attention, and what the coverage is missing.
        </h1>
        <p className="mt-5 max-w-3xl font-[family-name:var(--font-source-serif)] text-xl leading-relaxed text-zinc-600 dark:text-zinc-300">
          Albis is building a calm public-service signal desk for the risks that can affect daily life: weather, food, energy, health, shipping, infrastructure, and the market-implied signals around them.
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          Polymarket and Kalshi are useful because they show where public uncertainty, attention, and money are clustering. Albis treats them as signals to inspect — not as truth, advice, or betting picks.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="inline-flex rounded-full bg-[#0f0f0f] px-5 py-3 text-sm font-semibold text-white dark:bg-[#f0efec] dark:text-[#0f0f0f]">
            Back to today&apos;s briefing
          </Link>
          <Link href="/editorial" className="inline-flex rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-zinc-700 dark:border-white/15 dark:text-zinc-300">
            How Albis works
          </Link>
          <Link href="/methodology" className="inline-flex rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-zinc-700 dark:border-white/15 dark:text-zinc-300">
            Methodology
          </Link>
        </div>
      </section>

      <section className="border-y border-black/[0.06] bg-[#101010] text-white dark:border-white/[0.08]">
        <div className="mx-auto grid max-w-6xl gap-5 px-6 py-12 md:grid-cols-5">
          {signalTiles.map((item) => (
            <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.18em] text-[#f0c15e]">Signal</p>
              <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/65">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.18em] text-[#c8922a]">
            Daily rhythm
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl font-bold">Five questions, every time.</h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            The goal is not to chase noise. The goal is to make changing risk understandable enough for a normal reader to know what matters, what changed, and what remains uncertain.
          </p>
        </div>
        <div className="rounded-3xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <ol className="space-y-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
            {fiveQuestions.map((item, index) => (
              <li key={item} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#c8922a]/15 text-xs font-bold text-[#9a6a10] dark:text-[#f0c15e]">{index + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-14">
        <div className="rounded-3xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035] md:p-8">
          <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.18em] text-[#c8922a]">
            Market framing
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl font-bold">Markets are signals, not truth.</h2>
          <div className="mt-5 grid gap-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 md:grid-cols-2">
            <p>
              Prediction-market prices can be useful because they compress attention, uncertainty, participant expectations, and sometimes new information. That makes them relevant to public intelligence.
            </p>
            <p>
              But prices can also be distorted by thin liquidity, wording, participant mix, resolution criteria, or speculation. Albis never treats them as official forecasts, investment advice, or betting recommendations.
            </p>
          </div>
          <div className="mt-6 rounded-2xl border border-[#c8922a]/25 bg-[#c8922a]/10 p-5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
            <strong>Albis usage rule:</strong> every market signal needs a timestamp, movement context, liquidity/noise label, resolution summary, and a clear caveat before it appears publicly.
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-14 md:grid-cols-3">
        {exampleSignals.map((signal) => (
          <article key={signal.title} className="rounded-3xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
            <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.18em] text-[#c8922a]">Example signal</p>
            <h3 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold">{signal.title}</h3>
            <dl className="mt-5 space-y-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              <div><dt className="font-bold text-zinc-900 dark:text-zinc-100">Risk</dt><dd>{signal.risk}</dd></div>
              <div><dt className="font-bold text-zinc-900 dark:text-zinc-100">Market signal</dt><dd>{signal.market}</dd></div>
              <div><dt className="font-bold text-zinc-900 dark:text-zinc-100">What may be missing</dt><dd>{signal.missing}</dd></div>
            </dl>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-8 md:grid-cols-[1fr_1fr]">
          <div>
            <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.18em] text-[#c8922a]">
              Evidence order
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl font-bold">Source hierarchy</h2>
            <div className="mt-6 space-y-4">
              {sourceHierarchy.map((source) => (
                <div key={source.tier} className="rounded-2xl border border-black/[0.07] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.035]">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c8922a]">Tier {source.tier}</p>
                  <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-xl font-semibold">{source.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{source.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.18em] text-[#c8922a]">
              Missing context
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl font-bold">What “missing” means here</h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              Missing context means important, publicly verifiable context that is absent or underrepresented relative to the severity or relevance of an event.
            </p>
            <div className="mt-6 grid gap-3">
              {missingTypes.map((item) => (
                <div key={item} className="rounded-2xl border border-black/[0.07] bg-white p-4 text-sm font-semibold text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-zinc-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
