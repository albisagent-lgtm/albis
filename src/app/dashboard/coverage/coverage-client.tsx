"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { RISK_PRIORITIES } from "@/lib/company-profile";
import { SECTORS, COMPANY_REGIONS } from "@/lib/onboarding-taxonomy";

type TrackedItemType =
  | "theme"
  | "entity"
  | "region"
  | "sector"
  | "risk"
  | "supply_chain";

interface TrackedItemEntry {
  type: TrackedItemType;
  value: string;
  matched_signal_count: number;
  last_movement_at: string | null;
}

interface SilentItemEntry {
  type: TrackedItemType;
  value: string;
}

interface SourcesInspected {
  total: number;
  by_language: Record<string, number>;
  by_region: Record<string, number>;
}

interface EarlySignalEntry {
  signal_headline: string;
  sources: string[];
  briefing_item_ref: string;
}

interface CoverageRow {
  id: string;
  coverage_date: string;
  tracked_items_checked: TrackedItemEntry[];
  sources_inspected: SourcesInspected;
  early_signals: EarlySignalEntry[];
  silent_items: SilentItemEntry[];
  summary_text: string | null;
}

const TYPE_LABEL: Record<TrackedItemType, string> = {
  theme: "Theme",
  entity: "Entity",
  region: "Region",
  sector: "Sector",
  risk: "Risk",
  supply_chain: "Supply chain",
};

function todayIso(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

function prettifyId(id: string): string {
  return id
    .split(/[-_]/)
    .map((part) => (part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function labelFor(type: TrackedItemType, value: string): string {
  if (type === "risk") {
    const match = RISK_PRIORITIES.find((r) => r.id === value);
    if (match) return match.label;
  }
  if (type === "sector") {
    const match = SECTORS.find((s) => s.id === value);
    if (match) return match.label;
  }
  if (type === "region") {
    const match = COMPANY_REGIONS.find((r) => r.id === value);
    if (match) return match.label;
  }
  return prettifyId(value);
}

function formatDateLong(iso: string): string {
  try {
    const d = new Date(`${iso}T12:00:00Z`);
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return iso;
  }
}

function formatRelative(iso: string | null): string {
  if (!iso) return "Not seen yet";
  try {
    const d = new Date(`${iso}T12:00:00Z`);
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const days = Math.round(
      (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.round(days / 7)} wk ago`;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return iso;
  }
}

export default function CoverageClient() {
  const [date, setDate] = useState<string>(todayIso());
  const [companyProfileId, setCompanyProfileId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [coverage, setCoverage] = useState<CoverageRow | null>(null);
  const [coverageLoading, setCoverageLoading] = useState(true);
  const [trackedExpanded, setTrackedExpanded] = useState(false);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setProfileLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("company_profiles")
        .select("id")
        .eq("owner_id", user.id)
        .single();
      setCompanyProfileId(profile?.id ?? null);
      setProfileLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!companyProfileId) return;
    setCoverageLoading(true);
    const supabase = createClient();
    supabase
      .from("company_coverage_summaries")
      .select(
        "id, coverage_date, tracked_items_checked, sources_inspected, early_signals, silent_items, summary_text"
      )
      .eq("company_profile_id", companyProfileId)
      .eq("coverage_date", date)
      .maybeSingle()
      .then(({ data }) => {
        setCoverage((data as CoverageRow | null) ?? null);
        setCoverageLoading(false);
      });
  }, [companyProfileId, date]);

  const movement = useMemo(() => {
    if (!coverage) return [];
    return [...coverage.tracked_items_checked]
      .filter((i) => i.matched_signal_count > 0)
      .sort((a, b) => b.matched_signal_count - a.matched_signal_count);
  }, [coverage]);

  const silent = useMemo(() => {
    if (!coverage) return [];
    return [...(coverage.silent_items || [])].sort((a, b) =>
      labelFor(a.type, a.value).localeCompare(labelFor(b.type, b.value))
    );
  }, [coverage]);

  const cardClass =
    "rounded-2xl border border-black/[0.07] bg-white p-7 dark:border-white/[0.07] dark:bg-white/[0.03]";

  if (profileLoading || coverageLoading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#c8922a]" />
      </main>
    );
  }

  if (!companyProfileId) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className={cardClass}>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No company profile found.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
            Coverage
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {formatDateLong(date)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor="coverage-date"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500"
          >
            Date
          </label>
          <input
            id="coverage-date"
            type="date"
            value={date}
            max={todayIso()}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 rounded-lg border border-black/[0.07] bg-white px-3 text-sm text-[#0f0f0f] dark:border-white/[0.07] dark:bg-[#0f0f0f] dark:text-[#f0efec]"
          />
        </div>
      </header>

      {!coverage ? (
        <div className={cardClass}>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {date === todayIso()
              ? "Today's coverage is being assembled. Check back after your briefing arrives."
              : "No coverage record for this date."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* A. Headline summary */}
          <div className={cardClass}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c8922a]">
              Today's coverage
            </p>
            <p className="mt-2 text-base text-[#0f0f0f] dark:text-[#f0efec]">
              {coverage.summary_text || "No summary available."}
            </p>
          </div>

          {/* B. Tracked items (collapsible) */}
          <div className={cardClass}>
            <button
              onClick={() => setTrackedExpanded((v) => !v)}
              className="flex w-full items-center justify-between"
            >
              <span className="text-sm font-medium text-[#0f0f0f] dark:text-[#f0efec]">
                Tracked priorities
              </span>
              <span className="flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
                <span>
                  {movement.length} moving · {silent.length} silent
                </span>
                <Chevron expanded={trackedExpanded} />
              </span>
            </button>

            {trackedExpanded && (
              <div className="mt-5 grid gap-6 sm:grid-cols-2">
                <section>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                    Movement today
                  </p>
                  {movement.length === 0 ? (
                    <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                      Nothing matched today.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {movement.map((item, idx) => (
                        <li
                          key={`${item.type}-${item.value}-${idx}`}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[#0f0f0f] dark:text-[#f0efec]">
                              {labelFor(item.type, item.value)}
                            </p>
                            <p className="text-[11px] uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                              {TYPE_LABEL[item.type]}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              {item.matched_signal_count}
                            </span>
                            <Link
                              href={`/dashboard/briefing/${coverage.coverage_date}`}
                              className="text-[#c8922a] hover:underline"
                              aria-label={`View briefing for ${labelFor(
                                item.type,
                                item.value
                              )}`}
                            >
                              →
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                    Silent today
                  </p>
                  {silent.length === 0 ? (
                    <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                      All priorities had movement.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {silent.map((item, idx) => {
                        const last = coverage.tracked_items_checked.find(
                          (t) => t.type === item.type && t.value === item.value
                        );
                        return (
                          <li
                            key={`${item.type}-${item.value}-${idx}`}
                            className="text-sm text-zinc-500 dark:text-zinc-400"
                          >
                            <p className="truncate">
                              {labelFor(item.type, item.value)}
                            </p>
                            <p className="text-[11px] uppercase tracking-[0.15em] text-zinc-400/80 dark:text-zinc-500/80">
                              {TYPE_LABEL[item.type]} ·{" "}
                              {formatRelative(last?.last_movement_at ?? null)}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </div>
            )}
          </div>

          {/* C. Source coverage (collapsible) */}
          <div className={cardClass}>
            <button
              onClick={() => setSourcesExpanded((v) => !v)}
              className="flex w-full items-center justify-between"
            >
              <span className="text-sm font-medium text-[#0f0f0f] dark:text-[#f0efec]">
                Source coverage
              </span>
              <span className="flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
                <span>{coverage.sources_inspected.total} inspected</span>
                <Chevron expanded={sourcesExpanded} />
              </span>
            </button>

            {sourcesExpanded && (
              <div className="mt-5 space-y-5">
                <section>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                    By language
                  </p>
                  <SourceBreakdown breakdown={coverage.sources_inspected.by_language} />
                </section>
                <section>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                    By region
                  </p>
                  <SourceBreakdown breakdown={coverage.sources_inspected.by_region} />
                </section>
              </div>
            )}
          </div>

          {/* D. Early signals (only if non-empty) */}
          {coverage.early_signals.length > 0 && (
            <div className={cardClass}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c8922a]">
                Signals from outside mainstream English coverage
              </p>
              <ul className="mt-4 space-y-3">
                {coverage.early_signals.map((sig, idx) => (
                  <li
                    key={`${sig.briefing_item_ref}-${idx}`}
                    className="flex items-start justify-between gap-4 border-t border-black/[0.07] pt-3 first:border-t-0 first:pt-0 dark:border-white/[0.07]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-[#0f0f0f] dark:text-[#f0efec]">
                        {sig.signal_headline}
                      </p>
                      {sig.sources.length > 0 && (
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {sig.sources.join(", ")}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/dashboard/briefing/${coverage.coverage_date}`}
                      className="shrink-0 text-xs text-[#c8922a] hover:underline"
                    >
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
        transition: "transform 0.15s",
      }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function SourceBreakdown({ breakdown }: { breakdown: Record<string, number> }) {
  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return (
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Breakdown will appear once upstream scan tags sources.
      </p>
    );
  }
  return (
    <ul className="mt-2 space-y-1.5">
      {entries.map(([key, count]) => (
        <li
          key={key}
          className="flex items-center justify-between text-sm text-[#0f0f0f] dark:text-[#f0efec]"
        >
          <span>{prettifyId(key)}</span>
          <span className="text-zinc-500 dark:text-zinc-400">{count}</span>
        </li>
      ))}
    </ul>
  );
}
