// ---------------------------------------------------------------------------
// Company Briefing Email Template — v2 (Package 8D)
//
// Renders a CompanyBriefingGenerationOutput into branded HTML email using
// the new calm briefing structure:
//
//   1. Main Briefing — grouped by selected areas with useful findings
//   2. Perception Gap — 1-3 evidence-bound notes only when useful
//   3. Observations — 2-4 calm observations
//   4. Source Notes / Dashboard link
//
// This template replaces the legacy "What Changed" / "Why It Matters" /
// "What to Watch Next" structure. The legacy template is NOT deleted —
// other code may still import it. This is the new path.
//
// No banned headings: "What Changed", "What to Watch Next".
// No raw source-headline clutter like "WSJ: ..." unless attribution required.
// No buildWhyItMatters generic lines.
// ---------------------------------------------------------------------------

import type {
  CompanyBriefingGenerationOutput,
  GeneratedBriefingItem,
} from "../company-scan/types";

const SITE = "https://www.albis.news";
const NAVY = "#1a1a2e";
const AMBER = "#c8922a";
const GRAY = "#6b7280";
const BORDER = "#e5e7eb";
const BODY = "#374151";
const WHITE = "#ffffff";
const QUIET_BG = "#faf9f7";

function esc(s: string | undefined | null): string {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escAttr(s: string | undefined | null): string {
  return esc(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function safeDashboardLink(link: string | undefined | null): string {
  if (!link) return `${SITE}/dashboard/briefing/today`;
  try {
    const url = new URL(link, SITE);
    if (url.protocol !== "https:" && url.protocol !== "http:")
      return `${SITE}/dashboard/briefing/today`;
    if (url.hostname !== "www.albis.news" && url.hostname !== "albis.news")
      return `${SITE}/dashboard/briefing/today`;
    return url.toString();
  } catch {
    return `${SITE}/dashboard/briefing/today`;
  }
}

function sectionLabel(title: string): string {
  return `<div style="font-size:10px;color:${AMBER};text-transform:uppercase;letter-spacing:2px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-weight:700;margin-bottom:14px;">${esc(title)}</div>`;
}

function divider(): string {
  return `<div style="height:1px;background:${BORDER};margin:28px 0;"></div>`;
}

function textHtml(s: string | undefined | null): string {
  return esc(customerEnglishText(s))
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>");
}

function firstSentences(value: string | undefined | null, max = 3): string {
  const text = customerEnglishText(value);
  if (!text) return "";
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return sentences.slice(0, max).join(" ").replace(/\s+/g, " ").trim();
}

// The scanner can find useful local-language sources, but the customer email
// is English-facing. This is a final rendering guard so raw non-Latin snippets
// never appear in delivered emails, even for already-generated briefing rows.
const NON_ENGLISH_VISIBLE_SCRIPT =
  /[\u0400-\u04ff\u0590-\u05ff\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\u0900-\u097f\u0980-\u09ff\u0a00-\u0a7f\u0a80-\u0aff\u0b00-\u0b7f\u0b80-\u0bff\u0c00-\u0c7f\u0c80-\u0cff\u0d00-\u0d7f\u0e00-\u0e7f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g;

function customerEnglishText(value: string | undefined | null): string {
  const raw = String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
  if (!raw || !NON_ENGLISH_VISIBLE_SCRIPT.test(raw)) return raw;
  const stripped = raw
    .replace(NON_ENGLISH_VISIBLE_SCRIPT, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/^[,.;:!\-–—\s]+|[,.;:!\-–—\s]+$/g, "")
    .trim();
  const words = stripped.split(/\s+/).filter(Boolean).length;
  const latinChars = (stripped.match(/[A-Za-z0-9]/g) || []).length;
  if (words >= 4 || latinChars >= 18) return stripped;
  return "Local-language source matched this scan area; source attribution is included below.";
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
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

/**
 * Render a v2 company briefing to HTML email.
 */
export function generateCompanyBriefingHtmlV2(
  output: CompanyBriefingGenerationOutput,
  companyName: string,
  date: string,
): string {
  const displayDate = formatDate(date);

  // --- SCANNER OVERVIEW / MAIN FINDINGS ---
  const todayScanHtml = renderTodayScan(output);

  // --- RESEARCHED DAILY FINDINGS ---
  const researchedFindingsHtml = renderResearchedFindings(output);

  // --- MAIN BRIEFING ---
  const mainBriefingHtml = researchedFindingsHtml ? "" : renderMainBriefing(output);

  // --- DEEPER READ ---
  const deeperReadHtml = renderDeeperRead(output);

  // --- PERCEPTION GAP ---
  const perceptionGapHtml = renderPerceptionGap();

  // --- OBSERVATIONS ---
  const observationsHtml = renderUsefulObservations(output);

  // --- SOURCE NOTES ---
  const sourceNotesHtml = renderSourceNotes(output);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${esc(companyName)} Daily Scan — ${esc(displayDate)}</title>
  <style>
    body,table,td{font-family:Georgia,'Times New Roman',serif;}
    a{color:${NAVY};text-decoration:none;}
    a:hover{text-decoration:underline;}
    @media only screen and (max-width:600px){
      .wrap{padding:24px 20px!important;}
      .masthead{padding:28px 20px 20px!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${WHITE};-webkit-font-smoothing:antialiased;">

  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;">Daily scan for ${esc(companyName)} — ${esc(displayDate)}</div>

  <table cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:0 auto;background:${WHITE};">

    <!-- MASTHEAD -->
    <tr><td class="masthead" style="padding:40px 40px 0;border-bottom:3px solid ${NAVY};">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        <tr>
          <td>
            <div style="font-size:24px;font-weight:800;color:${NAVY};letter-spacing:1px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">${esc(companyName)} Daily Scan</div>
            <div style="font-size:11px;color:${GRAY};letter-spacing:2px;margin:4px 0 0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;text-transform:uppercase;">Prepared by Albis</div>
          </td>
          <td style="text-align:right;vertical-align:top;">
            <div style="font-size:11px;color:${GRAY};letter-spacing:1px;font-family:-apple-system,sans-serif;text-transform:uppercase;">${esc(displayDate)}</div>
          </td>
        </tr>
      </table>
      <div style="padding:16px 0 20px;">
        <div style="font-size:18px;font-weight:700;color:${NAVY};margin-bottom:4px;font-family:-apple-system,sans-serif;">${esc(companyName)}</div>
      </div>
    </td></tr>

    <!-- MAIN CONTENT -->
    <tr><td class="wrap" style="padding:32px 40px 40px;">

      ${todayScanHtml}
      ${todayScanHtml ? divider() : ""}
      ${researchedFindingsHtml}
      ${researchedFindingsHtml && mainBriefingHtml ? divider() : ""}
      ${mainBriefingHtml}
      ${deeperReadHtml ? divider() + deeperReadHtml : ""}
      ${perceptionGapHtml ? divider() + perceptionGapHtml : ""}
      ${observationsHtml ? divider() + observationsHtml : ""}
      ${divider()}
      ${sourceNotesHtml}

    </td></tr>

    <!-- FOOTER -->
    <tr><td style="padding:20px 40px 32px;text-align:center;border-top:3px solid ${NAVY};">
      <div style="font-size:11px;color:#9ca3af;line-height:1.7;font-family:-apple-system,sans-serif;">
        You're receiving this because your company profile is active on <a href="${escAttr(SITE)}" style="color:#9ca3af;text-decoration:underline;">albis.news</a><br>
        <a href="${escAttr(`${SITE}/dashboard/profile`)}" style="color:#9ca3af;text-decoration:underline;">Update delivery preferences</a>
        &nbsp;·&nbsp; Intelligence, not noise.
      </div>
    </td></tr>

  </table>

</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------

function renderResearchedFindings(output: CompanyBriefingGenerationOutput): string {
  const layer = output.understanding?.researched_understanding_v1;
  const findings = layer?.findings?.filter((finding) =>
    ["email_main", "email_secondary"].includes(finding.placement),
  );
  if (!layer || !findings?.length) return "";

  const sourceById = new Map(layer.sources.map((source) => [source.id, source]));
  let html = sectionLabel("What matters today");
  html += `<p style="font-size:14px;color:${GRAY};line-height:1.55;margin:0 0 16px;font-family:-apple-system,sans-serif;">We looked through the relevant coverage and pulled out the signals worth your attention.</p>`;

  for (const finding of findings.slice(0, 6)) {
    const emailSources = finding.email_source_ids
      .map((id) => sourceById.get(id))
      .filter(Boolean)
      .slice(0, 5);
    const evidenceCount = finding.evidence_source_ids.length;
    html += `<div style="margin-bottom:18px;padding:16px 16px 14px;background:${QUIET_BG};border:1px solid ${BORDER};border-radius:12px;">`;
    html += `<p style="font-size:16px;color:${NAVY};line-height:1.35;margin:0 0 7px;font-weight:750;font-family:-apple-system,sans-serif;">${esc(customerEnglishText(finding.title))}</p>`;
    html += `<p style="font-size:15px;color:${BODY};line-height:1.6;margin:0 0 10px;font-family:-apple-system,sans-serif;">${textHtml(firstSentences(finding.body, 3))}</p>`;
    if (emailSources.length) {
      html += `<p style="font-size:12px;color:${GRAY};line-height:1.5;margin:0;font-family:-apple-system,sans-serif;">Sources: `;
      html += emailSources
        .map((source) =>
          source?.url
            ? `<a href="${escAttr(source.url)}" style="color:${GRAY};text-decoration:underline;">${esc(source.source_domain)}</a>`
            : esc(source?.source_domain || "source"),
        )
        .join(" · ");
      if (evidenceCount > emailSources.length) {
        html += ` · ${evidenceCount - emailSources.length} more in evidence trail`;
      }
      html += `</p>`;
    }
    html += `</div>`;
  }

  return html;
}

function renderMainBriefing(output: CompanyBriefingGenerationOutput): string {
  const sections = output.main_briefing.sections;
  if (sections.length === 0) return "";

  const scanner = output.scanner_report?.enabled;
  let html = sectionLabel(scanner ? "Your Daily Scan" : "Main Briefing");

  for (const section of sections) {
    html += `<div style="margin-bottom:24px;">`;
    html += `<div style="font-size:13px;color:${AMBER};font-weight:700;font-family:-apple-system,sans-serif;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;">${esc(section.heading)}</div>`;

    if (section.no_material_signal_line) {
      html += `<p style="font-size:14px;color:${GRAY};line-height:1.6;margin:0;font-family:-apple-system,sans-serif;font-style:italic;">${esc(section.no_material_signal_line.text)}</p>`;
    }

    for (const item of section.items) {
      html += renderBriefingItem(
        item,
        section.heading,
        section.items.length === 1,
      );
    }

    html += `</div>`;
  }

  return html;
}

function renderBriefingItem(
  item: GeneratedBriefingItem,
  sectionHeading?: string,
  hideTitle = false,
): string {
  let html = `<div style="margin-bottom:20px;">`;

  // Title. Most company sections currently contain one item, so avoid
  // repeating the same text twice (section heading + item title).
  if (
    !hideTitle &&
    (!sectionHeading ||
      customerEnglishText(item.title.text).trim().toLowerCase() !==
        sectionHeading.trim().toLowerCase())
  ) {
    html += `<p style="font-size:16px;color:${NAVY};line-height:1.4;margin:0 0 6px;font-weight:700;font-family:-apple-system,sans-serif;">${esc(customerEnglishText(item.title.text))}</p>`;
  }

  // Body
  html += `<p style="font-size:15px;color:${BODY};line-height:1.65;margin:0 0 6px;font-family:-apple-system,sans-serif;">${textHtml(item.body.text)}</p>`;

  if (item.source_attribution?.text) {
    const sourceText = esc(item.source_attribution.text);
    if (item.source_url) {
      html += `<p style="font-size:12px;color:${GRAY};line-height:1.5;margin:0;font-family:-apple-system,sans-serif;"><a href="${escAttr(item.source_url)}" style="color:${GRAY};text-decoration:underline;">${sourceText}</a></p>`;
    } else {
      html += `<p style="font-size:12px;color:${GRAY};line-height:1.5;margin:0;font-family:-apple-system,sans-serif;">${sourceText}</p>`;
    }
  }

  html += `</div>`;
  return html;
}

function renderTodayScan(output: CompanyBriefingGenerationOutput): string {
  if (!output.scanner_report?.enabled) return "";
  let html = sectionLabel("Your Daily Scan");
  html += `<div style="padding:14px 16px;background:${QUIET_BG};border-left:3px solid ${AMBER};margin-bottom:14px;">`;
  html += `<p style="font-size:15px;color:${BODY};line-height:1.65;margin:0;font-family:-apple-system,sans-serif;">${textHtml(output.scanner_report.overview.text)}</p>`;
  html += `</div>`;
  if (output.today_brief.bullets.length) {
    html += `<ul style="padding-left:18px;margin:0;color:${BODY};font-family:-apple-system,sans-serif;font-size:14px;line-height:1.55;">`;
    for (const bullet of output.today_brief.bullets)
      html += `<li style="margin-bottom:6px;">${esc(customerEnglishText(bullet.text))}</li>`;
    html += `</ul>`;
  }
  return html;
}

function renderDeeperRead(output: CompanyBriefingGenerationOutput): string {
  const reads = output.scanner_report?.deeper_reads || [];
  if (reads.length === 0) return "";
  let html = sectionLabel("Context");
  for (const item of reads.slice(0, 3)) {
    html += `<div style="margin-bottom:18px;padding-bottom:16px;border-bottom:1px solid ${BORDER};">`;
    html += `<p style="font-size:16px;color:${NAVY};line-height:1.4;margin:0 0 6px;font-weight:700;font-family:-apple-system,sans-serif;">${esc(customerEnglishText(item.title.text))}</p>`;
    html += `<p style="font-size:15px;color:${BODY};line-height:1.65;margin:0;font-family:-apple-system,sans-serif;">${textHtml(item.body.text)}</p>`;
    html += `</div>`;
  }
  return html;
}

function renderPerceptionGap(): string {
  // Product guard: current generated PGI reads can sound abstract even when the
  // research layer is stronger. Do not put PGI in customer email until the
  // writer can state a concrete “X sees it this way / Y sees it that way” gap.
  // The underlying PGI/research data remains available in the dashboard trail.
  return "";
}

function renderUsefulObservations(
  output: CompanyBriefingGenerationOutput,
): string {
  const obs = output.useful_observations.observations;
  if (obs.length === 0) return "";

  let html = sectionLabel("Observations");
  for (const o of obs) {
    html += `<p style="font-size:15px;color:${BODY};line-height:1.65;margin:0 0 10px;font-family:-apple-system,sans-serif;">
      <span style="color:${AMBER};font-weight:700;">&#x25B6;</span>&nbsp;${esc(customerEnglishText(o.text))}
    </p>`;
  }
  return html;
}

function renderSourceNotes(output: CompanyBriefingGenerationOutput): string {
  const sn = output.source_notes;
  let html = `<div style="text-align:center;">`;
  html += `<p style="font-size:13px;color:${GRAY};font-family:-apple-system,sans-serif;margin:0 0 10px;">${esc(sn.text.text)}</p>`;
  if (sn.dashboard_link) {
    const dashboardLink = safeDashboardLink(sn.dashboard_link);
    html += `<a href="${escAttr(dashboardLink)}" style="font-size:14px;color:${NAVY};font-weight:700;font-family:-apple-system,sans-serif;text-decoration:underline;">View source trail on Albis →</a>`;
  } else {
    html += `<p style="font-size:12px;color:${GRAY};font-family:-apple-system,sans-serif;margin:0;">Source trail available in the dashboard after this daily scan is saved.</p>`;
  }
  html += `</div>`;
  return html;
}

/**
 * Generate the v2 email subject line.
 */
export function generateBriefingSubjectV2(
  companyName: string,
  date: string,
  topLine?: string,
): string {
  // Use a calm subject line, not the full top line
  const displayDate = formatDate(date);
  if (topLine && topLine.length <= 60) {
    return `Albis — ${companyName} — ${topLine}`;
  }
  return `${companyName} Daily Scan — ${displayDate}`;
}
