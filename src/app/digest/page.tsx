import Link from "next/link";
import {
  getTodayScan,
  hasFramingWatch,
  hasBlindspot,
  REGION_LABELS,
  type ScanItem,
} from "@/lib/scan-parser";
import { estimateItemReadingTime } from "@/lib/reading-time";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Daily Digest",
  description:
    "Your daily intelligence briefing from Albis — top stories, blindspot alerts, and pattern detection across 7 regions.",
};

export default async function DigestPage() {
  const scan = await getTodayScan();

  const topStories = scan?.items.filter((i) => i.significance === "high").slice(0, 8) || [];
  const blindspotItem = scan?.items.find((i) => hasBlindspot(i));

  return (
    <main className="bg-[#f8f7f4] py-8 dark:bg-[#0f0f0f]">
      {/* Email preview badge */}
      <div className="mx-auto max-w-[600px] px-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-medium text-violet-600 dark:border-violet-800/40 dark:bg-violet-950/30 dark:text-violet-400">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Email Preview
          </span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
            How this looks in your inbox
          </span>
        </div>
      </div>

      {/* Email container */}
      <div className="mx-auto max-w-[600px] overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-[0_2px_16px_rgb(0,0,0,0.06)] dark:border-white/[0.08] dark:bg-[#1a1a1a] dark:shadow-none">

        {/* Header */}
        <div className="border-b border-black/[0.06] px-8 py-6 dark:border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="font-[family-name:var(--font-playfair)] text-2xl italic font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
              Albis
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              Daily Intelligence Briefing
            </span>
          </div>
          {scan && (
            <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
              {scan.displayDate}
            </p>
          )}
        </div>

        {/* Pattern of the Day */}
        {scan?.patternOfDay && (
          <div className="border-b border-black/[0.06] px-8 py-6 dark:border-white/[0.06]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c8922a]">
              Pattern of the Day
            </p>
            {scan.patternOfDay.title && (
              <p className="mt-2 font-[family-name:var(--font-playfair)] text-lg font-semibold italic leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
                {scan.patternOfDay.title}
              </p>
            )}
            <p className="mt-2 text-sm leading-relaxed text-zinc-500 font-[family-name:var(--font-source-serif)] dark:text-zinc-400">
              {scan.patternOfDay.body}
            </p>
          </div>
        )}

        {/* Top Stories */}
        {topStories.length > 0 && (
          <div className="border-b border-black/[0.06] px-8 py-6 dark:border-white/[0.06]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              Top Stories
            </p>
            <div className="mt-4 space-y-5">
              {topStories.map((item, i) => (
                <DigestStoryCard key={i} item={item} index={i + 1} />
              ))}
            </div>
          </div>
        )}

        {/* Blindspot Alert */}
        {blindspotItem && (
          <div className="border-b border-black/[0.06] px-8 py-6 dark:border-white/[0.06]">
            <div className="rounded-lg border border-amber-200/50 bg-amber-50/50 p-5 dark:border-amber-800/20 dark:bg-amber-950/10">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-amber-600 dark:text-amber-400">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
                  Blindspot Alert
                </p>
              </div>
              <p className="mt-3 text-sm font-medium leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
                {blindspotItem.headline}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                This story has limited regional coverage. You may be missing perspectives from{" "}
                {blindspotItem.blindspot?.missingFrom
                  .slice(0, 3)
                  .map((r) => REGION_LABELS[r] || r)
                  .join(", ")}
                .
              </p>
            </div>
          </div>
        )}

        {/* Subscribe CTA */}
        <div className="px-8 py-8 text-center">
          <p className="text-sm font-medium text-[#0f0f0f] dark:text-[#f0efec]">
            Get this briefing in your inbox every morning
          </p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Clarity, not noise. Delivered at 7:00 AM.
          </p>
          <div className="mt-4 flex gap-2">
            <input
              type="email"
              placeholder="you@email.com"
              className="h-10 flex-1 rounded-lg border border-zinc-200 bg-white px-4 text-sm text-zinc-700 placeholder:text-zinc-400 focus:border-[#1a3a5c] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-[#4a7baa]"
            />
            <button className="h-10 rounded-lg bg-[#1a3a5c] px-5 text-sm font-medium text-white hover:bg-[#243f66]">
              Subscribe
            </button>
          </div>
          <p className="mt-2 text-[10px] text-zinc-300 dark:text-zinc-600">
            Free · No spam · Unsubscribe anytime
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-black/[0.06] px-8 py-5 dark:border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="font-[family-name:var(--font-playfair)] text-sm italic font-semibold text-zinc-400 dark:text-zinc-500">
              Albis
            </span>
            <span className="text-[10px] text-zinc-300 dark:text-zinc-600">
              The app designed to let you go.
            </span>
          </div>
          <div className="mt-3 flex gap-4 text-[10px] text-zinc-300 dark:text-zinc-600">
            <Link href="/" className="hover:text-zinc-500 dark:hover:text-zinc-400">View online</Link>
            <span>&middot;</span>
            <Link href="/settings" className="hover:text-zinc-500 dark:hover:text-zinc-400">Manage preferences</Link>
            <span>&middot;</span>
            <button className="hover:text-zinc-500 dark:hover:text-zinc-400">Unsubscribe</button>
          </div>
        </div>
      </div>

      {/* Below the email container */}
      <div className="mx-auto mt-6 max-w-[600px] px-6 text-center">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          This is a preview of how your daily email digest will look.
        </p>
        <Link
          href="/briefing"
          className="mt-3 inline-flex h-9 items-center gap-2 rounded-full border border-zinc-200 px-5 text-xs font-medium text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
        >
          View full briefing
        </Link>
      </div>
    </main>
  );
}

function DigestStoryCard({ item, index }: { item: ScanItem; index: number }) {
  const readTime = estimateItemReadingTime(item.headline, item.connection);
  const framing = hasFramingWatch(item);
  const blindspot = hasBlindspot(item);

  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
          {item.headline}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {item.regions.slice(0, 3).map((r) => (
            <span key={r} className="text-[10px] text-zinc-400 dark:text-zinc-500">
              {REGION_LABELS[r] || r}
            </span>
          ))}
          {framing && (
            <span className="text-[10px] font-semibold text-[#c8922a]">
              Framing Watch
            </span>
          )}
          {blindspot && (
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              Blindspot
            </span>
          )}
          <span className="ml-auto text-[10px] text-zinc-300 dark:text-zinc-600">
            {readTime}
          </span>
        </div>
        {/* Mini perspective bar */}
        <div className="mt-1.5 flex h-[2px] w-full overflow-hidden rounded-full">
          {item.regions.filter((r) => r !== "global").map((region) => (
            <div
              key={region}
              className="flex-1"
              style={{
                backgroundColor: {
                  "south-asia": "#8b5cf6",
                  "western-world": "#3b82f6",
                  "middle-east": "#f59e0b",
                  "eastern-europe": "#ef4444",
                  "africa": "#10b981",
                  "east-se-asia": "#ec4899",
                  "latin-americas": "#06b6d4",
                }[region] || "#a1a1aa",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
