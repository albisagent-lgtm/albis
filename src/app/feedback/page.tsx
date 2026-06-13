import Link from "next/link";

export const metadata = {
  title: "Feedback for Albis | See what your feed missed",
  description:
    "A simple feedback route for early Albis testers, educators, journalists, librarians, and globally curious readers.",
};

const trySteps = [
  "Open the feed and scan the first few stories.",
  "Pick one story your usual news feed did not show you.",
  "Send a yes / maybe / no on whether you would return, plus one confusing thing.",
];

const prompts = [
  "Was the value clear within 30 seconds?",
  "Did you find a story or angle your usual feed missed?",
  "What felt confusing, risky, or untrustworthy?",
  "Would you come back next week — yes, maybe, or no?",
];

export default function FeedbackPage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#111] dark:bg-[#101010] dark:text-[#f4f1ea]">
      <section className="mx-auto max-w-3xl px-4 py-14 md:px-6 md:py-20">
        <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.16em] text-[#b58320]">
          Early feedback
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight md:text-6xl">
          Help make Albis clearer.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
          Albis is early. We are looking for blunt, kind feedback from people who care about news, media literacy, libraries, public-interest technology, and clearer information.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href="mailto:harry@albis.news?subject=Albis%20feedback&body=I%20tried%20Albis%20and%20my%20quick%20feedback%20is%3A%0A%0A1.%20Was%20the%20value%20clear%3F%0A2.%20Would%20I%20come%20back%3F%0A3.%20What%20felt%20confusing%20or%20untrustworthy%3F%0A"
            className="rounded-full bg-[#111] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-white hover:bg-[#b58320] dark:bg-white dark:text-black"
          >
            Email feedback
          </a>
          <Link
            href="/register"
            className="rounded-full border border-black/[0.12] px-5 py-3 font-[family-name:var(--font-inter)] text-sm font-bold text-zinc-700 hover:border-[#c8922a]/50 hover:text-[#b58320] dark:border-white/[0.12] dark:text-zinc-300"
          >
            Become a founding tester
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-3xl gap-5 px-4 pb-16 md:px-6">
        <div className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">
            Try it in 2 minutes
          </h2>
          <ol className="mt-5 space-y-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {trySteps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0dca8] text-xs font-bold text-[#5f4312] dark:bg-[#3a2a10] dark:text-[#f0c15e]">
                  {index + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex flex-wrap gap-3 font-[family-name:var(--font-inter)] text-sm font-bold">
            <Link href="/" className="text-[#8a641d] hover:text-[#c8922a] dark:text-[#f0c15e]">
              Start with the feed
            </Link>
            <a
              href="mailto:harry@albis.news?subject=Albis%202-minute%20feedback&body=I%20tried%20Albis%20for%202%20minutes.%0A%0AWould%20I%20return%3F%20Yes%20%2F%20Maybe%20%2F%20No%0AOne%20story%20or%20angle%20I%20noticed%3A%0AOne%20confusing%20or%20untrustworthy%20thing%3A%0A"
              className="text-[#8a641d] hover:text-[#c8922a] dark:text-[#f0c15e]"
            >
              Send the 2-minute result
            </a>
          </div>
        </div>

        <div className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">
            What we most want to learn
          </h2>
          <ul className="mt-5 space-y-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {prompts.map((prompt) => (
              <li key={prompt} className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#c8922a]" />
                <span>{prompt}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">
            Safety and trust notes
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            Please do not send private, dangerous, or identifying information about people on the ground. Albis is for noticing public coverage gaps and questions; it is not a place to submit sensitive testimony or unverified claims.
          </p>
        </div>

        <div className="rounded-3xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.035]">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">
            Useful links
          </h2>
          <div className="mt-4 flex flex-wrap gap-3 font-[family-name:var(--font-inter)] text-sm font-bold">
            <Link href="/" className="text-[#8a641d] hover:text-[#c8922a] dark:text-[#f0c15e]">
              Open the feed
            </Link>
            <Link href="/media-literacy" className="text-[#8a641d] hover:text-[#c8922a] dark:text-[#f0c15e]">
              Media literacy exercise
            </Link>
            <Link href="/corrections" className="text-[#8a641d] hover:text-[#c8922a] dark:text-[#f0c15e]">
              Corrections and source safety
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
