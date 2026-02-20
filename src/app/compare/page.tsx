import type { Metadata } from "next";
import { getTodayScan, REGION_LABELS, type ScanItem } from "@/lib/scan-parser";
import { EmailCapture } from "../components/email-capture";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "See how the world reported today's biggest story | Albis",
  description:
    "One story. Multiple perspectives. See how different regions frame the same news — updated daily by Albis.",
  openGraph: {
    title: "See how the world reported today's biggest story | Albis",
    description:
      "One story. Multiple perspectives. See how different regions frame the same news.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "See how the world reported today's biggest story | Albis",
    description:
      "One story. Multiple perspectives. See how different regions frame the same news.",
    images: ["/og-image.png"],
  },
};

const REGION_FLAGS: Record<string, string> = {
  west: "🌎",
  "east-se-asia": "🌏",
  "south-asia": "🇮🇳",
  "middle-east": "🕌",
  africa: "🌍",
  "e-europe": "🇪🇺",
  "latin-america": "🌎",
  global: "🌐",
};

const FALLBACK = {
  headline: "Global trade negotiations stall as tariff tensions rise",
  regions: [
    {
      key: "west",
      framing:
        "Markets react nervously to diplomatic breakdown, with tech stocks leading the decline. Western media focuses on economic impact to consumers.",
    },
    {
      key: "east-se-asia",
      framing:
        "Regional leaders emphasise alternative trade partnerships and domestic demand resilience. Coverage highlights self-sufficiency and new alliances.",
    },
    {
      key: "middle-east",
      framing:
        "Energy exporters see opportunity in shifting supply chains, focus on bilateral deals. Reporting centres on strategic repositioning.",
    },
    {
      key: "africa",
      framing:
        "Commodity-dependent economies brace for price volatility, call for fairer trade terms. Stories focus on sovereignty and development impact.",
    },
  ],
};

function splitConnectionByRegion(
  connection: string,
  regions: string[]
): { key: string; text: string }[] {
  const filtered = regions.filter((r) => r !== "global").slice(0, 4);
  if (filtered.length === 0) return [];

  const sentences = connection.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length >= filtered.length) {
    const perRegion = Math.ceil(sentences.length / filtered.length);
    return filtered.map((key, i) => {
      const start = i * perRegion;
      return {
        key,
        text: sentences.slice(start, start + perRegion).join(" ") || connection,
      };
    });
  }

  return filtered.map((key) => ({ key, text: connection }));
}

export default async function ComparePage() {
  const scan = await getTodayScan();

  // Find the story with the most regions
  const bestStory = scan?.items
    .filter((i) => i.regions.length >= 2 && i.connection)
    .sort((a, b) => b.regions.length - a.regions.length)[0] || null;

  let headline: string;
  let cards: { key: string; framing: string }[];

  if (bestStory) {
    headline = bestStory.headline;
    const parts = splitConnectionByRegion(
      bestStory.connection,
      bestStory.regions
    );
    cards =
      parts.length > 0
        ? parts.map((p) => ({ key: p.key, framing: p.text }))
        : bestStory.regions
            .filter((r) => r !== "global")
            .slice(0, 4)
            .map((key) => ({ key, framing: bestStory.connection }));
  } else {
    headline = FALLBACK.headline;
    cards = FALLBACK.regions;
  }

  return (
    <main className="overflow-hidden">
      {/* Hero */}
      <section className="relative bg-[#f8f7f4] py-20 dark:bg-[#0f0f0f] md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-subtle-grid opacity-60" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/60 via-transparent to-transparent dark:from-amber-950/15 dark:via-transparent" />

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <p className="text-xs font-medium tracking-[0.18em] uppercase text-[#c8922a]/70 font-[family-name:var(--font-playfair)] italic">
            Today&apos;s scan
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-tight tracking-tight text-[#0f0f0f] md:text-5xl dark:text-[#f0efec]">
            One story. {cards.length} perspectives.
          </h1>
          {scan && (
            <p className="mt-3 text-sm text-zinc-400 dark:text-zinc-500">
              {scan.displayDate}
            </p>
          )}
        </div>
      </section>

      {/* Story + Cards */}
      <section className="relative bg-[#f2f0eb] py-16 dark:bg-[#111111] md:py-24">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8922a]/20 to-transparent" />
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-snug text-[#0f0f0f] md:text-3xl dark:text-[#f0efec]">
            {headline}
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {cards.map((card) => (
              <div
                key={card.key}
                className="rounded-xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-white/[0.03]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">
                    {REGION_FLAGS[card.key] || "🌐"}
                  </span>
                  <p className="text-xs font-bold tracking-[0.12em] uppercase text-zinc-500 dark:text-zinc-400">
                    {REGION_LABELS[card.key] || card.key}
                  </p>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-zinc-600 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
                  {card.framing}
                </p>
              </div>
            ))}
          </div>
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
              Every story. Every day.
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
