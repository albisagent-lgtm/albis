import type { CompanyBriefingEvidenceDocument } from "./intelligence-depth";

const NAVY = "#1a1a2e";
const AMBER = "#c8922a";
const BODY = "#374151";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const BG = "#faf9f7";

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pct(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${Math.round(value * 100)}%`;
}

function statCard(label: string, value: string | number, note?: string): string {
  return `<div style="border:1px solid ${BORDER};border-radius:16px;padding:16px;background:white;">
    <div style="font:700 24px/1.2 -apple-system,BlinkMacSystemFont,sans-serif;color:${NAVY};">${esc(value)}</div>
    <div style="margin-top:4px;font:700 11px/1.4 -apple-system,BlinkMacSystemFont,sans-serif;color:${AMBER};letter-spacing:1.2px;text-transform:uppercase;">${esc(label)}</div>
    ${note ? `<div style="margin-top:6px;font:400 12px/1.45 -apple-system,BlinkMacSystemFont,sans-serif;color:${MUTED};">${esc(note)}</div>` : ""}
  </div>`;
}

function section(title: string, body: string): string {
  return `<section style="margin-top:28px;border:1px solid ${BORDER};border-radius:22px;background:white;padding:24px;">
    <h2 style="margin:0 0 16px;font:800 18px/1.25 -apple-system,BlinkMacSystemFont,sans-serif;color:${NAVY};">${esc(title)}</h2>
    ${body}
  </section>`;
}

function confidencePill(label: string): string {
  return `<span style="display:inline-block;border:1px solid #ead7ad;background:#fff8e8;color:#8a6018;border-radius:999px;padding:4px 9px;font:700 11px/1 -apple-system,BlinkMacSystemFont,sans-serif;text-transform:uppercase;letter-spacing:.6px;">${esc(label)}</span>`;
}

export function generateCompanyEvidenceDashboardHtml(doc: CompanyBriefingEvidenceDocument): string {
  const scan = doc.scan_summary;
  const sourceMix = doc.source_quality_summary.source_mix;
  const scanWindow = scan.scan_window ? `${scan.scan_window.from} → ${scan.scan_window.to}` : "Not recorded";

  const summaryCards = [
    statCard("Signals scanned", scan.total_signals_loaded),
    statCard("Selected", scan.selected_for_email, "Included in the email briefing"),
    statCard("Dashboard-only", scan.dashboard_only_count, "Relevant, but not email-worthy"),
    statCard("Excluded/noise", scan.excluded_count, "Duplicates, sludge, weak matches, stale items"),
    statCard("Source domains", scan.all_source_domains_count),
    statCard("Key domains", scan.key_source_domains_count),
  ].join("");

  const briefingEvidence = doc.briefing_sections.map((item) => `
    <article style="border-top:1px solid ${BORDER};padding-top:18px;margin-top:18px;">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:8px;">
        <h3 style="margin:0;font:800 16px/1.35 -apple-system,BlinkMacSystemFont,sans-serif;color:${NAVY};">${esc(item.heading)}</h3>
        ${confidencePill(item.evidence_confidence.label)}
      </div>
      <p style="margin:0 0 10px;font:400 14px/1.6 -apple-system,BlinkMacSystemFont,sans-serif;color:${BODY};"><strong>Why selected:</strong> ${esc(item.selection_reason)}</p>
      <p style="margin:0 0 10px;font:400 13px/1.55 -apple-system,BlinkMacSystemFont,sans-serif;color:${MUTED};"><strong>Evidence class:</strong> ${esc(item.evidence_class)} · <strong>Scan area:</strong> ${esc(item.section_label)} · <strong>Quality:</strong> A ${item.source_quality.A}, B ${item.source_quality.B}, C ${item.source_quality.C}</p>
      ${item.statistics.length ? `<div style="margin:12px 0;padding:12px;border-left:3px solid ${AMBER};background:${BG};">${item.statistics.map((stat) => `<p style="margin:0 0 8px;font:400 13px/1.55 -apple-system,BlinkMacSystemFont,sans-serif;color:${BODY};"><strong>${esc(stat.label)}:</strong> ${esc(stat.value_text)} — ${esc(stat.explanation)}</p>`).join("")}</div>` : ""}
      <details style="margin-top:10px;">
        <summary style="cursor:pointer;font:700 13px/1.5 -apple-system,BlinkMacSystemFont,sans-serif;color:${NAVY};">Claims and sources</summary>
        <ul style="margin:8px 0 0 18px;padding:0;font:400 13px/1.55 -apple-system,BlinkMacSystemFont,sans-serif;color:${BODY};">
          ${item.claims.slice(0, 8).map((claim) => `<li>${esc(claim.text)} <span style="color:${MUTED};">(${esc(claim.claim_type)}, confidence ${pct(claim.confidence)})</span></li>`).join("")}
        </ul>
        <p style="margin:8px 0 0;font:400 12px/1.55 -apple-system,BlinkMacSystemFont,sans-serif;color:${MUTED};">Sources: ${esc(item.source_names.join("; ") || "none recorded")}</p>
      </details>
    </article>
  `).join("");

  const perceptionGap = doc.perception_gap_frames.length
    ? doc.perception_gap_frames.map((frame) => `
      <article style="border-top:1px solid ${BORDER};padding-top:16px;margin-top:16px;">
        <h3 style="margin:0 0 8px;font:800 15px/1.35 -apple-system,BlinkMacSystemFont,sans-serif;color:${NAVY};">${esc(frame.topic)}</h3>
        <pre style="white-space:pre-wrap;margin:0;padding:14px;border-left:3px solid ${AMBER};background:${BG};font:400 13px/1.6 -apple-system,BlinkMacSystemFont,sans-serif;color:${BODY};">${esc(frame.frame_text)}</pre>
        <p style="margin:10px 0 0;font:400 12px/1.55 -apple-system,BlinkMacSystemFont,sans-serif;color:${MUTED};">${esc(frame.evidence_confidence.customer_phrase)} Sources: ${esc(frame.source_names.join("; "))}</p>
      </article>`).join("")
    : `<p style="font:400 14px/1.6 -apple-system,BlinkMacSystemFont,sans-serif;color:${MUTED};">No Perception Gap was shown because the selected evidence did not support a useful multi-frame comparison.</p>`;

  const dashboardOnly = doc.dashboard_only_items.length
    ? `<ul style="margin:0;padding-left:18px;font:400 13px/1.6 -apple-system,BlinkMacSystemFont,sans-serif;color:${BODY};">${doc.dashboard_only_items.slice(0, 30).map((item) => `<li><strong>${esc(item.canonical_event_name)}</strong> — held back because ${esc(item.reason)} <span style="color:${MUTED};">(relevance ${pct(item.relevance_score)}, confidence ${pct(item.cluster_confidence)})</span></li>`).join("")}</ul>`
    : `<p style="font:400 14px/1.6 -apple-system,BlinkMacSystemFont,sans-serif;color:${MUTED};">No dashboard-only items recorded for this preview.</p>`;

  const excluded = Object.entries(doc.excluded_summary.counts_by_reason || {})
    .map(([reason, count]) => `<li><strong>${esc(reason.replace(/_/g, " "))}:</strong> ${esc(count)}</li>`)
    .join("");

  const sourceRows = doc.key_sources_detail.slice(0, 60).map((source) => `
    <tr>
      <td style="padding:8px;border-top:1px solid ${BORDER};">${esc(source.source_display_name)}</td>
      <td style="padding:8px;border-top:1px solid ${BORDER};">${esc(source.source_grade)}</td>
      <td style="padding:8px;border-top:1px solid ${BORDER};">${esc(source.source_type)}</td>
      <td style="padding:8px;border-top:1px solid ${BORDER};">${esc(source.role)}</td>
    </tr>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${esc(doc.company_name)} Evidence Trail — ${esc(doc.scan_date)}</title>
</head>
<body style="margin:0;background:${BG};color:${BODY};">
  <main style="max-width:1040px;margin:0 auto;padding:36px 20px 56px;">
    <p style="margin:0 0 8px;font:700 11px/1.4 -apple-system,BlinkMacSystemFont,sans-serif;color:${AMBER};letter-spacing:2px;text-transform:uppercase;">Albis evidence trail</p>
    <h1 style="margin:0;font:900 34px/1.1 -apple-system,BlinkMacSystemFont,sans-serif;color:${NAVY};">${esc(doc.company_name)} — ${esc(doc.scan_date)}</h1>
    <p style="margin:12px 0 0;max-width:760px;font:400 15px/1.65 -apple-system,BlinkMacSystemFont,sans-serif;color:${MUTED};">This page shows why the briefing included what it included, what was held back, and how the evidence was classified. It is designed for verification, not for quick reading.</p>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:24px;">${summaryCards}</div>

    ${section("Scan coverage", `<p style="margin:0;font:400 14px/1.7 -apple-system,BlinkMacSystemFont,sans-serif;color:${BODY};"><strong>Scan window:</strong> ${esc(scanWindow)}<br/><strong>Regions:</strong> ${esc(scan.regions_represented.slice(0, 24).join(", ") || "unknown")}<br/><strong>Languages:</strong> ${esc(scan.languages_represented.join(", ") || "unknown")}<br/><strong>Selected scan areas:</strong> ${esc(scan.selected_sections.join(", ") || "none recorded")}</p>`)}

    ${section("Briefing evidence", briefingEvidence)}
    ${section("Perception Gap evidence", perceptionGap)}
    ${section("Dashboard-only signals", dashboardOnly)}
    ${section("Excluded/noise summary", `<ul style="margin:0;padding-left:18px;font:400 13px/1.7 -apple-system,BlinkMacSystemFont,sans-serif;color:${BODY};">${excluded || "<li>No excluded summary recorded.</li>"}</ul>`)}
    ${section("Source quality", `<p style="margin:0 0 12px;font:400 14px/1.65 -apple-system,BlinkMacSystemFont,sans-serif;color:${BODY};"><strong>Mix:</strong> A ${sourceMix.A}, B ${sourceMix.B}, C ${sourceMix.C}, D ${sourceMix.D}, Block ${sourceMix.Block}. <strong>Concentration risk:</strong> ${esc(doc.source_quality_summary.concentration_risk)}. ${esc(doc.source_quality_summary.note)}</p><table style="width:100%;border-collapse:collapse;font:400 13px/1.5 -apple-system,BlinkMacSystemFont,sans-serif;color:${BODY};"><thead><tr><th align="left" style="padding:8px;">Source</th><th align="left" style="padding:8px;">Grade</th><th align="left" style="padding:8px;">Type</th><th align="left" style="padding:8px;">Role</th></tr></thead><tbody>${sourceRows}</tbody></table>`)}
  </main>
</body>
</html>`;
}
