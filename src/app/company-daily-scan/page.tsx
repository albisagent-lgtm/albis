import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Company Daily Scan — Albis",
  description:
    "Demo-led daily intelligence for teams tracking markets, policy, operations, reputation, supply chains, customers, and opportunities.",
  openGraph: {
    title: "Company Daily Scan — Albis",
    description:
      "A premium daily intelligence layer for teams monitoring the outside world: markets, policy, operations, reputation, supply chains, customers, and opportunities.",
  },
};

const demoHref =
  "mailto:harry@albis.news?subject=Company%20Daily%20Scan%20demo&body=Hi%20Harry%2C%0A%0AI%27d%20like%20to%20book%20a%20Company%20Daily%20Scan%20demo.%0A%0ACompany%2Fteam%3A%0AWhat%20we%20track%3A%0AUseful%20times%3A%0A";

const sampleHref =
  "mailto:harry@albis.news?subject=Sample%20Company%20Daily%20Scan&body=Hi%20Harry%2C%0A%0AI%27d%20like%20to%20request%20a%20sample%20Company%20Daily%20Scan.%0A%0ACompany%2Fteam%3A%0AMarkets%2C%20regions%2C%20clients%2C%20or%20issues%20we%20track%3A%0A";

const sampleItems = [
  {
    label: "Geopolitical risk",
    title: "Sanctions language shifts before the formal policy changes",
    body:
      "Domestic and regional sources begin repeating the same policy framing, while international coverage still treats the issue as speculative. For a risk team, the useful signal is the narrowing window before formal action.",
  },
  {
    label: "Client monitoring",
    title: "A local regulatory story starts crossing into sector coverage",
    body:
      "The first reports are local, but trade and policy outlets begin connecting the change to firms with cross-border exposure. Albis flags the client relevance before the story becomes a board-level question.",
  },
  {
    label: "Supply chain",
    title: "Route disruption is framed differently across source regions",
    body:
      "English-language coverage focuses on prices, while regional reporting points to customs backlogs, labour pressure, and port capacity. The briefing separates headline noise from operational risk.",
  },
];

const useCases = [
  {
    title: "Risk intelligence firms",
    text: "Monitor sanctions, instability, regulatory change, geopolitical shifts, and region-specific signals for client work.",
  },
  {
    title: "Policy and public affairs teams",
    text: "Track legislation, regulation, government action, public narratives, and coverage gaps across countries.",
  },
  {
    title: "Reputation and comms agencies",
    text: "Watch emerging narratives, stakeholder-sensitive issues, media framing, and stories that may cross into wider coverage.",
  },
  {
    title: "Logistics and supply-chain teams",
    text: "Follow tariffs, sanctions, customs disruption, shipping routes, energy, food systems, and regional instability.",
  },
  {
    title: "Consultants and advisory firms",
    text: "Turn daily public signals into calm, source-backed notes for sectors, markets, clients, or internal briefs.",
  },
  {
    title: "Leadership teams",
    text: "Receive a concise executive read without losing the source trail and dashboard depth behind each finding.",
  },
];

const packages = [
  {
    name: "Founder pilot",
    position: "Selected early teams",
    audience: "For one clear company, market, sector, route, customer segment, or policy watchlist.",
    features: ["Founder-led setup", "Daily source-backed briefing", "Private dashboard archive", "Fast feedback loop on relevance"],
    highlighted: true,
  },
  {
    name: "Team workflow",
    position: "Demo-led configuration",
    audience: "For consultancies, agencies, operators, public affairs, comms, research, and leadership teams.",
    features: ["Multiple topics, regions, clients, or recipients", "Framing and coverage-gap context", "Internal or client-ready summary options", "Cadence shaped around the team"],
  },
  {
    name: "Intelligence partner",
    position: "Custom scope",
    audience: "For organisations using Albis as a higher-touch outside-world intelligence layer.",
    features: ["Custom watchlists and operating cadence", "Priority setup", "Stakeholder and procurement support", "Room for deeper governance review"],
  },
];

export default function CompanyDailyScanPage() {
  return (
    <main className="min-h-screen bg-[#f8f7f4] text-[#0f0f0f] dark:bg-[#0f0f0f] dark:text-[#f0efec]">
      <section className="border-b border-black/[0.06] bg-gradient-to-b from-[#c8922a]/10 to-transparent dark:border-white/[0.06] dark:from-[#c8922a]/15">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:py-24 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
          <div>
            <p className="font-[family-name:var(--font-inter)] text-xs font-semibold uppercase tracking-[0.22em] text-[#c8922a]">
              Company Daily Scan
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl">
              Daily intelligence for the outside world your team needs to track.
            </h1>
            <p className="mt-5 max-w-xl font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-xl">
              Albis turns global news and public signals into a concise daily briefing around markets, policy, operations, reputation, supply chains, customers, opportunities, and the watchlists your team already cares about.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={demoHref}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#c8922a] px-6 text-sm font-semibold text-white shadow-[0_3px_14px_rgb(200,146,42,0.28)] transition-colors hover:bg-[#b17f24]"
              >
                Book a demo
              </a>
              <a
                href={sampleHref}
                className="inline-flex h-11 items-center justify-center rounded-full border border-black/[0.12] px-6 text-sm font-semibold text-zinc-700 transition-colors hover:border-[#c8922a]/40 hover:text-[#c8922a] dark:border-white/[0.12] dark:text-zinc-300"
              >
                Request a sample scan
              </a>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
              Founder pilots are available for selected teams while we shape the product around high-value workflows.
            </p>
            <p className="mt-3 max-w-xl text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-600">
              Company Daily Scan is an informational intelligence briefing, not legal, financial, investment, compliance, or professional advice. You remain responsible for decisions made from any briefing.
            </p>
          </div>

          <div className="rounded-3xl border border-black/[0.07] bg-white p-5 shadow-[0_16px_50px_rgb(0,0,0,0.08)] dark:border-white/[0.07] dark:bg-white/[0.04] dark:shadow-none">
            <div className="rounded-2xl border border-[#c8922a]/20 bg-[#f8f7f4] p-5 dark:bg-[#111]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c8922a]">
                    Example daily scan
                  </p>
                  <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold">
                    Risk advisory watchlist
                  </h2>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  8 curated findings
                </span>
              </div>
              <div className="mt-5 space-y-4">
                {sampleItems.map((item, i) => (
                  <div key={item.title} className="border-t border-black/[0.06] pt-4 dark:border-white/[0.07]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                      {String(i + 1).padStart(2, "0")} · {item.label}
                    </p>
                    <h3 className="mt-1 font-[family-name:var(--font-playfair)] text-lg font-semibold leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-5 rounded-xl bg-[#c8922a]/10 p-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                The full scanner can preserve wider dashboard depth. The email stays concise: the strongest source-backed findings, written for decision-makers.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8922a]">
            Built for business monitoring
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl font-bold md:text-4xl">
            Know what changed before clients, boards, or leadership ask.
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {useCases.map((useCase) => (
            <Feature key={useCase.title} title={useCase.title} text={useCase.text} />
          ))}
        </div>
      </section>

      <section className="border-y border-black/[0.06] bg-white/55 dark:border-white/[0.06] dark:bg-white/[0.03]">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-2 md:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8922a]">
              Dashboard depth, email clarity
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl font-bold md:text-4xl">
              The scanner stays deep. The customer briefing stays sharp.
            </h2>
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-base">
            <p>
              The full scan can hold broader source trails, clusters, and excluded findings for review. That protects the intelligence depth behind the product.
            </p>
            <p>
              The daily email is curated separately: usually 7–12 findings that passed source depth, relevance, and editorial quality checks.
            </p>
            <p>
              For serious teams, we can configure the scan around markets, policy areas, operations, reputation, supply chains, customers, opportunities, regions, and recipient groups.
            </p>
          </div>
        </div>
      </section>

      <section id="sample" className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8922a]">
            How a scan is shaped
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl font-bold md:text-4xl">
            Source signal → business relevance → coverage gap → practical implication.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            The point is not to list headlines. It is to explain what changed, why it matters for the organisation, and where the source picture is uneven.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-4">
          <Step number="01" title="Source signal" text="What credible sources are reporting, and where the signal first appeared." />
          <Step number="02" title="Business relevance" text="Why this touches your client, sector, geography, supply chain, reputation, or watchlist." />
          <Step number="03" title="Coverage gap" text="Where regions or source types are seeing the story differently — or not seeing it at all." />
          <Step number="04" title="Implication" text="What to monitor next, written carefully without turning the scan into advice or noise." />
        </div>
      </section>

      <section className="bg-[#0f0f0f] text-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8922a]">
              Pilot pathways
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-3xl font-bold md:text-4xl">
              Start with a focused pilot, or shape it around a serious intelligence workflow.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              We are not publishing fixed public tiers while the product is founder-led. Selected teams can book a demo and configure watchlists, recipients, regions, and output depth around their actual workflow.
            </p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {packages.map((pkg) => (
              <PackageCard key={pkg.name} {...pkg} />
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={demoHref} className="inline-flex h-11 items-center justify-center rounded-full bg-[#c8922a] px-6 text-sm font-semibold text-white hover:bg-[#b17f24]">
              Book a demo
            </a>
            <a href={sampleHref} className="inline-flex h-11 items-center justify-center rounded-full border border-white/[0.16] px-6 text-sm font-semibold text-white/80 hover:border-[#c8922a]/50 hover:text-[#c8922a]">
              Request a sample scan
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center md:py-24">
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold md:text-4xl">
          For serious teams, book a demo. If you need proof of fit, request a sample scan.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 md:text-base">
          If your team tracks markets, policy, operations, reputation, supply chains, customers, or opportunities, start with a demo. If you already know the watchlist, ask for a sample scan first.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a href={demoHref} className="inline-flex h-11 items-center justify-center rounded-full bg-[#c8922a] px-6 text-sm font-semibold text-white hover:bg-[#b17f24]">
            Book a demo
          </a>
          <a href={sampleHref} className="inline-flex h-11 items-center justify-center rounded-full border border-black/[0.12] px-6 text-sm font-semibold text-zinc-700 hover:border-[#c8922a]/40 hover:text-[#c8922a] dark:border-white/[0.12] dark:text-zinc-300">
            Request a sample scan
          </a>
        </div>
        <p className="mx-auto mt-5 max-w-xl text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
          Albis helps surface source-backed signals and gaps, but no scan can guarantee complete coverage of every risk, source, region, or event. See our <Link href="/disclaimer" className="text-[#c8922a] underline decoration-[#c8922a]/30 underline-offset-2">disclaimer</Link>.
        </p>
      </section>
    </main>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-white/[0.03]">
      <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{text}</p>
    </div>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-5 dark:border-white/[0.07] dark:bg-white/[0.03]">
      <p className="text-xs font-bold tracking-[0.18em] text-[#c8922a]">{number}</p>
      <h3 className="mt-3 font-[family-name:var(--font-playfair)] text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{text}</p>
    </div>
  );
}

function PackageCard({
  name,
  position,
  audience,
  features,
  highlighted,
}: {
  name: string;
  position: string;
  audience: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-6 ${highlighted ? "border-[#c8922a]/45 bg-[#c8922a]/10" : "border-white/[0.1] bg-white/[0.04]"}`}>
      {highlighted && <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#c8922a]">Best fit for teams</p>}
      <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">{name}</h3>
      <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#c8922a]">{position}</p>
      <p className="mt-2 text-sm leading-relaxed text-white/65">{audience}</p>
      <ul className="mt-5 space-y-2.5 text-sm text-white/70">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c8922a]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
