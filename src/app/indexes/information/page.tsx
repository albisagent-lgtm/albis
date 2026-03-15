import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Information Warfare Intelligence | Albis",
  description:
    "Tracking active information warfare campaigns worldwide. 24 operations across 11 state actors — observed, catalogued, explained. Light, not heat.",
  openGraph: {
    title: "Information Warfare Intelligence | Albis",
    description:
      "Active global information warfare campaigns tracked and explained. Observer mode: here's how it works. Now you can see it.",
  },
};

/* ── Static campaign data (from tracker) ── */

interface Campaign {
  name: string;
  actor: string;
  target: string;
  tactics: string[];
  severity: number;
  status: string;
  summary: string;
}

const campaigns: Campaign[] = [
  { name: "Doppelganger 2.0", actor: "Russia", target: "Europe", tactics: ["Source Spoofing", "Narrative Laundering"], severity: 7, status: "Active", summary: "Cloned European news websites pushing anti-Ukraine, pro-Russia narratives. Resurged targeting German elections." },
  { name: "Operation Matryoshka", actor: "Russia", target: "Moldova", tactics: ["Firehose of Falsehood", "Source Spoofing"], severity: 8, status: "Active", summary: "High-volume disinformation targeting Moldovan domestic population ahead of EU integration." },
  { name: "Storm-1679 Election Ops", actor: "Russia", target: "United States", tactics: ["Deepfake Deployment", "CIB"], severity: 8, status: "Active", summary: "AI-generated video and audio targeting US elections. Microsoft-attributed cluster." },
  { name: "Spamouflage Dragon", actor: "China", target: "Global", tactics: ["CIB", "Platform Manipulation"], severity: 7, status: "Active", summary: "Largest known CIB network. Pro-Beijing content amplified across X, YouTube, TikTok, Reddit." },
  { name: "Wolf Warrior Diplomacy 2.0", actor: "China", target: "Global", tactics: ["State Media Amplification", "Narrative Laundering"], severity: 6, status: "Active", summary: "Aggressive diplomatic messaging via social media. Shifting from confrontation to 'charm offensive' in some regions." },
  { name: "Shadow Play — Taiwan", actor: "China", target: "Taiwan", tactics: ["Deepfake Deployment", "CIB", "Economic Coercion"], severity: 8, status: "Active", summary: "Multi-vector influence targeting Taiwan's information environment ahead of cross-strait tensions." },
  { name: "Iran War Disinfo Surge", actor: "Iran / Israel / USA", target: "Middle East & Global", tactics: ["Visual Misinformation", "AI Content", "Coordinated Narratives"], severity: 9, status: "Active", summary: "Multi-sided disinformation from all parties in the Feb-March 2026 US-Iran-Israel conflict." },
  { name: "AI Narrative Warfare", actor: "Multiple", target: "Global", tactics: ["Narrative Framing", "Strategic Omission"], severity: 7, status: "Emerging", summary: "How the AI superintelligence race is framed differently across regions — arms race vs. cooperation vs. existential risk." },
  { name: "Sahel Information Ops", actor: "Russia (Africa Corps)", target: "West Africa", tactics: ["CIB", "State Media Amplification"], severity: 7, status: "Active", summary: "GRU-directed operations replacing Wagner Group. Anti-French, pro-Russia narratives across Mali, Burkina Faso, Niger." },
  { name: "India-Pakistan Info War", actor: "India / Pakistan", target: "South Asia", tactics: ["CIB", "Visual Misinformation", "Platform Manipulation"], severity: 8, status: "Active", summary: "Bilateral information warfare escalation following May 2025 military crisis. Both sides deploying coordinated narratives." },
];

const tacticCategories = [
  { name: "Astroturfing", icon: "🌱", description: "Manufacturing fake grassroots support" },
  { name: "Coordinated Inauthentic Behavior", icon: "🤖", description: "Networks of fake accounts acting in concert" },
  { name: "Deepfake Deployment", icon: "🎭", description: "AI-generated media to fabricate events" },
  { name: "Firehose of Falsehood", icon: "🚿", description: "Overwhelming volume to exhaust discernment" },
  { name: "Censorship Architecture", icon: "🔒", description: "State infrastructure to control information" },
  { name: "Source Spoofing", icon: "📰", description: "Impersonating legitimate news outlets" },
  { name: "Narrative Laundering", icon: "🧼", description: "Recycling propaganda through credible-looking channels" },
  { name: "Strategic Amplification", icon: "📢", description: "Boosting authentic content to serve foreign goals" },
  { name: "Platform Manipulation", icon: "⚙️", description: "Exploiting algorithmic systems for visibility" },
  { name: "Economic Information Warfare", icon: "💰", description: "Weaponizing financial narratives" },
  { name: "Hack-and-Leak", icon: "💧", description: "Stealing and selectively releasing information" },
  { name: "State Media Amplification", icon: "📡", description: "Government-controlled outlets as force multipliers" },
  { name: "Visual Misinformation", icon: "📸", description: "Decontextualized or manipulated images" },
  { name: "Cultural Co-option", icon: "🎨", description: "Hijacking cultural narratives for political ends" },
];

function SeverityBadge({ severity }: { severity: number }) {
  const color = severity >= 8 ? "bg-red-100 text-red-800" : severity >= 6 ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800";
  const label = severity >= 8 ? "High" : severity >= 6 ? "Elevated" : "Moderate";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>{label} ({severity}/10)</span>;
}

export default function InformationWarfarePage() {
  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-red-950 via-red-900 to-stone-900 text-white py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-red-300 text-sm font-medium tracking-widest uppercase mb-4">Albis Intelligence</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Information Warfare</h1>
          <p className="text-lg text-red-100/80 max-w-2xl mx-auto">
            Tracking active information warfare campaigns worldwide. Not to take sides.
            To help you see the mechanisms — so you can think for yourself.
          </p>
          <p className="mt-6 text-sm text-red-200/60 italic">
            &quot;The first step to seeing clearly is knowing where the fog machines are.&quot;
          </p>
        </div>
      </section>

      {/* Philosophy Banner */}
      <section className="bg-red-50 border-y border-red-100 py-6">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-red-800 text-sm font-medium">
            🔍 Observer mode — We catalogue information warfare techniques and active operations.
            We don&apos;t take sides. We show you how it works. Then you decide.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Campaigns", value: "24" },
            { label: "State Actors", value: "11" },
            { label: "Tactic Categories", value: "14" },
            { label: "Most Active", value: "Russia (9)" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-4 text-center border border-stone-200">
              <div className="text-2xl font-bold text-red-700">{stat.value}</div>
              <div className="text-xs text-stone-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Active Campaigns */}
      <section className="max-w-5xl mx-auto px-6 pb-12">
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Active Campaigns</h2>
        <p className="text-stone-500 text-sm mb-6">Top tracked operations, updated daily from our global scans.</p>
        <div className="space-y-4">
          {campaigns.map((c) => (
            <div key={c.name} className="bg-white rounded-xl border border-stone-200 p-5 hover:border-red-200 transition-colors">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h3 className="font-semibold text-stone-900">{c.name}</h3>
                <SeverityBadge severity={c.severity} />
                <span className="text-xs text-stone-400">{c.status}</span>
              </div>
              <p className="text-sm text-stone-600 mb-3">{c.summary}</p>
              <div className="flex flex-wrap gap-4 text-xs text-stone-500">
                <span><strong>Actor:</strong> {c.actor}</span>
                <span><strong>Target:</strong> {c.target}</span>
                <span><strong>Tactics:</strong> {c.tactics.join(", ")}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-stone-400 mt-6">
          Tracking 24 campaigns total · Full database updated daily
        </p>
      </section>

      {/* Tactics Taxonomy */}
      <section className="bg-white border-y border-stone-200 py-12">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-stone-900 mb-2">The Taxonomy</h2>
          <p className="text-stone-500 text-sm mb-8">14 categories of information warfare techniques we track across all campaigns.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tacticCategories.map((t) => (
              <div key={t.name} className="border border-stone-200 rounded-lg p-4 hover:border-red-200 transition-colors">
                <div className="text-2xl mb-2">{t.icon}</div>
                <h3 className="font-medium text-stone-900 text-sm">{t.name}</h3>
                <p className="text-xs text-stone-500 mt-1">{t.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Information Chain */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-stone-900 mb-2">The Chain</h2>
        <p className="text-stone-500 text-sm mb-8">
          How information warfare flows — from creation to impact.
        </p>
        <div className="flex flex-col md:flex-row items-stretch gap-3">
          {[
            { step: "1", label: "Creation", detail: "State actors design narratives" },
            { step: "2", label: "Amplification", detail: "Networks boost signal" },
            { step: "3", label: "Laundering", detail: "Content enters legitimate channels" },
            { step: "4", label: "Consumption", detail: "Audiences absorb framing" },
            { step: "5", label: "Behavior Change", detail: "Perception shifts, votes change" },
          ].map((s, i) => (
            <div key={s.step} className="flex-1 relative">
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 text-center h-full">
                <div className="text-red-700 font-bold text-lg mb-1">{s.step}</div>
                <div className="font-medium text-stone-900 text-sm">{s.label}</div>
                <div className="text-xs text-stone-500 mt-1">{s.detail}</div>
              </div>
              {i < 4 && (
                <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 text-stone-300 z-10">→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-red-50 py-12">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-xl font-bold text-stone-900 mb-3">See more clearly.</h2>
          <p className="text-stone-600 text-sm mb-6">
            Our daily briefing includes information warfare alerts alongside global news.
            Free, forever.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/briefing" className="bg-red-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-red-800 transition-colors">
              Get the daily briefing
            </Link>
            <Link href="/indexes" className="bg-white text-stone-700 px-6 py-2.5 rounded-lg text-sm font-medium border border-stone-200 hover:border-red-200 transition-colors">
              ← Back to Indexes
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
