// ---------------------------------------------------------------------------
// Scoring adapters — Package 5.
//
// The relevance engine (src/lib/relevance-engine.ts) scores items shaped
// as ScanItemInput. Public-side scan_items already arrive in that shape
// via pipeline-db loaders, so adaptScanItemToScoringInput is a pass-
// through; it exists for API symmetry. adaptSignalToScoringInput maps a
// typed Signal into the same shape so the same scorer can run against
// the new company-side pool without forking a parallel scorer.
//
// Limits worth knowing (Package 6 + Package 8 may revisit):
//   - signal.signal_type does not align with the public scan category
//     vocabulary (energy / tech-ai / etc), so sector_score is mostly 0
//     for signals. Theme/entity overlap carries the relevance instead.
//   - signal.regions is raw text. The engine's region matcher uses a
//     fixed scan-region → company-region map keyed on internal region
//     ids; raw region text from a signal won't match that map. Result:
//     geography_score is weak for signals at v1. Canonical alias
//     expansion on the company side provides partial coverage.
//   - signals carry numeric urgency / significance. The engine takes
//     a "significance" string and a "patterns" array. We bucket the
//     numeric values into the engine's vocabulary as a thin shim.
// ---------------------------------------------------------------------------
import type { ScanItemInput } from "./relevance-engine";
import type { Signal, SignalDraft } from "./company-scan/types";

/**
 * No-op shim for public-side scan items. Exists for symmetry with the
 * signal adapter so callers can write
 *   adaptScanItemToScoringInput(item)
 *   adaptSignalToScoringInput(signal)
 * without one path being a "raw" assignment and the other a function.
 */
export function adaptScanItemToScoringInput(item: ScanItemInput): ScanItemInput {
  return item;
}

function bucketSignificance(n: number): "high" | "medium" | "low" {
  if (n >= 0.7) return "high";
  if (n >= 0.4) return "medium";
  return "low";
}

function patternsFromUrgency(n: number): string[] {
  // The engine's urgencyBoost grants:
  //   significance=high → +0.5, escalation → +0.3, breaking → +0.2,
  //   framing → +0.1. We translate signal.urgency into the same
  //   vocabulary so the engine produces a comparable urgency_score.
  if (n >= 0.85) return ["escalation", "breaking"];
  if (n >= 0.7) return ["breaking"];
  if (n >= 0.55) return ["framing"];
  return [];
}

/**
 * Convert a Signal (or SignalDraft) into ScanItemInput so the existing
 * scoreStoriesForCompany engine can score it without modification.
 *
 * tags is built from the signal's raw entities + themes so the engine's
 * canonical-alias-aware fuzzy matchers (scoreEntities, scoreThemes,
 * scoreSupplyChain, scoreRisk) can hit company-side canonical mappings.
 */
export function adaptSignalToScoringInput(signal: Signal | SignalDraft): ScanItemInput {
  const tags = [...new Set([...signal.entities, ...signal.themes])];
  return {
    headline: signal.headline,
    category: signal.signal_type,
    regions: signal.regions,
    tags,
    patterns: patternsFromUrgency(signal.urgency),
    significance: bucketSignificance(signal.significance),
    connection: signal.summary,
    perception_gap: null,
    coverage_breadth: null,
  };
}
