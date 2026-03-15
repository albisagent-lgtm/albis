import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Information Warfare Intelligence | Albis",
  description:
    "Tracking how information is weaponized across 22 active campaigns worldwide. Observer mode: we describe what's happening, not what should happen.",
  openGraph: {
    title: "Information Warfare Intelligence | Albis",
    description:
      "22 active information warfare campaigns tracked. How states and actors weaponize information — observed, documented, never judged.",
  },
};

/* ── Static Data ── */

const CAMPAIGNS = [
  {
    name: "India-Pakistan Information Warfare",
    actor: "India & Pakistan",
    targets: ["South Asia", "International"],
    tactics: ["State Media Amplification", "Deepfake Deployment", "Firehose of Falsehood"],
    severity: 9,
    status: "Declining",
    attribution: "Confirmed",
  },
  {
    name: "Gaza/Israel Information Warfare",
    actor: "Multiple (Israel, Hamas, Iran)",
    targets: ["Global"],
    tactics: ["State Media Amplification", "Deepfake Deployment", "Strategic Ambiguity"],
    severity: 9,
    status: "Active",
    attribution: "Confirmed",
  },
  {
    name: "Operation Matryoshka (Moldova)",
    actor: "Russia",
    targets: ["Moldova", "Diaspora"],
    tactics: ["Firehose of Falsehood", "Source Spoofing", "Deepfake Deployment"],
    severity: 8,
    status: "Active",
    attribution: "Confirmed",
  },
  {
    name: "China Anti-Taiwan Operations",
    actor: "China (PRC)",
    targets: ["Taiwan"],
    tactics: ["Coordinated Inauthentic Behavior", "Deepfake Deployment", "Platform Manipulation"],
    severity: 8,
    status: "Escalating",
    attribution: "Confirmed",
  },
  {
    name: "Iran Domestic Protest Narrative Control",
    actor: "Iran",
    targets: ["Domestic", "International"],
    tactics: ["Censorship Architecture", "Strategic Ambiguity", "State Media Amplification"],
    severity: 8,
    status: "Active",
    attribution: "Confirmed",
  },
  {
    name: "Romania TikTok Election Interference",
    actor: "Suspected Russia-aligned",
    targets: ["Romania"],
    tactics: ["Platform Manipulation", "Coordinated Inauthentic Behavior", "Astroturfing"],
    severity: 8,
    status: "Active",
    attribution: "Suspected",
  },
  {
    name: "Doppelganger 2.0",
    actor: "Russia",
    targets: ["Europe"],
    tactics: ["Source Spoofing", "Coordinated Inauthentic Behavior", "Narrative Laundering"],
    severity: 7,
    status: "Active",
    attribution: "Confirmed",
  },
  {
    name: "AI-Enhanced Synthetic Video Campaign",
    actor: "Russia",
    targets: ["Europe"],
    tactics: ["Deepfake Deployment", "Attention Hacking", "Coordinated Inauthentic Behavior"],
    severity: 7,
    status: "Escalating",
    attribution: "Highly Likely",
  },
  {
    name: "Spamouflage / Dragonbridge",
    actor: "China (PRC)",
    targets: ["US", "Canada", "Taiwan"],
    tactics: ["Coordinated Inauthentic Behavior", "Astroturfing", "Platform Manipulation"],
    severity: 7,
    status: "Active",
    attribution: "Confirmed",
  },
  {
    name: "Iran Anti-Israel Operations",
    actor: "Iran",
    targets: ["Israel", "International"],
    tactics: ["Coordinated Inauthentic Behavior", "Polarization Amplification", "Astroturfing"],
    severity: 7,
    status: "Active",
    attribution: "Confirmed",
  },
];

const TACTICS = [
  { name: "Astroturfing", icon: "🌱", desc: "Faking grassroots support where none exists" },
  { name: "Coordinated Inauthentic Behavior", icon: "🤖", desc: "Fake account networks acting in concert" },
  { name: "Deepfake Deployment", icon: "🎭", desc: "AI-generated media to fabricate evidence" },
  { name: "Firehose of Falsehood", icon: "🔥", desc: "Overwhelming with contradictory noise" },
  { name: "Censorship Architecture", icon: "🚫", desc: "Systematic infrastructure to control information" },
  { name: "Narrative Laundering", icon: "🧺", desc: "Moving stories from fringe to mainstream" },
  { name: "Attention Hacking", icon: "📢", desc: "Hijacking public attention through manufactured controversy" },
  { name: "Strategic Ambiguity", icon: "🌫️", desc: "Deliberate vagueness to maintain deniability" },
  { name: "Whataboutism", icon: "🪞", desc: "Deflecting criticism by pointing at the accuser" },
  { name: "Polarization Amplification", icon: "⚡", desc: "Intensifying existing social divisions" },
  { name: "Platform Manipulation", icon: "🎮", desc: "Exploiting algorithms for disproportionate reach" },
  { name: "Source Spoofing", icon: "📰", desc: "Impersonating legitimate news organizations" },
  { name: "State Media Amplification", icon: "📡", desc: "Coordinated cross-platform state narrative promotion" },
  { name: "Economic Information Warfare", icon: "💰", desc: "Weaponizing information to manipulate markets" },
];

function severityColor(s: number) {
  if (s <= 3) return { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" };
  if (s <= 6) return { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" };
  return { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", dot: "bg-red-500" };
}

export default function InformationWarfarePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12 pb-28 md:pb-12">

      {/* ── Hero ── */}
      <section className="mb-16 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#dc2626]">
          Observer Intelligence
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight md:text-6xl">
          Information Warfare Intelligence
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-500 dark:text-zinc-400">
          How states, networks, and actors weaponize information to shape what billions of people believe.
          <br className="hidden sm:block" />
          <em>24 active campaigns. 10 actor profiles. Documented in real time.</em>
        </p>
      </section>

      {/* ── Philosophy Banner ── */}
      <section className="mb-20">
        <div className="rounded-2xl border border-[#dc2626]/20 bg-[#dc2626]/[0.03] p-8 md:p-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#dc2626] mb-4">
            The Albis Approach
          </p>
          <p className="font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight md:text-3xl text-zinc-800 dark:text-zinc-100">
            We observe. We don&apos;t judge.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Here&apos;s how information warfare works. Now you can see it. Every campaign documented here
            is based on published evidence from academic institutions, government disclosures, and
            investigative organizations. We describe the mechanism — never the morality.
          </p>
        </div>
      </section>

      {/* ── Active Campaigns ── */}
      <section className="mb-20">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-2">
          Live Tracker
        </p>
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight md:text-4xl mb-2">
          Active Campaigns
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
          Top 10 by severity — of 22 currently tracked worldwide. Sorted by impact on global information environment.
        </p>

        <div className="space-y-4">
          {CAMPAIGNS.map((c) => {
            const sev = severityColor(c.severity);
            return (
              <div
                key={c.name}
                className="rounded-2xl border border-black/[0.07] bg-white/50 p-5 md:p-6 dark:border-white/[0.06] dark:bg-white/[0.02]"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${sev.bg} ${sev.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${sev.dot}`} />
                        {c.severity}/10
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400">
                        {c.status}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400">
                        {c.attribution}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold leading-snug text-zinc-800 dark:text-zinc-100">
                      {c.name}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="font-medium">Actor:</span> {c.actor} →{" "}
                      <span className="font-medium">Targets:</span> {c.targets.join(", ")}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {c.tactics.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-[#dc2626]/20 bg-[#dc2626]/[0.04] px-2.5 py-0.5 text-[10px] font-medium text-[#dc2626] dark:border-[#dc2626]/30 dark:text-red-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          + 12 more campaigns tracked at lower severity levels
        </p>
      </section>

      {/* ── Tactics Taxonomy ── */}
      <section className="mb-20">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-2">
          Classification System
        </p>
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight md:text-4xl mb-2">
          Tactics Taxonomy
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
          14 documented categories of information warfare tactics. Each observed across multiple campaigns.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {TACTICS.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-black/[0.07] bg-white/50 p-5 dark:border-white/[0.06] dark:bg-white/[0.02]"
            >
              <div className="text-2xl mb-2">{t.icon}</div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t.name}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The Information Chain ── */}
      <section className="mb-20 text-center">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight md:text-3xl">
          The Information Chain
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
          Information warfare doesn&apos;t exist in isolation. It connects to everything Albis measures.
          Operations manipulate what you see, how it&apos;s framed, and ultimately what you believe.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
          <Link href="/indexes/gai" className="rounded-full bg-[#d97706]/10 px-5 py-2 text-[#d97706] hover:bg-[#d97706]/20 transition-colors">
            Attention (GAI)
          </Link>
          <span className="text-zinc-300 dark:text-zinc-600">&rarr;</span>
          <Link href="/indexes/pgi" className="rounded-full bg-[#4f46e5]/10 px-5 py-2 text-[#4f46e5] hover:bg-[#4f46e5]/20 transition-colors">
            Perception (PGI)
          </Link>
          <span className="text-zinc-300 dark:text-zinc-600">&rarr;</span>
          <span className="rounded-full bg-[#dc2626]/10 px-5 py-2 text-[#dc2626]">
            Manipulation (Info Warfare)
          </span>
          <span className="text-zinc-300 dark:text-zinc-600">&rarr;</span>
          <span className="rounded-full bg-zinc-100 px-5 py-2 text-zinc-400 dark:bg-white/[0.04]">
            Belief
          </span>
          <span className="text-zinc-300 dark:text-zinc-600">&rarr;</span>
          <span className="rounded-full bg-zinc-100 px-5 py-2 text-zinc-400 dark:bg-white/[0.04]">
            Action
          </span>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3 text-left">
          <div className="rounded-2xl border border-[#d97706]/20 bg-[#d97706]/[0.03] p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#d97706] mb-2">GAI Connection</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Censorship architecture and platform manipulation directly suppress stories, creating the attention gaps GAI measures. When a story scores high on GAI in a censorship-prone region, it may be deliberate.
            </p>
          </div>
          <div className="rounded-2xl border border-[#4f46e5]/20 bg-[#4f46e5]/[0.03] p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#4f46e5] mb-2">PGI Connection</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Narrative laundering, state media amplification, and deepfakes create the perception gaps PGI measures. When India-Pakistan crisis PGI hit 9.0, both sides were running full-spectrum information operations.
            </p>
          </div>
          <div className="rounded-2xl border border-[#dc2626]/20 bg-[#dc2626]/[0.03] p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#dc2626] mb-2">Cross-Reference Engine</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Our automated system flags stories whose PGI dimension patterns match known information warfare signatures. Six signature types, conservative thresholds, built-in false positive mitigation.
            </p>
          </div>
        </div>
      </section>

      {/* ── State of Information ── */}
      <section className="mb-20">
        <div className="rounded-2xl border border-dashed border-[#dc2626]/30 bg-[#dc2626]/[0.02] p-8 md:p-10 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-[#dc2626] mb-3">
            Coming Soon
          </p>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight md:text-3xl">
            State of Information — Weekly Report
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
            A weekly synthesis of information warfare activity worldwide. Which campaigns escalated,
            which new operations were detected, and what the PGI cross-reference engine flagged.
            Data-driven. Observer mode. No editorializing.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#dc2626]/20 px-4 py-2 text-xs text-[#dc2626]">
            <span className="h-2 w-2 rounded-full bg-[#dc2626] animate-pulse" />
            Building automated pipeline
          </div>
        </div>
      </section>

      {/* ── For Researchers ── */}
      <section className="rounded-2xl border border-black/[0.07] bg-white/50 p-8 md:p-12 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold tracking-tight md:text-3xl">
          For Journalists &amp; Researchers
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          This tracker draws from 33 authoritative sources including academic institutions (Oxford Internet Institute,
          Stanford Internet Observatory, Citizen Lab), investigative organizations (Bellingcat, DFRLab, EU DisinfoLab),
          platform transparency reports (Meta, Google TAG), and government agencies (CISA, Taiwan NSB, Canada RRM).
          All attribution follows a four-tier confidence framework: Confirmed, Highly Likely, Suspected, Unattributed.
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
