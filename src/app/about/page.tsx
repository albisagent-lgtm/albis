import type { Metadata } from "next";
import { EmailCapture } from "../components/email-capture";

export const metadata: Metadata = {
  title: "About — Albis News",
  description:
    "Albis scans news across 60 countries, 7 regions, and 16 languages every day. See how the world sees the news.",
};

export default function AboutPage() {
  return (
    <main className="bg-[#f8f7f4] dark:bg-[#0f0f0f]">
      <div className="mx-auto max-w-2xl px-6 py-16 md:py-24">
        {/* Header */}
        <p className="font-[family-name:var(--font-inter)] text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
          About Albis
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold leading-[1.15] tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">
          Global news from every&nbsp;region.
        </h1>

        {/* Opening */}
        <div className="mt-8 space-y-5 font-[family-name:var(--font-source-serif)] text-lg leading-[1.8] text-zinc-600 dark:text-zinc-400">
          <p>
            Albis scans news across <strong className="text-zinc-800 dark:text-zinc-200">60 countries</strong>, <strong className="text-zinc-800 dark:text-zinc-200">7 regions</strong>, and <strong className="text-zinc-800 dark:text-zinc-200">16 languages</strong> every day. We read the news the way the world reads it &mdash; not just the English-language version.
          </p>
          <p>
            Most people see the news through one country&apos;s lens. Albis shows you what every region is reporting, how they&apos;re framing it, and what stories you&apos;re missing entirely.
          </p>
        </div>

        {/* How it works */}
        <div className="mt-16 border-t border-black/5 pt-16 dark:border-white/5">
          <h2 className="font-[family-name:var(--font-inter)] text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-8">
            How it works
          </h2>
          <div className="space-y-8">
            <div className="flex gap-5">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#c8922a]/10 font-[family-name:var(--font-inter)] text-sm font-bold text-[#c8922a]">
                1
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                  We scan
                </h3>
                <p className="mt-1.5 font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Every day, we read news sources in 16 languages across 7 regions &mdash; from Farsi and Mandarin to Swahili and Portuguese. We read what each region is actually saying, not just what gets translated into English.
                </p>
              </div>
            </div>
            <div className="flex gap-5">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#c8922a]/10 font-[family-name:var(--font-inter)] text-sm font-bold text-[#c8922a]">
                2
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                  We synthesise
                </h3>
                <p className="mt-1.5 font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                  We compare how different regions cover the same events. Where narratives align, we note it. Where they diverge, we show you both sides. Where stories are invisible to most of the world, we surface them.
                </p>
              </div>
            </div>
            <div className="flex gap-5">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#c8922a]/10 font-[family-name:var(--font-inter)] text-sm font-bold text-[#c8922a]">
                3
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                  We publish
                </h3>
                <p className="mt-1.5 font-[family-name:var(--font-source-serif)] text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                  You get clear, calm reporting on what matters. Every story shows which regions covered it, how they framed it, and what the rest of the world isn&apos;t seeing. No spin, no noise.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* What makes us different */}
        <div className="mt-16 border-t border-black/5 pt-16 dark:border-white/5">
          <h2 className="font-[family-name:var(--font-inter)] text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-6">
            What makes Albis different
          </h2>
          <div className="space-y-5 font-[family-name:var(--font-source-serif)] text-lg leading-[1.8] text-zinc-600 dark:text-zinc-400">
            <p>
              <strong className="text-zinc-800 dark:text-zinc-200">We read the world in its own languages.</strong> Iranian media in Farsi. Chinese outlets in Mandarin. Arabic sources in Arabic. The domestic narrative is often fundamentally different from what English-language media reports. We capture both.
            </p>
            <p>
              <strong className="text-zinc-800 dark:text-zinc-200">We show you the framing.</strong> The same event gets told differently in different regions. A military strike might be a &ldquo;security operation&rdquo; in one country and a &ldquo;civilian massacre&rdquo; in another. We show you both framings so you can judge for yourself.
            </p>
            <p>
              <strong className="text-zinc-800 dark:text-zinc-200">We find the invisible stories.</strong> Important events covered by one or two regions while billions of people have no idea they happened. We surface what the rest of the world is missing.
            </p>
            <p>
              <strong className="text-zinc-800 dark:text-zinc-200">We connect the dots.</strong> When a shipping lane closes and food prices spike three continents away, most outlets cover each link as a separate story. We connect them.
            </p>
          </div>
        </div>

        {/* Daily briefing + email capture */}
        <div className="mt-16 border-t border-black/5 pt-16 dark:border-white/5">
          <h2 className="font-[family-name:var(--font-inter)] text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-6">
            The daily briefing
          </h2>
          <div className="space-y-5 font-[family-name:var(--font-source-serif)] text-lg leading-[1.8] text-zinc-600 dark:text-zinc-400">
            <p>
              Every morning, you get the world&apos;s most important stories &mdash; scanned from every region, every language. One top story with context. Quick hits on everything else. Plus a &ldquo;How regions covered this&rdquo; section showing you the different framings.
            </p>
            <p>
              Read it in 2 minutes. Understand what&apos;s actually happening. Get on with your day.
            </p>
          </div>
          <div className="mt-8">
            <EmailCapture variant="hero" showSocialProof={true} showYesterdayLink={false} source="about" />
          </div>
        </div>

        {/* Languages */}
        <div className="mt-16 border-t border-black/5 pt-16 dark:border-white/5">
          <h2 className="font-[family-name:var(--font-inter)] text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-6">
            Languages we scan
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

        {/* Who we are */}
        <div className="mt-16 border-t border-black/5 pt-16 dark:border-white/5">
          <h2 className="font-[family-name:var(--font-inter)] text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-6">
            Who we are
          </h2>
          <div className="space-y-5 font-[family-name:var(--font-source-serif)] text-lg leading-[1.8] text-zinc-600 dark:text-zinc-400">
            <p>
              Albis uses AI-powered scanning and analysis to read global sources in 16 languages, detect framing differences, and produce reporting. A human editorial team sets the direction and reviews everything.
            </p>
            <p>
              We believe a publication that helps people see information clearly should be honest about how it&apos;s made. Every article is authored by &ldquo;Albis&rdquo; (AI-assisted) or by name (human-written).
            </p>
          </div>
        </div>

        {/* Why we built this */}
        <div className="mt-16 border-t border-black/5 pt-16 dark:border-white/5">
          <h2 className="font-[family-name:var(--font-inter)] text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a] mb-4">
            Why we built this
          </h2>
          <p className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
            Harry Wenham
          </p>
          <p className="mt-1 font-[family-name:var(--font-inter)] text-sm text-zinc-400 dark:text-zinc-500">
            Founder &middot; New Zealand
          </p>
          <div className="mt-5 space-y-4 font-[family-name:var(--font-source-serif)] text-lg leading-[1.8] text-zinc-600 dark:text-zinc-400">
            <p>
              Albis started from a simple observation: the same event, reported in different languages and different regions, creates different realities. A shipping crisis is an economic story in Europe, a security story in the Middle East, and barely covered in Africa. Each audience thinks they have the full picture. None of them do.
            </p>
            <p>
              We built Albis to make that visible. Not to tell you what to think, but to show you what every region is reporting &mdash; so you can see the full picture and decide for yourself.
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
