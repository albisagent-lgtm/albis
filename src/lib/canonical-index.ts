// ---------------------------------------------------------------------------
// Canonical index loader — Package 4.
//
// Resolves a company profile's raw tracked-item strings to the canonical
// topic / alias registry, returning a per-source-field map the relevance
// engine can use for alias-aware matching. Profiles whose values aren't
// mapped to canonicals yet (mid-rollout) simply have empty entries — the
// engine then falls back to its existing raw-string matching path.
//
// Kept in a separate file from relevance-engine.ts so the scoring engine
// stays free of Supabase dependencies (still pure / testable).
// ---------------------------------------------------------------------------
import type { SupabaseClient } from "@supabase/supabase-js";

export type CanonicalSourceField =
  | "tracked_themes"
  | "watchlist_entities"
  | "regions"
  | "sectors"
  | "risk_priorities"
  | "supply_chain_exposure";

export interface CanonicalEntry {
  canonical_topic_id: string;
  canonical_label: string;
  /**
   * Lowercased term set the engine matches against — includes the canonical
   * label plus every alias. Always non-empty.
   */
  terms: string[];
}

export type CanonicalIndex = Record<
  CanonicalSourceField,
  Map<string, CanonicalEntry>
>;

export function emptyCanonicalIndex(): CanonicalIndex {
  return {
    tracked_themes: new Map(),
    watchlist_entities: new Map(),
    regions: new Map(),
    sectors: new Map(),
    risk_priorities: new Map(),
    supply_chain_exposure: new Map(),
  };
}

interface MappingRow {
  source_field: CanonicalSourceField;
  source_value: string;
  canonical_topic_id: string;
}

interface CanonicalRow {
  id: string;
  canonical_label: string;
}

interface AliasRow {
  canonical_topic_id: string;
  alias: string;
}

/**
 * Build an index of source_value → canonical entry for one company profile.
 * Returns an empty index if the profile has no mappings yet — the engine
 * then falls back to raw-string matching for every field.
 */
export async function loadCanonicalIndexForProfile(
  supabase: SupabaseClient,
  companyProfileId: string
): Promise<CanonicalIndex> {
  const index = emptyCanonicalIndex();

  const { data: mappings, error: mappingErr } = await supabase
    .from("company_canonical_mappings")
    .select("source_field, source_value, canonical_topic_id")
    .eq("company_profile_id", companyProfileId);
  if (mappingErr) throw new Error(`canonical mappings load failed: ${mappingErr.message}`);
  if (!mappings || mappings.length === 0) return index;

  const canonicalIds = [
    ...new Set((mappings as MappingRow[]).map((m) => m.canonical_topic_id)),
  ];

  const [{ data: topics }, { data: aliases }] = await Promise.all([
    supabase
      .from("canonical_topics")
      .select("id, canonical_label")
      .in("id", canonicalIds)
      .eq("is_active", true),
    supabase
      .from("canonical_topic_aliases")
      .select("canonical_topic_id, alias")
      .in("canonical_topic_id", canonicalIds),
  ]);

  const labelById = new Map<string, string>();
  for (const t of (topics || []) as CanonicalRow[]) {
    labelById.set(t.id, t.canonical_label);
  }

  const aliasesById = new Map<string, string[]>();
  for (const a of (aliases || []) as AliasRow[]) {
    const list = aliasesById.get(a.canonical_topic_id) || [];
    list.push(a.alias);
    aliasesById.set(a.canonical_topic_id, list);
  }

  for (const m of mappings as MappingRow[]) {
    const label = labelById.get(m.canonical_topic_id);
    if (!label) continue;
    const aliasList = aliasesById.get(m.canonical_topic_id) || [];
    const terms = [
      label,
      m.source_value,
      ...aliasList,
    ]
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0);
    const dedupedTerms = [...new Set(terms)];

    const bucket = index[m.source_field];
    if (!bucket) continue;
    bucket.set(m.source_value.toLowerCase(), {
      canonical_topic_id: m.canonical_topic_id,
      canonical_label: label,
      terms: dedupedTerms,
    });
  }

  return index;
}
