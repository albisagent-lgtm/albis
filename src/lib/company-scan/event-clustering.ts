// ---------------------------------------------------------------------------
// Event clustering — Package 8B.
//
// Groups NormalizedArticle records into EventClusters. The cluster — not
// the article — becomes the briefing unit for downstream layers (8C–8E).
//
// Pipeline:
//   1. Exact URL dedupe
//   2. Syndication/wire clone detection
//   3. Pairwise similarity scoring (title, entity, time, place, action)
//   4. Greedy merge into clusters
//   5. Cluster validation + confidence scoring
//   6. Canonical event naming
//   7. Email-eligibility check
//
// This layer does NOT decide company relevance (that's 8C).
// ---------------------------------------------------------------------------

import type {
  NormalizedArticle,
  EventCluster,
  EventTuple,
  ClusterFact,
  ClusterConflict,
  ClusterFrame,
  ClusterFreshness,
  EventStatus,
  ConfidenceLabel,
  QualityGrade,
  SourceType,
  FrameLabel,
  NormalizationClusteringReport,
  NormalizedEntity,
} from "./types";
import {
  computePairwiseSimilarity,
  type PairwiseSimilarity,
  jaccardSimilarity,
} from "./article-normalizer";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Minimum weighted score to merge two articles into the same event cluster. */
const MERGE_THRESHOLD = 0.68;

/** Score above which merge is high-confidence. */
const HIGH_CONFIDENCE_MERGE = 0.86;

/** Cluster confidence thresholds for labels. */
const CONFIDENCE_HIGH = 0.80;
const CONFIDENCE_MEDIUM = 0.60;
const CONFIDENCE_LOW = 0.40;

/** Minimum cluster confidence for email eligibility. */
const EMAIL_CONFIDENCE_THRESHOLD = 0.70;

// Source quality grade → numeric score for confidence calculation
const GRADE_SCORES: Record<QualityGrade, number> = {
  A: 1.0,
  B: 0.8,
  C: 0.45,
  D: 0.2,
  Block: 0,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ClusteringInput {
  articles: NormalizedArticle[];
  ingest_run_id: string;
}

export interface ClusteringResult {
  clusters: EventCluster[];
  report: NormalizationClusteringReport;
}

/**
 * Cluster normalized articles into event clusters.
 *
 * Steps:
 * 1. Dedupe by canonical URL
 * 2. Detect syndicated copies
 * 3. Compute pairwise similarity for candidate pairs
 * 4. Greedy agglomerative clustering
 * 5. Build full EventCluster records
 */
export function clusterArticles(input: ClusteringInput): ClusteringResult {
  const { articles, ingest_run_id } = input;
  const now = new Date().toISOString();

  if (articles.length === 0) {
    return {
      clusters: [],
      report: buildEmptyReport(ingest_run_id, now),
    };
  }

  // --- Step 1: Dedupe by canonical URL ---
  const { unique, duplicateMap } = dedupeByUrl(articles);

  // --- Step 2: Detect syndicated copies ---
  const syndicatedPairs = detectSyndicatedPairs(unique);

  // --- Step 3: Compute pairwise similarities for candidate pairs ---
  const similarities = computeCandidateSimilarities(unique);

  // --- Step 4: Greedy agglomerative merge ---
  const articleGroups = greedyCluster(unique, similarities, syndicatedPairs, duplicateMap);

  // --- Step 5: Build EventCluster records ---
  const clusters: EventCluster[] = [];
  const duplicatePairsForReport: NormalizationClusteringReport["duplicate_pairs"] = [];

  for (const group of articleGroups) {
    const cluster = buildEventCluster(group, ingest_run_id, now, duplicateMap, syndicatedPairs);
    clusters.push(cluster);
  }

  // Collect duplicate pairs for report
  for (const [canonical, dupes] of duplicateMap.entries) {
    for (const dupe of dupes) {
      duplicatePairsForReport.push({
        article_a: canonical,
        article_b: dupe.article_id,
        reason: "canonical_url_match",
        confidence: 0.99,
      });
    }
  }
  for (const pair of syndicatedPairs) {
    duplicatePairsForReport.push({
      article_a: pair.article_a,
      article_b: pair.article_b,
      reason: "syndicated_copy",
      confidence: pair.confidence,
    });
  }

  // --- Build report ---
  const report: NormalizationClusteringReport = {
    run_id: ingest_run_id,
    created_at: now,
    input_article_count: articles.length,
    normalized_article_count: unique.length,
    blocked_count: articles.filter(a => a.processing.status === "blocked").length,
    failed_extraction_count: articles.filter(a => a.processing.status === "failed_extraction").length,
    duplicate_pairs: duplicatePairsForReport,
    cluster_count: clusters.length,
    clusters_email_eligible: clusters.filter(c => c.downstream.email_eligible_by_cluster_quality).length,
    clusters_dashboard_only: clusters.filter(c => c.downstream.dashboard_safe && !c.downstream.email_eligible_by_cluster_quality).length,
    clusters_needs_review: clusters.filter(c => c.decision_trace.review_required).length,
    cluster_summaries: clusters.map(c => ({
      cluster_id: c.cluster_id,
      canonical_event_name: c.canonical_event_name,
      article_count: c.articles.article_ids.length,
      independent_sources: c.source_mix.independent_source_count,
      confidence_label: c.confidence.confidence_label,
      email_eligible: c.downstream.email_eligible_by_cluster_quality,
      merge_methods: c.decision_trace.merge_method,
    })),
  };

  return { clusters, report };
}

// ---------------------------------------------------------------------------
// Step 1: URL-based deduplication
// ---------------------------------------------------------------------------

interface DuplicateMap {
  /** Maps canonical article_id → list of duplicate articles */
  entries: Map<string, NormalizedArticle[]>;
  /** Get all duplicate articles for a canonical */
  get(canonicalId: string): NormalizedArticle[];
}

function dedupeByUrl(articles: NormalizedArticle[]): {
  unique: NormalizedArticle[];
  duplicateMap: DuplicateMap;
} {
  const urlMap = new Map<string, NormalizedArticle>();
  const duplicates = new Map<string, NormalizedArticle[]>();

  for (const article of articles) {
    // Skip failed/blocked articles
    if (article.processing.status !== "normalized") continue;

    const key = normalizeUrlKey(article);
    if (urlMap.has(key)) {
      const canonical = urlMap.get(key)!;
      if (!duplicates.has(canonical.article_id)) {
        duplicates.set(canonical.article_id, []);
      }
      duplicates.get(canonical.article_id)!.push(article);
    } else {
      urlMap.set(key, article);
    }
  }

  const unique = Array.from(urlMap.values());
  const duplicateMap: DuplicateMap = {
    entries: duplicates,
    get(canonicalId: string) {
      return duplicates.get(canonicalId) || [];
    },
  };

  return { unique, duplicateMap };
}

function normalizeUrlKey(article: NormalizedArticle): string {
  const url = article.urls.canonical_url || article.urls.raw_url;
  try {
    const u = new URL(url);
    // Strip query params, fragments, trailing slashes; lowercase host
    return `${u.hostname.toLowerCase()}${u.pathname.replace(/\/$/, "")}`;
  } catch {
    return url.toLowerCase();
  }
}

// ---------------------------------------------------------------------------
// Step 2: Syndication detection (between articles)
// ---------------------------------------------------------------------------

interface SyndicatedPair {
  article_a: string;
  article_b: string;
  confidence: number;
  canonical_wire?: string;
}

function detectSyndicatedPairs(articles: NormalizedArticle[]): SyndicatedPair[] {
  const pairs: SyndicatedPair[] = [];

  // Group articles by canonical wire
  const wireGroups = new Map<string, NormalizedArticle[]>();
  for (const article of articles) {
    if (article.syndication.canonical_wire) {
      const wire = article.syndication.canonical_wire;
      if (!wireGroups.has(wire)) wireGroups.set(wire, []);
      wireGroups.get(wire)!.push(article);
    }
  }

  // For each wire group, mark pairwise syndication
  for (const [wire, group] of wireGroups.entries()) {
    if (group.length < 2) continue;

    // The first article in the group with highest source grade is the "original"
    const sorted = [...group].sort((a, b) => {
      const ga = GRADE_SCORES[a.source.source_quality_grade];
      const gb = GRADE_SCORES[b.source.source_quality_grade];
      return gb - ga;
    });

    for (let i = 1; i < sorted.length; i++) {
      pairs.push({
        article_a: sorted[0].article_id,
        article_b: sorted[i].article_id,
        confidence: sorted[i].syndication.syndication_confidence,
        canonical_wire: wire,
      });
    }
  }

  // Also check for high title similarity between articles from different domains
  // that both flag as syndicated
  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      const a = articles[i];
      const b = articles[j];
      if (a.urls.domain === b.urls.domain) continue;
      if (!a.syndication.is_syndicated && !b.syndication.is_syndicated) continue;

      // Check title fingerprint match
      if (a.dedupe_features.title_fingerprint === b.dedupe_features.title_fingerprint) {
        const alreadyPaired = pairs.some(
          p => (p.article_a === a.article_id && p.article_b === b.article_id) ||
               (p.article_a === b.article_id && p.article_b === a.article_id)
        );
        if (!alreadyPaired) {
          pairs.push({
            article_a: a.article_id,
            article_b: b.article_id,
            confidence: 0.75,
          });
        }
      }
    }
  }

  return pairs;
}

// ---------------------------------------------------------------------------
// Step 3: Pairwise similarity for candidate pairs
// ---------------------------------------------------------------------------

function computeCandidateSimilarities(articles: NormalizedArticle[]): PairwiseSimilarity[] {
  const results: PairwiseSimilarity[] = [];

  // For v1 with small article counts (< 100), compare all pairs.
  // For larger counts, use blocking keys to limit comparisons.
  if (articles.length <= 100) {
    for (let i = 0; i < articles.length; i++) {
      for (let j = i + 1; j < articles.length; j++) {
        const sim = computePairwiseSimilarity(articles[i], articles[j]);
        if (sim.weighted_score >= 0.3) {
          results.push(sim);
        }
      }
    }
  } else {
    // Blocking: only compare articles sharing entity_key or action_key+time_bucket
    const blockIndex = new Map<string, NormalizedArticle[]>();
    for (const article of articles) {
      const keys: string[] = [];
      if (article.dedupe_features.entity_key !== "no_entities") {
        keys.push(`ent:${article.dedupe_features.entity_key}`);
      }
      if (article.dedupe_features.action_key && article.dedupe_features.time_bucket) {
        keys.push(`act:${article.dedupe_features.action_key}:${article.dedupe_features.time_bucket}`);
      }
      for (const key of keys) {
        if (!blockIndex.has(key)) blockIndex.set(key, []);
        blockIndex.get(key)!.push(article);
      }
    }

    const compared = new Set<string>();
    for (const [, group] of blockIndex.entries()) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const pairKey = [group[i].article_id, group[j].article_id].sort().join(":");
          if (compared.has(pairKey)) continue;
          compared.add(pairKey);

          const sim = computePairwiseSimilarity(group[i], group[j]);
          if (sim.weighted_score >= 0.3) {
            results.push(sim);
          }
        }
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Step 4: Greedy agglomerative clustering
// ---------------------------------------------------------------------------

function greedyCluster(
  articles: NormalizedArticle[],
  similarities: PairwiseSimilarity[],
  syndicatedPairs: SyndicatedPair[],
  duplicateMap: DuplicateMap
): NormalizedArticle[][] {
  // Union-Find for clustering
  const parent = new Map<string, string>();
  const articleById = new Map<string, NormalizedArticle>();

  for (const article of articles) {
    parent.set(article.article_id, article.article_id);
    articleById.set(article.article_id, article);
  }

  function find(x: string): string {
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)!)!);
      x = parent.get(x)!;
    }
    return x;
  }

  function union(x: string, y: string): void {
    const px = find(x);
    const py = find(y);
    if (px !== py) parent.set(px, py);
  }

  // Merge syndicated copies
  for (const pair of syndicatedPairs) {
    if (articleById.has(pair.article_a) && articleById.has(pair.article_b)) {
      union(pair.article_a, pair.article_b);
    }
  }

  // Sort similarities descending by weighted score
  const sortedSims = [...similarities].sort((a, b) => b.weighted_score - a.weighted_score);

  // Merge by similarity (highest first)
  for (const sim of sortedSims) {
    if (sim.decision === "duplicate_copy" || sim.decision === "same_event") {
      if (sim.weighted_score >= MERGE_THRESHOLD) {
        union(sim.article_a, sim.article_b);
      }
    }
  }

  // Collect clusters
  const clusterMap = new Map<string, NormalizedArticle[]>();
  for (const article of articles) {
    const root = find(article.article_id);
    if (!clusterMap.has(root)) clusterMap.set(root, []);
    clusterMap.get(root)!.push(article);
  }

  // Add URL-duplicates back into their clusters
  for (const [canonicalId, dupes] of duplicateMap.entries) {
    const root = find(canonicalId);
    const group = clusterMap.get(root);
    if (group) {
      for (const dupe of dupes) {
        if (!group.some(a => a.article_id === dupe.article_id)) {
          group.push(dupe);
        }
      }
    }
  }

  return Array.from(clusterMap.values());
}

// ---------------------------------------------------------------------------
// Step 5: Build EventCluster from article group
// ---------------------------------------------------------------------------

function buildEventCluster(
  articles: NormalizedArticle[],
  ingest_run_id: string,
  now: string,
  duplicateMap: DuplicateMap,
  syndicatedPairs: SyndicatedPair[]
): EventCluster {
  // Select anchor article: highest source grade, then highest article quality
  const sorted = [...articles].sort((a, b) => {
    const ga = GRADE_SCORES[a.source.source_quality_grade];
    const gb = GRADE_SCORES[b.source.source_quality_grade];
    if (gb !== ga) return gb - ga;
    return b.quality.article_quality_score - a.quality.article_quality_score;
  });
  const anchor = sorted[0];

  // Classify articles into roles
  const duplicateIds = new Set<string>();
  const syndicatedIds = new Set<string>();

  // Mark URL duplicates
  for (const [canonicalId, dupes] of duplicateMap.entries) {
    for (const dupe of dupes) {
      if (articles.some(a => a.article_id === dupe.article_id)) {
        duplicateIds.add(dupe.article_id);
      }
    }
  }

  // Mark syndicated copies
  for (const pair of syndicatedPairs) {
    for (const article of articles) {
      if (article.article_id === pair.article_b && article.syndication.is_syndicated) {
        syndicatedIds.add(article.article_id);
      }
    }
  }

  // Supporting articles: non-anchor, non-duplicate, non-syndicated
  const supportingIds = articles
    .filter(a => a.article_id !== anchor.article_id &&
                 !duplicateIds.has(a.article_id) &&
                 !syndicatedIds.has(a.article_id))
    .map(a => a.article_id);

  // Excluded articles (e.g., blocked ones that somehow ended up here)
  const excludedArticles = articles
    .filter(a => a.processing.status !== "normalized")
    .map(a => ({ article_id: a.article_id, reason: a.processing.block_reason || "not_normalized" }));

  // Primary event tuple: use anchor's
  const primaryTuple = anchor.event_extraction.event_tuples[0] || buildFallbackTuple(anchor);

  // Canonical event name
  const canonicalName = buildCanonicalEventName(primaryTuple, anchor);
  const canonicalSlug = buildCanonicalSlug(primaryTuple, anchor);
  const clusterId = `evt_${simpleHash(canonicalSlug)}`;

  // Source mix
  const sourceMix = computeSourceMix(articles, anchor, syndicatedIds);

  // Geography and language
  const geoLang = computeGeographyLanguage(articles);

  // Facts consolidation
  const facts = consolidateFacts(articles, anchor);

  // Conflict detection
  const conflicts = detectConflicts(articles);

  // Frame extraction
  const frames = extractFrames(articles, clusterId);

  // Related event tuples from other articles
  const relatedTuples = articles
    .filter(a => a.article_id !== anchor.article_id)
    .flatMap(a => a.event_extraction.event_tuples)
    .slice(0, 5);

  // Confidence scoring
  const confidence = computeClusterConfidence(anchor, articles, sourceMix, facts, conflicts, syndicatedIds);

  // Freshness
  const freshness = computeFreshness(anchor);

  // Cluster status: use anchor's primary tuple status
  const status = primaryTuple.status;

  // Merge methods used
  const mergeMethods = new Set<EventCluster["decision_trace"]["merge_method"][number]>();
  const reasonCodes: string[] = [];

  if (duplicateIds.size > 0) {
    mergeMethods.add("canonical_url");
    reasonCodes.push("url_dedupe");
  }
  if (syndicatedIds.size > 0) {
    mergeMethods.add("syndication");
    reasonCodes.push("syndication_detected");
  }
  if (articles.length > 1) {
    mergeMethods.add("event_tuple");
    reasonCodes.push("event_similarity_merge");
  }

  // Email eligibility blockers
  const blockers: string[] = [];
  if (!["A", "B"].includes(anchor.source.source_quality_grade)) {
    blockers.push("no_ab_anchor");
  }
  if (sourceMix.independent_source_count === 0 &&
      articles.every(a => a.syndication.is_syndicated)) {
    blockers.push("all_syndicated_copies");
  }
  if (!primaryTuple.actor.name || primaryTuple.actor.name === "Unknown") {
    blockers.push("vague_primary_tuple");
  }
  if (confidence.cluster_confidence < EMAIL_CONFIDENCE_THRESHOLD) {
    blockers.push("low_confidence");
  }
  if (anchor.quality.seo_sludge_score >= 80) {
    blockers.push("anchor_high_sludge");
  }
  if (anchor.quality.prompt_injection_flags.length > 0) {
    blockers.push("prompt_injection_in_anchor");
  }

  const emailEligible = blockers.length === 0;

  return {
    cluster_id: clusterId,
    schema_version: "event_cluster_v1",
    created_at: now,
    updated_at: now,
    ingest_run_ids: [ingest_run_id],

    canonical_event_name: canonicalName,
    canonical_event_slug: canonicalSlug,
    primary_event_tuple: primaryTuple,
    related_event_tuples: relatedTuples.length > 0 ? relatedTuples : undefined,

    status,
    freshness,

    articles: {
      article_ids: articles.map(a => a.article_id),
      anchor_article_id: anchor.article_id,
      supporting_article_ids: supportingIds,
      duplicate_article_ids: Array.from(duplicateIds),
      syndicated_article_ids: Array.from(syndicatedIds),
      excluded_article_ids: excludedArticles,
    },

    source_mix: sourceMix,
    geography_language: geoLang,

    facts,
    conflicts,
    frames,

    confidence,

    decision_trace: {
      merge_method: Array.from(mergeMethods),
      reason_codes: reasonCodes,
      thresholds_hit: {
        cluster_confidence: confidence.cluster_confidence,
        article_count: articles.length,
        independent_sources: sourceMix.independent_source_count,
      },
      split_warnings: [],
      review_required: confidence.confidence_label === "needs_review",
    },

    downstream: {
      candidate_for_relevance_scoring: confidence.cluster_confidence >= CONFIDENCE_LOW,
      dashboard_safe: confidence.cluster_confidence >= CONFIDENCE_LOW,
      email_eligible_by_cluster_quality: emailEligible,
      blockers,
    },
  };
}

// ---------------------------------------------------------------------------
// Canonical event naming
// ---------------------------------------------------------------------------

function buildCanonicalEventName(tuple: EventTuple, anchor: NormalizedArticle): string {
  // Prefer structured tuple naming
  const actor = tuple.actor.name;
  const action = tuple.action.lemma || tuple.action.raw;
  const object = tuple.object.name;

  if (actor && actor !== "Unknown" && action && object && object !== "unspecified") {
    const place = tuple.place.length > 0 ? ` in ${tuple.place[0].name}` : "";
    const statusPrefix = tuple.status === "proposed" ? "proposes to " :
                          tuple.status === "alleged" ? "allegedly " :
                          tuple.status === "rumored" ? "reportedly " : "";
    return `${actor} ${statusPrefix}${action} ${object}${place}`;
  }

  // Fallback: use cleaned title from anchor article
  return anchor.article_meta.title_normalized || anchor.article_meta.title_raw;
}

function buildCanonicalSlug(tuple: EventTuple, anchor: NormalizedArticle): string {
  const parts = [
    tuple.actor.name,
    tuple.action.lemma || tuple.action.action_class,
    tuple.object.name,
    ...(tuple.place.length > 0 ? [tuple.place[0].name] : []),
    anchor.dedupe_features.time_bucket || "",
  ]
    .filter(Boolean)
    .map(s => s!.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
    .filter(s => s.length > 0);

  return parts.join("-").slice(0, 120);
}

// ---------------------------------------------------------------------------
// Source mix computation
// ---------------------------------------------------------------------------

function computeSourceMix(
  articles: NormalizedArticle[],
  anchor: NormalizedArticle,
  syndicatedIds: Set<string>
): EventCluster["source_mix"] {
  const countsByGrade: Record<QualityGrade, number> = { A: 0, B: 0, C: 0, D: 0, Block: 0 };
  const countsByType: Record<string, number> = {};
  const independentDomains = new Set<string>();
  let syndicatedCount = 0;
  let officialPresent = false;

  for (const article of articles) {
    if (article.processing.status !== "normalized") continue;

    countsByGrade[article.source.source_quality_grade]++;
    const st = article.source.source_type;
    countsByType[st] = (countsByType[st] || 0) + 1;

    if (syndicatedIds.has(article.article_id)) {
      syndicatedCount++;
    } else {
      independentDomains.add(article.urls.domain);
    }

    if (["official", "regulator", "government", "court"].includes(st)) {
      officialPresent = true;
    }
  }

  return {
    counts_by_grade: countsByGrade,
    counts_by_type: countsByType,
    independent_source_count: independentDomains.size,
    syndicated_copy_count: syndicatedCount,
    official_source_present: officialPresent,
    anchor_source_grade: anchor.source.source_quality_grade,
  };
}

// ---------------------------------------------------------------------------
// Geography and language
// ---------------------------------------------------------------------------

function computeGeographyLanguage(articles: NormalizedArticle[]): EventCluster["geography_language"] {
  const eventPlaces = new Set<string>();
  const regions = new Set<string>();
  const sourceRegions = new Set<string>();
  const audienceRegions = new Set<string>();
  const languages = new Set<string>();

  for (const article of articles) {
    for (const r of article.normalized_content.region_scope) eventPlaces.add(r);
    if (article.source.home_region) sourceRegions.add(article.source.home_region);
    if (article.source.source_region) sourceRegions.add(article.source.source_region);
    if (article.source.audience_region) audienceRegions.add(article.source.audience_region);
    languages.add(article.article_meta.language);

    // Extract places from event tuples
    for (const tuple of article.event_extraction.event_tuples) {
      for (const place of tuple.place) {
        eventPlaces.add(place.name);
        regions.add(place.name);
      }
    }
  }

  return {
    event_places: Array.from(eventPlaces),
    regions_represented: Array.from(regions),
    source_regions_represented: Array.from(sourceRegions),
    audience_regions_represented: Array.from(audienceRegions),
    languages_represented: Array.from(languages),
  };
}

// ---------------------------------------------------------------------------
// Facts consolidation
// ---------------------------------------------------------------------------

function consolidateFacts(articles: NormalizedArticle[], anchor: NormalizedArticle): ClusterFact[] {
  const facts: ClusterFact[] = [];
  const seenTexts = new Set<string>();

  // Start with anchor's claims as core facts
  for (const claim of anchor.normalized_content.factual_claims) {
    const normalized = claim.text.toLowerCase().trim();
    if (seenTexts.has(normalized)) continue;
    seenTexts.add(normalized);

    facts.push({
      cluster_fact_id: `cf_${simpleHash(claim.claim_id)}`,
      text: claim.text,
      normalized_claim_type: mapToClusterClaimType(claim.claim_type),
      supported_by_claim_ids: [claim.claim_id],
      supported_by_article_ids: [anchor.article_id],
      source_grades: [anchor.source.source_quality_grade],
      requires_attribution: claim.requires_attribution,
      confidence: claim.confidence,
      uncertainty_flags: claim.uncertainty_flags,
    });
  }

  // Add unique facts from supporting articles
  for (const article of articles) {
    if (article.article_id === anchor.article_id) continue;

    for (const claim of article.normalized_content.factual_claims) {
      const normalized = claim.text.toLowerCase().trim();

      // Check if this fact is already covered
      const existingFact = facts.find(f => {
        const similarity = jaccardSimilarity(
          f.text.toLowerCase().split(/\s+/),
          normalized.split(/\s+/)
        );
        return similarity > 0.6;
      });

      if (existingFact) {
        // Corroborate existing fact
        if (!existingFact.supported_by_article_ids.includes(article.article_id)) {
          existingFact.supported_by_article_ids.push(article.article_id);
          existingFact.supported_by_claim_ids.push(claim.claim_id);
          existingFact.source_grades.push(article.source.source_quality_grade);
          // Boost confidence with corroboration
          existingFact.confidence = Math.min(existingFact.confidence + 0.05, 1.0);
        }
      } else if (!seenTexts.has(normalized)) {
        seenTexts.add(normalized);
        facts.push({
          cluster_fact_id: `cf_${simpleHash(claim.claim_id)}`,
          text: claim.text,
          normalized_claim_type: mapToClusterClaimType(claim.claim_type),
          supported_by_claim_ids: [claim.claim_id],
          supported_by_article_ids: [article.article_id],
          source_grades: [article.source.source_quality_grade],
          requires_attribution: claim.requires_attribution,
          confidence: claim.confidence,
          uncertainty_flags: claim.uncertainty_flags,
        });
      }
    }
  }

  return facts;
}

function mapToClusterClaimType(claimType: string): ClusterFact["normalized_claim_type"] {
  switch (claimType) {
    case "fact": return "core_event";
    case "stat": return "number";
    case "quote": return "quote";
    case "background": return "context";
    case "analysis": return "impact";
    case "forecast": return "uncertainty";
    default: return "core_event";
  }
}

// ---------------------------------------------------------------------------
// Conflict detection
// ---------------------------------------------------------------------------

function detectConflicts(articles: NormalizedArticle[]): ClusterConflict[] {
  const conflicts: ClusterConflict[] = [];

  if (articles.length < 2) return conflicts;

  // Check for status mismatches (e.g., one says "confirmed", another "alleged")
  const statuses = new Map<EventStatus, NormalizedArticle[]>();
  for (const article of articles) {
    for (const tuple of article.event_extraction.event_tuples) {
      if (!statuses.has(tuple.status)) statuses.set(tuple.status, []);
      statuses.get(tuple.status)!.push(article);
    }
  }

  if (statuses.size > 1) {
    // Check for material status conflicts
    const statusList = Array.from(statuses.keys());
    const conflicting = statusList.filter(s =>
      (s === "confirmed" && statusList.includes("denied")) ||
      (s === "denied" && statusList.includes("confirmed")) ||
      (s === "alleged" && statusList.includes("denied"))
    );

    if (conflicting.length > 0) {
      const positions = Array.from(statuses.entries()).map(([status, arts]) => ({
        text: `${status}: ${arts.map(a => a.source.display_name).join(", ")}`,
        article_ids: arts.map(a => a.article_id),
        source_grade: arts[0].source.source_quality_grade,
        confidence: 0.6,
      }));

      conflicts.push({
        conflict_id: `conf_status_${simpleHash(statusList.join(""))}`,
        conflict_type: "status_mismatch",
        description: `Articles disagree on event status: ${statusList.join(" vs ")}`,
        positions,
        resolution: "unresolved",
        generation_instruction: "Present both perspectives with attribution; do not assert either as settled fact",
      });
    }
  }

  // Check for number mismatches in claims
  const numericClaims = articles.flatMap(a =>
    a.normalized_content.factual_claims
      .filter(c => c.numeric_values && c.numeric_values.length > 0)
      .map(c => ({ article: a, claim: c }))
  );

  if (numericClaims.length >= 2) {
    // Group by similar claim text and check for different numbers
    // This is a simplified check - a more robust version would use NLP
    for (let i = 0; i < numericClaims.length; i++) {
      for (let j = i + 1; j < numericClaims.length; j++) {
        const a = numericClaims[i];
        const b = numericClaims[j];
        if (a.claim.numeric_values && b.claim.numeric_values) {
          for (const numA of a.claim.numeric_values) {
            for (const numB of b.claim.numeric_values) {
              if (numA.label === numB.label && numA.value !== numB.value) {
                conflicts.push({
                  conflict_id: `conf_num_${simpleHash(`${numA.label}${numA.value}${numB.value}`)}`,
                  conflict_type: "number_mismatch",
                  description: `Sources disagree on ${numA.label}: ${numA.raw} vs ${numB.raw}`,
                  positions: [
                    {
                      text: numA.raw,
                      article_ids: [a.article.article_id],
                      source_grade: a.article.source.source_quality_grade,
                      confidence: a.claim.confidence,
                    },
                    {
                      text: numB.raw,
                      article_ids: [b.article.article_id],
                      source_grade: b.article.source.source_quality_grade,
                      confidence: b.claim.confidence,
                    },
                  ],
                  resolution: "unresolved",
                  generation_instruction: "Report the range or cite both numbers with attribution",
                });
              }
            }
          }
        }
      }
    }
  }

  return conflicts;
}

// ---------------------------------------------------------------------------
// Frame extraction
// ---------------------------------------------------------------------------

function extractFrames(articles: NormalizedArticle[], clusterId: string): ClusterFrame[] {
  const frames: ClusterFrame[] = [];

  // Only extract frames when there are multiple articles from different sources
  if (articles.length < 2) return frames;

  // Group by source region + source type
  const regionTypeGroups = new Map<string, NormalizedArticle[]>();
  for (const article of articles) {
    const key = `${article.source.home_region || "global"}:${article.source.source_type}`;
    if (!regionTypeGroups.has(key)) regionTypeGroups.set(key, []);
    regionTypeGroups.get(key)!.push(article);
  }

  // Create a frame for each distinct region/type group
  for (const [key, groupArticles] of regionTypeGroups.entries()) {
    const representative = groupArticles[0];
    const [region, sourceType] = key.split(":");

    // Infer frame labels from topics and action class
    const frameLabels = inferFrameLabels(representative);

    // Stakeholders mentioned
    const stakeholders = representative.normalized_content.entities
      .filter(e => e.role === "actor" || e.role === "affected_party")
      .map(e => e.name);
    const secondaryStakeholders = representative.normalized_content.entities
      .filter(e => e.role === "mentioned")
      .map(e => e.name);

    frames.push({
      frame_id: `frame_${simpleHash(`${clusterId}:${key}`)}`,
      cluster_id: clusterId,
      article_id: representative.article_id,
      source_region: region !== "global" ? region : null,
      audience_region: representative.source.audience_region || null,
      language: representative.article_meta.language,
      source_type: representative.source.source_type,
      frame_labels: frameLabels,
      primary_stakeholders_mentioned: stakeholders.slice(0, 5),
      secondary_stakeholders_mentioned: secondaryStakeholders.slice(0, 5),
      evidence_basis: inferEvidenceBasis(representative),
      tone_intensity: "medium",
      sentiment_toward_actor: undefined,
      frame_summary: buildFrameSummary(representative, region),
      supporting_claim_ids: representative.normalized_content.factual_claims
        .map(c => c.claim_id)
        .slice(0, 5),
      confidence: 0.6,
    });
  }

  return frames;
}

function inferFrameLabels(article: NormalizedArticle): FrameLabel[] {
  const labels: FrameLabel[] = [];
  const topics = article.normalized_content.topics;
  const actionClass = article.event_extraction.event_tuples[0]?.action.action_class;

  if (actionClass === "regulatory_action" || topics.includes("regulation")) labels.push("regulatory_risk");
  if (actionClass === "legal_action") labels.push("legal_liability");
  if (actionClass === "market_move" || actionClass === "financial_result") labels.push("market_impact");
  if (actionClass === "supply_chain_disruption") labels.push("supplier_disruption");
  if (actionClass === "labor_workforce") labels.push("worker_impact");
  if (actionClass === "security_incident") labels.push("technology_angle");
  if (actionClass === "geopolitical_event") labels.push("geopolitical_angle");
  if (actionClass === "natural_disaster") labels.push("environmental_angle");
  if (actionClass === "company_statement") labels.push("company_strategy");

  if (labels.length === 0) labels.push("other");
  return labels;
}

function inferEvidenceBasis(article: NormalizedArticle): string[] {
  const basis: string[] = [];
  const sourceType = article.source.source_type;

  if (sourceType === "official" || sourceType === "regulator" || sourceType === "government") {
    basis.push("official");
  }
  if (sourceType === "company") basis.push("company_statement");
  if (sourceType === "local_outlet") basis.push("local_reporting");
  if (sourceType === "wire") basis.push("wire_service");
  if (article.normalized_content.quotes.length > 0) basis.push("expert");
  if (basis.length === 0) basis.push("unknown");
  return basis;
}

function buildFrameSummary(article: NormalizedArticle, region: string): string {
  const sourceDesc = region !== "global"
    ? `${region} ${article.source.source_type} coverage`
    : `${article.source.source_type} coverage`;
  const summary = article.normalized_content.summary_1_sentence;
  return `${sourceDesc}: ${summary}`;
}

// ---------------------------------------------------------------------------
// Cluster confidence scoring
// ---------------------------------------------------------------------------

function computeClusterConfidence(
  anchor: NormalizedArticle,
  articles: NormalizedArticle[],
  sourceMix: EventCluster["source_mix"],
  facts: ClusterFact[],
  conflicts: ClusterConflict[],
  syndicatedIds: Set<string>
): EventCluster["confidence"] {
  // Anchor source score
  const anchorScore = GRADE_SCORES[anchor.source.source_quality_grade];

  // Independent corroboration score
  let corroborationScore = 0;
  if (sourceMix.official_source_present && sourceMix.independent_source_count >= 2) {
    corroborationScore = 1.0;
  } else if (sourceMix.independent_source_count >= 2 &&
             (sourceMix.counts_by_grade.A > 0 || sourceMix.counts_by_grade.B >= 2)) {
    corroborationScore = 0.85;
  } else if (sourceMix.counts_by_grade.A > 0) {
    corroborationScore = 0.75;
  } else if (sourceMix.independent_source_count >= 2) {
    corroborationScore = 0.6;
  } else if (sourceMix.counts_by_grade.B > 0) {
    corroborationScore = 0.45;
  } else {
    corroborationScore = 0.3;
  }

  // Event tuple coherence score
  const primaryTuple = anchor.event_extraction.event_tuples[0];
  let tupleCoherence = 0.5;
  if (primaryTuple) {
    if (primaryTuple.actor.name !== "Unknown" &&
        primaryTuple.object.name !== "unspecified" &&
        primaryTuple.place.length > 0 &&
        primaryTuple.event_time.granularity !== "unknown") {
      tupleCoherence = 0.95;
    } else if (primaryTuple.actor.name !== "Unknown" && primaryTuple.object.name !== "unspecified") {
      tupleCoherence = 0.8;
    } else if (primaryTuple.actor.name !== "Unknown") {
      tupleCoherence = 0.65;
    }
  }

  // Factual support score
  const corroboratedFacts = facts.filter(f => f.supported_by_article_ids.length >= 2);
  const factualSupport = facts.length > 0
    ? Math.min(0.5 + (corroboratedFacts.length / facts.length) * 0.5, 1.0)
    : 0.3;

  // Dedupe similarity score
  const dedupeSim = articles.length > 1 ? 0.8 : 0.5;

  // Source independence score
  const totalArticles = articles.length;
  const syndCount = syndicatedIds.size;
  const independenceScore = totalArticles > 0
    ? Math.min((totalArticles - syndCount) / totalArticles + 0.3, 1.0)
    : 0.5;

  // Penalties
  const conflictPenalty = Math.min(conflicts.length * 0.3, 1.0);
  const extractionPenalty = anchor.quality.extraction_confidence < 0.5 ? 0.5 : 0;
  const sludgePenalty = anchor.quality.seo_sludge_score >= 40 ? 0.5 : 0;
  const stalePenalty = computeFreshness(anchor) === "stale" ? 0.5 : 0;

  // Weighted formula from spec
  const cluster_confidence = Math.max(0, Math.min(1,
    0.20 * anchorScore +
    0.15 * corroborationScore +
    0.20 * tupleCoherence +
    0.15 * factualSupport +
    0.10 * dedupeSim +
    0.10 * independenceScore -
    0.04 * conflictPenalty -
    0.03 * extractionPenalty -
    0.02 * sludgePenalty -
    0.01 * stalePenalty
  ));

  // Confidence label
  let confidence_label: ConfidenceLabel;
  if (cluster_confidence >= CONFIDENCE_HIGH) confidence_label = "high";
  else if (cluster_confidence >= CONFIDENCE_MEDIUM) confidence_label = "medium";
  else if (cluster_confidence >= CONFIDENCE_LOW) confidence_label = "low";
  else confidence_label = "needs_review";

  return {
    cluster_confidence,
    dedupe_confidence: dedupeSim,
    factual_confidence: factualSupport,
    independence_confidence: independenceScore,
    extraction_confidence: anchor.quality.extraction_confidence,
    confidence_label,
  };
}

// ---------------------------------------------------------------------------
// Freshness computation
// ---------------------------------------------------------------------------

function computeFreshness(anchor: NormalizedArticle): ClusterFreshness {
  const publishedAt = anchor.article_meta.published_at;
  if (!publishedAt) return "recent";

  try {
    const pubDate = new Date(publishedAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60);

    if (hoursDiff <= 4) return "breaking";
    if (hoursDiff <= 24) return "today";
    if (hoursDiff <= 72) return "recent";
    if (hoursDiff <= 168) return "stale";
    return "historical_context";
  } catch {
    return "recent";
  }
}

// ---------------------------------------------------------------------------
// Fallback tuple for articles with no extraction
// ---------------------------------------------------------------------------

function buildFallbackTuple(article: NormalizedArticle): EventTuple {
  const title = article.article_meta.title_normalized;
  return {
    event_tuple_id: `et_fallback_${article.article_id}`,
    article_id: article.article_id,
    actor: { name: "Unknown", type: "other" },
    action: {
      raw: title,
      lemma: title.toLowerCase().slice(0, 80),
      action_class: "other",
    },
    object: { name: "unspecified", type: "other" },
    affected_entities: [],
    place: [],
    event_time: {
      date: article.article_meta.published_at || null,
      granularity: "unknown",
    },
    status: "reported",
    confidence: 0.2,
    support_claim_ids: [],
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildEmptyReport(runId: string, now: string): NormalizationClusteringReport {
  return {
    run_id: runId,
    created_at: now,
    input_article_count: 0,
    normalized_article_count: 0,
    blocked_count: 0,
    failed_extraction_count: 0,
    duplicate_pairs: [],
    cluster_count: 0,
    clusters_email_eligible: 0,
    clusters_dashboard_only: 0,
    clusters_needs_review: 0,
    cluster_summaries: [],
  };
}

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36).padStart(8, "0").slice(0, 8);
}
