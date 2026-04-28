// ---------------------------------------------------------------------------
// Evidence decision logic — Package 8A.
//
// Combines source grade, article grade, sludge score, and context flags
// to produce the final EvidenceAction for each article. Also produces
// a QualityAuditTrace for debug/dry-run output.
//
// This is Layer 1 of the Package 8 funnel: decide per-article before
// clustering, relevance, or generation.
// ---------------------------------------------------------------------------
import type {
  QualityGrade,
  EvidenceAction,
  SourceType,
  HardBlockReason,
  QualityAuditTrace,
  RawArticleInput,
  AuthorType,
} from "./types";
import {
  scoreSource,
  type SourceScoringInput,
  type SourceScoreResult,
} from "./source-quality";
import {
  scoreArticle,
  type ArticleScoringInput,
  type ArticleScoreResult,
} from "./article-quality";
import {
  computeSeoSludgeScore,
  type SludgeScoringInput,
  type SludgeScoreResult,
} from "./seo-sludge";

// ---------------------------------------------------------------------------
// Combined decision
// ---------------------------------------------------------------------------

export interface EvidenceDecisionInput {
  sourceGrade: QualityGrade;
  sourceType: SourceType;
  articleGrade: QualityGrade;
  sludgeScore: number;
  hardBlockReasons: HardBlockReason[];
  hasExtractableEvent: boolean;
  isSensitive: boolean;
  // Corroboration context (from cluster — V1 defaults to false/0)
  corroborationCountAB: number;
  clusterHasABAnchor: boolean;
  uniqueRegionalDetail: boolean;
}

/**
 * Decide the evidence action based on combined signals.
 * Implements the decision table from the Package 8 spec.
 */
export function decideEvidenceAction(input: EvidenceDecisionInput): {
  action: EvidenceAction;
  reasons: string[];
  attribution_required: boolean;
} {
  const reasons: string[] = [];

  // Hard blocks always win
  if (input.hardBlockReasons.length > 0) {
    reasons.push(`hard block: ${input.hardBlockReasons.join(", ")}`);
    return { action: "block", reasons, attribution_required: false };
  }

  // Source or article Block grade
  if (input.sourceGrade === "Block" || input.articleGrade === "Block") {
    reasons.push(`grade block: source=${input.sourceGrade}, article=${input.articleGrade}`);
    return { action: "block", reasons, attribution_required: false };
  }

  // Sludge >= 80: block unless official/primary source → review_required
  if (input.sludgeScore >= 80) {
    const isOfficial = ["official", "regulator", "government", "court"].includes(input.sourceType);
    if (isOfficial && input.sourceGrade === "A") {
      reasons.push(`sludge=${input.sludgeScore} but official A-source → review_required`);
      return { action: "review_required", reasons, attribution_required: true };
    }
    reasons.push(`sludge=${input.sludgeScore} → block`);
    return { action: "block", reasons, attribution_required: false };
  }

  // Sludge >= 60: dashboard_only (unless official primary page flagged for review)
  if (input.sludgeScore >= 60) {
    const isOfficial = ["official", "regulator", "government", "court"].includes(input.sourceType);
    if (isOfficial && input.sourceGrade === "A") {
      reasons.push(`sludge=${input.sludgeScore} but official A-source → review_required`);
      return { action: "review_required", reasons, attribution_required: true };
    }
    reasons.push(`sludge=${input.sludgeScore} → dashboard_only`);
    return { action: "dashboard_only", reasons, attribution_required: false };
  }

  // No extractable event
  if (!input.hasExtractableEvent && input.articleGrade !== "A" && input.articleGrade !== "B") {
    reasons.push("no extractable event → exclude");
    return { action: "exclude", reasons, attribution_required: false };
  }

  // Sensitive claim without strong corroboration
  // Spec: requires one A anchor, OR two independent B sources, OR one official primary source
  const isOfficialPrimarySource = ["official", "regulator", "government", "court"].includes(input.sourceType);
  if (input.isSensitive && input.sourceGrade !== "A" && !isOfficialPrimarySource && input.corroborationCountAB < 1) {
    reasons.push("sensitive claim without A anchor, official primary, or AB corroboration → dashboard_only");
    return { action: "dashboard_only", reasons, attribution_required: true };
  }

  // Source D: watchlist only
  if (input.sourceGrade === "D") {
    reasons.push("source grade D → watchlist_only");
    return { action: "watchlist_only", reasons, attribution_required: false };
  }

  // Article D: watchlist only
  if (input.articleGrade === "D") {
    reasons.push("article grade D → watchlist_only");
    return { action: "watchlist_only", reasons, attribution_required: false };
  }

  // --- Email eligibility ---

  // Source A + Article A/B: email_anchor
  if (input.sourceGrade === "A" && (input.articleGrade === "A" || input.articleGrade === "B")) {
    reasons.push(`source A + article ${input.articleGrade} → email_anchor`);
    const attrRequired = input.isSensitive;
    return { action: "email_anchor", reasons, attribution_required: attrRequired };
  }

  // Source A + Article C: email_support or dashboard_only
  if (input.sourceGrade === "A" && input.articleGrade === "C") {
    reasons.push("source A + article C → email_support");
    return { action: "email_support", reasons, attribution_required: true };
  }

  // Source B + Article A/B + corroboration: email_anchor or email_support
  if (input.sourceGrade === "B" && (input.articleGrade === "A" || input.articleGrade === "B")) {
    if (input.corroborationCountAB >= 1) {
      reasons.push(`source B + article ${input.articleGrade} + AB corroboration → email_anchor`);
      return { action: "email_anchor", reasons, attribution_required: true };
    }
    reasons.push(`source B + article ${input.articleGrade} → email_support`);
    return { action: "email_support", reasons, attribution_required: true };
  }

  // Source B + Article C: email_support if cluster has AB anchor, else dashboard
  if (input.sourceGrade === "B" && input.articleGrade === "C") {
    if (input.clusterHasABAnchor) {
      reasons.push("source B + article C + AB cluster anchor → email_support");
      return { action: "email_support", reasons, attribution_required: true };
    }
    reasons.push("source B + article C → dashboard_only");
    return { action: "dashboard_only", reasons, attribution_required: false };
  }

  // Source C + cluster has AB anchor + unique regional detail: email_support
  if (input.sourceGrade === "C" && input.clusterHasABAnchor && input.uniqueRegionalDetail) {
    reasons.push("source C + AB cluster anchor + unique regional detail → email_support");
    return { action: "email_support", reasons, attribution_required: true };
  }

  // Source C: dashboard_only
  if (input.sourceGrade === "C") {
    reasons.push("source C → dashboard_only");
    return { action: "dashboard_only", reasons, attribution_required: false };
  }

  // Fallback
  reasons.push("no email eligibility met → exclude");
  return { action: "exclude", reasons, attribution_required: false };
}

// ---------------------------------------------------------------------------
// Full article quality pipeline — convenience function that runs all three
// scorers and the decision logic, returning a complete audit trace.
// ---------------------------------------------------------------------------

export interface ScoreArticleEvidenceOptions {
  // Cluster context (V1: default empty/false)
  corroboration_count_ab?: number;
  cluster_has_ab_anchor?: boolean;
  unique_regional_detail?: boolean;
  // Regional context
  is_local_to_event?: boolean;
  local_language_source?: boolean;
  quotes_local_actors?: boolean;
  // Source type hint when caller knows the source type
  source_type_hint?: SourceType;
}

export interface ScoreArticleEvidenceResult {
  source: SourceScoreResult;
  article: ArticleScoreResult;
  sludge: SludgeScoreResult;
  evidence_action: EvidenceAction;
  evidence_action_reasons: string[];
  attribution_required: boolean;
  audit_trace: QualityAuditTrace;
}

/**
 * Run the full 8A quality funnel on a single raw article.
 * Returns source score, article score, sludge score, evidence action,
 * and a complete audit trace.
 */
export function scoreArticleEvidence(
  raw: RawArticleInput,
  options: ScoreArticleEvidenceOptions = {}
): ScoreArticleEvidenceResult {
  const domain = extractDomain(raw.domain || raw.raw_url);
  const title = raw.title || "";
  const body = raw.extracted_text || raw.description || "";
  const authorType = inferAuthorType(raw.author_raw);
  const hasTimestamp = Boolean(raw.published_at);

  // Infer source type: use hint if provided, otherwise detect from local context
  const sourceTypeHint = options.source_type_hint ??
    (options.is_local_to_event ? "local_outlet" as SourceType : undefined);

  // 1. Score source
  const sourceInput: SourceScoringInput = {
    domain,
    source_name: raw.source_name,
    source_type: sourceTypeHint,
    has_author: authorType !== "none" && authorType !== "unknown",
    has_timestamp: hasTimestamp,
    is_local_to_event: options.is_local_to_event,
    local_language_source: options.local_language_source,
    quotes_local_actors: options.quotes_local_actors,
  };
  const sourceResult = scoreSource(sourceInput);

  // 2. Score article
  const articleInput: ArticleScoringInput = {
    title,
    body,
    domain,
    author_type: authorType,
    has_reliable_timestamp: hasTimestamp,
    published_at: raw.published_at,
    has_canonical_attribution: Boolean(raw.canonical_url),
    is_syndicated: false, // V1: no syndication detection yet
  };
  const articleResult = scoreArticle(articleInput);

  // 3. SEO sludge
  const sludgeInput: SludgeScoringInput = {
    title,
    body,
    domain,
    author_type: authorType,
    has_reliable_timestamp: hasTimestamp,
    has_original_facts: articleResult.has_extractable_event || articleResult.has_primary_evidence,
    published_at: raw.published_at,
  };
  const sludgeResult = computeSeoSludgeScore(sludgeInput);

  // 4. Combine hard blocks
  const allHardBlocks = [
    ...sourceResult.hard_block_reasons,
    ...articleResult.hard_block_reasons,
    ...sludgeResult.hard_block_reasons,
  ];

  // 5. Decide evidence action
  const isSensitive = articleResult.sensitivity_flags.length > 0;
  const decision = decideEvidenceAction({
    sourceGrade: sourceResult.source_quality_grade,
    sourceType: sourceResult.source_type,
    articleGrade: articleResult.article_quality_grade,
    sludgeScore: sludgeResult.seo_sludge_score,
    hardBlockReasons: allHardBlocks,
    hasExtractableEvent: articleResult.has_extractable_event,
    isSensitive,
    corroborationCountAB: options.corroboration_count_ab ?? 0,
    clusterHasABAnchor: options.cluster_has_ab_anchor ?? false,
    uniqueRegionalDetail: options.unique_regional_detail ?? false,
  });

  // 6. Build audit trace
  const auditTrace: QualityAuditTrace = {
    raw_url: raw.raw_url,
    domain,
    source_grade: sourceResult.source_quality_grade,
    source_score: sourceResult.source_quality_score,
    source_reasons: sourceResult.source_quality_reasons,
    article_grade: articleResult.article_quality_grade,
    article_score: articleResult.article_quality_score,
    article_reasons: articleResult.article_quality_reasons,
    sludge_score: sludgeResult.seo_sludge_score,
    sludge_signals: sludgeResult.seo_sludge_signals,
    sludge_action: sludgeResult.sludge_action,
    evidence_action: decision.action,
    evidence_action_reasons: decision.reasons,
    hard_block_reasons: allHardBlocks,
  };

  return {
    source: sourceResult,
    article: articleResult,
    sludge: sludgeResult,
    evidence_action: decision.action,
    evidence_action_reasons: decision.reasons,
    attribution_required: decision.attribution_required,
    audit_trace: auditTrace,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractDomain(urlOrDomain: string | null | undefined): string {
  if (!urlOrDomain) return "unknown";
  try {
    if (urlOrDomain.includes("://")) {
      return new URL(urlOrDomain).hostname.replace(/^www\./, "");
    }
    return urlOrDomain.replace(/^www\./, "").toLowerCase();
  } catch {
    return urlOrDomain.replace(/^www\./, "").toLowerCase();
  }
}

function inferAuthorType(authorRaw: string | null | undefined): AuthorType {
  if (!authorRaw || authorRaw.trim() === "") return "none";
  const lower = authorRaw.toLowerCase().trim();
  if (lower === "ap" || lower === "reuters" || lower === "afp" || lower.includes("wire")) return "wire";
  if (lower.includes("staff") || lower.includes("editorial") || lower.includes("newsroom")) return "staff";
  if (lower.includes("office of") || lower.includes("department of") || lower.includes("ministry")) return "official";
  // Likely a named person if it has spaces and looks like a name
  if (/^[a-z\u00C0-\u024F]+ [a-z\u00C0-\u024F]+/i.test(lower)) return "named";
  return "unknown";
}

// ---------------------------------------------------------------------------
// Debug formatter — produces human-readable audit output for dry-run
// ---------------------------------------------------------------------------

export function formatAuditTrace(trace: QualityAuditTrace): string {
  const lines: string[] = [
    `URL:      ${trace.raw_url}`,
    `Domain:   ${trace.domain || "unknown"}`,
    `Source:   grade=${trace.source_grade}  score=${trace.source_score}`,
    `Article:  grade=${trace.article_grade}  score=${trace.article_score}`,
    `Sludge:   score=${trace.sludge_score}  action=${trace.sludge_action}`,
    `Evidence: action=${trace.evidence_action}`,
  ];

  if (trace.hard_block_reasons.length > 0) {
    lines.push(`BLOCKED:  ${trace.hard_block_reasons.join(", ")}`);
  }

  if (trace.sludge_signals.length > 0) {
    lines.push(`Sludge signals: ${trace.sludge_signals.join(", ")}`);
  }

  lines.push(`Reasons:  ${trace.evidence_action_reasons.join("; ")}`);

  return lines.join("\n");
}

/**
 * Format a batch of audit traces into a readable report.
 */
export function formatAuditReport(traces: QualityAuditTrace[]): string {
  const header = [
    `=== Package 8A Quality Audit Report ===`,
    `Date: ${new Date().toISOString()}`,
    `Articles scored: ${traces.length}`,
    ``,
  ];

  // Summary counts
  const actionCounts: Record<string, number> = {};
  const gradeCounts: Record<string, number> = {};
  for (const t of traces) {
    actionCounts[t.evidence_action] = (actionCounts[t.evidence_action] || 0) + 1;
    gradeCounts[`src:${t.source_grade}`] = (gradeCounts[`src:${t.source_grade}`] || 0) + 1;
    gradeCounts[`art:${t.article_grade}`] = (gradeCounts[`art:${t.article_grade}`] || 0) + 1;
  }

  header.push("--- Action summary ---");
  for (const [action, count] of Object.entries(actionCounts).sort()) {
    header.push(`  ${action}: ${count}`);
  }
  header.push("");
  header.push("--- Grade summary ---");
  for (const [grade, count] of Object.entries(gradeCounts).sort()) {
    header.push(`  ${grade}: ${count}`);
  }
  header.push("");
  header.push("--- Per-article details ---");
  header.push("");

  const details = traces.map((t, i) =>
    `[${i + 1}] ${formatAuditTrace(t)}`
  ).join("\n\n");

  return header.join("\n") + details;
}
