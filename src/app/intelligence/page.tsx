import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Intelligence | Albis",
  description:
    "Deep, ongoing, data-driven analysis of how information power works. The indexes measure the gaps. Intelligence explains why they exist.",
  openGraph: {
    title: "Intelligence | Albis",
    description:
      "The Lens tells you what happened. Intelligence tells you why.",
  },
};

const VERTICALS = [
  {
    name: "Information Warfare",
    accent: "#dc2626",
    href: "/intelligence/information-warfare",
    active: true,
    desc: "Tracking how information is weaponised across 24 active campaigns, 10 state actors, 14 tactic categories",
    icon: "⚔️",
  },
  {
    name: "Energy Geopolitics",
    accent: "#059669",
    href: "/intelligence/energy",
    active: true,
    desc: "Tracking the global energy transition across 5 pillars — who controls fossil, who leads renewables, who wins the nuclear race",
    icon: "⚡",
  },
  {
    name: "The AI Race",
    accent: "#2563eb",
    href: null,
    active: false,
    desc: "Who controls AI infrastructure, and how that reshapes the global information order",
    icon: "🧠",
  },
];

export default function IntelligencePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12 pb-28 md:pb-12">

      {/* ── Hero ── */}
      <section className="mb-20 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#dc2626]">
          Deep Analysis
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight md:text-6xl">
          Intelligence
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-500 dark:text-zinc-400">
          The Lens tells you what happened.
          <br className="hidden sm:block" />
          Intelligence tells you <em>why</em>.
        </p>
      </section>

      {/* ── Intro ── */}
      <section className="mb-20">
        <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200/60 bg-zinc-950/[0.02] p-8 md:p-10 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <p className="font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            Intelligence is deep, ongoing, data-driven analysis of how information power works in specific domains.
            The <Link href="/indexes" className="text-[#4f46e5] hover:underline">Albis Indexes</Link> measure the gaps — 
            how differently the world frames the same story, and what stories disappear entirely. 
            Intelligence explains <em>why</em> those gaps exist: the actors, the tactics, the systems 
            that shape what billions of people see, believe, and never hear about.
          </p>
        </div>
      </section>

      {/* ── Verticals ── */}
      <section className="mb-20">
        <h2 className="mb-8 text-center font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight md:text-3xl">
          Intelligence Verticals
        </h2>

        <div className="space-y-4">
          {VERTICALS.map((v) => {
            const content = (
              <div
                className={`rounded-2xl border p-6 md:p-8 transition-all ${
                  v.active
                    ? "border-[var(--accent)]/20 bg-[var(--accent)]/[0.03] hover:border-[var(--accent)]/40 hover:shadow-lg cursor-pointer"
                    : "border-zinc-200/40 bg-zinc-100/30 opacity-50 dark:border-white/[0.04] dark:bg-white/[0.01]"
                }`}
                style={{ "--accent": v.accent } as React.CSSProperties}
              >
                <div className="flex items-start gap-5">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl"
                    style={{ backgroundColor: v.active ? `${v.accent}10` : undefined }}
                  >
                    {v.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
                        {v.name}
                      </h3>
                      {!v.active && (
                        <span className="rounded-full bg-zinc-200 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-500">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {v.desc}
                    </p>
                    {v.active && (
                      <span
                        className="mt-3 inline-flex items-center gap-1 text-sm font-medium"
                        style={{ color: v.accent }}
                      >
                        Enter &rarr;
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );

            return v.active && v.href ? (
              <Link key={v.name} href={v.href} className="block">
                {content}
              </Link>
            ) : (
              <div key={v.name}>{content}</div>
            );
          })}
        </div>
      </section>

      {/* ── The Information Chain ── */}
      <section className="mb-20 text-center">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight md:text-3xl">
          The Information Chain
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
          Four layers of understanding. Each builds on the last.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
          <Link href="/indexes" className="rounded-full bg-[#4f46e5]/10 px-5 py-2 text-[#4f46e5] hover:bg-[#4f46e5]/20 transition-colors">
            Indexes MEASURE the gaps
          </Link>
          <span className="text-zinc-300 dark:text-zinc-600">&rarr;</span>
          <span className="rounded-full bg-[#dc2626]/10 px-5 py-2 text-[#dc2626]">
            Intelligence EXPLAINS why
          </span>
          <span className="text-zinc-300 dark:text-zinc-600">&rarr;</span>
          <Link href="/lens" className="rounded-full bg-[#d97706]/10 px-5 py-2 text-[#d97706] hover:bg-[#d97706]/20 transition-colors">
            The Lens SHOWS it in today&apos;s news
          </Link>
          <span className="text-zinc-300 dark:text-zinc-600">&rarr;</span>
          <Link href="/perspectives" className="rounded-full bg-emerald-500/10 px-5 py-2 text-emerald-600 hover:bg-emerald-500/20 transition-colors">
            Perspectives let you SEE it from any country
          </Link>
        </div>
      </section>

    </main>
  );
}
