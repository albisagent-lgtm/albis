import type { Metadata } from "next";
import { getTodayScan, REGION_LABELS } from "@/lib/scan-parser";
import { EmailCapture } from "../components/email-capture";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "See how the world reported today's biggest story | Albis",
  description:
    "One event. Multiple perspectives. See how different regions reported the same news — updated daily by Albis.",
  openGraph: {
    title: "See how the world reported today's biggest story | Albis",
    description:
      "One event. Multiple perspectives. See how different regions reported the same news.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "See how the world reported today's biggest story | Albis",
    description:
      "One event. Multiple perspectives. See how different regions reported the same news.",
    images: ["/og-image.png"],
  },
};

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
  // Look for Framing Watch section
  const fwMatch = rawMarkdown.match(
    /\*\*Framing Watch[^*]*\*\*\s*([\s\S]*?)(?=\n\*\*(?:Mood|Pattern)|$)/i
  );
  if (!fwMatch) return null;

  const block = fwMatch[0];

  // Extract topic from the header
  const topicMatch = block.match(/Framing Watch[:\s—–-]*([^*\n]+)/i);
  const topic = topicMatch ? topicMatch[1].trim() : "Today's Story";

  // Extract perspective lines (- Region: "quote" — description)
  const perspectives: FramingPerspective[] = [];
  const lineRegex = /^-\s*(.+?):\s*(.+)/gm;
  let match;
  let absent: string | undefined;

  while ((match = lineRegex.exec(block)) !== null) {
    const label = match[1].trim();
    const content = match[2].trim();

    // Skip "absent from" or "mechanism" lines
    if (label.toLowerCase().startsWith("absent")) {
      absent = content;
      continue;
    }
    if (label.toLowerCase().startsWith("mechanism")) continue;

    // Determine flag
    let flag = "🌐";
    const labelLower = label.toLowerCase();
    if (labelLower.includes("uk") || labelLower.includes("british") || labelLower.includes("britain")) flag = "🇬🇧";
    else if (labelLower.includes("us ") || labelLower.includes("american") || labelLower.includes("us framing")) flag = "🇺🇸";
    else if (labelLower.includes("europe")) flag = "🇪🇺";
    else if (labelLower.includes("china") || labelLower.includes("chinese")) flag = "🇨🇳";
    else if (labelLower.includes("russia")) flag = "🇷🇺";
    else if (labelLower.includes("india")) flag = "🇮🇳";
    else if (labelLower.includes("middle east")) flag = "🕌";
    else if (labelLower.includes("africa")) flag = "🌍";
    else if (labelLower.includes("asia")) flag = "🌏";
    else if (labelLower.includes("latin") || labelLower.includes("south america")) flag = "🌎";
    else if (labelLower.includes("iran")) flag = "🇮🇷";

    perspectives.push({
      region: label,
      flag,
      reported: content,
    });
  }

  if (perspectives.length < 2) return null;

  // Extract mechanism/observation line
  const mechMatch = block.match(/[-–]\s*Mechanism:\s*(.+)/i);
  const observation = mechMatch ? mechMatch[1].trim() : undefined;

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
