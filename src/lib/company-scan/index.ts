// ---------------------------------------------------------------------------
// Company scan library — public surface.
// ---------------------------------------------------------------------------
export * from "./types";
export { loadCanonicalAliasIndex } from "./canonical-alias-index";
export type { CanonicalAliasIndex, CanonicalAliasIndexEntry } from "./canonical-alias-index";
export {
  parseSignalFromArticle,
  inferSignalType,
  buildSummary,
  extractCanonicalsFromText,
} from "./signal-parser";
export { resolveSignalToCanonicals } from "./signal-resolver";
export { retrieveForTarget } from "./retrieval-stub";
export { runCompanyScan } from "./scan-engine";
export type { ScanRunSummary } from "./scan-engine";
