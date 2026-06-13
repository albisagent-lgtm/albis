import Link from "next/link";

export const metadata = {
  title: "Media literacy with Albis | See what your feed missed",
  description: "A simple media literacy exercise for exploring news feed blind spots, source diversity, and global context with Albis.",
};

const steps = [
  "Open today’s Albis feed.",
  "Pick one story you had not seen in your usual news or social feed.",
  "Ask where it appears prominent, absent, or framed differently.",
  "Compare it with the sources you normally read.",
  "Discuss what algorithms, geography, language, or habits might hide.",
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
          Albis is a free early tool for exploring global stories, context, and framing gaps that a normal news feed may not show.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/" className="rounded-full bg-[#111] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-white hover:bg-[#b58320] dark:bg-white dark:text-black">
            Open today’s feed
          </Link>
          <Link href="/register" className="rounded-full border border-black/[0.12] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-zinc-700 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300">
            Become a founding tester
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-3xl gap-5 px-4 pb-16 md:px-6">
        <div className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">10-minute classroom or discussion exercise</h2>
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
            Albis is exploratory. It is not a replacement for reporting, primary sources, or teacher judgement. It is built to reveal gaps and questions — not declare a single final truth.
          </p>
        </div>
      </section>
    </main>
  );
}
