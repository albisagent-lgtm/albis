"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CompanyBriefingEvidenceDocument } from "@/lib/company-scan/intelligence-depth";
import type { CompanyResearchedUnderstandingLayer } from "@/lib/company-scan/types";

type LoadState = "loading" | "ready" | "not_found" | "unauthorized" | "error";

type PersistedResearchSource = CompanyResearchedUnderstandingLayer["sources"][number];
type PersistedResearchNote = CompanyResearchedUnderstandingLayer["notes"][number];
type PersistedAlbisFinding = CompanyResearchedUnderstandingLayer["findings"][number];

interface PersistedResearchRows {
  sources: PersistedResearchSource[];
  notes: PersistedResearchNote[];
  findings: PersistedAlbisFinding[];
}

function pct(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${Math.round(value * 100)}%`;
}

function sourceFromDbRow(row: Record<string, unknown>): PersistedResearchSource {
  return {
    id: String(row.id || ""),
    cluster_id: String(row.cluster_id || ""),
    url: String(row.url || ""),
    source_domain: String(row.source_domain || ""),
    title: String(row.title || ""),
    published_at: typeof row.published_at === "string" ? row.published_at : null,
    source_type: row.source_type as PersistedResearchSource["source_type"],
    region: typeof row.region === "string" ? row.region : null,
    language: typeof row.language === "string" ? row.language : null,
    read_status: row.read_status as PersistedResearchSource["read_status"],
    trail_role: row.trail_role as PersistedResearchSource["trail_role"],
    relevance_score:
      typeof row.relevance_score === "number" ? row.relevance_score : undefined,
    reliability_note:
      typeof row.reliability_note === "string" ? row.reliability_note : undefined,
    extracted_title:
      typeof row.extracted_title === "string" ? row.extracted_title : undefined,
    extracted_excerpt:
      typeof row.extracted_excerpt === "string" ? row.extracted_excerpt : undefined,
    extracted_word_count:
      typeof row.extracted_word_count === "number"
        ? row.extracted_word_count
        : undefined,
    text_cache_status:
      typeof row.text_cache_status === "string" ? row.text_cache_status : undefined,
    text_cache_path:
      typeof row.text_cache_path === "string" ? row.text_cache_path : undefined,
  };
}

function noteFromDbRow(row: Record<string, unknown>): PersistedResearchNote {
  return {
    id: String(row.id || ""),
    cluster_id: String(row.cluster_id || ""),
    summary: String(row.summary || ""),
    what_happened: String(row.what_happened || ""),
    what_changed_today: String(row.what_changed_today || ""),
    key_actors: Array.isArray(row.key_actors) ? row.key_actors.map(String) : [],
    key_facts: Array.isArray(row.key_facts) ? row.key_facts.map(String) : [],
    key_numbers: Array.isArray(row.key_numbers) ? row.key_numbers.map(String) : [],
    named_places: Array.isArray(row.named_places) ? row.named_places.map(String) : [],
    causes_or_drivers: Array.isArray(row.causes_or_drivers)
      ? row.causes_or_drivers.map(String)
      : [],
    consequences: Array.isArray(row.consequences)
      ? row.consequences.map(String)
      : [],
    source_observations: Array.isArray(row.source_observations)
      ? (row.source_observations as PersistedResearchNote["source_observations"])
      : [],
    differences_in_reporting: Array.isArray(row.differences_in_reporting)
      ? (row.differences_in_reporting as PersistedResearchNote["differences_in_reporting"])
      : [],
    what_is_unclear: Array.isArray(row.what_is_unclear)
      ? row.what_is_unclear.map(String)
      : [],
    possible_perception_gap:
      row.possible_perception_gap && typeof row.possible_perception_gap === "object"
        ? (row.possible_perception_gap as PersistedResearchNote["possible_perception_gap"])
        : undefined,
    company_relevance:
      typeof row.company_relevance === "string" ? row.company_relevance : undefined,
    albis_learning: String(row.albis_learning || ""),
  };
}

function findingFromDbRow(row: Record<string, unknown>): PersistedAlbisFinding {
  return {
    id: String(row.id || ""),
    cluster_id: String(row.cluster_id || ""),
    date: String(row.research_date || ""),
    scope: row.scope as PersistedAlbisFinding["scope"],
    company_profile_id:
      typeof row.company_profile_id === "string" ? row.company_profile_id : undefined,
    title: String(row.title || ""),
    body: String(row.body || ""),
    why_it_matters:
      typeof row.why_it_matters === "string" ? row.why_it_matters : undefined,
    uncertainty: typeof row.uncertainty === "string" ? row.uncertainty : undefined,
    confidence: row.confidence as PersistedAlbisFinding["confidence"],
    email_source_ids: Array.isArray(row.email_source_ids)
      ? row.email_source_ids.map(String)
      : [],
    evidence_source_ids: Array.isArray(row.evidence_source_ids)
      ? row.evidence_source_ids.map(String)
      : [],
    dashboard_source_ids: Array.isArray(row.dashboard_source_ids)
      ? row.dashboard_source_ids.map(String)
      : [],
    placement: row.placement as PersistedAlbisFinding["placement"],
  };
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
  const [researchedLayer, setResearchedLayer] =
    useState<CompanyResearchedUnderstandingLayer | null>(null);

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
        understanding?: {
          researched_understanding_v1?: CompanyResearchedUnderstandingLayer;
        };
      };
      if (!content.evidence_document) {
        if (!cancelled) setState("not_found");
        return;
      }

      let layer = content.understanding?.researched_understanding_v1 ?? null;

      if (layer) {
        const [sourcesResult, notesResult, findingsResult] = await Promise.all([
          supabase
            .from("research_sources")
            .select("*")
            .eq("company_profile_id", companyId)
            .eq("research_date", date),
          supabase
            .from("research_notes")
            .select("*")
            .eq("company_profile_id", companyId)
            .eq("research_date", date),
          supabase
            .from("albis_findings")
            .select("*")
            .eq("company_profile_id", companyId)
            .eq("research_date", date),
        ]);

        const persistedRows: PersistedResearchRows = {
          sources: sourcesResult.error
            ? []
            : ((sourcesResult.data || []) as Record<string, unknown>[]).map(
                sourceFromDbRow,
              ),
          notes: notesResult.error
            ? []
            : ((notesResult.data || []) as Record<string, unknown>[]).map(
                noteFromDbRow,
              ),
          findings: findingsResult.error
            ? []
            : ((findingsResult.data || []) as Record<string, unknown>[]).map(
                findingFromDbRow,
              ),
        };

        if (
          persistedRows.sources.length > 0 ||
          persistedRows.notes.length > 0 ||
          persistedRows.findings.length > 0
        ) {
          layer = {
            ...layer,
            sources: persistedRows.sources.length
              ? persistedRows.sources
              : layer.sources,
            notes: persistedRows.notes.length ? persistedRows.notes : layer.notes,
            findings: persistedRows.findings.length
              ? persistedRows.findings
              : layer.findings,
            source_trail_summary: persistedRows.sources.length
              ? {
                  research_sources: persistedRows.sources.filter(
                    (source) => source.trail_role === "research",
                  ).length,
                  evidence_sources: persistedRows.sources.filter(
                    (source) => source.trail_role === "evidence",
                  ).length,
                  email_sources: persistedRows.sources.filter(
                    (source) => source.trail_role === "email",
                  ).length,
                  snippet_only_sources: persistedRows.sources.filter(
                    (source) => source.read_status === "snippet_only",
                  ).length,
                  full_text_sources: persistedRows.sources.filter(
                    (source) => source.read_status === "read",
                  ).length,
                }
              : layer.source_trail_summary,
          };
        }
      }

      if (!cancelled) {
        setDoc(content.evidence_document);
        setResearchedLayer(layer);
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
  const researchSourceById = useMemo(() => {
    return new Map(
      (researchedLayer?.sources || []).map((source) => [source.id, source]),
    );
  }, [researchedLayer]);
  const keySourceByName = useMemo(() => {
    const entries = (doc?.key_sources_detail || []).flatMap((source) => {
      const names = [source.source_display_name, source.source_id]
        .filter(Boolean)
        .map((value) => value.toLowerCase());
      return names.map((name) => [name, source] as const);
    });
    return new Map(entries);
  }, [doc]);

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
            Source trail not available
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
        Albis source trail
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
                {section.source_names.length ? (
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-6 text-zinc-500">
                    {section.source_names.map((sourceName, sourceIndex) => {
                      const source = keySourceByName.get(sourceName.toLowerCase());
                      return (
                        <li key={`${section.heading}-${sourceName}-${sourceIndex}`}>
                          {source?.url ? (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#c8922a] hover:underline"
                            >
                              {sourceName}
                            </a>
                          ) : (
                            sourceName
                          )}
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="mt-2 text-xs leading-6 text-zinc-500">
                    Sources: none recorded
                  </p>
                )}
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

      {researchedLayer ? (
        <Panel title="Researched understanding trail">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Research clusters"
              value={researchedLayer.clusters.length}
              note="Story dossiers behind the scan"
            />
            <StatCard
              label="Full-text reads"
              value={researchedLayer.source_trail_summary.full_text_sources}
            />
            <StatCard
              label="Email trail"
              value={researchedLayer.source_trail_summary.email_sources}
            />
            <StatCard
              label="Evidence trail"
              value={researchedLayer.source_trail_summary.evidence_sources}
            />
            <StatCard
              label="Research trail"
              value={researchedLayer.source_trail_summary.research_sources}
            />
          </div>
          <p className="mt-4 text-sm leading-7 text-zinc-500 dark:text-zinc-400">
            These are Albis-written findings produced after the research layer
            grouped sources into story dossiers. External articles are evidence;
            the finding is the product.
          </p>
          <div className="mt-6 space-y-6">
            {researchedLayer.findings.slice(0, 8).map((finding) => {
              const note = researchedLayer.notes.find(
                (entry) => entry.cluster_id === finding.cluster_id,
              );
              const evidenceSources = finding.evidence_source_ids
                .map((sourceId) => researchSourceById.get(sourceId))
                .filter(Boolean);
              return (
                <article
                  key={finding.id}
                  className="border-t border-black/[0.07] pt-5 first:border-t-0 first:pt-0 dark:border-white/[0.07]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-[#0f0f0f] dark:text-[#f0efec]">
                      {finding.title}
                    </h3>
                    <Badge>{finding.confidence}</Badge>
                    <Badge>{finding.placement.replace(/_/g, " ")}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                    {finding.body}
                  </p>
                  {note ? (
                    <div className="mt-3 rounded-xl border-l-4 border-[#c8922a] bg-[#faf9f7] p-4 text-sm leading-7 text-zinc-700 dark:bg-white/[0.04] dark:text-zinc-300">
                      <p>
                        <strong>What changed:</strong> {note.what_changed_today}
                      </p>
                      {note.possible_perception_gap?.gap ? (
                        <p className="mt-2">
                          <strong>Possible perception gap:</strong>{" "}
                          {note.possible_perception_gap.gap}
                        </p>
                      ) : null}
                      {note.what_is_unclear.length ? (
                        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                          <strong>Unclear:</strong> {note.what_is_unclear[0]}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-semibold text-[#0f0f0f] dark:text-[#f0efec]">
                      Research sources ({evidenceSources.length})
                    </summary>
                    <ul className="mt-2 space-y-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                      {evidenceSources.slice(0, 10).map((source, sourceIndex) => (
                        <li key={source!.id} className="border-l border-black/10 pl-3 dark:border-white/10">
                          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                            Source {sourceIndex + 1}
                          </div>
                          {source!.url ? (
                            <a
                              href={source!.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-[#c8922a] hover:underline"
                            >
                              {source!.extracted_title || source!.title}
                            </a>
                          ) : (
                            <span className="font-medium">
                              {source!.extracted_title || source!.title}
                            </span>
                          )}
                          <div className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                            {source!.source_domain} · {source!.trail_role} ·{" "}
                            {source!.read_status}
                            {source!.extracted_word_count
                              ? ` · ${source!.extracted_word_count} words read`
                              : ""}
                          </div>
                          {source!.extracted_excerpt ? (
                            <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                              {source!.extracted_excerpt.slice(0, 260)}
                              {source!.extracted_excerpt.length > 260 ? "…" : ""}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </details>
                </article>
              );
            })}
          </div>
        </Panel>
      ) : null}

      <Panel title="Dashboard-only source trail">
        {doc.dashboard_only_items.length ? (
          <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            {doc.dashboard_only_items.slice(0, 30).map((item, itemIndex) => (
              <li key={item.cluster_id}>
                <span className="font-semibold text-zinc-400">#{itemIndex + 1}</span>{" "}
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
              {doc.key_sources_detail.slice(0, 60).map((source, sourceIndex) => (
                <tr key={source.source_id}>
                  <td className="border-b border-black/[0.05] py-2 pr-3 dark:border-white/[0.05]">
                    <span className="mr-2 text-xs font-semibold text-zinc-400">
                      {sourceIndex + 1}.
                    </span>
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#c8922a] hover:underline"
                      >
                        {source.source_display_name}
                      </a>
                    ) : (
                      source.source_display_name
                    )}
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
