import type { ParsedScan } from "../scan-types";
import { hasFramingWatch, hasBlindspot, CATEGORY_META, REGION_LABELS } from "../scan-types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://albis-app.vercel.app";

export function generateWeeklyReviewHtml(scans: ParsedScan[]): string {
  if (scans.length === 0) return "<p>No scans available for this week.</p>";

  const sorted = [...scans].sort((a, b) => a.date.localeCompare(b.date));
  const dateRange = `${sorted[0].displayDate} — ${sorted[sorted.length - 1].displayDate}`;

  // Aggregate stats
  const allItems = scans.flatMap((s) => s.items);
  const totalStories = allItems.length;
  const allRegions = new Set(allItems.flatMap((i) => i.regions));
  const blindspots = allItems.filter((i) => hasBlindspot(i));
  const framingItems = allItems.filter((i) => hasFramingWatch(i));

  // Top themes by category frequency
  const catCounts: Record<string, number> = {};
  for (const item of allItems) {
    catCounts[item.category] = (catCounts[item.category] || 0) + 1;
  }
  const topThemes = Object.entries(catCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([cat, count]) => ({
      label: CATEGORY_META[cat]?.label || cat,
      count,
    }));

  // Story of the week — biggest framing divergence (highest significance framing item)
  const storyOfWeek =
    framingItems.find((i) => i.significance === "high") ||
    framingItems[0] ||
    allItems.find((i) => i.significance === "high");

  // Consistent blindspot regions
  const blindspotRegionCounts: Record<string, number> = {};
  for (const item of blindspots) {
    for (const r of item.blindspot?.missingFrom || []) {
      blindspotRegionCounts[r] = (blindspotRegionCounts[r] || 0) + 1;
    }
  }
  const consistentBlindspots = Object.entries(blindspotRegionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([r]) => REGION_LABELS[r] || r);

  // Patterns across the week
  const patterns = scans
    .filter((s) => s.patternOfDay)
    .map((s) => `<li style="margin-bottom: 8px;"><strong>${s.date}:</strong> ${s.patternOfDay!.title}</li>`);

  const themesHtml = topThemes
    .map(
      (t) =>
        `<tr><td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #1a1a1a;">${t.label}</td><td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #888; text-align: right;">${t.count} stories</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="padding: 32px 24px 24px; border-bottom: 1px solid #f0f0f0;">
        <div style="font-size: 12px; color: #d97706; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Your Albis Weekly</div>
        <div style="font-size: 20px; color: #1a1a1a; font-weight: 700;">${dateRange}</div>
      </div>

      <!-- Stats Bar -->
      <div style="padding: 16px 24px; background: #fafafa; display: flex; border-bottom: 1px solid #f0f0f0;">
        <table style="width: 100%;"><tr>
          <td style="text-align: center; padding: 8px;">
            <div style="font-size: 24px; font-weight: 700; color: #1a1a1a;">${totalStories}</div>
            <div style="font-size: 11px; color: #888; text-transform: uppercase;">Stories</div>
          </td>
          <td style="text-align: center; padding: 8px;">
            <div style="font-size: 24px; font-weight: 700; color: #1a1a1a;">${allRegions.size}</div>
            <div style="font-size: 11px; color: #888; text-transform: uppercase;">Regions</div>
          </td>
          <td style="text-align: center; padding: 8px;">
            <div style="font-size: 24px; font-weight: 700; color: #dc2626;">${blindspots.length}</div>
            <div style="font-size: 11px; color: #888; text-transform: uppercase;">Blindspots</div>
          </td>
          <td style="text-align: center; padding: 8px;">
            <div style="font-size: 24px; font-weight: 700; color: #d97706;">${scans.length}</div>
            <div style="font-size: 11px; color: #888; text-transform: uppercase;">Days</div>
          </td>
        </tr></table>
      </div>

      <!-- Top Themes -->
      <div style="padding: 24px;">
        <div style="font-size: 12px; color: #d97706; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Top Themes This Week</div>
        <table style="width: 100%; border-collapse: collapse;">${themesHtml}</table>
      </div>

      ${storyOfWeek ? `
      <!-- Story of the Week -->
      <div style="margin: 0 24px 24px; padding: 16px; background: #fffbeb; border-left: 3px solid #d97706; border-radius: 4px;">
        <div style="font-size: 12px; color: #92400e; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">📰 Story of the Week</div>
        <div style="font-size: 15px; color: #451a03; font-weight: 600;">${storyOfWeek.headline}</div>
        ${storyOfWeek.connection ? `<div style="font-size: 13px; color: #78350f; margin-top: 6px;">${storyOfWeek.connection}</div>` : ""}
      </div>` : ""}

      ${consistentBlindspots.length > 0 ? `
      <!-- Blindspot Report -->
      <div style="margin: 0 24px 24px; padding: 16px; background: #fef2f2; border-left: 3px solid #dc2626; border-radius: 4px;">
        <div style="font-size: 12px; color: #991b1b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">🚨 Blindspot Report</div>
        <div style="font-size: 14px; color: #450a0a;">Consistently underrepresented: <strong>${consistentBlindspots.join(", ")}</strong></div>
        <div style="font-size: 13px; color: #7f1d1d; margin-top: 6px;">${blindspots.length} stories flagged as blindspots this week</div>
      </div>` : ""}

      ${patterns.length > 0 ? `
      <!-- Pattern Evolution -->
      <div style="padding: 0 24px 24px;">
        <div style="font-size: 12px; color: #7c3aed; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">📊 Pattern Evolution</div>
        <ul style="padding-left: 16px; margin: 0; color: #4c1d95; font-size: 14px;">
          ${patterns.join("")}
        </ul>
      </div>` : ""}

      <!-- Footer -->
      <div style="padding: 24px; background: #f9fafb; text-align: center; border-top: 1px solid #f0f0f0;">
        <a href="${SITE_URL}" style="display: inline-block; padding: 10px 24px; background: #d97706; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">Explore Full Archive</a>
        <div style="margin-top: 16px; font-size: 12px; color: #999;">
          <a href="${SITE_URL}/api/unsubscribe?email={{EMAIL}}" style="color: #999; text-decoration: underline;">Unsubscribe</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
