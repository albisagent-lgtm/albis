import type { NewsletterData } from "./types";
import { REGION_FLAGS, REGION_NAMES } from "./types";

const SITE = "https://www.albis.news";
const NAVY = "#1a1a2e";
const AMBER = "#c8922a";
const GRAY = "#6b7280";
const LIGHT_GRAY = "#f9fafb";
const BORDER = "#e5e7eb";
const BODY = "#374151";
const WHITE = "#ffffff";

function esc(s: string | undefined | null): string {
  if (!s) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function regionName(r: string): string {
  return REGION_NAMES[r] || r.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function regionFlag(r: string): string {
  return REGION_FLAGS[r] || "🌐";
}

function sectionLabel(title: string): string {
  return `<div style="font-size:10px;color:${AMBER};text-transform:uppercase;letter-spacing:2px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-weight:700;margin-bottom:14px;">${esc(title)}</div>`;
}

function divider(): string {
  return `<div style="height:1px;background:${BORDER};margin:28px 0;"></div>`;
}

export function generateDailyDigestHtml(data: NewsletterData): string {
  const {
    greeting,
    pulseItems,
    bigStory,
    bigStoryAnalysis,
    glanceItems,
    blindSpot,
    blogPosts,
    closingThought,
    displayDate,
  } = data;

  // --- PULSE ---
  const pulseHtml = pulseItems.length > 0
    ? pulseItems.map((p) =>
        `<td style="text-align:center;padding:0 20px;border-right:1px solid ${BORDER};">
          <div style="font-size:10px;color:${GRAY};text-transform:uppercase;letter-spacing:1px;font-family:-apple-system,sans-serif;font-weight:600;">${esc(p.label)}</div>
          <div style="font-size:20px;font-weight:900;color:${NAVY};margin:4px 0 2px;font-family:Georgia,serif;">${esc(p.value)}</div>
          ${p.change ? `<div style="font-size:11px;color:${p.change.startsWith("↓") ? "#dc2626" : "#dc2626"};font-family:-apple-system,sans-serif;">${esc(p.change)}</div>` : ""}
        </td>`
      ).join("")
    : "";

  // Always add the scanned metric
  const scannedCell = `<td style="text-align:center;padding:0 0 0 20px;">
    <div style="font-size:10px;color:${GRAY};text-transform:uppercase;letter-spacing:1px;font-family:-apple-system,sans-serif;font-weight:600;">Scanned</div>
    <div style="font-size:20px;font-weight:900;color:${NAVY};margin:4px 0 2px;font-family:Georgia,serif;">60</div>
    <div style="font-size:11px;color:${GRAY};font-family:-apple-system,sans-serif;">countries · 9 languages</div>
  </td>`;

  // --- PERSPECTIVES ---
  const perspectivesHtml = bigStoryAnalysis.perspectives
    .map((p) =>
      `<p style="font-size:15px;color:${BODY};line-height:1.65;margin:0 0 8px;font-family:-apple-system,sans-serif;">
        <strong>${esc(p.region)}:</strong> ${esc(p.view)}
      </p>`
    ).join("");

  // --- GLANCE ITEMS ---
  const glanceHtml = glanceItems
    .map((item) =>
      `<p style="font-size:15px;color:${BODY};line-height:1.65;margin:0 0 14px;font-family:-apple-system,sans-serif;">
        <strong style="color:${NAVY};">${esc(item.headline)}.</strong> ${esc(item.connection)}
      </p>`
    ).join("");

  // --- BLIND SPOT ---
  let blindSpotHtml = "";
  if (blindSpot) {
    const covered = blindSpot.coveredIn.map((r) => `${regionFlag(r)} ${regionName(r)}`).join(" · ");
    const missing = blindSpot.missingFrom.map((r) => `${regionFlag(r)} ${regionName(r)}`).join(" · ");
    blindSpotHtml = `
      ${divider()}
      ${sectionLabel("The Blind Spot")}
      <p style="font-size:15px;color:${BODY};line-height:1.65;margin:0 0 8px;font-family:-apple-system,sans-serif;">
        <strong style="color:${NAVY};">${esc(blindSpot.headline)}.</strong> ${esc(blindSpot.connection)}
      </p>
      <p style="font-size:12px;color:${GRAY};margin:0;font-family:-apple-system,sans-serif;">
        <strong style="color:${NAVY};">Covered in:</strong> ${covered}<br>
        <strong style="color:${NAVY};">Missing from:</strong> ${missing}
      </p>`;
  }

  // --- WORTH READING ---
  let worthReadingHtml = "";
  if (blogPosts.length > 0) {
    const links = blogPosts.slice(0, 4).map((p) =>
      `<p style="font-size:14px;margin:0 0 10px;font-family:-apple-system,sans-serif;">
        — <a href="${SITE}/blog/${p.slug}" style="color:${NAVY};font-weight:600;text-decoration:none;">${esc(p.title)}</a>
        ${p.description ? `<span style="color:${GRAY};"> — ${esc(p.description)}</span>` : ""}
      </p>`
    ).join("");
    worthReadingHtml = `
      ${divider()}
      ${sectionLabel("Worth Reading")}
      ${links}`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Albis Daily — ${esc(displayDate)}</title>
  <style>
    body,table,td{font-family:Georgia,'Times New Roman',serif;}
    a{color:${NAVY};text-decoration:none;}
    a:hover{text-decoration:underline;}
    @media only screen and (max-width:600px){
      .wrap{padding:24px 20px!important;}
      .masthead{padding:28px 20px 20px!important;}
      .pulse td{display:block!important;text-align:left!important;border-right:none!important;border-bottom:1px solid ${BORDER};padding:10px 0!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${WHITE};-webkit-font-smoothing:antialiased;">

  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;">${esc(bigStory.headline)} — ${esc(displayDate)}</div>

  <table cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:0 auto;background:${WHITE};">

    <!-- MASTHEAD -->
    <tr><td class="masthead" style="padding:40px 40px 0;text-align:center;border-bottom:3px solid ${NAVY};">
      <div style="font-size:38px;font-weight:900;color:${NAVY};letter-spacing:4px;text-transform:uppercase;">ALBIS</div>
      <div style="font-size:11px;color:${GRAY};letter-spacing:2px;margin:4px 0 18px;font-family:-apple-system,sans-serif;text-transform:uppercase;">Daily Briefing · ${esc(displayDate)}</div>
    </td></tr>

    <!-- GREETING -->
    <tr><td class="wrap" style="padding:24px 40px;border-bottom:1px solid ${BORDER};">
      <div style="font-size:15px;color:${GRAY};line-height:1.65;font-style:italic;font-family:-apple-system,sans-serif;">${esc(greeting)}</div>
    </td></tr>

    <!-- PULSE -->
    ${pulseItems.length > 0 ? `
    <tr><td style="padding:20px 40px;border-bottom:1px solid ${BORDER};">
      <table class="pulse" cellpadding="0" cellspacing="0" style="width:100%;">
        <tr>
          ${pulseHtml}
          ${scannedCell}
        </tr>
      </table>
    </td></tr>` : `
    <tr><td style="padding:20px 40px;border-bottom:1px solid ${BORDER};">
      <table class="pulse" cellpadding="0" cellspacing="0" style="width:100%;">
        <tr>${scannedCell}</tr>
      </table>
    </td></tr>`}

    <!-- MAIN CONTENT -->
    <tr><td class="wrap" style="padding:32px 40px 40px;">

      <!-- The Full Picture -->
      ${sectionLabel("The Full Picture")}
      <div style="font-size:26px;font-weight:900;color:${NAVY};line-height:1.25;margin-bottom:18px;">${esc(bigStory.headline)}</div>
      <p style="font-size:16px;color:${BODY};line-height:1.7;margin:0 0 20px;font-family:-apple-system,sans-serif;">${esc(bigStoryAnalysis.whatHappened)}</p>

      <div style="font-size:10px;color:${AMBER};text-transform:uppercase;letter-spacing:2px;font-family:-apple-system,sans-serif;font-weight:700;margin-bottom:10px;">How the world sees it</div>
      ${perspectivesHtml}

      <p style="font-size:15px;color:${BODY};line-height:1.65;margin:16px 0 8px;font-family:-apple-system,sans-serif;">
        <strong style="color:${NAVY};">What everyone misses:</strong> ${esc(bigStoryAnalysis.whatEveryoneMisses)}
      </p>
      <p style="font-size:15px;color:${BODY};line-height:1.65;margin:0 0 0;font-family:-apple-system,sans-serif;">
        <strong style="color:${NAVY};">Zoom out:</strong> ${esc(bigStoryAnalysis.zoomOut)}
      </p>

      ${divider()}

      <!-- World at a Glance -->
      ${sectionLabel("World at a Glance")}
      ${glanceHtml}

      <!-- Blind Spot -->
      ${blindSpotHtml}

      <!-- Worth Reading -->
      ${worthReadingHtml}

      ${divider()}

      <!-- One Thing -->
      <div style="text-align:center;padding:8px 0 24px;">
        <div style="font-size:18px;color:${NAVY};line-height:1.6;font-style:italic;margin-bottom:12px;">&ldquo;${esc(closingThought)}&rdquo;</div>
        <div style="font-size:13px;color:${GRAY};font-family:-apple-system,sans-serif;">See clearly. — Albis</div>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:8px;">
        <a href="${SITE}" style="display:inline-block;padding:13px 36px;background:${NAVY};color:${WHITE};text-decoration:none;font-family:-apple-system,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.5px;">Explore today's stories</a>
      </div>

    </td></tr>

    <!-- FOOTER -->
    <tr><td style="padding:20px 40px 32px;text-align:center;border-top:3px solid ${NAVY};">
      <div style="font-size:11px;color:#9ca3af;line-height:1.7;font-family:-apple-system,sans-serif;">
        You're receiving this because you signed up at <a href="${SITE}" style="color:#9ca3af;text-decoration:underline;">albis.news</a><br>
        <a href="${SITE}/api/unsubscribe?email={{EMAIL}}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
        &nbsp;·&nbsp;
        <a href="${SITE}/archive/${data.date}" style="color:#9ca3af;text-decoration:underline;">View on web</a>
        &nbsp;·&nbsp; Observe. Never judge.
      </div>
    </td></tr>

  </table>

</body>
</html>`;
}
