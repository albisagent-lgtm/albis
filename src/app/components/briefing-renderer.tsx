"use client";

import { useState } from "react";
import type {
  BriefingContent,
  BriefingStory,
  BriefingWatchItem,
  MatchReason,
} from "@/lib/email-templates/company-briefing";
import type { CompanyBriefingGenerationOutput } from "@/lib/company-scan/types";

// Re-export so pages can use the type without reaching into email-templates
export type { BriefingContent };

const MATCH_REASON_LABEL: Record<MatchReason["type"], string> = {
  geography: "Geography",
  sector: "Sector",
  tracked_theme: "Tracked themes",
  watchlist_entity: "Named entities",
  supply_chain: "Supply chain",
  risk_priority: "Risk priorities",
  urgency: "Urgency signal",
  significance: "Story significance",
};

function WhyMatched({ reasons }: { reasons: MatchReason[] }) {
  const [open, setOpen] = useState(false);
  if (!reasons || reasons.length === 0) return null;
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-zinc-400 hover:text-[#c8922a] dark:text-zinc-500 dark:hover:text-[#c8922a]"
        aria-expanded={open}
      >
        <svg
          width="9"
          height="9"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? "rotate-90" : ""}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        Why this matched
      </button>
      {open && (
        <ul className="mt-2 space-y-1.5 border-l border-black/[0.07] pl-3 dark:border-white/[0.07]">
          {reasons.map((r, i) => {
            // Surface canonical alias relationship when every matched term
            // resolved to a single canonical AND that canonical's label
            // differs from what the user actually has tracked. Suppresses
            // the "(via canonical X)" suffix when matched IS the canonical.
            const matchedSet = new Set(r.matched.map((m) => m.toLowerCase()));
            const showCanonical =
              !!r.canonical_label &&
              r.canonical_topic_id &&
              !matchedSet.has(r.canonical_label.toLowerCase());
            return (
              <li key={i} className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                <span className="font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                  {MATCH_REASON_LABEL[r.type] || r.type}
                </span>
                {r.matched.length > 0 && (
                  <span className="text-zinc-500 dark:text-zinc-400">
                    : {r.matched.join(", ")}
                  </span>
                )}
                {showCanonical && (
                  <span className="text-zinc-400 dark:text-zinc-500">
                    {" "}
                    (via {r.canonical_label})
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

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
  content: BriefingContent | CompanyBriefingGenerationOutput;
  compact?: boolean;
}) {
  if (isScannerReportContent(content)) {
    return <ScannerReportRenderer content={content} compact={compact} />;
  }

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
              {story.match_reasons && <WhyMatched reasons={story.match_reasons} />}
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

function isScannerReportContent(content: BriefingContent | CompanyBriefingGenerationOutput): content is CompanyBriefingGenerationOutput {
  return (content as CompanyBriefingGenerationOutput).output_version === "company_briefing_generation_v1";
}

function ScannerReportRenderer({
  content,
  compact = false,
}: {
  content: CompanyBriefingGenerationOutput;
  compact?: boolean;
}) {
  const scanner = content.scanner_report;
  return (
    <div className="space-y-0">
      {!compact && (
        <div className="mb-8">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">Daily scan</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
            Company Scanner Report
          </h2>
          {scanner?.enabled && (
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
              {scanner.main_findings_count} main findings across {scanner.scan_area_count} watched areas
            </p>
          )}
        </div>
      )}

      {scanner?.overview?.text && (
        <section>
          <p className={sectionLabel}>Today&apos;s Scan</p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {scanner.overview.text}
          </p>
        </section>
      )}

      <div className="my-7 h-px bg-black/[0.07] dark:bg-white/[0.07]" />

      <section>
        <p className={sectionLabel}>Main Findings</p>
        <div className="mt-5 space-y-8">
          {content.main_briefing.sections.map((section) => (
            <div key={section.section_id}>
              <h3 className="text-base font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                {section.heading}
              </h3>
              <div className="mt-3 space-y-4">
                {section.items.map((item, i) => (
                  <article key={item.generated_item_id || i}>
                    <p className="text-[15px] font-semibold leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
                      {item.title.text}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {item.body.text}
                    </p>
                    {item.uncertainty_line?.text && (
                      <p className="mt-1 text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
                        {item.uncertainty_line.text}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {(scanner?.deeper_reads?.length || 0) > 0 && (
        <>
          <div className="my-7 h-px bg-black/[0.07] dark:bg-white/[0.07]" />
          <section>
            <p className={sectionLabel}>Deeper Read</p>
            <div className="mt-4 space-y-5">
              {scanner?.deeper_reads.map((item, i) => (
                <article key={item.generated_item_id || i}>
                  <p className="text-[15px] font-semibold leading-snug text-[#0f0f0f] dark:text-[#f0efec]">
                    {item.title.text}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {item.body.text}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

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
