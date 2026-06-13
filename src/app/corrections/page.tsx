import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Corrections & Updates — Albis",
  description:
    "Albis corrections, updates, clarifications, and revision standards. Trust through inspectability and visible changes."
};

const correctionLevels = [
  {
    level: "Minor update",
    meaning: "Small wording, spelling, formatting, or source-link fixes that do not change the meaning of a story.",
  },
  {
    level: "Context update",
    meaning: "New background, source material, regional framing, or explanation added after publication.",
  },
  {
    level: "Factual correction",
    meaning: "A factual statement was wrong, misleading, or insufficiently supported and has been corrected visibly.",
  },
  {
    level: "Substantial revision",
    meaning: "The summary, interpretation, status, or main framing changed materially as better evidence arrived.",
  },
];

export default function CorrectionsPage() {
  return (
    <main className="bg-[#f8f7f4] text-[#0f0f0f] dark:bg-[#0f0f0f] dark:text-[#f0efec]">
      <section className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.22em] text-[#c8922a]">
          Corrections & Updates
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-4xl font-bold leading-tight md:text-5xl">
          Trust means showing what changed.
        </h1>
        <p className="mt-5 font-[family-name:var(--font-source-serif)] text-xl leading-relaxed text-zinc-600 dark:text-zinc-300">
          Albis is built around inspectability. When meaningful details change, we should say so plainly: what changed, why it changed, and what evidence supports the update.
        </p>
        <div className="mt-8 rounded-3xl border border-[#c8922a]/25 bg-[#c8922a]/[0.06] p-6 dark:bg-[#c8922a]/[0.09]">
          <p className="font-[family-name:var(--font-inter)] text-[11px] font-bold uppercase tracking-[0.18em] text-[#c8922a]">
            Current status
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            No public correction entries are listed yet. This page establishes the standard before the log fills up. Substantive corrections should not be silently overwritten.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="grid gap-4 md:grid-cols-2">
          {correctionLevels.map((item) => (
            <article key={item.level} className="rounded-3xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">{item.level}</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{item.meaning}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-black/[0.06] bg-white/55 dark:border-white/[0.08] dark:bg-white/[0.03]">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">Local voices, sources, and safety</h2>
          <p className="mt-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            Albis works from public sources and credited context. We aim to respect local reporting, community knowledge, and people close to events without putting vulnerable people at risk.
          </p>
          <ul className="mt-6 space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            <li>• We do not ask people in risky situations to send dangerous testimony or identifying details.</li>
            <li>• Lived context should be treated as context, not automatically as verified fact.</li>
            <li>• Local outlets and community sources should be credited where they shape understanding.</li>
            <li>• If a source, community, or person asks for a correction, clarification, attribution change, or removal review, we should take it seriously.</li>
            <li>• Albis should help people compare and understand information — not extract stories from communities.</li>
          </ul>
        </div>
      </section>

      <section className="border-b border-black/[0.06] bg-white/55 dark:border-white/[0.08] dark:bg-white/[0.03]">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">What each correction should show</h2>
          <ul className="mt-6 space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            <li>• Date and time of the update.</li>
            <li>• Story or briefing affected.</li>
            <li>• What the original wording or claim said.</li>
            <li>• What it now says.</li>
            <li>• Why the change was made.</li>
            <li>• Source or evidence behind the change.</li>
            <li>• Whether the story status or interpretation changed.</li>
          </ul>
          <p className="mt-7 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Tiny typos may be fixed quietly. Anything that changes meaning, evidence, status, or interpretation belongs here.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="mailto:harry@albis.news?subject=Albis%20correction%20or%20source%20note&body=Story%20or%20page%3A%0A%0AWhat%20looks%20wrong%2C%20missing%2C%20unsafe%2C%20or%20misattributed%3A%0A%0ASource%20or%20context%20we%20should%20check%3A%0A%0AAnything%20sensitive%20we%20should%20avoid%20publishing%3A%0A"
              className="rounded-full bg-[#0f0f0f] px-5 py-3 text-sm font-semibold text-white dark:bg-[#f0efec] dark:text-[#0f0f0f]"
            >
              Send a correction or source note
            </a>
            <Link href="/methodology" className="rounded-full border border-black/[0.12] px-5 py-3 text-sm font-semibold text-zinc-700 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300">
              Read how Albis works
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
