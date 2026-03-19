import type { NewsletterData } from "./types";
import { CATEGORY_EMOJI, REGION_FLAGS, REGION_NAMES } from "./types";

const SITE = "https://www.albis.news";

// Design tokens
const AMBER = "#d97706";
const NAVY = "#1a1a2e";
const BODY_COLOR = "#333333";
const GRAY = "#6b7280";
const LIGHT_GRAY = "#f3f4f6";
const BORDER = "#e5e7eb";
const BLIND_SPOT_BG = "#fffbeb";
const WHITE = "#ffffff";

function esc(s: string | undefined | null): string {
  if (!s) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function categoryLabel(cat: string): string {
  const names: Record<string, string> = {
    "current-events": "World",
    cybersecurity: "Cyber",
    "tech-ai": "Tech",
    "ai-intelligence": "AI",
    "weather-climate": "Climate",
    "economic-flows": "Business",
    health: "Health",
    "health-longevity": "Science",
    "climate-energy": "Energy",
    culture: "Culture",
    "natural-world": "Nature",
    grassroots: "Society",
    "psychology-persuasion": "Mind",
    "influential-people": "People",
  };
  return names[cat] || cat.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function regionName(r: string): string {
  return REGION_NAMES[r] || r.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function regionFlag(r: string): string {
  return REGION_FLAGS[r] || "🌐";
}

/** Section header — amber, uppercase */
function sectionHeader(_emoji: string, title: string): string {
  return `<tr><td style="padding:0 28px;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:32px 0 0 0;">
        <div style="border-top:1px solid ${BORDER};padding-top:20px;">
          <span style="font-size:11px;font-weight:700;color:${AMBER};text-transform:uppercase;letter-spacing:1.5px;">${esc(title)}</span>
        </div>
      </td></tr>
    </table>
  </td></tr>`;
}

export function generateDailyDigestHtml(data: NewsletterData): string {
  return generateSimpleDigestHtml(data);
}

export function generateSimpleDigestHtml(data: NewsletterData): string {
  const SITE = "https://www.albis.news";
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

  // --- 📊 THE PULSE ---
  const pulseHtml = pulseItems.length > 0
    ? pulseItems
        .map(
          (p) =>
            `<td style="padding:8px 12px 8px 0;vertical-align:top;">
              <div style="font-size:11px;color:${GRAY};text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">${esc(p.label)}</div>
              <div style="font-size:16px;color:${NAVY};font-weight:700;margin-top:2px;">${esc(p.value)}</div>
              ${p.change ? `<div style="font-size:12px;color:${p.change.startsWith("↓") ? "#dc2626" : "#16a34a"};margin-top:1px;">${esc(p.change)}</div>` : ""}
            </td>`
        )
        .join("")
    : "";

  // --- 🔍 THE FULL PICTURE ---
  const perspectivesHtml = bigStoryAnalysis.perspectives
    .map(
      (p) =>
        `<div style="margin-bottom:10px;">
          <span style="font-size:13px;font-weight:700;color:${AMBER};">${esc(p.region)}:</span>
          <span style="font-size:15px;color:${BODY_COLOR};line-height:1.6;"> ${esc(p.view)}</span>
        </div>`
    )
    .join("");

  // --- ⚡ WORLD AT A GLANCE ---
  const glanceHtml = glanceItems
    .map(
      (item, i) => {
        const fontSize = i === 0 ? "15px" : i <= 2 ? "14.5px" : "14px"; // taper
        return `<tr><td style="padding:0;">
          <div style="padding:14px 0;${i < glanceItems.length - 1 ? `border-bottom:1px solid ${BORDER};` : ""}">
            <div style="border-left:3px solid ${AMBER};padding-left:14px;">
              <div style="font-size:11px;font-weight:700;color:${AMBER};text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">${categoryLabel(item.category)}</div>
              <div style="font-size:${fontSize};color:${NAVY};font-weight:600;line-height:1.4;margin-bottom:4px;">${esc(item.headline)}</div>
              <div style="font-size:14px;color:${BODY_COLOR};line-height:1.55;">${esc(item.connection)}</div>
            </div>
          </div>
        </td></tr>`;
      }
    )
    .join("");

  // --- 🌍 THE BLIND SPOT ---
  let blindSpotHtml = "";
  if (blindSpot) {
    const covered = blindSpot.coveredIn.map((r) => `${regionFlag(r)} ${regionName(r)}`).join(", ");
    const missing = blindSpot.missingFrom.map((r) => `${regionFlag(r)} ${regionName(r)}`).join(", ");
    blindSpotHtml = `
    ${sectionHeader("", "The Blind Spot")}
    <tr><td style="padding:0 28px;">
      <div style="background:${BLIND_SPOT_BG};border-radius:8px;padding:20px 22px;margin-top:14px;">
        <div style="font-size:16px;color:${NAVY};font-weight:600;line-height:1.4;margin-bottom:10px;">${esc(blindSpot.headline)}</div>
        <div style="font-size:14px;color:${BODY_COLOR};line-height:1.6;margin-bottom:12px;">${esc(blindSpot.connection)}</div>
        <div style="font-size:13px;color:${GRAY};line-height:1.5;">
          <strong style="color:${NAVY};">Covered in:</strong> ${covered}<br>
          <strong style="color:${NAVY};">Missing from:</strong> ${missing}
        </div>
      </div>
    </td></tr>`;
  }

  // --- 📚 WORTH READING ---
  let blogHtml = "";
  if (blogPosts.length > 0) {
    const links = blogPosts
      .slice(0, 4)
      .map(
        (p) =>
          `<div style="padding:5px 0;">
            <span style="color:${AMBER};font-weight:700;">—</span>
            <a href="${SITE}/blog/${p.slug}" style="color:${NAVY};font-weight:600;text-decoration:none;font-size:14px;">${esc(p.title)}</a>
            <span style="font-size:13px;color:${GRAY};"> — ${esc(p.description)}</span>
          </div>`
      )
      .join("");
    blogHtml = `
    ${sectionHeader("", "Worth Reading")}
    <tr><td style="padding:6px 28px 0 28px;">${links}</td></tr>`;
  }

  // --- BUILD EMAIL ---
  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Albis Daily — ${esc(displayDate)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body,table,td{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}
    a{color:${AMBER};text-decoration:none;}
    a:hover{text-decoration:underline;}
    @media only screen and (max-width:620px){
      .outer{width:100%!important;}
      .inner{padding:20px 20px!important;}
      .masthead{padding:28px 20px 24px!important;}
      .section-pad{padding-left:20px!important;padding-right:20px!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${LIGHT_GRAY};-webkit-font-smoothing:antialiased;">
  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(bigStory.headline)} &mdash; Today's full picture plus ${glanceItems.length} more stories you need to see.</div>

  <center>
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:${LIGHT_GRAY};">
    <tr><td align="center" style="padding:24px 16px;">

      <!-- Main Container -->
      <table role="presentation" cellpadding="0" cellspacing="0" class="outer" style="width:100%;max-width:560px;background:${WHITE};border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">

        <!-- ═══════════ MASTHEAD ═══════════ -->
        <tr><td class="masthead" style="padding:36px 28px 28px;text-align:center;">
          <div style="font-size:28px;font-weight:800;color:${NAVY};letter-spacing:-0.5px;font-family:Georgia,'Times New Roman',serif;">ALBIS</div>
          <div style="font-size:11px;color:${GRAY};text-transform:uppercase;letter-spacing:3px;margin-top:4px;">Daily Briefing</div>
          <div style="font-size:13px;color:${GRAY};margin-top:8px;">${esc(displayDate)}</div>
          <div style="margin-top:10px;"><a href="${SITE}/archive/${data.date}" style="font-size:12px;color:${AMBER};text-decoration:underline;">View in browser</a></div>
          <div style="width:40px;height:2px;background:${AMBER};margin:16px auto 0;"></div>
        </td></tr>

        <!-- ═══════════ 🌅 GOOD MORNING ═══════════ -->
        <tr><td class="section-pad" style="padding:0 28px 24px;">
          <div style="font-size:16px;color:${BODY_COLOR};line-height:1.65;">${esc(greeting)}</div>
        </td></tr>

        <!-- ═══════════ 📊 THE PULSE ═══════════ -->
        ${pulseItems.length > 0 ? `
        ${sectionHeader("", "The Pulse")}
        <tr><td class="section-pad" style="padding:12px 28px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>${pulseHtml}</tr>
          </table>
        </td></tr>` : ""}

        <!-- ═══════════ 🔍 THE FULL PICTURE ═══════════ -->
        ${sectionHeader("", "The Full Picture")}
        <tr><td class="section-pad" style="padding:14px 28px 0;">
          <div style="font-size:22px;font-weight:700;color:${NAVY};line-height:1.3;font-family:Georgia,'Times New Roman',serif;margin-bottom:16px;">${esc(bigStory.headline)}</div>

          <!-- What happened -->
          <div style="font-size:16px;color:${BODY_COLOR};line-height:1.65;margin-bottom:18px;">${esc(bigStoryAnalysis.whatHappened)}</div>

          <!-- How the world sees it -->
          <div style="font-size:11px;font-weight:700;color:${AMBER};text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">How the world sees it</div>
          <div style="margin-bottom:18px;">${perspectivesHtml}</div>

          <!-- What everyone misses -->
          <div style="background:${BLIND_SPOT_BG};border-left:3px solid ${AMBER};padding:14px 16px;border-radius:0 6px 6px 0;margin-bottom:18px;">
            <div style="font-size:11px;font-weight:700;color:${AMBER};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">What everyone misses</div>
            <div style="font-size:15px;color:${BODY_COLOR};line-height:1.6;">${esc(bigStoryAnalysis.whatEveryoneMisses)}</div>
          </div>

          <!-- Zoom Out -->
          <div style="font-size:11px;font-weight:700;color:${AMBER};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Zoom out</div>
          <div style="font-size:15px;color:${BODY_COLOR};line-height:1.6;margin-bottom:4px;">${esc(bigStoryAnalysis.zoomOut)}</div>
        </td></tr>

        <!-- ═══════════ ⚡ WORLD AT A GLANCE ═══════════ -->
        ${sectionHeader("", "World at a Glance")}
        <tr><td class="section-pad" style="padding:10px 28px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
            ${glanceHtml}
          </table>
        </td></tr>

        <!-- ═══════════ 🌍 THE BLIND SPOT ═══════════ -->
        ${blindSpotHtml}

        <!-- ═══════════ 📚 WORTH READING ═══════════ -->
        ${blogHtml}

        <!-- ═══════════ 💬 ONE THING ═══════════ -->
        ${sectionHeader("", "One Thing")}
        <tr><td style="padding:14px 28px 32px;text-align:center;">
          <div style="font-size:17px;color:${NAVY};line-height:1.6;font-style:italic;font-family:Georgia,'Times New Roman',serif;max-width:460px;margin:0 auto;">&ldquo;${esc(closingThought)}&rdquo;</div>
          <div style="font-size:14px;color:${GRAY};margin-top:18px;">See clearly. — Albis</div>
        </td></tr>

        <!-- ═══════════ CTA ═══════════ -->
        <tr><td style="padding:0 28px 36px;text-align:center;">
          <a href="${SITE}" style="display:inline-block;padding:14px 36px;background:${NAVY};color:${WHITE};text-decoration:none;border-radius:6px;font-size:14px;font-weight:700;">Explore today's stories</a>
        </td></tr>

      </table>

      <!-- ═══════════ FOOTER ═══════════ -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;">
        <tr><td style="padding:24px 28px;text-align:center;">
          <div style="font-size:12px;color:#9ca3af;line-height:1.6;">
            You're receiving this because you signed up at <a href="${SITE}" style="color:#9ca3af;text-decoration:underline;">albis.news</a>
          </div>
          <div style="margin-top:8px;">
            <a href="${SITE}/api/unsubscribe?email={{EMAIL}}" style="font-size:12px;color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
            &nbsp;&nbsp;·&nbsp;&nbsp;
            <a href="${SITE}/archive/${data.date}" style="font-size:12px;color:#9ca3af;text-decoration:underline;">View on web</a>
          </div>
          <div style="margin-top:16px;font-size:11px;color:#d1d5db;">Observe. Never judge.</div>
        </td></tr>
      </table>

    </td></tr>
  </table>
  </center>
</body>
</html>`;
}
