"use client";

import type {
  BriefingContent,
  BriefingStory,
  BriefingWatchItem,
} from "@/lib/email-templates/company-briefing";

// Re-export so pages can use the type without reaching into email-templates
export type { BriefingContent };

// ---------------------------------------------------------------------------
// Signal level badge
// ---------------------------------------------------------------------------

const SIGNAL_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  low: {
    label: "Low",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  moderate: {
    label: "Moderate",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  elevated: {
    label: "Elevated",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  high: {
    label: "High",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    dot: "bg-red-500",
  },
};

function SignalBadge({ level }: { level: string }) {
  const s = SIGNAL_CONFIG[level] || SIGNAL_CONFIG.moderate;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${s.bg} ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Section label
// ---------------------------------------------------------------------------

const sectionLabel =
  "text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c8922a]";

// ---------------------------------------------------------------------------
// Main renderer
// ---------------------------------------------------------------------------

export function BriefingRenderer({
  content,
  compact = false,
}: {
  content: BriefingContent;
  compact?: boolean;
}) {
  const { header, what_changed, why_it_matters, what_to_watch, regional_framing } =
    content;

  return (
    <div className="space-y-0">
      {/* Header */}
      {!compact && (
        <div className="mb-8">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            {formatDate(header.date)}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
            Daily Briefing
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <SignalBadge level={header.signal_level} />
            {header.scan_focus && (
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Focus: {header.scan_focus}
              </span>
            )}
          </div>
        </div>
      )}

      {/* What Changed */}
      <section>
        <p className={sectionLabel}>What Changed</p>
        <div className="mt-4 space-y-5">
          {what_changed.map((story: BriefingStory, i: number) => (
            <div key={i}>
              <p className="text-[15px] font-semibold leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
                {i + 1}. {story.headline}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {story.summary}
              </p>
              {story.relevance_tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {story.relevance_tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="my-7 h-px bg-black/[0.07] dark:bg-white/[0.07]" />

      {/* Why It Matters */}
      <section>
        <p className={sectionLabel}>Why It Matters to You</p>
        <p className="mt-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {why_it_matters}
        </p>

        {regional_framing && (
          <div className="mt-4 border-l-3 border-[#c8922a] bg-[#c8922a]/5 px-4 py-3 dark:bg-[#c8922a]/10"
               style={{ borderLeftWidth: "3px", borderLeftColor: "#c8922a" }}>
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              <span className="font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                Regional framing:
              </span>{" "}
              {regional_framing}
            </p>
          </div>
        )}
      </section>

      {/* Divider */}
      <div className="my-7 h-px bg-black/[0.07] dark:bg-white/[0.07]" />

      {/* What to Watch */}
      <section>
        <p className={sectionLabel}>What to Watch Next</p>
        <div className="mt-4 space-y-3">
          {what_to_watch.map((item: BriefingWatchItem, i: number) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 text-[#c8922a]">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {item.monitor_point}
                </p>
                {item.timeframe && (
                  <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                    {item.timeframe}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T12:00:00Z");
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// Empty / pending states
// ---------------------------------------------------------------------------

export function BriefingPending() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#c8922a]/10">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[#c8922a]"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
        Your briefing is being prepared
      </h3>
      <p className="mt-2 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
        Your personalised intelligence briefing will be ready shortly. Check
        back soon or wait for your email delivery.
      </p>
    </div>
  );
}

export function BriefingEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-zinc-400"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
      <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
        No briefings yet
      </h3>
      <p className="mt-2 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
        Your first personalised briefing will arrive based on your delivery
        schedule. You can review it here once it&apos;s generated.
      </p>
    </div>
  );
}
