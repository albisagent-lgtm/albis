import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Not news. Clarity. Albis is designed to help you see the world clearly — without the noise, the anxiety, or the spin.",
};

const howItWorks = [
  {
    step: "SCAN",
    title: "What happened",
    body: "AI agents scan 50,000+ sources across 7 regions, 3 times daily. Raw facts, multi-sourced and cross-referenced.",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    step: "DETECT",
    title: "How it is being framed",
    body: "Regional perspectives are detected automatically. See how the same story reads in Washington, Beijing, Lagos, and London.",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    step: "COMPARE",
    title: "What you are not seeing",
    body: "Blindspots and coverage gaps are surfaced. Stories with concentrated regional coverage are flagged so you know what you might be missing.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    step: "REVEAL",
    title: "Pattern connections",
    body: "Cross-domain patterns that single-source reporting misses. Connections between stories that give you the bigger picture.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
];

const differentiators = [
  {
    title: "AI-powered, not journalist-dependent",
    body: "Our intelligence layer runs on AI agents that scan, compare, and synthesise coverage at a scale no editorial team could match. Every briefing is generated fresh from live data.",
  },
  {
    title: "Genuinely global — 7 regions, not fake globalism",
    body: "Most 'global' news services are Western outlets with international bureaux. Albis scans native coverage from South Asia, East & SE Asia, the Middle East, Africa, Latin America, Eastern Europe, and the Western World.",
  },
  {
    title: "Anti-doomscroll — designed to let you go",
    body: "Your daily briefing has a beginning, middle, and end. No infinite scroll. No algorithmic feed. No engagement tricks. You read, you understand, you leave.",
  },
];

const values = [
  {
    number: "01",
    title: "Patterns over headlines",
    body: "A single headline tells you almost nothing. The pattern across dozens of stories across multiple regions tells you something real. We surface the signal, not the noise.",
  },
  {
    number: "02",
    title: "Omissions matter",
    body: "What's not being reported is often more revealing than what is. We flag framing differences and coverage gaps so you can see the full picture — not just one version of it.",
  },
  {
    number: "03",
    title: "Observe, never judge",
    body: "We don't tell you what to think. We show you the patterns, the perspectives, and the gaps — then let you draw your own conclusions.",
  },
  {
    number: "04",
    title: "Honest pricing",
    body: "The free tier is genuinely useful. Premium exists for people who want deeper analysis. No dark patterns, no manufactured urgency, no upsell tricks.",
  },
];

export default function AboutPage() {
  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#f8f7f4] py-24 dark:bg-[#0f0f0f] md:py-36">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/50 via-transparent to-transparent dark:from-amber-950/10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/30 to-transparent" />

        <div className="relative mx-auto max-w-3xl px-6">
          <p className="animate-fade-in text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
            About Albis
          </p>

          <h1 className="animate-fade-in-up delay-100 mt-5 font-[family-name:var(--font-playfair)] text-4xl font-light italic leading-[1.1] text-[#0f0f0f]/70 md:text-5xl lg:text-6xl dark:text-white/60">
            Not news.
            <br />
            <span className="font-bold not-italic text-gradient-amber">
              Clarity.
            </span>
          </h1>

          <p className="animate-fade-in-up delay-200 mt-7 max-w-xl text-lg leading-relaxed text-zinc-500 dark:text-zinc-400">
            News was designed to make you feel. Albis is designed to help you see.
          </p>
        </div>
      </section>

      {/* ── Brand story ────────────────────────────────────────── */}
      <section className="bg-[#f8f7f4] py-16 dark:bg-[#0f0f0f] md:py-20">
        <div className="mx-auto max-w-2xl px-6">
          <div className="space-y-6 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p className="text-lg font-light text-zinc-700 dark:text-zinc-300">
              We built Albis because the information landscape is broken.
            </p>
            <p>
              Most news platforms are optimised for engagement. Engagement
              means outrage, fear, and doom-scrolling. The algorithm doesn&apos;t
              care whether you&apos;re informed — it cares whether you keep
              scrolling. Albis is optimised for understanding.
            </p>
            <p>
              Every day, AI agents scan coverage across 7 regions and 12 topic
              categories, then surface the patterns that traditional news
              aggregators miss. Not just what happened — but what it means,
              who&apos;s telling it differently, and what&apos;s being left out
              entirely.
            </p>
            <div className="border-l-2 border-[#c8922a]/40 pl-5 italic text-zinc-500 dark:text-zinc-400">
              <p className="font-[family-name:var(--font-playfair)] text-lg">
                &ldquo;News was designed to make you feel.
                Albis is designed to help you see.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How Albis Works ──────────────────────────────────── */}
      <section className="bg-[#f2f0eb] py-16 dark:bg-[#111111] md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
            How Albis Works
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] md:text-3xl">
            Scan. Detect. Compare. Reveal.
          </h2>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {howItWorks.map((step) => (
              <div key={step.step} className="rounded-2xl border border-black/[0.06] bg-white p-6 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <div className={`inline-flex items-center gap-2 rounded-full ${step.bg} px-3 py-1`}>
                  <span className={`text-xs font-bold tracking-[0.2em] ${step.color}`}>
                    {step.step}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What makes us different ─────────────────────────── */}
      <section className="bg-[#0f0f0f] py-20 md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]/70">
            What makes us different
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-white md:text-3xl">
            Built for clarity, not clicks.
          </h2>
          <div className="mt-10 space-y-6">
            {differentiators.map((d) => (
              <div key={d.title} className="rounded-xl border border-white/[0.07] bg-white/[0.04] p-6">
                <h3 className="text-sm font-semibold text-white/90">
                  {d.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {d.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ─────────────────────────────────────────────── */}
      <section className="bg-[#f8f7f4] py-16 dark:bg-[#0f0f0f] md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
            What we believe
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] md:text-3xl">
            The principles behind every decision.
          </h2>

          <div className="mt-12 space-y-10">
            {values.map((v) => (
              <div key={v.number} className="flex gap-7">
                <span className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#c8922a]/25 leading-none mt-1 flex-shrink-0 dark:text-[#c8922a]/20">
                  {v.number}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {v.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats / Trust signals ─────────────────────────────── */}
      <section className="bg-[#f2f0eb] py-16 dark:bg-[#111111] md:py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { value: "50K+", label: "Sources scanned" },
              { value: "7", label: "Regions covered" },
              { value: "3x", label: "Daily scans" },
              { value: "0", label: "Outrage algorithms" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="rounded-2xl border border-black/[0.06] bg-white p-6 text-center dark:border-white/[0.06] dark:bg-white/[0.03]"
              >
                <p className="font-[family-name:var(--font-playfair)] text-4xl font-bold text-[#1a3a5c] dark:text-[#4a7baa]">
                  {value}
                </p>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The team ──────────────────────────────────────────── */}
      <section className="bg-[#f8f7f4] py-16 dark:bg-[#0f0f0f] md:py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
            The team
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] md:text-3xl">
            Built by one human and a team of AI agents
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-zinc-500 dark:text-zinc-400">
            Albis is built by one human and a team of AI agents scanning the
            world 3x daily. No newsroom. No editorial board. Just pattern
            detection at global scale.
          </p>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="bg-[#f8f7f4] py-20 dark:bg-[#0f0f0f] md:py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] md:text-3xl">
            Ready to see the patterns?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-zinc-500 dark:text-zinc-400">
            Start free. No credit card. Get your first briefing today.
          </p>
          <p className="mt-2 font-[family-name:var(--font-playfair)] text-sm italic text-zinc-400 dark:text-zinc-500">
            The app designed to let you go.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#1a3a5c] px-8 text-sm font-semibold text-white shadow-[0_4px_16px_rgb(26,58,92,0.3)] hover:bg-[#243f66]"
            >
              Start free &rarr;
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 items-center rounded-full border border-black/[0.1] px-8 text-sm font-medium text-zinc-600 hover:bg-zinc-100/80 dark:border-white/[0.1] dark:text-zinc-400 dark:hover:bg-white/[0.05]"
            >
              See today&apos;s scan
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
