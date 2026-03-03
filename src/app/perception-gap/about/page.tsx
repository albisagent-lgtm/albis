import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About the Perception Gap Index — Albis",
  description:
    "The Perception Gap Index measures how differently the world's media tells the same story. Here's what it is, how it works, and why it matters.",
};

export default function PGIAboutPage() {
  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#f8f7f4] py-24 dark:bg-[#0f0f0f] md:py-36">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/50 via-transparent to-transparent dark:from-amber-950/10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/30 to-transparent" />

        <div className="relative mx-auto max-w-3xl px-6">
          <p className="animate-fade-in text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
            The Perception Gap Index
          </p>

          <h1 className="animate-fade-in-up delay-100 mt-5 font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-[1.15] text-[#0f0f0f] md:text-5xl lg:text-6xl dark:text-[#f0efec]">
            Same event. Different story.
          </h1>

          <p className="animate-fade-in-up delay-200 mt-7 max-w-xl text-lg leading-relaxed text-zinc-500 dark:text-zinc-400">
            The Perception Gap Index measures how differently the world&apos;s media tells the same story. One number that shows whether we&apos;re all looking at the same reality — or living in different ones.
          </p>
        </div>
      </section>

      {/* ── What Is It ────────────────────────────────────────── */}
      <section className="bg-[#f8f7f4] py-16 dark:bg-[#0f0f0f] md:py-20">
        <div className="mx-auto max-w-2xl px-6">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
            What It Is
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] md:text-3xl">
            What is the Perception Gap Index?
          </h2>

          <div className="mt-8 space-y-6 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p className="text-lg font-light text-zinc-700 dark:text-zinc-300">
              When a missile strikes, one country&apos;s news calls it &ldquo;defence.&rdquo; Another calls it &ldquo;aggression.&rdquo; Same missile. Different story.
            </p>
            <p>
              This happens constantly. A trade deal that one region celebrates as a breakthrough is reported elsewhere as exploitation. A political leader described as courageous in their home country gets called reckless across the border. Same facts, wildly different meaning.
            </p>
            <p>
              The Perception Gap Index (PGI) puts a number on that difference. Every day, we scan news coverage across seven regions of the world and measure how far apart their versions of the same event really are.
            </p>
            <p>
              It&apos;s not about who&apos;s right. It&apos;s about seeing the full picture.
            </p>
          </div>
        </div>
      </section>

      {/* ── The Unwitting Curriculum ──────────────────────────── */}
      <section className="bg-[#f2f0eb] py-16 dark:bg-[#111111] md:py-24">
        <div className="mx-auto max-w-2xl px-6">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
            The Hidden Syllabus
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] md:text-3xl">
            You&apos;re not a blank slate
          </h2>

          <div className="mt-8 space-y-6 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p className="text-lg font-light text-zinc-700 dark:text-zinc-300">
              You learned to read when you were six. From that moment on, you&apos;ve been consuming news almost every day. Thirty, forty, fifty years of exposure. That&apos;s longer than any formal degree.
            </p>
            <p>
              But unlike a university education, there was no curriculum. No syllabus. No professor explaining the methodology behind what you were reading. Selection bias — what stories get covered and which get ignored. Framing effects — how the same event gets called &ldquo;defense&rdquo; or &ldquo;aggression.&rdquo; Emotional valence. Source weighting. You absorbed it all without ever seeing the methods.
            </p>
            <p>
              Everyone in the world has been earning an unwitting degree in information. Decades of study. No awareness of the curriculum shaping what you learned.
            </p>
            <p>
              The PGI measures that curriculum. It shows you what you&apos;ve been taught — and what you&apos;ve been missing. Not to say who&apos;s right or wrong. But to make visible the syllabus you never knew you were following.
            </p>
          </div>
        </div>
      </section>

      {/* ── Why It Matters ────────────────────────────────────── */}
      <section className="bg-[#f8f7f4] py-16 dark:bg-[#0f0f0f] md:py-24">
        <div className="mx-auto max-w-2xl px-6">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
            Why It Matters
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] md:text-3xl">
            People act on the stories they&apos;re told
          </h2>

          <div className="mt-8 space-y-6 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              Nobody goes to war thinking they&apos;re the bad guy. Every major conflict in recent history was preceded by a period where two populations were told completely different stories about the same events. By the time the first shot is fired, each side is already living in a different reality.
            </p>
            <p>
              It&apos;s not just war. When two countries&apos; populations understand a trade deal completely differently, that deal is fragile — no matter what the politicians signed. When the Global South sees climate policy as rich countries protecting themselves while the West sees it as shared sacrifice, summits fail. Same facts. Different stories. Real consequences.
            </p>
            <p>
              COVID showed this starkly. Same virus, completely different stories about its origin, severity, and solutions. The gap in perception had real-world costs.
            </p>
            <p>
              The PGI tracks these gaps. When the score on a topic suddenly spikes, that often <em>precedes</em> real-world escalation. The stories split before the actions split. It&apos;s an early warning system — not for who&apos;s right or wrong, but for when understanding is breaking down.
            </p>
          </div>
        </div>
      </section>

      {/* ── How We Measure It ─────────────────────────────────── */}
      <section className="bg-[#f2f0eb] py-16 dark:bg-[#111111] md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
            The Method
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] md:text-3xl">
            Six dimensions of the gap
          </h2>
          <p className="mt-4 text-base text-zinc-500 dark:text-zinc-400">
            We don&apos;t just ask &ldquo;are the stories different?&rdquo; We measure <em>how</em> they&apos;re different across six dimensions.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-black/[0.06] bg-white p-7 dark:border-white/[0.06] dark:bg-white/[0.03]">
              <div className="h-8 w-8 rounded-lg bg-[#c8922a]/10 flex items-center justify-center"><span className="text-sm font-bold text-[#c8922a]">FD</span></div>
              <h3 className="mt-3 text-base font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                Factual Divergence
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Are different regions reporting different basic facts? Sometimes the numbers, dates, or events themselves don&apos;t match across borders. That&apos;s where it starts.
              </p>
            </div>

            <div className="rounded-2xl border border-black/[0.06] bg-white p-7 dark:border-white/[0.06] dark:bg-white/[0.03]">
              <div className="h-8 w-8 rounded-lg bg-[#c8922a]/10 flex items-center justify-center"><span className="text-sm font-bold text-[#c8922a]">CA</span></div>
              <h3 className="mt-3 text-base font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                Causal Attribution
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Do regions agree on <em>why</em> something happened? One country&apos;s media might blame economic policy. Another blames foreign interference. Same outcome, different explanation.
              </p>
            </div>

            <div className="rounded-2xl border border-black/[0.06] bg-white p-7 dark:border-white/[0.06] dark:bg-white/[0.03]">
              <div className="h-8 w-8 rounded-lg bg-[#c8922a]/10 flex items-center justify-center"><span className="text-sm font-bold text-[#c8922a]">ND</span></div>
              <h3 className="mt-3 text-base font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                Narrative Distortion
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                How far does each region&apos;s story drift from a complete, multi-source picture? Every media outlet leaves things out. We measure what&apos;s missing and how much it changes the story.
              </p>
            </div>

            <div className="rounded-2xl border border-black/[0.06] bg-white p-7 dark:border-white/[0.06] dark:bg-white/[0.03]">
              <div className="h-8 w-8 rounded-lg bg-[#c8922a]/10 flex items-center justify-center"><span className="text-sm font-bold text-[#c8922a]">ET</span></div>
              <h3 className="mt-3 text-base font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                Emotional Tone
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                How differently do regions <em>feel</em> about the same event? One country&apos;s press is outraged. Another is cautiously optimistic. A third barely mentions it. The emotional temperature tells you a lot.
              </p>
            </div>

            <div className="rounded-2xl border border-black/[0.06] bg-white p-7 dark:border-white/[0.06] dark:bg-white/[0.03]">
              <div className="h-8 w-8 rounded-lg bg-[#c8922a]/10 flex items-center justify-center"><span className="text-sm font-bold text-[#c8922a]">AP</span></div>
              <h3 className="mt-3 text-base font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                Actor Portrayal
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Are the same people described as heroes in one region and villains in another? A &ldquo;freedom fighter&rdquo; in one headline is a &ldquo;terrorist&rdquo; in the next. Same person, different story.
              </p>
            </div>

            <div className="rounded-2xl border border-black/[0.06] bg-white p-7 dark:border-white/[0.06] dark:bg-white/[0.03]">
              <div className="h-8 w-8 rounded-lg bg-[#c8922a]/10 flex items-center justify-center"><span className="text-sm font-bold text-[#c8922a]">CB</span></div>
              <h3 className="mt-3 text-base font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                Cui Bono — Who Benefits?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Every version of a story serves someone&apos;s interests. We look at who benefits from each region&apos;s framing. Not to assign blame — but to help you see the incentives behind the narrative.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── The Score ─────────────────────────────────────────── */}
      <section className="bg-[#0f0f0f] py-20 md:py-24">
        <div className="mx-auto max-w-2xl px-6">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]/70">
            The Scale
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-white md:text-3xl">
            What the number means
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400">
            Every story gets a PGI score from 0 to 10. Low means the world mostly agrees. High means people in different countries would barely recognise they&apos;re reading about the same event.
          </p>

          <div className="mt-10 space-y-4">
            <div className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
              <span className="inline-block h-5 w-5 rounded-full bg-[#22c55e] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">0–2 · Global Consensus</p>
                <p className="mt-1 text-sm text-zinc-400">Everyone&apos;s on the same page. Same facts, same meaning. Think natural disaster coverage — an earthquake is an earthquake everywhere.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
              <span className="inline-block h-5 w-5 rounded-full bg-[#eab308] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">3–4 · Different Lenses</p>
                <p className="mt-1 text-sm text-zinc-400">Same facts, different priorities. A climate summit where Western media focuses on emission targets while Southern media focuses on who&apos;s paying for it.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
              <span className="inline-block h-5 w-5 rounded-full bg-[#f97316] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">5–6 · Diverging Narratives</p>
                <p className="mt-1 text-sm text-zinc-400">Same event, different stories. Nuclear talks where one side sees diplomacy and another sees a security threat. The framing starts shaping different conclusions.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
              <span className="inline-block h-5 w-5 rounded-full bg-[#ef4444] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">7–8 · Competing Realities</p>
                <p className="mt-1 text-sm text-zinc-400">Same event, incompatible conclusions. One region calls it liberation. Another calls it invasion. The facts haven&apos;t changed — the meaning has split completely.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5">
              <span className="inline-block h-5 w-5 rounded-full bg-[#1f2937] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">9–10 · Parallel Universes</p>
                <p className="mt-1 text-sm text-zinc-400">You wouldn&apos;t even recognise these as the same story. Two populations living in entirely different information realities. This is where misunderstanding becomes dangerous.</p>
              </div>
            </div>
          </div>

          <p className="mt-8 text-sm text-zinc-500">
            We also publish a <strong className="text-zinc-300">daily PGI score</strong> — the average across all major stories that day. It&apos;s a quick read on how aligned (or fractured) the world&apos;s understanding is right now.
          </p>
        </div>
      </section>

      {/* ── Convergence ───────────────────────────────────────── */}
      <section className="bg-[#f2f0eb] py-16 dark:bg-[#111111] md:py-24">
        <div className="mx-auto max-w-2xl px-6">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
            Over Time
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] md:text-3xl">
            Do stories heal or harden?
          </h2>

          <div className="mt-8 space-y-6 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              A single day&apos;s score is a snapshot. But the real insight comes from watching how stories evolve.
            </p>
            <p>
              Some stories start divisive and then converge. More facts emerge, investigations conclude, and the world gradually settles on a shared understanding. The gap closes.
            </p>
            <p>
              Others do the opposite. They start with confusion and then harden into competing narratives that never reconcile. Each side digs in. The gap widens.
            </p>
            <p>
              We call this the <strong className="text-zinc-700 dark:text-zinc-300">Narrative Convergence Rate</strong>. It tracks whether the world&apos;s understanding of a story is getting clearer or murkier over time. A converging story is healthy — truth is emerging. A diverging one is a warning sign.
            </p>
          </div>
        </div>
      </section>

      {/* ── Principles ────────────────────────────────────────── */}
      <section className="bg-[#f8f7f4] py-16 dark:bg-[#0f0f0f] md:py-24">
        <div className="mx-auto max-w-2xl px-6">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
            Our Principles
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec] md:text-3xl">
            How we think about this
          </h2>

          <div className="mt-8 space-y-6 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            <ul className="space-y-5">
              <li className="flex gap-3">
                <span className="text-[#c8922a] mt-0.5">→</span>
                <span><span className="font-medium text-zinc-700 dark:text-zinc-300">Observe, never judge.</span> We don&apos;t pick sides. We don&apos;t say which version is &ldquo;right.&rdquo; We show you how the same event looks from different places — and let you decide.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#c8922a] mt-0.5">→</span>
                <span><span className="font-medium text-zinc-700 dark:text-zinc-300">Every perspective counts equally.</span> We don&apos;t weight Western media more heavily than African or Asian sources. Every region&apos;s framing matters.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#c8922a] mt-0.5">→</span>
                <span><span className="font-medium text-zinc-700 dark:text-zinc-300">Transparency.</span> When a region&apos;s coverage is missing, we say so. When our methodology changes, we explain why. No black boxes.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#c8922a] mt-0.5">→</span>
                <span><span className="font-medium text-zinc-700 dark:text-zinc-300">Awareness is the product.</span> We&apos;re not trying to change anyone&apos;s mind. We&apos;re trying to help people see what they might be missing. That&apos;s it.</span>
              </li>
            </ul>
          </div>

          <div className="mt-10 border-l-2 border-[#c8922a]/40 pl-5 italic text-zinc-500 dark:text-zinc-400">
            <p className="font-[family-name:var(--font-playfair)] text-lg">
              &ldquo;Awareness of the gap changes the gap.&rdquo;
            </p>
          </div>

          <p className="mt-6 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            When you see that a story has a PGI of 8, something shifts. You instinctively want to understand the other side. The measurement itself creates curiosity. The curiosity creates awareness. And awareness is the first step toward understanding.
          </p>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#1a3a5c] py-20 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-subtle-grid opacity-20" />
        <div className="relative mx-auto max-w-xl px-6 text-center">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-white md:text-3xl">
            See the stories the world is telling.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-white/60">
            Read today&apos;s briefing and discover how the same events look from seven different regions.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/briefing"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-8 text-sm font-semibold text-[#1a3a5c] shadow-[0_4px_16px_rgb(0,0,0,0.2)] hover:bg-[#f0efec] transition-colors"
            >
              Read today&apos;s briefing →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
