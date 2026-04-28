// ---------------------------------------------------------------------------
// Signal resolver — Package 5.
//
// Re-resolves a Signal's raw entities / themes / regions arrays into
// canonical_topic_ids, mirroring Package 4's resolveValue lookup behavior
// (case-insensitive alias hit, then canonical_label hit, skip ambiguous).
// Unlike Package 4's profile resolver, this NEVER creates new canonicals
// — signals don't author new registry entries.
//
// The deterministic parser already populates canonical_*_ids during
// extraction. The resolver exists for two cases:
//   1. signals that arrive with raw arrays but no canonical ids (e.g.
//      LLM-extracted in pkg 8, or external retrieval providers that
//      return tagged articles)
//   2. re-running canonical resolution after the registry has grown,
//      without needing to re-parse the whole signal
// ---------------------------------------------------------------------------
import type { CanonicalAliasIndex } from "./canonical-alias-index";
import type { Signal, SignalDraft } from "./types";

type SignalLike = Signal | SignalDraft;

function resolveOne(raw: string, index: CanonicalAliasIndex): string | null {
  const lower = raw.trim().toLowerCase();
  if (!lower) return null;
  return index.termToId.get(lower) || null;
}

/**
 * Populate canonical_*_ids on a signal-shaped object from its raw
 * entities / themes / regions arrays. Preserves the raw arrays. Skips
 * raw values that don't resolve, or that are ambiguous (multiple distinct
 * canonicals share the same alias text — those are not in the index).
 *
 * Returns a new object; does not mutate the input.
 */
export function resolveSignalToCanonicals<T extends SignalLike>(
  signal: T,
  index: CanonicalAliasIndex
): T {
  const resolveArray = (raws: string[]): string[] => {
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const r of raws) {
      const id = resolveOne(r, index);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
    return ids;
  };

  return {
    ...signal,
    canonical_entity_ids: resolveArray(signal.entities),
    canonical_theme_ids: resolveArray(signal.themes),
    canonical_region_ids: resolveArray(signal.regions),
  };
}
