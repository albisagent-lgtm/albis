import type { Metadata } from "next";
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

const REGION_FLAGS: Record<string, string> = {
  "western-world": "🌎",
  west: "🌎",
  "east-se-asia": "🌏",
  "south-asia": "🇮🇳",
  "middle-east": "🕌",
  africa: "🌍",
  "eastern-europe": "🇪🇺",
  "e-europe": "🇪🇺",
  "latin-america": "🌎",
  global: "🌐",
};

// Fallback with REAL framing watch data (from our actual scans)
const FALLBACK = {
  topic: "Epstein Files & Prince Andrew Arrest",
  perspectives: [
    {
      region: "United Kingdom",
      flag: "🇬🇧",
      reported: "\"Royal scandal damages institution\" — coverage centres on the monarchy's reputation crisis and what this means for the royal family's legitimacy.",
    },
    {
      region: "Europe",
      flag: "🇪🇺",
      reported: "\"Network exposure across multiple jurisdictions\" — intelligence sources frame it as systemic corruption being revealed, with probes opening from London to Norway.",
    },
    {
      region: "United States",
      flag: "🇺🇸",
      reported: "\"Legal liability for figures in Trump circles\" — emerging US framing centres on political vulnerability and which American names appear in the files.",
    },
  ],
  absent: "Middle East, Africa — largely absent from coverage due to geo-political distance and US-centric media concentration.",
  observation: "The same evidence — the release of Epstein files — becomes a domestic legitimacy crisis in the UK, a conspiracy revelation in Europe, and a political threat in the US. Same facts. Different institutional stakes. Different stories.",
};

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

    // Determine flag from label
    let flag = "🌐";
    const labelLower = label.toLowerCase();
    if (labelLower.includes("uk") || labelLower.includes("british") || labelLower.includes("britain")) flag = "🇬🇧";
    else if (labelLower.includes("us") || labelLower.includes("american")) flag = "🇺🇸";
    else if (labelLower.includes("europe") || labelLower.includes("eu ")) flag = "🇪🇺";
    else if (labelLower.includes("china") || labelLower.includes("chinese")) flag = "🇨🇳";
    else if (labelLower.includes("russia")) flag = "🇷🇺";
    else if (labelLower.includes("india") || labelLower.includes("modi")) flag = "🇮🇳";
    else if (labelLower.includes("middle east")) flag = "🕌";
    else if (labelLower.includes("africa")) flag = "🌍";
    else if (labelLower.includes("asia")) flag = "🌏";
    else if (labelLower.includes("latin") || labelLower.includes("south america")) flag = "🌎";
    else if (labelLower.includes("iran")) flag = "🇮🇷";
    else if (labelLower.includes("japan")) flag = "🇯🇵";

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

  let topic: string;
  let perspectives: FramingPerspective[];
  let absent: string | undefined;
  let observation: string | undefined;
  let displayDate: string | undefined;

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

  if (parsed && parsed.perspectives.length >= 2) {
    topic = parsed.topic;
    perspectives = parsed.perspectives;
    absent = parsed.absent;
    observation = parsed.observation;
    displayDate = scan?.displayDate;
  } else {
    topic = FALLBACK.topic;
    perspectives = FALLBACK.perspectives;
    absent = FALLBACK.absent;
    observation = FALLBACK.observation;
  }

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
                  <span className="text-xl">{p.flag}</span>
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
          <ShareButtons topic={topic} />
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
