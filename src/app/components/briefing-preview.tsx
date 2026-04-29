"use client";

// ---------------------------------------------------------------------------
// BriefingPreview — Company Daily Scan V1 preview card
//
// Static confidence preview for onboarding. This should describe the product
// customers will receive: a topic-by-topic scan with open source links, a small
// perception-gap note, and practical watch-next points. No analyst-memo copy.
// ---------------------------------------------------------------------------

import {
  findThemeOption,
  findWatchlistOption,
} from "@/lib/onboarding-taxonomy";

export interface BriefingPreviewProps {
  companyName: string;
  themes: string[]; // canonical values
  watchlist: string[];
  deliveryTime: string; // "HH:MM"
  timezone: string; // IANA
}

/**
 * Format an IANA timezone into a friendly label.
 * e.g. "Europe/London" → "London", "America/New_York" → "New York".
 */
function friendlyTimezone(tz: string): string {
  if (!tz) return "UTC";
  const parts = tz.split("/");
  const city = parts[parts.length - 1] || tz;
  return city.replace(/_/g, " ");
}

function themeLabels(values: string[], n = 3): string[] {
  return values.map((v) => findThemeOption(v)?.label ?? v).slice(0, n);
}

function watchlistLabels(values: string[], n = 4): string[] {
  return values.map((v) => findWatchlistOption(v)?.label ?? v).slice(0, n);
}

export function BriefingPreview({
  companyName,
  themes,
  watchlist,
  deliveryTime,
  timezone,
}: BriefingPreviewProps) {
  const topics = themeLabels(themes, 3);
  const entities = watchlistLabels(watchlist, 4);
  const tzLabel = friendlyTimezone(timezone);

  const displayName = companyName.trim() || "Your Company";
  const firstTopic = topics[0] || entities[0] || "Supply chain risk";
  const secondTopic = topics[1] || entities[1] || "Regional policy";

  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-5 dark:border-white/[0.07] dark:bg-white/[0.03]">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c8922a]">
          Preview — Company Daily Scan
        </p>
        <span className="text-[10px] text-zinc-400 dark:text-zinc-600">
          Example format
        </span>
      </div>

      <div className="mt-4 border-b border-black/[0.07] pb-3 dark:border-white/[0.07]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Albis Company Daily Scan
        </p>
        <p className="mt-1 font-[family-name:var(--font-playfair)] text-base font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
          {displayName}
        </p>
        {(topics.length > 0 || entities.length > 0) && (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Monitoring: {[...topics, ...entities].slice(0, 4).join(" · ")}
          </p>
        )}
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c8922a]">
          Your Daily Scan
        </p>
        <div className="mt-3 space-y-4">
          {[firstTopic, secondTopic].map((topic, i) => (
            <div key={topic}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                {topic}
              </p>
              <p className="mt-1 text-[13px] font-semibold leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
                {i + 1}. A new open-web finding appears under this topic.
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                The daily email gives the useful fact directly, without internal
                process notes or analysis filler.
              </p>
              <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                Source: Open web source · Direct article link
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-black/[0.06] bg-zinc-50 px-3 py-2.5 dark:border-white/[0.07] dark:bg-white/[0.03]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
          Perception Gap
        </p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          A short note highlights what different regions or source types are
          covering, missing, or framing differently.
        </p>
      </div>

      <div className="mt-4 border-t border-black/[0.07] pt-3 dark:border-white/[0.07]">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Delivers at{" "}
          <span className="font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
            {deliveryTime || "07:00"}
          </span>{" "}
          {tzLabel} time. Full source trail appears in the dashboard when a scan
          is saved.
        </p>
      </div>
    </div>
  );
}
