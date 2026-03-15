import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Energy Geopolitics Intelligence | Albis",
  description:
    "Tracking the global energy transition across 5 pillars — who controls fossil, who leads renewables, who wins the nuclear race. Observer mode.",
  openGraph: {
    title: "Energy Geopolitics Intelligence | Albis",
    description:
      "5 pillars of energy power tracked across 7 regions. How the world frames the largest wealth transfer in human history.",
  },
};

/* ── Static Data ── */

const PILLARS = [
  {
    name: "Fossil Control",
    icon: "🛢️",
    status: "Concentrated Power",
    statusColor: "bg-red-500/10 text-red-600 dark:text-red-400",
    points: [
      "OPEC+ controls ~40% of global oil production",
      "Russia weaponised gas supply against Europe (2022–present)",
      "US became world's largest oil producer (13.2M barrels/day)",
      "Strait of Hormuz: 20% of world's oil passes through — currently under threat from Iran conflict",
    ],
  },
  {
    name: "Renewable Scale",
    icon: "⚡",
    status: "Accelerating",
    statusColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    points: [
      "Global renewable investment hit $2.3 trillion in 2025 (8% increase)",
      "Renewables now 61% of new power capacity globally",
      "China deploys more solar than rest of world combined",
      "Wind and solar surpassed coal globally for first time (2025)",
      "100% of new US power capacity in 2026 is renewable",
    ],
  },
  {
    name: "Nuclear Race",
    icon: "☢️",
    status: "Race Intensifying",
    statusColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    points: [
      "China's EAST \"artificial sun\" achieved breakthrough stability (March 2026)",
      "60+ countries exploring SMRs (Small Modular Reactors)",
      "US NIF achieved ignition (2022), pursuing commercial fusion",
      "UK STEP fusion plant targeting 2040s",
      "France ITER delayed but world's largest fusion experiment",
    ],
  },
  {
    name: "Critical Minerals",
    icon: "⛏️",
    status: "Strategic Chokepoint",
    statusColor: "bg-red-500/10 text-red-600 dark:text-red-400",
    points: [
      "China controls 60%+ of rare earth processing",
      "Lithium demand projected to grow 40x by 2040",
      "Japan-India rare earth partnership announced (March 2026) to counter China",
      "DRC produces 70% of world's cobalt — child labour concerns persist",
      "Transition minerals market: $121B → $358B projected",
    ],
  },
  {
    name: "Grid & Storage",
    icon: "🔋",
    status: "Innovation Surge",
    statusColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    points: [
      "Sodium-ion batteries doubled capacity (breakthrough Feb 2026)",
      "Perovskite solar cells hit record 34.6% efficiency",
      "Global battery storage deployments up 130% YoY",
      "Hydrogen economy: $500B in announced projects globally",
      "Grid modernisation: $600B+ needed globally by 2030",
    ],
  },
];

const PGI_STORIES = [
  {
    name: "Oil at $92/barrel (March 2026)",
    pgi: 8.0,
    frames: [
      { region: "🇺🇸 US/Israel", frame: "Iranian aggression threatening energy security" },
      { region: "🇸🇦 Middle East", frame: "Western military action destabilising markets" },
      { region: "🇨🇳 Asia-Pacific", frame: "Economic threat via energy prices" },
    ],
  },
  {
    name: "Renewable Energy Surge",
    pgi: 6.5,
    frames: [
      { region: "🇪🇺 Europe", frame: "Climate victory — proof the transition works" },
      { region: "🇮🇳 Global South", frame: "Energy sovereignty and development rights" },
      { region: "🇸🇦 Fossil states", frame: "Economic threat to national revenue" },
    ],
  },
  {
    name: "China's Fusion Breakthrough",
    pgi: 5.0,
    frames: [
      { region: "🇨🇳 China", frame: "National achievement, scientific leadership" },
      { region: "🇺🇸 US", frame: "Competitive threat, race implications" },
      { region: "🇪🇺 Europe", frame: "Collaborative science, ITER partnership context" },
    ],
  },
  {
    name: "Critical Mineral Supply Chains",
    pgi: 7.0,
    frames: [
      { region: "🇨🇳 China", frame: "Fair market position, decades of investment" },
      { region: "🇺🇸 Western", frame: "Dangerous dependency, national security risk" },
      { region: "🇨🇩 Africa", frame: "Resource extraction without fair value" },
    ],
  },
];

const ACTORS = [
  { flag: "🇺🇸", name: "United States", desc: "Largest oil producer, leading fusion research, renewables accelerating despite political headwinds" },
  { flag: "🇨🇳", name: "China", desc: "Dominant in solar manufacturing, rare earth processing, fusion breakthroughs, largest coal consumer" },
  { flag: "🇸🇦", name: "Saudi Arabia", desc: "OPEC+ leader, Vision 2030 diversification, $100B+ renewable investment planned" },
  { flag: "🇷🇺", name: "Russia", desc: "Energy as geopolitical weapon, gas leverage over Europe, Arctic drilling expansion" },
  { flag: "🇪🇺", name: "European Union", desc: "Green Deal leader, energy independence push post-Ukraine, hydrogen strategy" },
  { flag: "🇮🇳", name: "India", desc: "50GW+ renewable capacity, energy sovereignty focus, coal dependency declining" },
  { flag: "🇦🇺", name: "Australia", desc: "Critical minerals exporter, green hydrogen ambitions, coal phase-out debate" },
];

const CHAIN_STEPS = [
  "Energy Control",
  "Market Power",
  "Information Framing",
  "Public Perception",
  "Policy",
  "Energy Control",
];

function pgiColor(pgi: number) {
  if (pgi >= 7) return "text-red-600 dark:text-red-400 bg-red-500/10";
  if (pgi >= 5) return "text-amber-600 dark:text-amber-400 bg-amber-500/10";
  return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10";
}

export default function EnergyGeopoliticsPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12 pb-28 md:pb-12">

      {/* ── Hero ── */}
      <section className="mb-16 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#059669]">
          Observer Intelligence
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight md:text-6xl">
          Energy Geopolitics
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-500 dark:text-zinc-400">
          Who controls energy controls the narrative.
          <br className="hidden sm:block" />
          Who controls the narrative controls the transition.
        </p>
      </section>

      {/* ── Philosophy Banner ── */}
      <section className="mb-20">
        <div className="rounded-2xl border border-[#059669]/20 bg-[#059669]/[0.03] p-8 md:p-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#059669] mb-4">
            The Albis Approach
          </p>
          <p className="font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight md:text-3xl text-zinc-800 dark:text-zinc-100">
            The story beneath every other story
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Energy is the story beneath every other story. Wars are fought over it. Economies rise and fall with it.
            The transition to clean energy is the largest wealth transfer in human history — and every region frames
            it differently. Albis tracks not just what&apos;s happening in energy, but how the world understands
            what&apos;s happening.
          </p>
        </div>
      </section>

      {/* ── 5 Pillars ── */}
      <section className="mb-20">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-2">
          Scoreboard
        </p>
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight md:text-4xl mb-2">
          The 5 Pillars of Energy Power
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
          Five domains that determine who holds energy power — and how it shifts.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <div
              key={p.name}
              className="rounded-2xl border border-black/[0.07] bg-white/50 p-5 md:p-6 dark:border-white/[0.06] dark:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{p.icon}</span>
                <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">{p.name}</h3>
              </div>
              <ul className="space-y-2 mb-4">
                {p.points.map((pt, i) => (
                  <li key={i} className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 flex gap-2">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[#059669]" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
              <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${p.statusColor}`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── PGI Crossover ── */}
      <section className="mb-20">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-2">
          PGI Crossover
        </p>
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight md:text-4xl mb-2">
          Same Transition, Different Story
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
          How different regions frame the same energy events — measured by the Perception Gap Index.
        </p>

        <div className="space-y-4">
          {PGI_STORIES.map((s) => (
            <div
              key={s.name}
              className="rounded-2xl border border-black/[0.07] bg-white/50 p-5 md:p-6 dark:border-white/[0.06] dark:bg-white/[0.02]"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">{s.name}</h3>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${pgiColor(s.pgi)}`}>
                      PGI {s.pgi.toFixed(1)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {s.frames.map((f) => (
                      <div key={f.region} className="flex gap-3 text-sm">
                        <span className="shrink-0 font-medium text-zinc-700 dark:text-zinc-300 w-28">{f.region}</span>
                        <span className="text-zinc-500 dark:text-zinc-400">&ldquo;{f.frame}&rdquo;</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Energy Chain ── */}
      <section className="mb-20 text-center">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight md:text-3xl">
          The Energy Chain
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
          How energy power flows — and why it&apos;s circular.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
          {CHAIN_STEPS.map((step, i) => (
            <span key={i} className="contents">
              <span className="rounded-full bg-[#059669]/10 px-5 py-2 text-[#059669]">
                {step}
              </span>
              {i < CHAIN_STEPS.length - 1 && (
                <span className="text-zinc-300 dark:text-zinc-600">&rarr;</span>
              )}
            </span>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-lg text-sm italic text-zinc-500 dark:text-zinc-400">
          Whoever controls energy controls the narrative about energy, which shapes the policy
          that determines who controls energy.
        </p>
      </section>

      {/* ── Key Actors ── */}
      <section className="mb-20">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-2">
          Global Players
        </p>
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight md:text-4xl mb-2">
          Key Actors
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
          Major energy actors and their strategic positioning.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACTORS.map((a) => (
            <div
              key={a.name}
              className="rounded-2xl border border-black/[0.07] bg-white/50 p-5 dark:border-white/[0.06] dark:bg-white/[0.02]"
            >
              <div className="text-2xl mb-2">{a.flag}</div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{a.name}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Weekly Brief Placeholder ── */}
      <section className="mb-20">
        <div className="rounded-2xl border border-dashed border-[#059669]/30 bg-[#059669]/[0.02] p-8 md:p-10 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-[#059669] mb-3">
            Coming Soon
          </p>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight md:text-3xl">
            Weekly Energy Intelligence Brief
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
            A data-driven weekly report on who&apos;s winning the energy race, who&apos;s losing,
            and what you&apos;re not being told.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#059669]/20 px-4 py-2 text-xs text-[#059669]">
            <span className="h-2 w-2 rounded-full bg-[#059669] animate-pulse" />
            Building automated pipeline
          </div>
        </div>
      </section>

      {/* ── Researcher Footer ── */}
      <section className="rounded-2xl border border-black/[0.07] bg-white/50 p-8 md:p-12 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight md:text-3xl">
          Sources &amp; Methodology
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Albis Energy Geopolitics Intelligence is compiled from daily global scans across 7 regions,
          cross-referenced with PGI framing analysis and GAI attention data. Updated continuously.
          Observe, never judge.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link href="/indexes/pgi" className="rounded-lg border border-[#4f46e5]/30 px-4 py-2 text-sm font-medium text-[#4f46e5] transition-colors hover:bg-[#4f46e5]/5">
            PGI Data →
          </Link>
          <Link href="/indexes/gai" className="rounded-lg border border-[#d97706]/30 px-4 py-2 text-sm font-medium text-[#d97706] transition-colors hover:bg-[#d97706]/5">
            GAI Data →
          </Link>
          <Link href="/intelligence" className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-white/[0.03]">
            ← Intelligence
          </Link>
        </div>
      </section>
    </main>
  );
}
