import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Weather & Risk Signals — Albis",
  description:
    "Weather, risk, markets, attention, and missing context — a calm Albis signal desk for physical-world risks.",
};

const missingTypes = [
  "Local-source gap",
  "Human-impact gap",
  "Market-impact gap",
  "Historical-context gap",
  "Preparedness-policy gap",
  "Compounding-risk gap",
  "Attention-severity mismatch",
];

const checklist = [
  "What is happening physically?",
  "Where and when is it happening?",
  "Who or what is exposed?",
  "What systems could be affected — food, energy, health, shipping, insurance, infrastructure?",
  "What are markets or bettors watching, if relevant?",
  "How much attention is the story receiving?",
  "What important context is missing?",
  "What is still uncertain?",
];

const signalTiles = [
  { title: "Weather", detail: "Observed and forecast conditions that can change daily life." },
  { title: "Risk", detail: "Exposure for people, infrastructure, food, water, energy, and health." },
  { title: "Markets", detail: "Pricing, supply, insurance, and prediction-market signals where relevant." },
  { title: "Attention", detail: "Whether coverage matches the likely public impact." },
  { title: "What’s missing", detail: "The context absent from early or uneven coverage." },
];

export default function WeatherRiskSignalsPage() {
  return (
    <main className="bg-[#f8f7f4] text-[#0f0f0f] dark:bg-[#0f0f0f] dark:text-[#f0efec]">
      <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.22em] text-[#c8922a]">
          Weather & Risk Signals
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-4xl font-bold leading-tight md:text-6xl">
          Weather is not just weather.
        </h1>
        <p className="mt-5 max-w-2xl font-[family-name:var(--font-source-serif)] text-xl leading-relaxed text-zinc-600 dark:text-zinc-300">
          Albis tracks physical-world risks by connecting weather, human exposure, markets, media attention, and missing context — a public-service signal desk for what may affect daily life.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="inline-flex rounded-full bg-[#0f0f0f] px-5 py-3 text-sm font-semibold text-white dark:bg-[#f0efec] dark:text-[#0f0f0f]">
            Back to today&apos;s briefing
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

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.18em] text-[#c8922a]">
            Pilot status
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl font-bold">Manual first. Evidence first.</h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            Weather & Risk Signals will begin as a manual pilot. We publish only when the signal is useful, evidence-backed, and clearly explainable.
          </p>
        </div>
        <div className="rounded-3xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">Signal card structure</h3>
          <ul className="mt-5 space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            {checklist.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">What “missing” means here</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          Missing context means important, publicly verifiable context that is absent or underrepresented relative to the severity or relevance of an event.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {missingTypes.map((item) => (
            <div key={item} className="rounded-2xl border border-black/[0.07] bg-white p-5 text-sm font-semibold text-zinc-700 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-zinc-200">
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
