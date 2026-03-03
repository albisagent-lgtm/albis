"use client";

import { useState, useRef } from "react";
import Link from "next/link";

/* ── PERSPECTIVE DATA ─────────────────────────────────── */

interface Perspective {
  id: string;
  region: string;
  teaser: string;
  headline: string;
  body: string;
}

const perspectives: Perspective[] = [
  {
    id: "us",
    region: "United States",
    teaser: "Policy working as intended. Markets adjusting. Executive authority tested but holding.",
    headline: "White House Holds Line on Tariffs as Markets Recalibrate",
    body: `WASHINGTON — The administration moved swiftly Tuesday to reinforce its trade agenda, announcing expanded tariff measures just days after a narrow Supreme Court ruling questioned the scope of executive trade authority. Senior officials characterized the escalation not as defiance but as course correction, insisting the policy framework remains on solid legal ground.

Markets dipped on the news before recovering through the afternoon session, a pattern traders have come to expect with each tariff announcement. The Dow closed down 0.4 percent while the S&P 500 finished essentially flat. "The market has priced in a certain level of trade friction," said JPMorgan chief strategist David Kowalski. "What you're seeing is calibration, not panic."

The new measures target $120 billion in goods across multiple sectors, with administration officials framing the move as leverage ahead of bilateral negotiations expected to resume next month. Congressional allies signaled support, noting that domestic manufacturing indicators continue to trend upward. Critics warned the escalation risks retaliatory action, but the White House appeared unfazed. "American workers are winning," the trade representative said. "The numbers speak for themselves."`,
  },
  {
    id: "eu",
    region: "Europe",
    teaser: "Trust broken. Trade agreements undermined. Transatlantic relationship at risk.",
    headline: "Brussels Warns of 'Fundamental Breach' as Washington Escalates Trade Offensive",
    body: `BRUSSELS — European Commission President Ursula von der Leyen delivered a sharply worded rebuke of Washington's latest tariff escalation, calling it "a fundamental breach of the negotiated framework" that had underpinned transatlantic commerce for decades.

The new American measures, announced mere days after the Supreme Court signalled discomfort with unchecked executive trade powers, caught European capitals off guard. Diplomats who had spent months crafting a de-escalation roadmap described the mood as one of betrayal. "We negotiated in good faith," said one senior EU trade official, speaking on condition of anonymity. "This renders those conversations meaningless."

The euro fell 0.6 percent against the dollar as markets absorbed the implications. European industrials, particularly German automakers and French luxury goods exporters, face the most immediate exposure. Berlin has already convened an emergency session of its trade policy committee.

Perhaps most damaging is the erosion of trust itself. The transatlantic alliance, already strained by disagreements over defence spending and energy policy, now confronts a trade rift that Brussels fears could become structural. "This is not a negotiating tactic," von der Leyen cautioned. "This is a choice. And choices have consequences."`,
  },
  {
    id: "latam",
    region: "Latin America",
    teaser: "Unexpected opportunity. Markets surging. Capital rotating south.",
    headline: "Latin American Markets Rally as Trade War Reshuffles Global Capital Flows",
    body: `SAO PAULO — While Washington and Brussels exchange threats, Latin America is quietly having its best quarter in years. The Bovespa has surged more than 22 percent year-to-date. Mexico's IPC index is up 18 percent. Even Colombia's COLCAP has posted double-digit gains as global capital searches for new destinations.

The arithmetic is straightforward: the new American tariff regime imposes a 15 percent rate on goods from targeted nations — substantially lower than the bilateral rates many Latin American exporters previously faced. Manufacturers in Monterrey, Sao Paulo and Santiago are suddenly competitive in ways they weren't six months ago.

"We are seeing purchase orders that would have gone to Shenzhen landing in Guadalajara," said Ana Lucia Ferreira, chief economist at Banco Itau. "The reshoring narrative has shifted to nearshoring, and Latin America is the obvious beneficiary."

Foreign direct investment commitments to the region have jumped 34 percent in the current quarter. Infrastructure funds are oversubscribed. The Inter-American Development Bank revised its regional growth forecast upward for the third consecutive month. For a region long accustomed to being an afterthought in global trade architecture, the moment feels historic — if fragile. "The window is open," Ferreira added. "The question is whether we can build fast enough to hold it."`,
  },
  {
    id: "asia",
    region: "Asia",
    teaser: "Supply chain chaos. Operational disruption. Geopolitical warning shot.",
    headline: "Asian Supply Chains Brace for Disruption as Washington Widens Tariff Net",
    body: `SINGAPORE — Across factory floors from Guangdong to Hanoi, the calculus changed overnight. Washington's expanded tariff package — broader in scope and more aggressive in rate structure than analysts had forecast — has sent procurement teams scrambling to reassess supply chain exposure across the Asia-Pacific.

The immediate impact centres on electronics and advanced manufacturing. Companies with deep integration into China-based supply networks face the sharpest adjustment. Samsung, Toyota and TSMC all issued statements indicating they are conducting "full assessments" of the tariff implications for their operations.

Regional markets reflected the uncertainty. The Nikkei fell 1.8 percent. Hong Kong's Hang Seng dropped 2.3 percent. The Singapore Straits Times Index closed at its lowest level in four months. Currency markets saw the yuan weaken past the closely watched 7.30 level against the dollar.

"This is not simply a US-China story any more," said Takeshi Yamamoto, head of Asian macro strategy at Nomura. "The tariff architecture now captures goods that transit through ASEAN nations. Vietnam, Thailand, Malaysia — everyone with a re-export model is exposed."

Beijing's response has been measured but pointed, with state media characterising the move as evidence of American economic instability rather than strength.`,
  },
  {
    id: "me",
    region: "Middle East",
    teaser: "Distant superpower turmoil. Oil price implications. Regional trade route shifts.",
    headline: "Gulf Economies Eye Opportunity and Risk as US Trade Policy Roils Global Markets",
    body: `DUBAI — The latest American tariff escalation may have been aimed at Beijing and Brussels, but its reverberations are being felt keenly across the Gulf. Oil prices climbed 3.2 percent on the news as traders priced in the possibility of prolonged trade friction dampening global demand projections — a paradox that simultaneously threatens long-term consumption while boosting near-term prices through supply chain disruption.

For Gulf economies deep into diversification programmes, the implications are layered. Saudi Arabia's Vision 2030 logistics ambitions could benefit as global trade routes reorganise around the new tariff architecture. Dubai, already positioning itself as a re-export hub between East and West, sees potential in the disruption. "Every time the major powers create friction, intermediary economies gain relevance," noted Fatima Al-Rashid, director of trade policy at the Gulf Research Centre.

Yet the risks are real. Gulf sovereign wealth funds hold substantial positions in American and European equities now under pressure. The region's petrochemical exporters face margin compression if tariffs cascade further. And the broader spectre of superpower instability unsettles a region that depends on predictable great-power behaviour for its own security architecture.

Regional leaders are watching carefully, recalibrating quietly, and — as has become customary — hedging in every direction.`,
  },
];

/* ── COMPONENT ────────────────────────────────────────── */

export default function ExperimentPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);

  const selectedPerspective = perspectives.find((p) => p.id === selected);

  const handleSelect = (id: string) => {
    setSelected(id);
    setRevealed(false);
    setTimeout(() => {
      articleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleReveal = () => {
    setRevealed(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // silent
    }
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      {/* ── HERO ──────────────────────────────────────── */}
      <section className="relative flex min-h-[60svh] flex-col items-center justify-center px-6 py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0 bg-subtle-grid opacity-60" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/60 via-transparent to-transparent dark:from-amber-950/15 dark:via-transparent" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
            Live Framing Experiment
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-tight tracking-tight text-[#0f0f0f] md:text-5xl lg:text-6xl dark:text-[#f0efec]">
            One story. Five realities.
          </h1>
          <p className="mt-2 font-[family-name:var(--font-playfair)] text-2xl text-zinc-500 md:text-3xl dark:text-zinc-400">
            Which one did you read?
          </p>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-500 font-[family-name:var(--font-source-serif)] md:text-lg dark:text-zinc-400">
            The same news event — Trump&rsquo;s tariff escalation following the Supreme Court ruling — reported through five different regional lenses. Pick one. Then see what everyone else saw.
          </p>
        </div>
      </section>

      {/* ── PERSPECTIVE CARDS ─────────────────────────── */}
      <section className="relative px-6 pb-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {perspectives.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className={`group relative rounded-lg border px-5 py-6 text-left transition-all duration-300 ${
                  selected === p.id
                    ? "border-[#c8922a] bg-[#c8922a]/10 dark:bg-[#c8922a]/5"
                    : "border-zinc-200 bg-white hover:border-[#c8922a]/50 hover:shadow-md dark:border-zinc-800 dark:bg-[#161616] dark:hover:border-[#c8922a]/40"
                }`}
              >
                <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                  {p.region}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {p.teaser}
                </p>
                <div
                  className={`mt-3 text-xs font-medium tracking-wide uppercase transition-colors ${
                    selected === p.id
                      ? "text-[#c8922a]"
                      : "text-zinc-400 group-hover:text-[#c8922a] dark:text-zinc-500"
                  }`}
                >
                  {selected === p.id ? "Selected" : "Read this version"}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── SELECTED ARTICLE ──────────────────────────── */}
      {selectedPerspective && (
        <section ref={articleRef} className="px-6 pb-16">
          <div className="mx-auto max-w-3xl">
            <div
              key={selectedPerspective.id}
              className="animate-fade-in-up rounded-lg border border-zinc-200 bg-white p-8 shadow-sm md:p-12 dark:border-zinc-800 dark:bg-[#161616]"
            >
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
                {selectedPerspective.region}
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-[#0f0f0f] md:text-3xl dark:text-[#f0efec]">
                {selectedPerspective.headline}
              </h2>
              <div className="mt-6 space-y-4 font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-zinc-600 md:text-lg dark:text-zinc-300">
                {selectedPerspective.body.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>

            {/* Reveal prompt */}
            {!revealed && (
              <div className="mt-12 text-center">
                <p className="font-[family-name:var(--font-playfair)] text-xl text-zinc-500 dark:text-zinc-400">
                  You just read one perspective.
                </p>
                <button
                  onClick={handleReveal}
                  className="mt-4 rounded-lg bg-[#c8922a] px-8 py-3 text-sm font-semibold tracking-wide text-white transition-all hover:bg-[#b07d1e] hover:shadow-lg"
                >
                  Now see what you missed
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── ALL PERSPECTIVES REVEALED ─────────────────── */}
      {revealed && (
        <section className="px-6 pb-16">
          <div className="mx-auto max-w-6xl">
            <p className="mb-8 text-center text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
              The other four perspectives
            </p>

            {/* Mobile: stacked, swipeable-style */}
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory lg:grid lg:grid-cols-2 lg:overflow-visible lg:snap-none">
              {perspectives
                .filter((p) => p.id !== selected)
                .map((p) => (
                  <div
                    key={p.id}
                    className="min-w-[85vw] snap-center rounded-lg border border-zinc-200 bg-white p-6 shadow-sm sm:min-w-[60vw] md:p-8 lg:min-w-0 dark:border-zinc-800 dark:bg-[#161616]"
                  >
                    <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
                      {p.region}
                    </p>
                    <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-lg font-semibold leading-tight text-[#0f0f0f] md:text-xl dark:text-[#f0efec]">
                      {p.headline}
                    </h3>
                    <div className="mt-4 space-y-3 font-[family-name:var(--font-source-serif)] text-sm leading-relaxed text-zinc-600 md:text-base dark:text-zinc-300">
                      {p.body.split("\n\n").map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* ── INSIGHT + CTA ─────────────────────────────── */}
      {revealed && (
        <section className="border-t border-zinc-200 bg-[#f2f0eb] px-6 py-20 dark:border-zinc-800 dark:bg-[#111111]">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[#0f0f0f] md:text-4xl dark:text-[#f0efec]">
              Same facts. Five different worlds.
            </h2>
            <p className="mt-4 text-lg text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
              This is why perspective matters. Every newsroom makes choices about what to emphasise, what to minimise, and what to leave out entirely. The only defence is seeing all of them.
            </p>

            {/* Email capture */}
            <div className="mt-12">
              <p className="text-sm font-medium tracking-wide uppercase text-[#c8922a]">
                Get all perspectives daily. Free.
              </p>
              {submitted ? (
                <p className="mt-4 text-base text-zinc-600 dark:text-zinc-300">
                  You&rsquo;re in. Watch your inbox.
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="mx-auto mt-4 flex max-w-md gap-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-[#0f0f0f] placeholder:text-zinc-400 focus:border-[#c8922a] focus:outline-none focus:ring-1 focus:ring-[#c8922a] dark:border-zinc-700 dark:bg-[#1a1a1a] dark:text-[#f0efec]"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-[#c8922a] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#b07d1e]"
                  >
                    Subscribe
                  </button>
                </form>
              )}
              <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                100% free · No spam · Unsubscribe anytime
              </p>
            </div>

            {/* Quiz link */}
            <div className="mt-10">
              <Link
                href="/quiz"
                className="inline-block rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium text-[#0f0f0f] transition-all hover:border-[#c8922a] hover:text-[#c8922a] dark:border-zinc-700 dark:text-[#f0efec] dark:hover:border-[#c8922a] dark:hover:text-[#c8922a]"
              >
                Take the Information Diet Quiz
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
