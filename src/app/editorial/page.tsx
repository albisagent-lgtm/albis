import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How Albis Works — Editorial Trust",
  description:
    "How Albis scans global coverage, compares framing, identifies missing context, handles corrections, and keeps public intelligence evidence-led.",
  alternates: {
    canonical: "https://www.albis.news/editorial",
  },
};

const promises = [
  "We separate what happened, how it is framed, what is missing, and what is still unclear.",
  "We compare coverage across regions instead of asking one outlet to define the whole story.",
  "We show uncertainty plainly and correct meaningful errors visibly.",
  "We do not treat prediction markets, social attention, or AI outputs as truth. They are signals to inspect.",
];

const workflow = [
  {
    title: "Scan",
    text: "Albis gathers public reporting across regions, languages, and source types, then clusters related coverage around the same event.",
  },
  {
    title: "Compare",
    text: "The system looks for differences in emphasis, language, regional attention, missing voices, and what each audience may be led to notice first.",
  },
  {
    title: "Explain",
    text: "Editors turn the signal into plain-language briefing cards: what happened, why it matters, how it is framed, what is missing, and what to watch next.",
  },
  {
    title: "Correct",
    text: "When important details change, the correction should be visible: what changed, why it changed, and what evidence supports the update.",
  },
];

export default function EditorialPage() {
  return (
    <main className="bg-[#f8f7f4] text-[#0f0f0f] dark:bg-[#0f0f0f] dark:text-[#f0efec]">
      <section className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.22em] text-[#c8922a]">
          How Albis Works
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-4xl font-bold leading-tight md:text-5xl">
          Public intelligence, built to be inspected.
        </h1>
        <p className="mt-5 font-[family-name:var(--font-source-serif)] text-xl leading-relaxed text-zinc-600 dark:text-zinc-300">
          Albis helps people understand more and react less by showing what happened, how the story is framed, what may be missing, and what signals matter next.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/methodology" className="inline-flex rounded-full bg-[#0f0f0f] px-5 py-3 text-sm font-semibold text-white dark:bg-[#f0efec] dark:text-[#0f0f0f]">
            Read methodology
          </Link>
          <Link href="/corrections" className="inline-flex rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-zinc-700 dark:border-white/15 dark:text-zinc-300">
            Corrections & Updates
          </Link>
        </div>
      </section>

      <section className="border-y border-black/[0.06] bg-white/60 dark:border-white/[0.08] dark:bg-white/[0.03]">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 py-12 md:grid-cols-4">
          {workflow.map((item) => (
            <article key={item.title} className="rounded-3xl border border-black/[0.07] bg-[#f8f7f4] p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
              <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.18em] text-[#c8922a]">Step</p>
              <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.18em] text-[#c8922a]">
            Editorial promise
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl font-bold">Trust through inspectability.</h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            Albis is not neutral by pretending every claim is equal. It is impartial by showing the evidence, the framing, the gaps, and the limits of what is known.
          </p>
        </div>
        <div className="rounded-3xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <ul className="space-y-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            {promises.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="rounded-3xl border border-[#c8922a]/25 bg-[#c8922a]/[0.06] p-6 dark:bg-[#c8922a]/[0.09]">
          <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.18em] text-[#c8922a]">
            What Albis is not
          </p>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            <p>Albis is not a replacement for original reporting, official warnings, financial advice, or expert local judgement.</p>
            <p>Weather, market, and attention signals are used to guide public understanding. They are not instructions to trade, bet, panic, or ignore official guidance.</p>
          </div>
        </div>

        <div className="mt-12 border-t border-black/5 pt-10 dark:border-white/5">
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">Corrections</h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            If Albis gets something meaningful wrong, the correction should explain what changed and why. To report an error, email <a href="mailto:hello@albis.news" className="font-semibold text-[#c8922a] hover:underline">hello@albis.news</a>.
          </p>
          <Link href="/corrections" className="mt-5 inline-flex text-sm font-semibold text-[#c8922a] hover:underline">
            Read the corrections policy &rarr;
          </Link>
        </div>
      </section>
    </main>
  );
}
