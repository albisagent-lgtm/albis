import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  hashCompanyShareToken,
  recordCompanyShareLinkAccess,
} from "@/lib/company-scan/company-briefing-share-links";
import type { CompanyBriefingEvidenceDocument } from "@/lib/company-scan/intelligence-depth";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Source trail — Albis",
  description: "Read-only source trail for an Albis Company Daily Scan.",
};

type PageProps = {
  params: Promise<{ token: string }>;
};

type ShareLinkRow = {
  id: string;
  briefing_id: string;
  company_profile_id: string;
  expires_at: string | null;
  revoked_at: string | null;
  access_count: number | null;
};

type BriefingRow = {
  id: string;
  company_profile_id: string;
  briefing_content: unknown;
};

function isExpired(expiresAt: string | null): boolean {
  return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
}

function asEvidenceDocument(value: unknown): CompanyBriefingEvidenceDocument | null {
  if (!value || typeof value !== "object") return null;
  const content = value as { evidence_document?: unknown };
  const doc = content.evidence_document;
  if (!doc || typeof doc !== "object") return null;
  const candidate = doc as Partial<CompanyBriefingEvidenceDocument>;
  if (!candidate.company_profile_id || !candidate.scan_date) return null;
  if (!Array.isArray(candidate.key_sources_detail)) return null;
  if (!Array.isArray(candidate.briefing_sections)) return null;
  return candidate as CompanyBriefingEvidenceDocument;
}

function pct(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${Math.round(value * 100)}%`;
}

function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-2xl font-extrabold text-[#1a1a2e] dark:text-[#f0efec]">{value}</div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#c8922a]">{label}</div>
      {note ? <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{note}</p> : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7 rounded-[1.4rem] border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <h2 className="text-xl font-extrabold text-[#1a1a2e] dark:text-[#f0efec]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function PublicSourceTrailPage({ params }: PageProps) {
  const { token } = await params;
  if (!token || !/^[A-Za-z0-9_-]{32,}$/.test(token)) notFound();

  const supabase = createAdminClient();
  const tokenHash = hashCompanyShareToken(token);

  const { data: linkData, error: linkError } = await supabase
    .from("company_briefing_share_links")
    .select("id, briefing_id, company_profile_id, expires_at, revoked_at, access_count")
    .eq("token_hash", tokenHash)
    .eq("purpose", "source_trail")
    .maybeSingle();

  if (linkError || !linkData) notFound();
  const link = linkData as ShareLinkRow;
  if (link.revoked_at || isExpired(link.expires_at)) notFound();

  const { data: briefingData, error: briefingError } = await supabase
    .from("company_briefings")
    .select("id, company_profile_id, briefing_content")
    .eq("id", link.briefing_id)
    .eq("company_profile_id", link.company_profile_id)
    .maybeSingle();

  if (briefingError || !briefingData) notFound();
  const briefing = briefingData as BriefingRow;
  const doc = asEvidenceDocument(briefing.briefing_content);
  if (!doc || doc.company_profile_id !== link.company_profile_id) notFound();

  await recordCompanyShareLinkAccess(supabase, link);

  const scanWindow = doc.scan_summary.scan_window
    ? `${doc.scan_summary.scan_window.from} → ${doc.scan_summary.scan_window.to}`
    : "Not recorded";
  const sourceMix = doc.source_quality_summary.source_mix;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 text-[#1a1a1a] dark:text-[#f0efec]">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#c8922a]">Albis source trail</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-[#1a1a2e] dark:text-[#f0efec] md:text-5xl">
        {doc.company_name} — {doc.scan_date}
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
        Read-only source evidence for this Company Daily Scan. This public link only opens this briefing’s source trail; it does not expose the dashboard, account settings, or other company pages.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="Signals scanned" value={doc.scan_summary.total_signals_loaded} />
        <Stat label="Selected" value={doc.scan_summary.selected_for_email} note="Included in the email" />
        <Stat label="Extra context" value={doc.scan_summary.dashboard_only_count} note="Kept in this evidence trail" />
        <Stat label="Excluded/noise" value={doc.scan_summary.excluded_count} />
        <Stat label="Source domains" value={doc.scan_summary.all_source_domains_count} />
        <Stat label="Key domains" value={doc.scan_summary.key_source_domains_count} />
      </div>

      <Section title="Scan coverage">
        <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-300">
          <strong>Scan window:</strong> {scanWindow}<br />
          <strong>Regions:</strong> {doc.scan_summary.regions_represented.slice(0, 24).join(", ") || "unknown"}<br />
          <strong>Languages:</strong> {doc.scan_summary.languages_represented.join(", ") || "unknown"}<br />
          <strong>Selected scan areas:</strong> {doc.scan_summary.selected_sections.join(", ") || "none recorded"}
        </p>
      </Section>

      <Section title="Daily scan evidence">
        <div className="space-y-5">
          {doc.briefing_sections.map((section, index) => (
            <article key={`${section.heading}-${index}`} className="border-t border-black/10 pt-5 first:border-t-0 first:pt-0 dark:border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#f5ead2] px-2.5 py-1 text-xs font-bold text-[#8a6018]">{index + 1}</span>
                <h3 className="text-lg font-extrabold text-[#1a1a2e] dark:text-[#f0efec]">{section.heading}</h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300"><strong>Why selected:</strong> {section.selection_reason}</p>
              <p className="mt-1 text-xs leading-6 text-zinc-500 dark:text-zinc-400">
                {section.section_label} · {section.evidence_class} · confidence {section.evidence_confidence.label} · Quality: A {section.source_quality.A}, B {section.source_quality.B}, C {section.source_quality.C}
              </p>
              {section.claims.length ? (
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                  {section.claims.slice(0, 8).map((claim) => (
                    <li key={claim.claim_id}>{claim.text} <span className="text-zinc-500">({claim.claim_type}, confidence {pct(claim.confidence)})</span></li>
                  ))}
                </ol>
              ) : null}
              {section.source_names.length ? <p className="mt-3 text-xs leading-6 text-zinc-500 dark:text-zinc-400"><strong>Sources:</strong> {section.source_names.join("; ")}</p> : null}
            </article>
          ))}
        </div>
      </Section>

      <Section title="Additional evidence kept for context">
        {doc.dashboard_only_items.length ? (
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
            {doc.dashboard_only_items.slice(0, 30).map((item) => (
              <li key={item.cluster_id}>
                <strong>{item.canonical_event_name}</strong> — kept as {item.reason.replace(/_/g, " ")} <span className="text-zinc-500">(relevance {pct(item.relevance_score)}, confidence {pct(item.cluster_confidence)})</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No extra context items were recorded for this briefing.</p>
        )}
      </Section>

      <Section title="Numbered source list">
        <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-300">
          <strong>Mix:</strong> A {sourceMix.A}, B {sourceMix.B}, C {sourceMix.C}, D {sourceMix.D}, Block {sourceMix.Block}. <strong>Concentration risk:</strong> {doc.source_quality_summary.concentration_risk}. {doc.source_quality_summary.note}
        </p>
        <ol className="mt-5 space-y-3 pl-5 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          {doc.key_sources_detail.slice(0, 80).map((source, index) => (
            <li key={`${source.source_id}-${index}`}>
              {source.url ? (
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#1a1a2e] underline decoration-[#c8922a]/40 underline-offset-4 dark:text-[#f0efec]">
                  {source.source_display_name}
                </a>
              ) : (
                <span className="font-semibold">{source.source_display_name}</span>
              )}
              <span className="text-zinc-500 dark:text-zinc-400"> — {source.source_grade} · {source.source_type} · {source.role}</span>
            </li>
          ))}
        </ol>
      </Section>
    </main>
  );
}
