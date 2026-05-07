"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BriefingEmpty } from "@/app/components/briefing-renderer";
import type { BriefingContent } from "@/lib/email-templates/company-briefing";
import type { CompanyBriefingGenerationOutput } from "@/lib/company-scan/types";

interface ArchiveEntry {
  id: string;
  briefing_date: string;
  status: string;
  stories_selected: number;
  briefing_content: BriefingContent | CompanyBriefingGenerationOutput | null;
}

const SIGNAL_DOT: Record<string, string> = {
  low: "bg-emerald-500",
  moderate: "bg-amber-500",
  elevated: "bg-orange-500",
  high: "bg-red-500",
};

const SIGNAL_LABEL: Record<string, string> = {
  low: "Low",
  moderate: "Moderate",
  elevated: "Elevated",
  high: "High",
};

const PAGE_SIZE = 20;

export default function BriefingsArchiveClient() {
  const [loading, setLoading] = useState(true);
  const [briefings, setBriefings] = useState<ArchiveEntry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadBriefings(0);
  }, []);

  async function loadBriefings(pageNum: number) {
    if (pageNum > 0) setLoadingMore(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("company_profiles")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!profile) {
      setLoading(false);
      return;
    }

    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE;

    const { data } = await supabase
      .from("company_briefings")
      .select("id, briefing_date, status, stories_selected, briefing_content")
      .eq("company_profile_id", profile.id)
      .in("status", ["generated", "delivered"])
      .order("briefing_date", { ascending: false })
      .range(from, to);

    const rows = (data || []) as ArchiveEntry[];
    setHasMore(rows.length > PAGE_SIZE);
    const trimmed = rows.slice(0, PAGE_SIZE);

    if (pageNum === 0) {
      setBriefings(trimmed);
    } else {
      setBriefings((prev) => [...prev, ...trimmed]);
    }

    setPage(pageNum);
    setLoading(false);
    setLoadingMore(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#c8922a]" />
      </main>
    );
  }

  if (briefings.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-2xl border border-black/[0.07] bg-white p-7 dark:border-white/[0.07] dark:bg-white/[0.03]">
          <BriefingEmpty />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
        Daily Scan Archive
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {briefings.length} daily scan{briefings.length === 1 ? "" : "s"}
      </p>

      <div className="mt-6 space-y-2">
        {briefings.map((b) => {
          const scannerReport =
            b.briefing_content && "scanner_report" in b.briefing_content
              ? b.briefing_content.scanner_report
              : undefined;
          const signal =
            b.briefing_content && "header" in b.briefing_content
              ? b.briefing_content.header?.signal_level || "moderate"
              : "moderate";
          const focus = scannerReport?.enabled
            ? `${scannerReport.scan_area_count || 0} monitored topic${scannerReport.scan_area_count === 1 ? "" : "s"}`
            : b.briefing_content && "header" in b.briefing_content
              ? b.briefing_content.header?.scan_focus || ""
              : "";
          const v1ResearchFindings =
            b.briefing_content &&
            "understanding" in b.briefing_content &&
            b.briefing_content.scanner_report?.layout_version ===
              "company_daily_scan_v1"
              ? b.briefing_content.understanding?.researched_understanding_v1?.findings?.filter(
                  (finding) =>
                    ["email_main", "email_secondary"].includes(
                      finding.placement,
                    ),
                ).length || 0
              : 0;
          const storyCount =
            v1ResearchFindings ||
            scannerReport?.main_findings_count ||
            (b.briefing_content && "what_changed" in b.briefing_content
              ? b.briefing_content.what_changed?.length
              : 0) ||
            b.stories_selected ||
            0;
          const countLabel = scannerReport?.enabled
            ? `finding${storyCount === 1 ? "" : "s"}`
            : `item${storyCount === 1 ? "" : "s"}`;

          return (
            <Link
              key={b.id}
              href={`/dashboard/briefing/${b.briefing_date}`}
              className="flex items-center justify-between rounded-xl border border-black/[0.07] bg-white px-5 py-4 transition-colors hover:bg-black/[0.02] dark:border-white/[0.07] dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
            >
              <div className="flex items-center gap-4">
                {/* Signal dot */}
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${SIGNAL_DOT[signal] || SIGNAL_DOT.moderate}`}
                />
                <div>
                  <p className="text-sm font-medium text-[#0f0f0f] dark:text-[#f0efec]">
                    {formatDate(b.briefing_date)}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                    {scannerReport?.enabled
                      ? "Daily scan"
                      : `${SIGNAL_LABEL[signal] || "Moderate"} activity`}
                    {focus ? ` \u00B7 ${focus}` : ""}
                    {storyCount > 0
                      ? ` \u00B7 ${storyCount} ${countLabel}`
                      : ""}
                  </p>
                </div>
              </div>

              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-zinc-300 dark:text-zinc-600"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          );
        })}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={() => loadBriefings(page + 1)}
            disabled={loadingMore}
            className="inline-flex h-10 items-center rounded-full border border-black/[0.07] px-6 text-sm font-medium text-zinc-500 transition-colors hover:text-[#0f0f0f] disabled:opacity-50 dark:border-white/[0.07] dark:text-zinc-400 dark:hover:text-[#f0efec]"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </main>
  );
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T12:00:00Z");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return dateStr;
  }
}
