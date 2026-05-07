import type { Metadata } from "next";
import Link from "next/link";
import { EmailCapture } from "../components/email-capture";

export const metadata: Metadata = {
  title: "About — Albis News",
  description:
    "Albis scans news across 60 countries, 7 regions, and 16 languages three times daily. Wire-service style reporting, sourced and attributed.",
};

export default function AboutPage() {
  return (
    <main className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-2xl px-5 py-12 sm:px-6 md:py-24">
        {/* Header */}
        <p className="font-[family-name:var(--font-inter)] text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
          About Albis
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold leading-[1.15] tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">
          The news, from every&nbsp;region.
        </h1>

        {/* Mission */}
        <div className="mt-8 space-y-5 font-[family-name:var(--font-source-serif)] text-lg leading-[1.8] text-zinc-600 dark:text-zinc-400">
          <p>
            Albis is an independent news service that scans sources across <strong className="text-zinc-800 dark:text-zinc-200">60 countries</strong>, <strong className="text-zinc-800 dark:text-zinc-200">7 regions</strong>, and <strong className="text-zinc-800 dark:text-zinc-200">16 languages</strong>, three times daily.
          </p>
          <p>
            Every story is sourced, attributed, and written in wire-service style. Where regions frame the same event differently, both framings are reported. Where a story is covered in one region and absent from another, the gap is noted.
          </p>
        </div>

        {/* Coverage */}
        <div className="mt-12 border-t border-black/5 pt-12 md:mt-16 md:pt-16 dark:border-white/5">
          <h2 className="font-[family-name:var(--font-inter)] text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-8">
            Coverage
          </h2>
          <div className="space-y-5 font-[family-name:var(--font-source-serif)] text-lg leading-[1.8] text-zinc-600 dark:text-zinc-400">
            <p>
              Albis monitors domestic media in their original languages &mdash; not only English-language outlets. Iranian coverage is drawn from Farsi-language sources, Chinese coverage from Mandarin, Arabic-region coverage from Arabic. The domestic narrative frequently differs from the version reported internationally.
            </p>
            <p>
              Reporting spans world affairs, politics, business, technology, health, and science. Multi-perspective coverage is standard: when sources diverge on the facts or framing of an event, all substantiated positions are presented.
            </p>
          </div>
        </div>

        {/* Why this matters */}
        <div className="mt-12 border-t border-black/5 pt-12 md:mt-16 md:pt-16 dark:border-white/5">
          <h2 className="font-[family-name:var(--font-inter)] text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-6">
            Why this matters
          </h2>
          <div className="space-y-5 font-[family-name:var(--font-source-serif)] text-lg leading-[1.8] text-zinc-600 dark:text-zinc-400">
            <p>
              Press freedom is under pressure worldwide. Reporters Without Borders reported in 2026 that global press freedom had fallen to its lowest level in 25 years, with journalism increasingly criminalised, restricted, or made unsafe in many countries.
            </p>
            <p>
              Albis is not a press freedom NGO. Its role is different: to help readers see what information reaches the public, what gets missed, and how the same event changes shape as it moves across languages, regions, governments, outlets, and platforms.
            </p>
            <p>
              In a world where journalists are targeted, access is restricted, and attention is manipulated, the public right to understand reality becomes fragile. Albis exists to protect that awareness: not by telling readers what to think, but by showing them more of what the world is seeing — and not seeing.
            </p>
          </div>
        </div>

        {/* Perception Gap Index */}
        <div className="mt-12 border-t border-black/5 pt-12 md:mt-16 md:pt-16 dark:border-white/5">
          <h2 className="font-[family-name:var(--font-inter)] text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-6">
            The Perception Gap Index
          </h2>
          <div className="space-y-5 font-[family-name:var(--font-source-serif)] text-lg leading-[1.8] text-zinc-600 dark:text-zinc-400">
            <p>
              The Perception Gap Index measures how differently regions frame the same story. A high score indicates sharply divergent coverage across regions &mdash; different facts emphasised, different causes cited, or different conclusions drawn. A low score indicates broad consensus.
            </p>
            <p>
              The index is published alongside each story to give readers immediate context on how contested the narrative is worldwide.
            </p>
          </div>
        </div>

        {/* Public + company layer */}
        <div className="mt-12 border-t border-black/5 pt-12 md:mt-16 md:pt-16 dark:border-white/5">
          <h2 className="font-[family-name:var(--font-inter)] text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-6">
            Public intelligence, company context
          </h2>
          <div className="space-y-5 font-[family-name:var(--font-source-serif)] text-lg leading-[1.8] text-zinc-600 dark:text-zinc-400">
            <p>
              The public Albis briefing remains open: a daily view of what the world is seeing, missing, and framing differently.
            </p>
            <p>
              The Company Daily Scan is built from the same intelligence layer, then filtered privately to an organisation&apos;s sector, regions, risks, and watchlist.
            </p>
          </div>
          <Link href="/company-daily-scan" className="mt-6 inline-block text-sm font-semibold text-[#c8922a] hover:underline">
            See the Company Daily Scan &rarr;
          </Link>
        </div>

        {/* Languages */}
        <div className="mt-12 border-t border-black/5 pt-12 md:mt-16 md:pt-16 dark:border-white/5">
          <h2 className="font-[family-name:var(--font-inter)] text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-6">
            Languages
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              ["English", "Global"],
              ["\u0641\u0627\u0631\u0633\u06CC", "Iran"],
              ["\u0627\u0644\u0639\u0631\u0628\u064A\u0629", "Middle East"],
              ["\u4E2D\u6587", "China"],
              ["\u0420\u0443\u0441\u0441\u043A\u0438\u0439", "Russia"],
              ["\u0939\u093F\u0928\u094D\u0926\u0940", "India"],
              ["Espa\u00F1ol", "Latin America"],
              ["Fran\u00E7ais", "West Africa"],
              ["T\u00FCrk\u00E7e", "Turkey"],
              ["Portugu\u00EAs", "Brazil"],
              ["\u65E5\u672C\u8A9E", "Japan"],
              ["\uD55C\uAD6D\uC5B4", "South Korea"],
              ["\u0627\u0631\u062F\u0648", "Pakistan"],
              ["\u09AC\u09BE\u0982\u09B2\u09BE", "Bangladesh"],
              ["Kiswahili", "East Africa"],
              ["Bahasa", "Indonesia"],
            ].map(([lang, region]) => (
              <div key={lang} className="rounded-lg border border-black/[0.05] px-4 py-3 dark:border-white/[0.05]">
                <p className="font-[family-name:var(--font-source-serif)] font-semibold text-zinc-800 dark:text-zinc-200">{lang}</p>
                <p className="font-[family-name:var(--font-inter)] text-sm text-zinc-400 dark:text-zinc-500">{region}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Daily briefing */}
        <div className="mt-12 border-t border-black/5 pt-12 md:mt-16 md:pt-16 dark:border-white/5">
          <h2 className="font-[family-name:var(--font-inter)] text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-6">
            The daily briefing
          </h2>
          <div className="space-y-5 font-[family-name:var(--font-source-serif)] text-lg leading-[1.8] text-zinc-600 dark:text-zinc-400">
            <p>
              The Albis daily briefing delivers the day&apos;s most significant stories with full regional context. Each edition includes a lead story, secondary coverage, and a regional framing summary showing how different parts of the world reported the same events.
            </p>
          </div>
          <div className="mt-8">
            <EmailCapture variant="hero" showSocialProof={true} showYesterdayLink={false} source="about" />
          </div>
        </div>

        {/* Organisation */}
        <div className="mt-12 border-t border-black/5 pt-12 md:mt-16 md:pt-16 dark:border-white/5">
          <h2 className="font-[family-name:var(--font-inter)] text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-6">
            Organisation
          </h2>
          <div className="space-y-5 font-[family-name:var(--font-source-serif)] text-lg leading-[1.8] text-zinc-600 dark:text-zinc-400">
            <p>
              Albis was founded in 2026. It is independently owned and operated, with no political affiliation, institutional backing, or editorial obligations to any government, party, or interest group.
            </p>
            <p>
              Editorial decisions are made solely on the basis of newsworthiness, regional significance, and public interest.
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-12 border-t border-black/5 pt-12 md:mt-16 md:pt-16 dark:border-white/5">
          <p className="font-[family-name:var(--font-source-serif)] text-lg text-zinc-600 dark:text-zinc-400">
            Press enquiries and corrections:<br />
            <a href="mailto:harry@albis.news" className="text-[#c8922a] hover:underline">harry@albis.news</a>
          </p>
        </div>
      </div>
    </main>
  );
}
