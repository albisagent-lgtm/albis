import Link from "next/link";

export const metadata = {
  title: "Media literacy with Albis | See what your feed missed",
  description: "A simple media literacy exercise for exploring news feed blind spots, source diversity, and global context with Albis.",
};

const steps = [
  "Open today’s feed.",
  "Pick one story you missed.",
  "Ask where it appears, disappears, or changes tone.",
  "Compare it with your usual sources.",
  "Discuss what your feed may hide.",
];

export default function MediaLiteracyPage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea]">
      <section className="mx-auto max-w-3xl px-4 py-14 md:px-6 md:py-20">
        <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.16em] text-[#b58320]">Media literacy</p>
        <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight md:text-6xl">
          Ask what your feed missed.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
          A free exercise for spotting stories, sources, and angles your usual feed may miss.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/" className="rounded-full bg-[#111] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-white hover:bg-[#b58320] dark:bg-white dark:text-black">
            Open today’s feed
          </Link>
          <Link href="/register" className="rounded-full border border-black/[0.12] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-zinc-700 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300">
Join as tester
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-3xl gap-5 px-4 pb-16 md:px-6">
        <div className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">5-minute exercise</h2>
          <ol className="mt-5 space-y-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#c8922a]/15 font-[family-name:var(--font-inter)] text-xs font-bold text-[#8a641d] dark:text-[#f0c15e]">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">Useful prompts</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            <li>What did you see here that was missing from your usual feed?</li>
            <li>Which regions or sources seemed to pay attention to it?</li>
            <li>What context would you still need before forming a strong opinion?</li>
            <li>How might language, geography, platform incentives, or source habits shape what you saw?</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">Important caveat</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            Albis is a starting point, not a final answer. Check original reporting and primary sources.
          </p>
        </div>

        <div className="rounded-3xl border border-[#c8922a]/25 bg-[#c8922a]/[0.06] p-6 dark:bg-[#c8922a]/[0.09]">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">Use it responsibly</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            Use Albis to compare public coverage. Do not submit sensitive testimony or identifying details.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 font-[family-name:var(--font-inter)] text-sm font-bold">
            <Link href="/methodology" className="text-[#8a641d] hover:text-[#c8922a] dark:text-[#f0c15e]">
              How Albis works
            </Link>
            <Link href="/corrections" className="text-[#8a641d] hover:text-[#c8922a] dark:text-[#f0c15e]">
              Corrections and source safety
            </Link>
            <Link href="/feedback" className="text-[#8a641d] hover:text-[#c8922a] dark:text-[#f0c15e]">
              Send feedback
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.14em] text-[#b58320]">Turn the exercise into a contribution</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-bold">Found a story your feed missed?</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            Post one public card with the story, source, or question. Then follow people, topics, or sources so your Albis feed gets sharper over time.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 font-[family-name:var(--font-inter)] text-sm font-bold">
            <Link href="/create" className="rounded-full bg-[#111] px-5 py-3 text-white hover:bg-[#b58320] dark:bg-white dark:text-black">
              Post one card
            </Link>
            <Link href="/people" className="rounded-full border border-black/[0.12] px-5 py-3 text-zinc-700 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300">
              Find people to follow
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
