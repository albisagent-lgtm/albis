import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScanItemInput } from "./relevance-engine";
import { loadVerifiedScanItems } from "./pipeline-db";

/**
 * Deterministic DB-truth-first scan loader.
 *
 * Contract:
 * - only returns items for the requested date
 * - requires a scans row with non-empty JSONB items
 * - requires mirrored scan_items rows to exist as verification
 * - never falls back to a neighbouring date
 */
export async function loadScanItems(
  supabase: SupabaseClient,
  scanDate: string
): Promise<ScanItemInput[]> {
  return loadVerifiedScanItems(supabase, scanDate);
}
