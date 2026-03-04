import type { Metadata } from "next";
import Link from "next/link";
import { getTodayScan, REGION_LABELS } from "@/lib/scan-parser";
import { hasBlindspot } from "@/lib/scan-types";
import { EmailCapture } from "../components/email-capture";
import { ShareButtons } from "../components/share-buttons";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const scan = await getTodayScan();
  
  let topic = "Today's biggest story";
  let regions = "western-world,east-se-asia,middle-east";
  let date = "";
  
  if (scan?.rawMarkdown) {
    const m = scan.rawMarkdown.match(/##\s*🔍?\s*Framing Watch[:\s—–-]*([^\n]+)/i);
    if (m) topic = m[1].trim();
  }
  if (scan?.displayDate) date = scan.displayDate;

  const ogUrl = `/api/og?title=${encodeURIComponent(topic)}&regions=${encodeURIComponent(regions)}&date=${encodeURIComponent(date)}`;

  return {
    title: `${topic} — See how the world reported it | Albis`,
    description:
      "One event. Multiple perspectives. See how different regions reported the same news — updated daily by Albis.",
    openGraph: {
      title: `${topic} — See how the world reported it | Albis`,
      description:
        "One event. Multiple perspectives. See how different regions reported the same news.",
      type: "website",
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${topic} — See how the world reported it | Albis`,
      description:
        "One event. Multiple perspectives. See how different regions reported the same news.",
      images: [ogUrl],
    },
  };
}

// Region flags removed - no emojis on website

interface FramingPerspective {
  region: string;
  flag: string;
  reported: string;
}

function parseFramingWatch(rawMarkdown: string): {
  topic: string;
  perspectives: FramingPerspective[];
  absent?: string;
  observation?: string;
} | null {
  // Try multiple section header formats:
  // 1. ## 🔍 Framing Watch: Topic
  // 2. **Framing Watch: Topic**
  const headerPatterns = [
    /##\s*🔍?\s*Framing Watch[:\s—–-]*([^\n]+)\n([\s\S]*?)(?=\n---|\n##[^#]|$)/i,
    /\*\*Framing Watch[^*]*\*\*\s*([\s\S]*?)(?=\n\*\*(?:Mood|Pattern)|$)/i,
  ];

  let block: string | null = null;
  let topic = "Today's Story";

  for (const pattern of headerPatterns) {
    const m = rawMarkdown.match(pattern);
    if (m) {
      if (pattern.source.startsWith('##')) {
        topic = m[1].trim();
        block = m[2];
      } else {
        const topicMatch = m[0].match(/Framing Watch[:\s—–-]*([^*\n]+)/i);
        if (topicMatch) topic = topicMatch[1].trim();
        block = m[0];
      }
      break;
    }
  }

  if (!block) return null;

  const perspectives: FramingPerspective[] = [];
  let absent: string | undefined;
  let observation: string | undefined;

  // Extract perspective lines: - **Region (description):** "quote" — analysis
  // Also handles: - Region: "quote"
  const lineRegex = /^-\s*\*?\*?([^*\n]+?)\*?\*?:\s*(.+)/gm;
  let match;

  while ((match = lineRegex.exec(block)) !== null) {
    const label = match[1].trim().replace(/\*+/g, '');
    const content = match[2].trim();

    if (label.toLowerCase().startsWith("absent")) {
      absent = content;
      continue;
    }
    if (label.toLowerCase().startsWith("mechanism")) {
      observation = content;
      continue;
    }

    // No flag emojis on website
    const flag = "";

    // Clean up region name: extract just the name part from "US (American media)" → "US"
    const regionClean = label.replace(/\s*\(.*\)\s*$/, '').trim();

    perspectives.push({
      region: regionClean,
      flag,
      reported: content,
    });
  }

  // Also check for non-list "Absent from:" and "Mechanism:" lines
  if (!absent) {
    const absentMatch = block.match(/\*\*Absent from:?\*\*\s*(.+)/i);
    if (absentMatch) absent = absentMatch[1].trim();
  }
  if (!observation) {
    const mechMatch = block.match(/\*\*Mechanism:?\*\*\s*(.+)/i);
    if (mechMatch) observation = mechMatch[1].trim();
  }

  if (perspectives.length < 2) return null;

  return { topic, perspectives, absent, observation };
}

export default async function ComparePage() {
  const scan = await getTodayScan();

  // Try to extract framing watch from scan data
  let parsed = null;
  
  // First try raw markdown which has the full framing watch section
  if (scan?.rawMarkdown) {
    parsed = parseFramingWatch(scan.rawMarkdown);
  }
  
  // Then try the framingWatchRaw field  
  if (!parsed && scan?.framingWatchRaw) {
    // framingWatchRaw is the note field - wrap it to look like a framing watch section
    const wrapped = `**Framing Watch: Today's Story**\n${scan.framingWatchRaw}`;
    parsed = parseFramingWatch(wrapped);
  }

  // If no framing watch data, show empty state
  if (!parsed || parsed.perspectives.length < 2) {
    return <NoComparisonState />;
  }

  const topic = parsed.topic;
  const perspectives = parsed.perspectives;
  const absent = parsed.absent;
  const observation = parsed.observation;
  const displayDate = scan?.displayDate;
  const blindspotCount = scan?.items.filter(i => hasBlindspot(i)).length ?? 0;

  return (
    <main className="overflow-hidden">
      {/* Hero */}
      <section className="relative bg-[#f8f7f4] py-20 dark:bg-[#0f0f0f] md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-subtle-grid opacity-60" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/60 via-transparent to-transparent dark:from-amber-950/15 dark:via-transparent" />

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#c8922a]/70 font-[family-name:var(--font-playfair)] italic">
            {displayDate ? `From today\u2019s scan` : "How Albis works"}
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-tight tracking-tight text-[#0f0f0f] md:text-5xl dark:text-[#f0efec]">
            One event. {perspectives.length} perspectives.
          </h1>
          <p className="mt-4 mx-auto max-w-lg text-lg text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
            Same facts. Different stories. See how different regions reported the same event.
          </p>
          {displayDate && (
            <p className="mt-3 text-sm text-zinc-400 dark:text-zinc-500">
              {displayDate}
            </p>
          )}
        </div>
      </section>

      {/* Story + Regional Perspective Cards */}
      <section className="relative bg-[#f2f0eb] py-16 dark:bg-[#111111] md:py-24">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/20 to-transparent" />
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#c8922a]">
            The event
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-snug text-[#0f0f0f] md:text-3xl dark:text-[#f0efec]">
            {topic}
          </h2>

          <p className="mt-2 text-xs font-medium tracking-[0.18em] uppercase text-zinc-400 dark:text-zinc-500 pt-6">
            How different regions reported it
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {perspectives.map((p, i) => (
              <div
                key={i}
                className="rounded-xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-white/[0.03]"
              >
                <div className="flex items-center gap-2.5">
                  <p className="text-xs font-bold tracking-[0.12em] uppercase text-zinc-500 dark:text-zinc-400">
                    {p.region}
                  </p>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-zinc-600 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
                  {p.reported}
                </p>
              </div>
            ))}
          </div>

          {/* What's absent */}
          {absent && (
            <div className="mt-6 rounded-xl border border-dashed border-zinc-300/60 bg-zinc-50/50 p-5 dark:border-zinc-700/40 dark:bg-zinc-900/30">
              <p className="text-xs font-bold tracking-[0.12em] uppercase text-zinc-400 dark:text-zinc-500">
                What&apos;s absent
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
                {absent}
              </p>
            </div>
          )}

          {/* Observation — not a judgment, just what we notice */}
          {observation && (
            <div className="mt-6 rounded-xl border border-[#c8922a]/20 bg-amber-50/30 p-5 dark:border-[#c8922a]/10 dark:bg-amber-950/10">
              <p className="text-xs font-bold tracking-[0.12em] uppercase text-[#c8922a]/70">
                What we observe
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 font-[family-name:var(--font-source-serif)] italic dark:text-zinc-400">
                {observation}
              </p>
            </div>
          )}

          {/* Blindspot badge */}
          {blindspotCount > 0 && (
            <div className="mt-6 flex items-center gap-2 rounded-lg border border-amber-200/50 bg-amber-50/40 px-4 py-3 dark:border-amber-800/30 dark:bg-amber-950/20">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-amber-600 dark:text-amber-400">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <span className="font-medium">{blindspotCount} blindspot{blindspotCount !== 1 ? "s" : ""}</span> detected in today&apos;s scan
              </p>
            </div>
          )}

          {/* Share buttons */}
          <ShareButtons 
            url="https://www.albis.news/compare" 
            title={`${topic} — See how the world reported it`}
            description="One event. Multiple perspectives. See how different regions reported the same news."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#1a3a5c] py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-subtle-grid opacity-30" />
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-[#c8922a]/10 blur-3xl" />

        <div className="relative mx-auto max-w-xl px-6 text-center">
          <p className="font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-white md:text-3xl">
            This is what Albis does.
            <br />
            <span className="font-light italic text-white/75">
              Every event. Every day. Observe, never judge.
            </span>
          </p>

          <div className="mt-10">
            <EmailCapture />
          </div>

          <p className="mt-5 text-sm text-white/50">
            Or{" "}
            <a
              href="https://t.me/albisdaily"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white/70 underline underline-offset-2 hover:text-white"
            >
              join on Telegram →
            </a>
          </p>

          <p className="mt-4 text-xs text-white/30">
            Free forever. No credit card. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </main>
  );
}

function NoComparisonState() {
  return (
    <main className="overflow-hidden">
      {/* Hero */}
      <section className="relative bg-[#f8f7f4] py-20 dark:bg-[#0f0f0f] md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-subtle-grid opacity-60" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/60 via-transparent to-transparent dark:from-amber-950/15 dark:via-transparent" />

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#c8922a]/70 font-[family-name:var(--font-playfair)] italic">
            Compare
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-tight tracking-tight text-[#0f0f0f] md:text-5xl dark:text-[#f0efec]">
            No comparison available today
          </h1>
          <p className="mt-4 mx-auto max-w-lg text-lg text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
            Check back after the next scan — comparisons update 3× daily.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/briefing"
              className="inline-flex h-11 min-w-[44px] items-center rounded-full bg-zinc-900 px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              View Today&apos;s Briefing
            </Link>
            <a
              href="https://t.me/albisdaily"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 min-w-[44px] items-center gap-2 rounded-full border border-zinc-300 bg-white px-8 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.693-1.653-1.124-2.678-1.8-1.185-.781-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.14.121.099.155.232.171.326.016.093.036.306.02.472z"/>
              </svg>
              Join on Telegram
            </a>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="relative bg-[#f2f0eb] py-16 dark:bg-[#111111] md:py-24">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/20 to-transparent" />
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-snug text-[#0f0f0f] md:text-3xl dark:text-[#f0efec]">
            How comparisons work
          </h2>
          <p className="mt-4 text-base text-zinc-600 font-[family-name:var(--font-source-serif)] dark:text-zinc-400 max-w-2xl mx-auto">
            When significant global events occur, Albis tracks how different regions frame the same story. 
            You&apos;ll see side-by-side comparisons showing how Western, Asian, Middle Eastern, and other 
            media outlets report the same facts through different cultural and political lenses.
          </p>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">
            Scans run 3× daily. Comparisons appear when major stories generate distinct regional framings.
          </p>
        </div>
      </section>
    </main>
  );
}
