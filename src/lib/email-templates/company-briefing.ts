// ---------------------------------------------------------------------------
// Company Briefing Email Template — Phase 4
// Renders a company_briefings.briefing_content JSONB into branded HTML email.
// ---------------------------------------------------------------------------

const SITE = "https://www.albis.news";
const NAVY = "#1a1a2e";
const AMBER = "#c8922a";
const GRAY = "#6b7280";
const BORDER = "#e5e7eb";
const BODY = "#374151";
const WHITE = "#ffffff";

function esc(s: string | undefined | null): string {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export interface BriefingContentHeader {
  company_name: string;
  date: string;
  scan_focus: string;
  signal_level: "low" | "moderate" | "elevated" | "high";
}

export type MatchReasonType =
  | "geography"
  | "sector"
  | "tracked_theme"
  | "watchlist_entity"
  | "supply_chain"
  | "risk_priority"
  | "urgency"
  | "significance";

export interface MatchReason {
  type: MatchReasonType;
  matched: string[];
  score: number;
  explanation: string;
  // Optional canonical_topic_id (Package 4). Present when every matched
  // term in this reason resolved to the same canonical via the alias
  // registry; null/absent on raw-string fallback or multi-canonical hits.
  canonical_topic_id?: string | null;
  canonical_label?: string | null;
}

export interface BriefingStory {
  headline: string;
  summary: string;
  // Persisted at scoring time. Optional so legacy briefing_content rows
  // (written before pkg 2) still type-check; the dashboard renderer
  // gracefully omits the expander when absent.
  match_reasons?: MatchReason[];
}

export interface BriefingWatchItem {
  monitor_point: string;
  timeframe: string;
}

export interface BriefingContent {
  header: BriefingContentHeader;
  what_changed: BriefingStory[];
  why_it_matters: string;
  what_to_watch: BriefingWatchItem[];
  regional_framing?: string;
}

const SIGNAL_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "#22c55e" },
  moderate: { label: "Moderate", color: "#eab308" },
  elevated: { label: "Elevated", color: "#f97316" },
  high: { label: "High", color: "#ef4444" },
};

function signalBadge(level: string): string {
  const s = SIGNAL_LABELS[level] || SIGNAL_LABELS.moderate;
  return `<span style="display:inline-block;padding:3px 10px;background:${s.color};color:${WHITE};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">${s.label}</span>`;
}

function sectionLabel(title: string): string {
  return `<div style="font-size:10px;color:${AMBER};text-transform:uppercase;letter-spacing:2px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-weight:700;margin-bottom:14px;">${esc(title)}</div>`;
}

function divider(): string {
  return `<div style="height:1px;background:${BORDER};margin:28px 0;"></div>`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00Z");
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

export function generateCompanyBriefingHtml(content: BriefingContent): string {
  const { header, what_changed, why_it_matters, what_to_watch, regional_framing } = content;
  const displayDate = formatDate(header.date);

  // --- WHAT CHANGED ---
  // Email body is intentionally clean: headline + 2-sentence summary only.
  // No inline match tags or chips — match reasoning lives on the dashboard
  // (see footer link).
  const storiesHtml = what_changed
    .map(
      (story, i) => `
      <div style="margin-bottom:20px;">
        <p style="font-size:16px;color:${NAVY};line-height:1.4;margin:0 0 6px;font-weight:700;font-family:-apple-system,sans-serif;">
          ${i + 1}. ${esc(story.headline)}
        </p>
        <p style="font-size:15px;color:${BODY};line-height:1.65;margin:0;font-family:-apple-system,sans-serif;">
          ${esc(story.summary)}
        </p>
      </div>`
    )
    .join("");

  // --- WHAT TO WATCH ---
  const watchHtml = what_to_watch
    .map(
      (w) => `
      <p style="font-size:15px;color:${BODY};line-height:1.65;margin:0 0 10px;font-family:-apple-system,sans-serif;">
        <span style="color:${AMBER};font-weight:700;">&#x25B6;</span>&nbsp;
        ${esc(w.monitor_point)}
        ${w.timeframe ? `<span style="color:${GRAY};font-size:12px;"> (${esc(w.timeframe)})</span>` : ""}
      </p>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Albis Briefing — ${esc(header.company_name)} — ${esc(displayDate)}</title>
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
  <div style="display:none;max-height:0;overflow:hidden;">Daily briefing for ${esc(header.company_name)} — ${esc(displayDate)}</div>

  <table cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:0 auto;background:${WHITE};">

    <!-- MASTHEAD -->
    <tr><td class="masthead" style="padding:40px 40px 0;border-bottom:3px solid ${NAVY};">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        <tr>
          <td>
            <div style="font-size:28px;font-weight:900;color:${NAVY};letter-spacing:3px;text-transform:uppercase;">ALBIS</div>
            <div style="font-size:11px;color:${GRAY};letter-spacing:2px;margin:4px 0 0;font-family:-apple-system,sans-serif;text-transform:uppercase;">Daily Briefing</div>
          </td>
          <td style="text-align:right;vertical-align:top;">
            <div style="font-size:11px;color:${GRAY};letter-spacing:1px;font-family:-apple-system,sans-serif;text-transform:uppercase;">${esc(displayDate)}</div>
          </td>
        </tr>
      </table>
      <div style="padding:16px 0 20px;">
        <div style="font-size:18px;font-weight:700;color:${NAVY};margin-bottom:8px;font-family:-apple-system,sans-serif;">${esc(header.company_name)}</div>
        <div style="font-size:13px;color:${GRAY};font-family:-apple-system,sans-serif;">
          Signal level: ${signalBadge(header.signal_level)}
          ${header.scan_focus ? `&nbsp;&nbsp;·&nbsp;&nbsp;Focus: ${esc(header.scan_focus)}` : ""}
        </div>
      </div>
    </td></tr>

    <!-- MAIN CONTENT -->
    <tr><td class="wrap" style="padding:32px 40px 40px;">

      <!-- WHAT CHANGED -->
      ${sectionLabel("What Changed")}
      ${storiesHtml}

      ${divider()}

      <!-- WHY IT MATTERS TO YOU -->
      ${sectionLabel("Why It Matters to You")}
      <p style="font-size:15px;color:${BODY};line-height:1.7;margin:0;font-family:-apple-system,sans-serif;">
        ${esc(why_it_matters)}
      </p>

      ${regional_framing ? `
      <div style="margin-top:16px;padding:12px 16px;background:#faf9f7;border-left:3px solid ${AMBER};">
        <p style="font-size:14px;color:${BODY};line-height:1.6;margin:0;font-family:-apple-system,sans-serif;">
          <strong style="color:${NAVY};">Regional framing:</strong> ${esc(regional_framing)}
        </p>
      </div>` : ""}

      ${divider()}

      <!-- WHAT TO WATCH -->
      ${sectionLabel("What to Watch Next")}
      ${watchHtml}

      ${divider()}

      <!-- Single subtle link to the dashboard, where each signal's
           "Why this matched" reasoning lives. -->
      <div style="text-align:center;">
        <a href="${SITE}/dashboard/briefing/today" style="font-size:13px;color:${GRAY};font-family:-apple-system,sans-serif;text-decoration:underline;">View reasoning on dashboard →</a>
      </div>

    </td></tr>

    <!-- FOOTER -->
    <tr><td style="padding:20px 40px 32px;text-align:center;border-top:3px solid ${NAVY};">
      <div style="font-size:11px;color:#9ca3af;line-height:1.7;font-family:-apple-system,sans-serif;">
        You're receiving this because your company profile is active on <a href="${SITE}" style="color:#9ca3af;text-decoration:underline;">albis.news</a><br>
        <a href="${SITE}/dashboard/profile" style="color:#9ca3af;text-decoration:underline;">Update delivery preferences</a>
        &nbsp;·&nbsp; Intelligence, not noise.
      </div>
    </td></tr>

  </table>

</body>
</html>`;
}

/**
 * Generate the email subject line for a company briefing.
 */
export function generateBriefingSubject(
  companyName: string,
  date: string
): string {
  return `Albis Daily Briefing — ${companyName} — ${formatDate(date)}`;
}
