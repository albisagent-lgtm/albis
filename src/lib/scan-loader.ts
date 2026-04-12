// ---------------------------------------------------------------------------
// Scan item loader — shared helper for loading scan items from Supabase
// Handles both the JSONB `items` column on `scans` and the normalised
// `scan_items` table as a fallback (matching scan-parser.ts behaviour).
// ---------------------------------------------------------------------------

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScanItemInput } from "./relevance-engine";

/**
 * Normalise category keys: scan_items uses underscores (current_events),
 * JSONB items use hyphens (current-events). Standardise to hyphens.
 */
function normaliseCategory(cat: string): string {
  return cat.replace(/_/g, "-");
}

/**
 * Normalise significance: scan_items stores free text like
 * "CRITICAL — IC testimony..." or "HIGH — Second simultaneous...".
 * Extract the level keyword and map to low/medium/high.
 */
function normaliseSignificance(sig: string): "high" | "medium" | "low" {
  if (!sig) return "medium";
  const upper = sig.toUpperCase();
  if (upper.startsWith("CRITICAL") || upper.startsWith("HIGH")) return "high";
  if (upper.startsWith("LOW") || upper.startsWith("MINOR")) return "low";
  if (upper.startsWith("MEDIUM") || upper.startsWith("MODERATE")) return "medium";
  // If it's already a clean value
  if (sig === "high" || sig === "medium" || sig === "low") return sig;
  // Default for unrecognised free-text
  return "medium";
}

/**
 * Load scan items for a given date from Supabase.
 * First tries the JSONB `items` column on the `scans` table.
 * Falls back to the normalised `scan_items` table if JSONB is empty.
 */
export async function loadScanItems(
  supabase: SupabaseClient,
  scanDate: string
): Promise<ScanItemInput[]> {
  const allItems: ScanItemInput[] = [];

  // 1. Try JSONB items from scans table
  const { data: scans } = await supabase
    .from("scans")
    .select("id, items, scan_time")
    .eq("scan_date", scanDate);

  const scanIds: string[] = [];
  for (const scan of scans || []) {
    scanIds.push(scan.id);
    const items = scan.items;
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item?.headline && item?.category) {
          allItems.push({
            headline: item.headline,
            category: normaliseCategory(item.category),
            regions: Array.isArray(item.regions) ? item.regions : [],
            tags: Array.isArray(item.tags) ? item.tags : [],
            patterns: Array.isArray(item.patterns) ? item.patterns : [],
            significance: normaliseSignificance(item.significance || "medium"),
            connection: item.connection || "",
            perception_gap: item.perception_gap ?? null,
            coverage_breadth: item.coverage_breadth ?? null,
          });
        }
      }
    }
  }

  // Prefer rows that actually have items and normalised lowercase scan_time values,
  // but accept legacy uppercase variants too.
  // 2. Fallback: if JSONB items are empty, try scan_items table
  if (allItems.length === 0 && scanIds.length > 0) {
    const { data: itemRows } = await supabase
      .from("scan_items")
      .select("headline, category, regions, tags, patterns, significance, connection")
      .in("scan_id", scanIds);

    if (itemRows) {
      for (const item of itemRows) {
        if (item?.headline && item?.category) {
          allItems.push({
            headline: item.headline,
            category: normaliseCategory(item.category),
            regions: Array.isArray(item.regions) ? item.regions : [],
            tags: Array.isArray(item.tags) ? item.tags : [],
            patterns: Array.isArray(item.patterns) ? item.patterns : [],
            significance: normaliseSignificance(item.significance || "medium"),
            connection: item.connection || "",
            perception_gap: null,
            coverage_breadth: null,
          });
        }
      }
    }
  }

  // 3. If still empty, try finding scan_items for the nearest date
  // (scans row may exist with no items, but scan_items linked via scan_id)
  if (allItems.length === 0) {
    // Try getting any scan_items through a broader scan lookup
    const { data: nearbyScans } = await supabase
      .from("scans")
      .select("id, scan_date")
      .lte("scan_date", scanDate)
      .order("scan_date", { ascending: false })
      .limit(5);

    if (nearbyScans) {
      const ids = nearbyScans.map((s) => s.id);
      if (ids.length > 0) {
        const { data: itemRows } = await supabase
          .from("scan_items")
          .select("headline, category, regions, tags, patterns, significance, connection")
          .in("scan_id", ids);

        if (itemRows && itemRows.length > 0) {
          for (const item of itemRows) {
            if (item?.headline && item?.category) {
              allItems.push({
                headline: item.headline,
                category: normaliseCategory(item.category),
                regions: Array.isArray(item.regions) ? item.regions : [],
                tags: Array.isArray(item.tags) ? item.tags : [],
                patterns: Array.isArray(item.patterns) ? item.patterns : [],
                significance: normaliseSignificance(item.significance || "medium"),
                connection: item.connection || "",
                perception_gap: null,
                coverage_breadth: null,
              });
            }
          }
        }
      }
    }
  }

  // Deduplicate by headline
  const seen = new Set<string>();
  return allItems.filter((item) => {
    if (seen.has(item.headline)) return false;
    seen.add(item.headline);
    return true;
  });
}
