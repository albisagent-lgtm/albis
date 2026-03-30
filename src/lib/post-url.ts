/* ─── Category → URL segment mapping ───
 * This file is safe to import from client components (no fs/path deps).
 */

const CATEGORY_TO_SECTION: Record<string, string> = {
  "current-events": "world",
  "geopolitics": "world",
  "conflict": "world",
  "governance": "politics",
  "economic-flows": "business",
  "tech-ai": "technology",
  "cyber-info-warfare": "technology",
  "health": "health",
  "science-space": "science",
  "weather-climate": "science",
  "natural-world": "science",
  "climate-energy": "science",
  "perception-gap-index": "analysis",
  "analysis": "analysis",
  "information-warfare": "analysis",
  "media-literacy": "analysis",
  "weekly-report": "analysis",
  "framing-guide": "analysis",
  "explainer": "analysis",
  "comparison": "analysis",
  "perspectives": "analysis",
  "data": "analysis",
  "breaking": "analysis",
  "research": "analysis",
};

export function getPostSection(category: string): string {
  return CATEGORY_TO_SECTION[category] || "analysis";
}

export function getPostUrl(post: { slug: string; category: string }): string {
  return `/${getPostSection(post.category)}/${post.slug}`;
}
