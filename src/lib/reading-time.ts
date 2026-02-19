/**
 * Estimates reading time based on average 200 words per minute.
 * Returns a human-readable string like '2 min read'.
 */
export function estimateReadingTime(text: string): string {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(wordCount / 200));
  return `${minutes} min read`;
}

/**
 * Estimates reading time in minutes from a ScanItem's content.
 */
export function estimateItemReadingTime(headline: string, connection?: string): string {
  const combined = [headline, connection || ""].join(" ");
  return estimateReadingTime(combined);
}
