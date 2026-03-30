/* ─── Category → URL segment mapping ───
 * This file is safe to import from client components (no fs/path deps).
 */

const CATEGORY_TO_SECTION: Record<string, string> = {
  "current-events": "world",
  "geopolitics": "world",
  "conflict": "world",
  "governance": "world",
  "health": "world",
  "breaking": "world",
  "economic-flows": "money",
  "markets": "money",
  "tech-ai": "tech",
  "cyber-info-warfare": "tech",
  "climate-energy": "climate",
  "weather-climate": "climate",
  "natural-world": "climate",
  "science-space": "climate",
  "energy": "life-systems",
  "food": "life-systems",
  "water": "life-systems",
  "life-systems": "life-systems",
  "perception-gap-index": "perspectives",
  "media-literacy": "perspectives",
  "information-warfare": "perspectives",
  "perspectives": "perspectives",
  "analysis": "perspectives",
  "data": "perspectives",
  "explainer": "perspectives",
  "comparison": "perspectives",
  "framing-guide": "perspectives",
  "weekly-report": "perspectives",
  "research": "perspectives",
};

export function getPostSection(category: string): string {
  return CATEGORY_TO_SECTION[category] || "perspectives";
}

export function getPostUrl(post: { slug: string; category: string }): string {
  return `/${getPostSection(post.category)}/${post.slug}`;
}
