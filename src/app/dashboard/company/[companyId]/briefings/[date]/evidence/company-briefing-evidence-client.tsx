"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CompanyBriefingEvidenceDocument } from "@/lib/company-scan/intelligence-depth";

type LoadState = "loading" | "ready" | "not_found" | "unauthorized" | "error";

function pct(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${Math.round(value * 100)}%`;
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-[#ead7ad] bg-[#fff8e8] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#8a6018]">
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-4 dark:border-white/[0.07] dark:bg-white/[0.03]">
      <div className="text-2xl font-bold text-[#0f0f0f] dark:text-[#f0efec]">
        {value}
      </div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c8922a]">
        {label}
      </div>
      {note ? (
        <div className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {note}
        </div>
      ) : null}
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7 rounded-3xl border border-black/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-white/[0.03]">
      <h2 className="text-lg font-bold text-[#0f0f0f] dark:text-[#f0efec]">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function CompanyBriefingEvidenceClient() {
  const params = useParams();
  const companyId = params.companyId as string;
  const date = params.date as string;
  const [state, setState] = useState<LoadState>("loading");
  const [doc, setDoc] = useState<CompanyBriefingEvidenceDocument | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setState("unauthorized");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("company_profiles")
        .select("id")
        .eq("id", companyId)
        .eq("owner_id", user.id)
        .single();

      if (profileError || !profile) {
        if (!cancelled) setState("not_found");
        return;
      }

      const { data: briefing, error: briefingError } = await supabase
        .from("company_briefings")
        .select("briefing_content,status")
        .eq("company_profile_id", companyId)
        .eq("briefing_date", date)
        .single();

      if (briefingError || !briefing?.briefing_content) {
        if (!cancelled) setState("not_found");
        return;
      }

      const content = briefing.briefing_content as {
        evidence_document?: CompanyBriefingEvidenceDocument;
      };
      if (!content.evidence_document) {
        if (!cancelled) setState("not_found");
        return;
      }

      if (!cancelled) {
        setDoc(content.evidence_document);
        setState("ready");
      }
    }

    load().catch(() => {
      if (!cancelled) setState("error");
    });
    return () => {
      cancelled = true;
    };
  }, [companyId, date]);

  const sourceMix = useMemo(
    () => doc?.source_quality_summary.source_mix,
    [doc],
  );

  if (state === "loading") {
    return (
      <main className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#c8922a]" />
      </main>
    );
  }

  if (state !== "ready" || !doc) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-2xl border border-black/[0.07] bg-white p-8 text-center dark:border-white/[0.07] dark:bg-white/[0.03]">
          <h1 className="text-lg font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
            Evidence trail not available
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            This daily scan has not been saved with a source trail yet, or you
            do not have access to it.
          </p>
          <Link
            href={`/dashboard/briefing/${date}`}
            className="mt-4 inline-block text-sm font-medium text-[#c8922a] hover:underline"
          >
            Back to daily scan
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link
        href={`/dashboard/briefing/${date}`}
        className="mb-5 inline-flex text-sm text-zinc-400 hover:text-[#0f0f0f] dark:hover:text-[#f0efec]"
      >
        ← Back to daily scan
      </Link>

      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c8922a]">
        Albis evidence trail
      </p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0f0f0f] dark:text-[#f0efec]">
        {doc.company_name} — {doc.scan_date}
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">
        This page shows the wider source trail behind the daily scan: what was
        found, what was held back, and how the evidence was classified. It is
        built for verification, not quick reading.
      </p>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Items checked"
          value={doc.scan_summary.total_signals_loaded}
        />
        <StatCard
          label="Email findings"
          value={doc.scan_summary.selected_for_email}
          note="Included in the daily scan email"
        />
        <StatCard
          label="Dashboard-only"
          value={doc.scan_summary.dashboard_only_count}
          note="Relevant, but not email-worthy"
        />
        <StatCard
          label="Excluded/noise"
          value={doc.scan_summary.excluded_count}
        />
        <StatCard
          label="Source domains"
          value={doc.scan_summary.all_source_domains_count}
        />
        <StatCard
          label="Key domains"
          value={doc.scan_summary.key_source_domains_count}
        />
      </div>

      <Panel title="Scan coverage">
        <div className="space-y-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          <p>
            <strong>Scan window:</strong>{" "}
            {doc.scan_summary.scan_window
              ? `${doc.scan_summary.scan_window.from} → ${doc.scan_summary.scan_window.to}`
              : "Not recorded"}
          </p>
          <p>
            <strong>Regions:</strong>{" "}
            {doc.scan_summary.regions_represented.slice(0, 24).join(", ") ||
              "unknown"}
          </p>
          <p>
            <strong>Languages:</strong>{" "}
            {doc.scan_summary.languages_represented.join(", ") || "unknown"}
          </p>
          <p>
            <strong>Selected scan areas:</strong>{" "}
            {doc.scan_summary.selected_sections.join(", ") || "none recorded"}
          </p>
        </div>
      </Panel>

      <Panel title="Daily scan evidence">
        <div className="space-y-6">
          {doc.briefing_sections.map((section) => (
            <article
              key={section.heading}
              className="border-t border-black/[0.07] pt-5 first:border-t-0 first:pt-0 dark:border-white/[0.07]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-[#0f0f0f] dark:text-[#f0efec]">
                  {section.heading}
                </h3>
                <Badge>{section.evidence_confidence.label}</Badge>
              </div>
              <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                <strong>Why selected:</strong> {section.selection_reason}
              </p>
              <p className="mt-1 text-xs leading-6 text-zinc-500 dark:text-zinc-400">
                Evidence class: {section.evidence_class} · Scan area:{" "}
                {section.section_label} · Quality: A {section.source_quality.A},
                B {section.source_quality.B}, C {section.source_quality.C}
              </p>
              {section.statistics.length > 0 ? (
                <div className="mt-3 rounded-xl border-l-4 border-[#c8922a] bg-[#faf9f7] p-4 dark:bg-white/[0.04]">
                  {section.statistics.map((stat) => (
                    <p
                      key={stat.stat_id}
                      className="mb-2 text-sm leading-6 text-zinc-700 last:mb-0 dark:text-zinc-300"
                    >
                      <strong>{stat.label}:</strong> {stat.value_text} —{" "}
                      {stat.explanation}
                    </p>
                  ))}
                </div>
              ) : null}
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                  Claims and sources
                </summary>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  {section.claims.slice(0, 8).map((claim) => (
                    <li key={claim.claim_id}>
                      {claim.text}{" "}
                      <span className="text-zinc-400">
                        ({claim.claim_type}, confidence {pct(claim.confidence)})
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs leading-6 text-zinc-500">
                  Sources: {section.source_names.join("; ") || "none recorded"}
                </p>
              </details>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="Perception Gap evidence">
        <div className="space-y-5">
          {doc.perception_gap_frames.length ? (
            doc.perception_gap_frames.map((frame) => (
              <article
                key={`${frame.topic}-${frame.frame_text.slice(0, 24)}`}
                className="border-t border-black/[0.07] pt-5 first:border-t-0 first:pt-0 dark:border-white/[0.07]"
              >
                <h3 className="text-sm font-bold text-[#0f0f0f] dark:text-[#f0efec]">
                  {frame.topic}
                </h3>
                <pre className="mt-2 whitespace-pre-wrap rounded-xl border-l-4 border-[#c8922a] bg-[#faf9f7] p-4 font-sans text-sm leading-7 text-zinc-700 dark:bg-white/[0.04] dark:text-zinc-300">
                  {frame.frame_text}
                </pre>
                <p className="mt-2 text-xs leading-6 text-zinc-500">
                  {frame.evidence_confidence.customer_phrase} Sources:{" "}
                  {frame.source_names.join("; ")}
                </p>
              </article>
            ))
          ) : (
            <p className="text-sm text-zinc-500">
              No Perception Gap was shown because the selected evidence did not
              support a useful multi-frame comparison.
            </p>
          )}
        </div>
      </Panel>

      <Panel title="Dashboard-only source trail">
        {doc.dashboard_only_items.length ? (
          <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            {doc.dashboard_only_items.slice(0, 30).map((item) => (
              <li key={item.cluster_id}>
                <strong>{item.canonical_event_name}</strong> — held back because{" "}
                {item.reason}{" "}
                <span className="text-zinc-400">
                  (relevance {pct(item.relevance_score)}, confidence{" "}
                  {pct(item.cluster_confidence)})
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">
            No dashboard-only source-trail items recorded for this preview.
          </p>
        )}
      </Panel>

      <Panel title="Excluded/noise summary">
        <ul className="list-disc space-y-1 pl-5 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          {Object.entries(doc.excluded_summary.counts_by_reason || {}).map(
            ([reason, count]) => (
              <li key={reason}>
                <strong>{reason.replace(/_/g, " ")}:</strong> {count}
              </li>
            ),
          )}
        </ul>
      </Panel>

      <Panel title="Source quality">
        {sourceMix ? (
          <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            <strong>Mix:</strong> A {sourceMix.A}, B {sourceMix.B}, C{" "}
            {sourceMix.C}, D {sourceMix.D}, Block {sourceMix.Block}.{" "}
            <strong>Concentration risk:</strong>{" "}
            {doc.source_quality_summary.concentration_risk}.{" "}
            {doc.source_quality_summary.note}
          </p>
        ) : null}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-zinc-600 dark:text-zinc-300">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-zinc-400">
                <th className="border-b border-black/[0.07] py-2 pr-3 dark:border-white/[0.07]">
                  Source
                </th>
                <th className="border-b border-black/[0.07] py-2 pr-3 dark:border-white/[0.07]">
                  Grade
                </th>
                <th className="border-b border-black/[0.07] py-2 pr-3 dark:border-white/[0.07]">
                  Type
                </th>
                <th className="border-b border-black/[0.07] py-2 pr-3 dark:border-white/[0.07]">
                  Role
                </th>
              </tr>
            </thead>
            <tbody>
              {doc.key_sources_detail.slice(0, 60).map((source) => (
                <tr key={source.source_id}>
                  <td className="border-b border-black/[0.05] py-2 pr-3 dark:border-white/[0.05]">
                    {source.source_display_name}
                  </td>
                  <td className="border-b border-black/[0.05] py-2 pr-3 dark:border-white/[0.05]">
                    {source.source_grade}
                  </td>
                  <td className="border-b border-black/[0.05] py-2 pr-3 dark:border-white/[0.05]">
                    {source.source_type}
                  </td>
                  <td className="border-b border-black/[0.05] py-2 pr-3 dark:border-white/[0.05]">
                    {source.role}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </main>
  );
}
