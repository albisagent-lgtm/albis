// ---------------------------------------------------------------------------
// Canonical alias index — preloaded once per scan, used by the parser to
// extract entities / themes / regions from article text without N round
// trips to Supabase per article. Companion to canonical-index.ts (which is
// scoped per-profile). This index is global across all canonicals.
// ---------------------------------------------------------------------------
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CanonicalTopicType } from "../canonical-resolver";

export interface CanonicalAliasIndexEntry {
  canonical_topic_id: string;
  canonical_label: string;
  topic_type: CanonicalTopicType;
  /** Lowercased alias surface (canonical label + aliases), deduped. */
  terms: string[];
}

export interface CanonicalAliasIndex {
  /** All entries keyed by canonical_topic_id for direct lookup. */
  byId: Map<string, CanonicalAliasIndexEntry>;
  /**
   * Lowercased term → canonical_topic_id. Multiple terms can share the
   * same canonical id, but a single term should resolve to a single id;
   * if it doesn't (ambiguity), we don't index it — extraction skips it.
   */
  termToId: Map<string, string>;
  /** Entries grouped by topic_type for type-scoped extraction. */
  byType: Map<CanonicalTopicType, CanonicalAliasIndexEntry[]>;
}

interface TopicRow {
  id: string;
  canonical_label: string;
  topic_type: CanonicalTopicType;
}
interface AliasRow {
  canonical_topic_id: string;
  alias: string;
}

/**
 * Build the global canonical alias index. Cheap at v1 scale (a few
 * hundred canonicals). Re-call per scan run; do not cache across runs.
 */
export async function loadCanonicalAliasIndex(
  supabase: SupabaseClient
): Promise<CanonicalAliasIndex> {
  const [{ data: topics }, { data: aliases }] = await Promise.all([
    supabase
      .from("canonical_topics")
      .select("id, canonical_label, topic_type")
      .eq("is_active", true),
    supabase.from("canonical_topic_aliases").select("canonical_topic_id, alias"),
  ]);

  const aliasesById = new Map<string, string[]>();
  for (const a of (aliases || []) as AliasRow[]) {
    const list = aliasesById.get(a.canonical_topic_id) || [];
    list.push(a.alias);
    aliasesById.set(a.canonical_topic_id, list);
  }

  const byId = new Map<string, CanonicalAliasIndexEntry>();
  const termToIdsRaw = new Map<string, Set<string>>();
  const byType = new Map<CanonicalTopicType, CanonicalAliasIndexEntry[]>();

  for (const t of (topics || []) as TopicRow[]) {
    const aliasList = aliasesById.get(t.id) || [];
    const terms = [t.canonical_label, ...aliasList]
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0);
    const deduped = [...new Set(terms)];
    const entry: CanonicalAliasIndexEntry = {
      canonical_topic_id: t.id,
      canonical_label: t.canonical_label,
      topic_type: t.topic_type,
      terms: deduped,
    };
    byId.set(t.id, entry);
    const bucket = byType.get(t.topic_type) || [];
    bucket.push(entry);
    byType.set(t.topic_type, bucket);
    for (const term of deduped) {
      const set = termToIdsRaw.get(term) || new Set<string>();
      set.add(t.id);
      termToIdsRaw.set(term, set);
    }
  }

  // Drop ambiguous terms (one alias text → multiple canonicals). The
  // resolver path also skips ambiguous values (Package 4 behavior); we
  // mirror that here so extraction never silently picks one.
  const termToId = new Map<string, string>();
  for (const [term, ids] of termToIdsRaw) {
    if (ids.size === 1) termToId.set(term, [...ids][0]);
  }

  return { byId, termToId, byType };
}
