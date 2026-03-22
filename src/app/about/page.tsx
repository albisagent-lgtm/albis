import type { Metadata } from "next";
import Link from "next/link";
import { EmailCapture } from "../components/email-capture";

export const metadata: Metadata = {
  title: "About Albis",
  description:
    "The world's news in 2 minutes. Albis scans 7 regions in 9 languages three times daily so you see the full picture, not just your version.",
};

export default function AboutPage() {
  return (
    <main className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-2xl px-6 py-16 md:py-24">
        {/* Header */}
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
          About
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold leading-[1.15] tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">
          The world&apos;s news in 2&nbsp;minutes.
        </h1>

        {/* Opening */}
        <div className="mt-8 space-y-5 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          <p>
            Most people get their news from one country, in one language, through one lens. They think they&apos;re informed. They&apos;re seeing a fraction.
          </p>
          <p>
            Albis scans the world three times a day — across <strong className="text-zinc-800 dark:text-zinc-200">seven regions</strong> and <strong className="text-zinc-800 dark:text-zinc-200">nine languages</strong> — and delivers a 2-minute briefing with everything you need to know. No spin. No noise. Just the full picture.
          </p>
        </div>

        {/* What makes us different */}
        <div className="mt-16 border-t border-black/5 pt-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-6">
            What Makes Albis Different
          </h2>
          <div className="space-y-5 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              <strong className="text-zinc-800 dark:text-zinc-200">We read the world in its own languages.</strong> Iranian media in Farsi. Chinese outlets in Mandarin. Arabic sources in Arabic. The domestic narrative is often fundamentally different from what English-language media reports. We capture both.
            </p>
            <p>
              <strong className="text-zinc-800 dark:text-zinc-200">We measure the gap.</strong> Our Perception Gap Index tracks how differently regions frame the same story. When the same missile strike is a &ldquo;security operation&rdquo; in one language and a &ldquo;war crime&rdquo; in another, we measure that distance. So you can see it.
            </p>
            <p>
              <strong className="text-zinc-800 dark:text-zinc-200">We find the invisible.</strong> Our Global Attention Index measures which stories most of the world never sees. Important events covered by one or two regions while billions of people have no idea they happened.
            </p>
            <p>
              <strong className="text-zinc-800 dark:text-zinc-200">We trace the chain.</strong> When a shipping lane closes and food prices spike three continents away, most outlets cover each link as a separate story. We connect them.
            </p>
          </div>
        </div>

        {/* The daily briefing */}
        <div className="mt-16 border-t border-black/5 pt-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-6">
            The Daily Briefing
          </h2>
          <div className="space-y-5 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              Every morning, you get the world&apos;s most important stories — scanned from every region, every language, every perspective. One top story with context. Quick hits on everything else. And a &ldquo;How The World Sees It&rdquo; section showing how different regions are framing the same events.
            </p>
            <p>
              Read it in 2 minutes. Understand what&apos;s actually happening. Get on with your day.
            </p>
          </div>
          <div className="mt-8">
            <EmailCapture variant="hero" showSocialProof={true} showYesterdayLink={false} />
          </div>
        </div>

        {/* Languages */}
        <div className="mt-16 border-t border-black/5 pt-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-6">
            Languages We Scan
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
            ].map(([lang, region]) => (
              <div key={lang} className="rounded-lg border border-black/[0.05] px-4 py-3 dark:border-white/[0.05]">
                <p className="font-[family-name:var(--font-source-serif)] font-semibold text-zinc-800 dark:text-zinc-200">{lang}</p>
                <p className="text-sm text-zinc-400 dark:text-zinc-500">{region}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it's built */}
        <div className="mt-16 border-t border-black/5 pt-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-6">
            How It&apos;s Built
          </h2>
          <div className="space-y-5 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              Albis is built by <strong className="text-zinc-800 dark:text-zinc-200">one person and AI</strong>. The scanning, analysis, and writing are done by AI agents that read global sources in 9 languages, detect framing patterns, and produce briefings. A human sets the direction and reviews the output.
            </p>
            <p>
              We&apos;re upfront about this because a product that helps people see information clearly should be honest about its own. Every article on Albis is authored by &ldquo;Albis&rdquo; (AI-generated) or by name (human-written).
            </p>
          </div>
        </div>

        {/* The founder */}
        <div className="mt-16 border-t border-black/5 pt-16 dark:border-white/5">
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-4">
            The Founder
          </h2>
          <p className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
            Harry Wenham
          </p>
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
            New Zealand
          </p>
          <div className="mt-5 space-y-4 font-[family-name:var(--font-source-serif)] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              Albis started as a question: how does the same event become completely different stories depending on where you read about it?
            </p>
            <p>
              That question became a tool. The tool became a daily practice. Now it scans the world three times a day, and anyone can see the patterns for themselves.
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-16 border-t border-black/5 pt-16 dark:border-white/5">
          <p className="font-[family-name:var(--font-source-serif)] text-lg text-zinc-600 dark:text-zinc-400">
            Questions, ideas, or just want to say hello?<br />
            <a href="mailto:harry@albis.news" className="text-[#c8922a] hover:underline">harry@albis.news</a>
          </p>
        </div>
      </div>
    </main>
  );
}
