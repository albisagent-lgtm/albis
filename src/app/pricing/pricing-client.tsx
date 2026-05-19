import Link from "next/link";

const demoHref =
  "mailto:harry@albis.news?subject=Company%20Daily%20Scan%20demo&body=Hi%20Harry%2C%0A%0AI%27d%20like%20to%20book%20a%20Company%20Daily%20Scan%20demo.%0A%0ACompany%2Fteam%3A%0AWhat%20we%20track%3A%0AUseful%20times%3A%0A";

const sampleHref =
  "mailto:harry@albis.news?subject=Sample%20Company%20Daily%20Scan&body=Hi%20Harry%2C%0A%0AI%27d%20like%20to%20request%20a%20sample%20Company%20Daily%20Scan.%0A%0ACompany%2Fteam%3A%0AMarkets%2C%20regions%2C%20clients%2C%20or%20issues%20we%20track%3A%0A";

const pilotTracks = [
  {
    title: "Founder pilots",
    eyebrow: "Selected teams",
    text: "A focused pilot for teams with a clear outside-world monitoring need: markets, policy, operations, reputation, supply chains, customers, or opportunities.",
    features: [
      "Configured around your team’s real watchlist",
      "Daily source-backed briefing and dashboard archive",
      "Founder-led setup, review, and iteration",
    ],
    highlighted: true,
  },
  {
    title: "Team intelligence workflows",
    eyebrow: "Demo-led",
    text: "For consultancies, operators, public affairs, comms, risk, research, and leadership teams that need a repeatable briefing rhythm.",
    features: [
      "Multiple topics, regions, clients, or recipient groups",
      "Coverage-gap and framing context where it matters",
      "Output shaped for internal or client-ready workflows",
    ],
  },
  {
    title: "Enterprise and partner builds",
    eyebrow: "Custom scope",
    text: "For organisations that need deeper configuration, wider source review, governance constraints, or a higher-touch intelligence layer.",
    features: [
      "Custom onboarding and operating cadence",
      "Priority setup for high-value monitoring needs",
      "Room for procurement, security, and stakeholder review",
    ],
  },
];

const included = [
  "Company-specific daily scan shaped around your real topics",
  "Open-web source links and source-trail visibility",
  "Private dashboard archive for review and handover",
  "Perception, framing, and coverage-gap context",
  "Careful informational language — not legal, financial, compliance, or investment advice",
  "A setup conversation before anything is configured",
];

export default function PricingClient() {
  return (
    <div className="relative min-h-screen bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/40 via-transparent to-transparent dark:from-amber-950/10" />
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/25 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#c8922a]">
            Company Daily Scan
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight text-[#0f0f0f] dark:text-[#f0efec] md:text-5xl">
            Premium daily intelligence for teams tracking the outside world
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-lg">
            Albis turns public signals into a private daily briefing around the markets, policy shifts, operations, reputation, supply chains, customers, and opportunities your team needs to see early.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-500">
            We are moving this product through demo-led onboarding and selected founder pilots. Public tier pricing is intentionally not published while we shape the right workflows with early teams.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={demoHref}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#c8922a] px-6 text-sm font-semibold text-white shadow-[0_3px_14px_rgb(200,146,42,0.28)] hover:bg-[#b17f24]"
            >
              Book a demo
            </a>
            <a
              href={sampleHref}
              className="inline-flex h-11 items-center justify-center rounded-full border border-black/[0.12] px-6 text-sm font-semibold text-zinc-700 hover:border-[#c8922a]/40 hover:text-[#c8922a] dark:border-white/[0.12] dark:text-zinc-300"
            >
              Request a sample scan
            </a>
          </div>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-5 lg:grid-cols-3">
          {pilotTracks.map((track) => (
            <PilotCard key={track.title} {...track} />
          ))}
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 rounded-3xl border border-black/[0.07] bg-white/75 p-6 dark:border-white/[0.07] dark:bg-white/[0.03] md:grid-cols-[0.85fr_1.15fr] md:p-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c8922a]">
              What every pilot starts with
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
              A sharper scan before a bigger commitment.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              The aim is fit, not a rushed checkout. We learn what your team tracks, configure a sensible first scan, then refine the daily briefing around what is genuinely useful.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
            {included.map((item) => (
              <MiniFeature key={item} text={item} />
            ))}
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-4xl rounded-2xl border border-[#c8922a]/25 bg-[#c8922a]/10 p-6 text-center dark:bg-[#c8922a]/[0.08]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c8922a]">
            For teams evaluating fit
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
            Not ready for a demo? Ask for a sample scan.
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Send us the company, market, route, policy area, customer segment, or issue you care about. We can show the kind of source-backed briefing Albis would produce before any commercial decision.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={demoHref}
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#c8922a] px-5 text-sm font-semibold text-white hover:bg-[#b17f24]"
            >
              Book a demo
            </a>
            <a
              href={sampleHref}
              className="inline-flex h-10 items-center justify-center rounded-full border border-black/[0.12] px-5 text-sm font-semibold text-zinc-700 hover:border-[#c8922a]/40 hover:text-[#c8922a] dark:border-white/[0.12] dark:text-zinc-300"
            >
              Request a sample scan
            </a>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Already reading albis.news? The public briefing stays free. The company scan is the private layer for organisations. {" "}
            <Link href="/register" className="font-medium text-[#c8922a] hover:underline">
              Create a free account
            </Link>
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-xs leading-relaxed text-zinc-400 dark:text-zinc-600">
            Company Daily Scan is for informational intelligence only. It is not legal, financial, investment, compliance, or professional advice, and does not guarantee complete coverage of every relevant source, region, event, or risk. See our {" "}
            <Link href="/disclaimer" className="text-[#c8922a] hover:underline">
              disclaimer
            </Link>
            .
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-3xl">
          <div className="grid gap-8 sm:grid-cols-3">
            <ValueProp
              title="Built from the public scan"
              text="The company product grows out of the same global source layer that powers the open Albis briefing."
            />
            <ValueProp
              title="Filtered to your context"
              text="Markets, policy, operations, reputation, supply chains, customers, and opportunities are prioritised over general headlines."
            />
            <ValueProp
              title="Shows the gap"
              text="Perception and coverage notes highlight when regions or source types are seeing an issue differently."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PilotCard({
  title,
  eyebrow,
  text,
  features,
  highlighted,
}: {
  title: string;
  eyebrow: string;
  text: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        highlighted
          ? "border-[#c8922a]/45 bg-white shadow-[0_4px_24px_rgb(200,146,42,0.12)] ring-1 ring-[#c8922a]/20 dark:bg-white/[0.04]"
          : "border-black/[0.07] bg-white dark:border-white/[0.07] dark:bg-white/[0.03]"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c8922a]">
        {eyebrow}
      </p>
      <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {text}
      </p>
      <ul className="mt-5 space-y-2.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c8922a]" />
            <span className="text-zinc-600 dark:text-zinc-400">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MiniFeature({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-[#f8f7f4] px-3 py-2 dark:bg-white/[0.04]">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c8922a]" />
      <span>{text}</span>
    </div>
  );
}

function ValueProp({ title, text }: { title: string; text: string }) {
  return (
    <div className="text-center">
      <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-[#0f0f0f] dark:text-[#f0efec]">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {text}
      </p>
    </div>
  );
}
