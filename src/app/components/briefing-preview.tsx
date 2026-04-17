"use client";

// ---------------------------------------------------------------------------
// BriefingPreview — placeholder "Your briefing will look like this" card
//
// Shows a mock briefing header based on the user's current selections. No
// API calls. Static text. This is a confidence-building preview, not a
// real preview. The actual briefing format will likely evolve.
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
  return values
    .map((v) => findThemeOption(v)?.label ?? v)
    .slice(0, n);
}

function watchlistLabels(values: string[], n = 4): string[] {
  return values
    .map((v) => findWatchlistOption(v)?.label ?? v)
    .slice(0, n);
}

export function BriefingPreview({
  companyName,
  themes,
  watchlist,
  deliveryTime,
  timezone,
}: BriefingPreviewProps) {
  const focus = themeLabels(themes, 3);
  const watch = watchlistLabels(watchlist, 4);
  const tzLabel = friendlyTimezone(timezone);

  const displayName = companyName.trim() || "Your Company";

  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-5 dark:border-white/[0.07] dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c8922a]">
          Preview — your briefing will look like this
        </p>
        <span className="text-[10px] text-zinc-400 dark:text-zinc-600">
          Format may evolve
        </span>
      </div>

      {/* Masthead */}
      <div className="mt-4 border-b border-black/[0.07] pb-3 dark:border-white/[0.07]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Albis Daily Briefing
        </p>
        <p className="mt-1 font-[family-name:var(--font-playfair)] text-base font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
          {displayName}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <span className="h-1 w-1 rounded-full bg-amber-500" />
            Signal: Moderate
          </span>
          {focus.length > 0 && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Focus: {focus.join(" · ")}
            </span>
          )}
        </div>
      </div>

      {/* What changed stub */}
      <div className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c8922a]">
          What Changed
        </p>
        <div className="mt-2 space-y-2">
          {(watch.length > 0 ? watch.slice(0, 3) : ["Global", "Regional", "Sector"]).map(
            (entity, i) => (
              <div key={i}>
                <p className="text-[13px] font-semibold leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
                  {i + 1}. Developments around {entity}
                  {focus[i % focus.length] ? ` affect ${focus[i % focus.length]}` : ""}.
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  2–3 sentences summarising what changed and why it matters to{" "}
                  {displayName}.
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Why it matters stub */}
      <div className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c8922a]">
          Why It Matters to You
        </p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          Connected analysis linking {focus[0] || "the day's developments"} to
          your{" "}
          {focus[1] ? `${focus[1]} and ${focus[2] || "sector exposure"}` : "business"}
          . 2–4 sentences, tailored to your profile.
        </p>
      </div>

      {/* Delivery footer */}
      <div className="mt-4 border-t border-black/[0.07] pt-3 dark:border-white/[0.07]">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          Delivers tomorrow at{" "}
          <span className="font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
            {deliveryTime || "07:00"}
          </span>{" "}
          {tzLabel} time.
        </p>
      </div>
    </div>
  );
}
