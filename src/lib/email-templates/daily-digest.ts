import type { ParsedScan } from "../scan-types";
import { CATEGORY_META, hasFramingWatch, hasBlindspot } from "../scan-types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://albis-app.vercel.app";

const SIG_ICON: Record<string, string> = {
  high: "🔴",
  medium: "🟡",
  low: "🟢",
};

export function generateDailyDigestHtml(scan: ParsedScan): string {
  const topItems = scan.items
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return (order[a.significance] ?? 2) - (order[b.significance] ?? 2);
    })
    .slice(0, 8);

  const framingItem = scan.items.find((i) => hasFramingWatch(i));
  const blindspotItem = scan.items.find((i) => hasBlindspot(i));

  const storiesHtml = topItems
    .map((item) => {
      const sig = SIG_ICON[item.significance] || "⚪";
      const cat = CATEGORY_META[item.category]?.label || item.category;
      return `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
            <span style="font-size: 14px;">${sig}</span>
            <span style="font-size: 15px; color: #1a1a1a; font-weight: 500;">${item.headline}</span>
            <br/>
            <span style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">${cat}</span>
          </td>
        </tr>`;
    })
    .join("");

  const framingHtml = framingItem
    ? `
      <div style="margin: 24px 0; padding: 16px; background: #fffbeb; border-left: 3px solid #d97706; border-radius: 4px;">
        <div style="font-size: 12px; color: #92400e; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">🔍 Framing Watch</div>
        <div style="font-size: 14px; color: #451a03;">${framingItem.headline}</div>
        ${framingItem.connection ? `<div style="font-size: 13px; color: #78350f; margin-top: 6px;">${framingItem.connection}</div>` : ""}
      </div>`
    : scan.framingNote
      ? `
      <div style="margin: 24px 0; padding: 16px; background: #fffbeb; border-left: 3px solid #d97706; border-radius: 4px;">
        <div style="font-size: 12px; color: #92400e; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">🔍 Framing Watch</div>
        <div style="font-size: 14px; color: #451a03;">${scan.framingNote}</div>
      </div>`
      : "";

  const blindspotHtml = blindspotItem
    ? `
      <div style="margin: 24px 0; padding: 16px; background: #fef2f2; border-left: 3px solid #dc2626; border-radius: 4px;">
        <div style="font-size: 12px; color: #991b1b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">🚨 Blindspot Alert</div>
        <div style="font-size: 14px; color: #450a0a;">${blindspotItem.headline}</div>
        <div style="font-size: 13px; color: #7f1d1d; margin-top: 6px;">Missing from: ${blindspotItem.blindspot?.missingFrom?.slice(0, 3).join(", ") || "multiple regions"}</div>
      </div>`
    : "";

  const patternHtml = scan.patternOfDay
    ? `
      <div style="margin: 24px 0; padding: 16px; background: #f5f3ff; border-left: 3px solid #7c3aed; border-radius: 4px;">
        <div style="font-size: 12px; color: #5b21b6; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">📊 Pattern of the Day</div>
        <div style="font-size: 15px; color: #3b0764; font-weight: 600;">${scan.patternOfDay.title}</div>
        <div style="font-size: 14px; color: #4c1d95; margin-top: 6px;">${scan.patternOfDay.body}</div>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="padding: 32px 24px 24px; border-bottom: 1px solid #f0f0f0;">
        <div style="font-size: 12px; color: #d97706; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Albis Daily</div>
        <div style="font-size: 22px; color: #1a1a1a; font-weight: 700;">${scan.displayDate}</div>
        ${scan.mood ? `<div style="font-size: 14px; color: #666; margin-top: 8px;">Mood: ${scan.mood}</div>` : ""}
      </div>

      <!-- Stories -->
      <div style="padding: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          ${storiesHtml}
        </table>
      </div>

      ${framingHtml}
      ${blindspotHtml}
      ${patternHtml}

      <!-- Footer -->
      <div style="padding: 24px; background: #f9fafb; text-align: center; border-top: 1px solid #f0f0f0;">
        <a href="${SITE_URL}" style="display: inline-block; padding: 10px 24px; background: #d97706; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">Read Full Analysis</a>
        <div style="margin-top: 16px; font-size: 12px; color: #999;">
          <a href="${SITE_URL}/api/unsubscribe?email={{EMAIL}}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
