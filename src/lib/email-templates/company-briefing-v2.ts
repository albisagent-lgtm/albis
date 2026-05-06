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
  AlbisFinding,
  CompanyBriefingGenerationOutput,
  GeneratedBriefingItem,
  ResearchNote,
  ResearchSource,
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
  const polished = polishCustomerText(raw);
  if (!polished || !NON_ENGLISH_VISIBLE_SCRIPT.test(polished)) return polished;
  const stripped = polished
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

function polishCustomerText(value: string): string {
  return value
    .replace(/\bpress-freedom signals\b/gi, "press-freedom coverage")
    .replace(/\bsignals need careful reading\b/gi, "coverage needs careful reading")
    .replace(/\bearly signals\b/gi, "early reports")
    .replace(/\bstrong signals?\b/gi, "clear evidence")
    .replace(/\boperating signal\b/gi, "operating evidence")
    .replace(/\bmarket signal\b/gi, "market evidence")
    .replace(/\bthis is the signal\b/gi, "this is the point")
    .replace(/\bthe useful point is\b/gi, "the point is")
    .replace(/\bThe practical difference is\b/g, "The difference is")
    .replace(/\bthe practical difference is\b/g, "the difference is")
    .replace(/\bThe section is about\b/g, "This coverage concerns")
    .replace(/\bRelevant to ([^.;]+?)'s selected scan areas because it matched ([^.]+)\./gi, "This item relates to $2.")
    .replace(/\bRelevant to selected scan areas because it matched ([^.]+)\./gi, "This item relates to $1.")
    .replace(/\bguarantees\b/gi, "sets out protections for")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
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
  const perceptionGapHtml = renderPerceptionGap(output);

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
  const noteByClusterId = new Map(layer.notes.map((note) => [note.cluster_id, note]));
  const goldFindings = findings
    .map((finding) => ({
      finding,
      note: noteByClusterId.get(finding.cluster_id),
      sources: finding.evidence_source_ids
        .map((id) => sourceById.get(id))
        .filter((source): source is ResearchSource => Boolean(source)),
    }))
    .filter(({ finding, note, sources }) =>
      Boolean(note) && hasClusterDepth(sources) && !looksLikeRawSourceTitle(finding.title),
    )
    .slice(0, 7);

  if (!goldFindings.length) return "";

  let html = sectionLabel("Your Daily Scan");

  for (const { finding, note, sources } of goldFindings) {
    const topicLabel = topicLabelForFinding(output, finding);
    const paragraphs = buildGoldStandardParagraphs(finding, note!, sources);
    if (paragraphs.length < 2) continue;
    html += `<div style="margin-bottom:28px;">`;
    if (topicLabel) {
      html += `<p style="font-size:13px;color:${AMBER};line-height:1.35;margin:0 0 6px;font-weight:750;font-family:-apple-system,sans-serif;text-transform:uppercase;letter-spacing:1px;">${esc(topicLabel)}</p>`;
    }
    html += `<p style="font-size:17px;color:${NAVY};line-height:1.35;margin:0 0 10px;font-weight:750;font-family:-apple-system,sans-serif;">${esc(goldHeadline(finding, note!))}</p>`;
    for (const paragraph of paragraphs.slice(0, 4)) {
      html += `<p style="font-size:15px;color:${BODY};line-height:1.68;margin:0 0 12px;font-family:-apple-system,sans-serif;">${textHtml(paragraph)}</p>`;
    }
    html += renderCleanSourceTrail(sources);
    html += `</div>`;
  }

  return html;
}

function looksLikeRawSourceTitle(title: string): boolean {
  return /\b(press release view|>\s*press release|\|\s*[A-Z]| - [A-Z][A-Za-z]+\s*(Observer|Online|News|Report)|^U\.S\.?$)/i.test(title || "");
}

function goldHeadline(finding: AlbisFinding, note: ResearchNote): string {
  const candidates = [finding.title, note.what_happened, note.summary]
    .map((value) => customerEnglishText(value))
    .filter(Boolean)
    .filter((value) => !looksLikeRawSourceTitle(value));
  return trimHeadline(candidates[0] || finding.title || "Reported development");
}

function trimHeadline(value: string): string {
  return value
    .replace(/\s+-\s+[^-]{2,45}$/g, "")
    .replace(/\s+\|\s+[^|]{2,45}$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(value: string): number {
  return value.split(/\s+/).filter(Boolean).length;
}

function splitCleanParagraphs(value: string): string[] {
  const rawParagraphs = String(value || "")
    .split(/\n{2,}/)
    .map((paragraph) => customerEnglishText(paragraph).trim())
    .filter(Boolean);

  const paragraphs = rawParagraphs.length >= 2 ? rawParagraphs : splitLongParagraphForEmail(rawParagraphs[0] || "");

  return paragraphs
    .filter(Boolean)
    .filter((paragraph, index, all) => {
      const key = paragraph.toLowerCase().replace(/[^a-z0-9]+/g, " ").slice(0, 140);
      return all.findIndex((candidate) => candidate.toLowerCase().replace(/[^a-z0-9]+/g, " ").slice(0, 140) === key) === index;
    });
}

function splitLongParagraphForEmail(value: string): string[] {
  const cleaned = customerEnglishText(value).trim();
  if (!cleaned) return [];
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g)?.map((sentence) => sentence.trim()).filter(Boolean) || [cleaned];
  if (sentences.length < 3 || wordCount(cleaned) < 90) return [cleaned];
  const midpoint = Math.ceil(sentences.length / 2);
  return [joinSentences(sentences.slice(0, midpoint)), joinSentences(sentences.slice(midpoint))].filter(Boolean);
}

function capParagraphsToWordTarget(paragraphs: string[], maxWords = 250): string[] {
  const out: string[] = [];
  let total = 0;
  for (const paragraph of paragraphs) {
    const words = wordCount(paragraph);
    if (total + words <= maxWords) {
      out.push(paragraph);
      total += words;
      continue;
    }
    const remaining = maxWords - total;
    if (remaining >= 45) {
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
      const kept: string[] = [];
      let keptWords = 0;
      for (const sentence of sentences) {
        const sentenceWords = wordCount(sentence);
        if (keptWords + sentenceWords > remaining) break;
        kept.push(sentence.trim());
        keptWords += sentenceWords;
      }
      if (kept.length) out.push(joinSentences(kept));
    }
    break;
  }
  return out;
}

function buildGoldStandardParagraphs(
  finding: AlbisFinding,
  note: ResearchNote,
  sources: ResearchSource[],
): string[] {
  const editedParagraphs = splitCleanParagraphs(finding.body || "")
    .filter((paragraph) => !/^the source trail includes concrete markers/i.test(paragraph))
    .filter((paragraph) => !/add different layers to the same tracked topic/i.test(paragraph));
  if (wordCount(editedParagraphs.join(" ")) >= 120) {
    return capParagraphsToWordTarget(editedParagraphs, 250);
  }

  const facts = note.key_facts
    .map((fact) => cleanResearchSentence(fact))
    .filter(Boolean)
    .filter((fact) => !looksLikeRawSourceTitle(fact));
  const sourceObservations = note.source_observations
    .map((observation) => cleanResearchSentence(observation.what_it_reports || observation.useful_detail))
    .filter(Boolean)
    .filter((fact) => !looksLikeRawSourceTitle(fact));
  const actors = note.key_actors.slice(0, 5);
  const places = note.named_places.slice(0, 5);

  const paragraphs: string[] = [];
  const leadParts = [facts[0] || note.what_happened, facts[1], facts[2]]
    .map(cleanResearchSentence)
    .filter(Boolean)
    .slice(0, 3);
  if (leadParts.length) {
    paragraphs.push(joinSentences(leadParts));
  }

  const context: string[] = [];
  if (actors.length) context.push(`The named actors include ${humanListText(actors)}.`);
  if (places.length) context.push(`The coverage reaches ${humanListText(places)}.`);
  const relevance = cleanResearchSentence(note.company_relevance || note.consequences[0]);
  if (relevance) context.push(relevance);
  if (context.length) paragraphs.push(joinSentences(context.slice(0, 4)));

  const sourceLayer = sourceObservations.slice(0, 3);
  if (sourceLayer.length >= 2) {
    paragraphs.push(joinSentences(sourceLayer));
  }

  if (note.differences_in_reporting.length >= 2) {
    const differences = note.differences_in_reporting
      .slice(0, 3)
      .map((difference) => cleanResearchSentence(difference.description))
      .filter(Boolean);
    if (differences.length) {
      paragraphs.push(`The source contrast matters. ${joinSentences(differences)}`);
    }
  }

  return capParagraphsToWordTarget(
    paragraphs
      .map((paragraph) => customerEnglishText(paragraph))
      .filter((paragraph) => paragraph.split(/\s+/).length >= 18),
    250,
  );
}

function hasClusterDepth(sources: ResearchSource[]): boolean {
  const sourceIds = new Set(sources.map((source) => source.id).filter(Boolean));
  const domains = new Set(sources.map((source) => source.source_domain.replace(/^www\./i, "").toLowerCase()).filter(Boolean));
  return sourceIds.size >= 2;
}

function cleanResearchSentence(value: string | undefined | null): string {
  return customerEnglishText(String(value || ""))
    .replace(/^[-–—\s]+/g, "")
    .replace(/\s*[-–—]\s*[-–—\s]+/g, " ")
    .replace(/\b(By\s+[A-Z][^–—]{2,80}\s+[A-Z][a-z]+,\s+)?May\s+\d{1,2},\s+\d{4}\b/gi, "")
    .replace(/\bUpdated\s+\d+\s+hour[s]?\s+ago\b/gi, "")
    .replace(/\bFollow us\b.*$/gi, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/^[,.;:!\-–—\s]+|[,.;:!\-–—\s]+$/g, "")
    .trim();
}

function joinSentences(parts: string[]): string {
  return parts
    .map((part) => part.replace(/[.!?]+$/g, ""))
    .filter(Boolean)
    .map((part) => `${part}.`)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function humanListText(values: string[]): string {
  const items = values.map((value) => cleanResearchSentence(value)).filter(Boolean).slice(0, 5);
  if (items.length <= 1) return items[0] || "the source trail";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function sourceNameForEmail(source: ResearchSource): string {
  const domain = source.source_domain.replace(/^www\./i, "");
  const names: Record<string, string> = {
    "rsf.org": "RSF",
    "cpj.org": "Committee to Protect Journalists",
    "unesco.org": "UNESCO",
    "freedomhouse.org": "Freedom House",
    "bbc.com": "BBC",
    "theguardian.com": "The Guardian",
    "ox.ac.uk": "University of Oxford",
    "nature.com": "Nature",
    "hrw.org": "Human Rights Watch",
    "404media.co": "404 Media",
  };
  return names[domain] || domain.replace(/\.(com|org|net|co|news)$/i, "");
}

function renderCleanSourceTrail(sources: ResearchSource[]): string {
  const visible = sources
    .filter((source) => source.url)
    .filter((source, index, arr) => arr.findIndex((s) => s.source_domain === source.source_domain) === index)
    .slice(0, 5);
  if (!visible.length) return "";
  const links = visible.map((source) =>
    `<a href="${escAttr(source.url)}" style="color:${GRAY};text-decoration:underline;">${esc(sourceNameForEmail(source))}</a>`,
  );
  return `<p style="font-size:13px;color:${GRAY};line-height:1.5;margin:2px 0 0;font-family:-apple-system,sans-serif;">${links.join(" · ")}</p>`;
}

function topicLabelForFinding(
  output: CompanyBriefingGenerationOutput,
  finding: AlbisFinding,
): string {
  const section = output.main_briefing.sections.find((candidate) =>
    candidate.items.some((item) => item.cluster_id === finding.cluster_id),
  );
  if (section?.heading) return customerEnglishText(section.heading);

  const cluster = output.understanding?.researched_understanding_v1?.clusters.find(
    (candidate) => candidate.id === finding.cluster_id,
  );
  const firstAreaId = cluster?.scan_area_ids?.[0];
  if (firstAreaId) {
    const areaSection = output.main_briefing.sections.find(
      (candidate) => candidate.section_id === firstAreaId,
    );
    if (areaSection?.heading) return customerEnglishText(areaSection.heading);
  }
  return "";
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
      html += renderBriefingItem(item, section.heading);
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

  // V1 requires broad tracked topic label + specific scan-based headline.
  // Only suppress the title if it is genuinely identical to the section label.
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

function renderPerceptionGap(output: CompanyBriefingGenerationOutput): string {
  const rendered = new Set<string>();
  const lines: string[] = [];

  const generatedNotes = output.perception_gap?.notes || [];
  for (const note of generatedNotes) {
    const text = customerEnglishText(note.note.text);
    if (!text || rendered.has(text.toLowerCase())) continue;
    rendered.add(text.toLowerCase());
    lines.push(text);
  }

  const researchNotes = output.understanding?.researched_understanding_v1?.notes || [];
  for (const note of researchNotes) {
    const candidate = note.possible_perception_gap;
    if (!candidate || candidate.strength === "none" || !candidate.gap) continue;
    const text = customerEnglishText(
      candidate.why_it_matters
        ? `${candidate.gap} ${candidate.why_it_matters}`
        : candidate.gap,
    );
    if (!text || rendered.has(text.toLowerCase())) continue;
    rendered.add(text.toLowerCase());
    lines.push(text);
  }

  if (!lines.length) return "";
  let html = sectionLabel("Perception Gap");
  for (const line of lines.slice(0, 3)) {
    html += `<p style="font-size:15px;color:${BODY};line-height:1.65;margin:0 0 10px;font-family:-apple-system,sans-serif;">${textHtml(line)}</p>`;
  }
  return html;
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
