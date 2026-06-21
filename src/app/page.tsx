import Link from "next/link";
import { EmailCapture } from "./components/email-capture";
import { getTodayScan, REGION_LABELS, CATEGORY_META, type ScanItem } from "@/lib/scan-parser";

export const revalidate = 300;

function regionLabel(region: string) {
  return REGION_LABELS[region] || region.replaceAll("-", " ");
}

function categoryLabel(category: string) {
  return CATEGORY_META[category]?.label || category.replaceAll("-", " ");
}

function lifeSystemFor(item: ScanItem) {
  const text = `${item.category} ${item.tags?.join(" ") || ""} ${item.headline}`.toLowerCase();
  if (/food|farm|agriculture|grain|hunger|famine|crop|fertilizer|fish|seafood/.test(text)) return "Food system";
  if (/energy|oil|gas|power|grid|electric|fuel|solar|nuclear|refinery/.test(text)) return "Energy system";
  if (/water|river|drought|flood|rain|storm|ocean|sea/.test(text)) return "Water & climate system";
  if (/health|disease|vaccine|hospital|ebola|measles|virus|medicine/.test(text)) return "Health system";
  if (/school|education|teacher|student|exam|university/.test(text)) return "Education system";
  if (/media|platform|internet|ai|information|press|speech|misinformation/.test(text)) return "Information system";
  if (/trade|tariff|shipping|supply|route|port|market|currency|bank/.test(text)) return "Economic flow";
  return "Life system signal";
}

function selectLifeSystemItems(items: ScanItem[]) {
  const priority = ["food", "food-agriculture", "energy", "climate-energy", "health", "water", "weather-climate", "economic-flows", "markets", "tech-ai"];
  return [...items]
    .sort((a, b) => {
      const sig = { high: 3, medium: 2, low: 1 } as const;
      const aPriority = priority.includes(a.category) ? 1 : 0;
      const bPriority = priority.includes(b.category) ? 1 : 0;
      return bPriority - aPriority || (sig[b.significance] || 0) - (sig[a.significance] || 0) || (b.regions?.length || 0) - (a.regions?.length || 0);
    })
    .slice(0, 4);
}

function StorySignal({ item }: { item: ScanItem }) {
  const regions = (item.regions || []).slice(0, 4).map(regionLabel);
  return (
    <article className="rounded-3xl border border-black/[0.07] bg-white/80 p-5 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.035]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#c8922a]/10 px-2.5 py-1 font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.14em] text-[#9b6b18] dark:text-[#f0c15e]">
          {lifeSystemFor(item)}
        </span>
        <span className="font-[family-name:var(--font-inter)] text-xs text-zinc-400">
          {categoryLabel(item.category)}
        </span>
      </div>
      <h3 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-bold leading-tight text-[#0f0f0f] dark:text-[#f0efec]">
        {item.headline}
      </h3>
      {item.connection ? (
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          {item.connection}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {regions.map((region) => (
          <span key={region} className="rounded-full border border-black/[0.08] px-2.5 py-1 font-[family-name:var(--font-inter)] text-[11px] text-zinc-500 dark:border-white/[0.10] dark:text-zinc-400">
            {region}
          </span>
        ))}
      </div>
    </article>
  );
}

export default async function Home() {
  const scan = await getTodayScan();
  const items = scan?.items || [];
  const featured = selectLifeSystemItems(items);
  const topStory = featured[0] || items[0] || null;

  return (
    <main className="overflow-hidden bg-[#f8f7f4] text-[#111] dark:bg-[#0f0f0f] dark:text-[#f4f1ea]">
      <section className="relative flex min-h-[78vh] items-center justify-center border-b border-black/[0.07] dark:border-white/[0.06]">
        <div className="pointer-events-none absolute inset-0 bg-subtle-grid opacity-50" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/70 via-transparent to-transparent dark:from-amber-950/15" />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.2em] text-[#b58320]">
            News intelligence, not noise
          </p>
          <h1 className="mt-6 font-[family-name:var(--font-playfair)] text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl">
            See the systems behind the news.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl font-[family-name:var(--font-source-serif)] text-xl leading-relaxed text-zinc-600 dark:text-zinc-300 md:text-2xl">
            Albis scans across regions and languages to show what the world is seeing, what your usual feed may miss, and how the systems that sustain life are shifting.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/read" className="rounded-full bg-[#1a3a5c] px-7 py-3.5 font-[family-name:var(--font-inter)] text-sm font-bold text-white shadow-[0_4px_20px_rgb(26,58,92,0.25)] hover:bg-[#243f66]">
              Read latest
            </Link>
            <Link href="/life-systems" className="rounded-full border border-black/[0.12] bg-white/70 px-7 py-3.5 font-[family-name:var(--font-inter)] text-sm font-bold text-zinc-700 hover:border-[#c8922a]/50 hover:text-[#9b6b18] dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-zinc-200">
              Life systems
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#f2f0eb] py-16 dark:bg-[#111] md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-2xl">
            <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.2em] text-[#b58320]">
              Today’s scan
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-4xl font-bold leading-tight md:text-5xl">
              Signals from the systems people rely on.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              The useful question is not just “what happened?” It is what the event reveals about food, energy, water, health, information, trade, and public resilience.
            </p>
          </div>

          {topStory ? (
            <div className="mt-10 grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
              <StorySignal item={topStory} />
              <div className="rounded-3xl border border-[#c8922a]/25 bg-[#fff8e8] p-5 dark:border-[#f0c15e]/20 dark:bg-[#f0c15e]/10">
                <p className="font-[family-name:var(--font-inter)] text-[10px] font-bold uppercase tracking-[0.16em] text-[#9b6b18] dark:text-[#f0c15e]">
                  Albis lens
                </p>
                <h3 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-bold">
                  What changed in the system?
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  Every story is treated as a signal: who depends on this system, where pressure is appearing, which regions are paying attention, and which angles are still thin.
                </p>
              </div>
            </div>
          ) : null}

          {featured.length > 1 ? (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {featured.slice(1, 4).map((item) => <StorySignal key={item.headline} item={item} />)}
            </div>
          ) : null}
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.2em] text-[#b58320]">
            How it works
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-4xl font-bold md:text-5xl">
            A simple lens.
          </h2>
          <div className="mt-12 grid gap-8 text-left md:grid-cols-3">
            {[
              ["Scan wider", "Look across regions, languages, and sources — not only the loudest English-language headlines."],
              ["Compare attention", "Show which places are covering a story, which are thin, and how the framing shifts."],
              ["Read as life systems", "Explain stories through the systems that sustain life: energy, food, water, health, climate, infrastructure, and information."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-3xl border border-black/[0.07] bg-white/60 p-5 dark:border-white/[0.08] dark:bg-white/[0.035]">
                <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-black/[0.07] bg-[#f2f0eb] py-16 dark:border-white/[0.06] dark:bg-[#111] md:py-24">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-[0.2em] text-[#b58320]">
              Life systems
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-4xl font-bold leading-tight md:text-5xl">
              Energy. Food. Water. Health. Information.
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
            Albis is moving back toward its clearest shape: a calm public intelligence layer for understanding the systems that shape material life. Not another social feed — a way to see what matters, what is missing, and what pressure is building.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-xl px-6 text-center">
          <h2 className="font-[family-name:var(--font-playfair)] text-4xl font-bold leading-tight">
            One calm briefing.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
            Follow the day’s global signals without turning Albis into another feed to live inside.
          </p>
          <div className="mt-7 rounded-3xl border border-black/[0.07] bg-white/70 p-5 dark:border-white/[0.08] dark:bg-white/[0.035]">
            <EmailCapture variant="hero" showSocialProof={false} showYesterdayLink={false} source="simple-home-life-systems" />
          </div>
        </div>
      </section>
    </main>
  );
}
