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
export { retrieveForTarget } from "./retrieval-brave";
export { runCompanyScan } from "./scan-engine";
export type { ScanRunSummary } from "./scan-engine";
export { buildUnionWatchGraph } from "./watch-graph-builder";
export type { WatchGraphSummary } from "./watch-graph-builder";

// Package 8A — Source quality, article quality, SEO sludge
export {
  scoreSource,
  gradeFromScore,
  buildSourceQualityRecord,
} from "./source-quality";
export type { SourceScoringInput, SourceScoreResult } from "./source-quality";
export { scoreArticle } from "./article-quality";
export type { ArticleScoringInput, ArticleScoreResult } from "./article-quality";
export { computeSeoSludgeScore } from "./seo-sludge";
export type { SludgeScoringInput, SludgeScoreResult } from "./seo-sludge";
export {
  decideEvidenceAction,
  scoreArticleEvidence,
  formatAuditTrace,
  formatAuditReport,
} from "./evidence-decision";
export type {
  EvidenceDecisionInput,
  ScoreArticleEvidenceOptions,
  ScoreArticleEvidenceResult,
} from "./evidence-decision";

// Package 8B — Article normalization, event clustering
export {
  normalizeArticle,
  normalizeArticleBatch,
  normalizeTitle,
  computePairwiseSimilarity,
  jaccardSimilarity,
  tokenize,
  computeFingerprint,
} from "./article-normalizer";
export type {
  NormalizationInput,
  NormalizationResult,
  PairwiseSimilarity,
} from "./article-normalizer";
export { clusterArticles } from "./event-clustering";
export type {
  ClusteringInput,
  ClusteringResult,
} from "./event-clustering";

// Package 8C — Company relevance, Perception Gap evidence
export {
  scoreCompanyRelevance,
  scoreClusterRelevance,
  matchSelectedScanAreas,
  detectWeakMatch,
  buildRelevanceDebugReport,
} from "./company-relevance";
export type { RelevancePipelineInput } from "./company-relevance";
export {
  evaluatePerceptionGap,
  evaluatePerceptionGapBatch,
} from "./perception-gap-evidence";
export type { PerceptionGapInput } from "./perception-gap-evidence";

// Package 8D — Evidence packet, briefing generation
export {
  buildEvidencePacket,
  PACKET_BUILD_VERSION,
} from "./briefing-evidence-packet";
export type { BuildEvidencePacketInput } from "./briefing-evidence-packet";
export {
  generateCompanyBriefing,
  GENERATOR_VERSION,
  PROMPT_TEMPLATE_VERSION,
} from "./company-briefing-generator";
export type {
  GenerateBriefingOptions,
  GenerateBriefingResult,
} from "./company-briefing-generator";

// Package 8E — QA gates and style lint
export {
  runQAGates,
} from "./company-briefing-qa";
export type {
  QAGateOptions,
  QAGateResult,
} from "./company-briefing-qa";
export {
  lintBriefingStyle,
} from "./company-briefing-style-lint";
export type {
  StyleLintIssue,
  StyleLintResult,
} from "./company-briefing-style-lint";
