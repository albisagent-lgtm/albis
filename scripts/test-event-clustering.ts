#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// Package 8B — Event clustering debug script.
//
// Tests the full 8B pipeline: article normalization → event clustering.
// Uses fixture data (no network/DB calls) to verify:
//   1. Title normalization removes publisher clutter
//   2. Articles about the same event merge into one cluster
//   3. Different events stay in separate clusters
//   4. Syndicated copies merge without inflating source counts
//   5. Cluster confidence scoring and email eligibility
//   6. Debug report generation
//
// Run: npx tsx scripts/test-event-clustering.ts
// ---------------------------------------------------------------------------

import {
  scoreArticleEvidence,
  normalizeArticle,
  normalizeArticleBatch,
  normalizeTitle,
  clusterArticles,
  jaccardSimilarity,
  computePairwiseSimilarity,
  tokenize,
  computeFingerprint,
} from "../src/lib/company-scan";
import type {
  RawArticleInput,
  ScoredCompanyArticleEvidence,
  NormalizedArticle,
  EventCluster,
  NormalizationClusteringReport,
} from "../src/lib/company-scan";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// ---------------------------------------------------------------------------
// Fixtures: messy raw articles about overlapping events
// ---------------------------------------------------------------------------

const FIXTURES: RawArticleInput[] = [
  // --- Group 1: EU regulation probe (3 articles → should merge into 1 cluster) ---
  {
    raw_url: "https://reuters.com/technology/eu-opens-probe-company-x-data-2026-04-27",
    canonical_url: "https://reuters.com/technology/eu-opens-probe-company-x-data-2026-04-27",
    source_name: "Reuters",
    domain: "reuters.com",
    title: "EU opens formal probe into Company X data practices - Reuters",
    description: "The European Commission opened a formal investigation into Company X's data practices under the Digital Markets Act.",
    extracted_text: "BRUSSELS (Reuters) - The European Commission opened a formal investigation into Company X's data practices on Tuesday, regulators said. The probe will examine compliance with the Digital Markets Act. Commissioner Breton said the investigation would focus on data handling and interoperability requirements. Company X said it would cooperate fully.",
    published_at: "2026-04-27T10:00:00Z",
    retrieved_at: "2026-04-27T12:00:00Z",
    author_raw: "John Smith",
    language_hint: "en",
  },
  {
    raw_url: "https://ec.europa.eu/commission/presscorner/detail/en/ip_26_1234",
    canonical_url: "https://ec.europa.eu/commission/presscorner/detail/en/ip_26_1234",
    source_name: "European Commission",
    domain: "ec.europa.eu",
    title: "Commission opens investigation under Digital Markets Act",
    description: "The European Commission has opened proceedings to investigate Company X under the Digital Markets Act.",
    extracted_text: "Brussels, 27 April 2026. The European Commission has today opened formal proceedings to investigate whether Company X has failed to comply with its obligations under the Digital Markets Act. The investigation focuses on data practices and interoperability.",
    published_at: "2026-04-27T09:00:00Z",
    retrieved_at: "2026-04-27T12:00:00Z",
    author_raw: null,
    language_hint: "en",
  },
  {
    raw_url: "https://localnews.de/eu-probe-company-x-verbraucher-2026",
    source_name: "Berliner Zeitung",
    domain: "localnews.de",
    title: "German consumer advocates welcome EU probe into Company X | Berliner Zeitung",
    description: "German consumer protection groups said the EU investigation is a step forward.",
    extracted_text: "German consumer advocates have welcomed the European Commission's decision to investigate Company X's data practices. The Federation of German Consumer Organisations said the probe addresses longstanding concerns about data portability. Local officials in Berlin praised the move.",
    published_at: "2026-04-27T14:00:00Z",
    retrieved_at: "2026-04-27T15:00:00Z",
    author_raw: "Maria Mueller",
    language_hint: "de",
  },

  // --- Group 1b: Syndicated copy of Reuters (should merge as duplicate) ---
  {
    raw_url: "https://smallpaper.com/news/eu-opens-probe-company-x",
    source_name: "Small Paper",
    domain: "smallpaper.com",
    title: "EU opens formal probe into Company X data practices",
    description: "The European Commission opened a formal investigation into Company X data practices.",
    extracted_text: "(Reuters) - The European Commission opened a formal investigation into Company X's data practices on Tuesday, regulators said. The probe will examine compliance with the Digital Markets Act.",
    published_at: "2026-04-27T11:00:00Z",
    retrieved_at: "2026-04-27T12:00:00Z",
    author_raw: "Reuters",
    language_hint: "en",
  },

  // --- Group 1c: SEO sludge (should be blocked/excluded) ---
  {
    raw_url: "https://seosite.xyz/company-x-eu-investigation-explained-what-it-means-for-your-privacy-2026",
    source_name: "SEO Site",
    domain: "seosite.xyz",
    title: "Company X EU Investigation Explained: What It Means for Your Privacy in 2026 | Best Tips",
    description: "Everything you need to know about the Company X EU investigation.",
    extracted_text: "If you're wondering about the Company X investigation, here's what you need to know. Privacy experts say this could be significant. Click here for more tips.",
    published_at: null,
    retrieved_at: "2026-04-27T16:00:00Z",
    author_raw: null,
    language_hint: "en",
  },

  // --- Group 2: Completely different event (Bank of England rate decision) ---
  {
    raw_url: "https://bbc.co.uk/news/business/boe-holds-rate-april-2026",
    canonical_url: "https://bbc.co.uk/news/business/boe-holds-rate-april-2026",
    source_name: "BBC News",
    domain: "bbc.co.uk",
    title: "Bank of England holds UK interest rate at 4.25% - BBC News",
    description: "The Bank of England voted to hold the UK interest rate at 4.25% amid inflation concerns.",
    extracted_text: "The Bank of England has voted 7-2 to hold the UK base interest rate at 4.25%, as expected by most economists. Governor Bailey said the committee would continue to monitor inflation data. Two members voted for a 0.25 percentage point cut. The pound rose 0.3% against the dollar after the announcement.",
    published_at: "2026-04-27T12:00:00Z",
    retrieved_at: "2026-04-27T13:00:00Z",
    author_raw: "Economics Team",
    language_hint: "en",
  },
  {
    raw_url: "https://ft.com/content/boe-rate-decision-april-2026",
    canonical_url: "https://ft.com/content/boe-rate-decision-april-2026",
    source_name: "Financial Times",
    domain: "ft.com",
    title: "Bank of England keeps rates on hold at 4.25% | Financial Times",
    description: "BoE holds rate amid divided committee; two members push for cut",
    extracted_text: "The Bank of England held interest rates at 4.25% on Thursday in a 7-2 vote, with two dissenters favouring a quarter-point cut. Markets had priced in a hold. Sterling strengthened after the decision. The MPC said it would need to see further evidence of disinflation before easing.",
    published_at: "2026-04-27T12:30:00Z",
    retrieved_at: "2026-04-27T13:00:00Z",
    author_raw: "Chris Giles",
    language_hint: "en",
  },
];

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function pass(label: string) {
  console.log(`  ✓ ${label}`);
}

function fail(label: string, detail?: string) {
  console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`);
  failures++;
}

let failures = 0;
let testCount = 0;

function assert(condition: boolean, label: string, detail?: string) {
  testCount++;
  if (condition) {
    pass(label);
  } else {
    fail(label, detail);
  }
}

// ---------------------------------------------------------------------------
// Run tests
// ---------------------------------------------------------------------------

console.log("=== Package 8B: Article Normalization + Event Clustering Tests ===\n");

// --- Test 1: Title normalization ---
console.log("1. Title normalization");

assert(
  normalizeTitle("EU opens formal probe into Company X data practices - Reuters") ===
    "EU opens formal probe into Company X data practices",
  "Strips Reuters suffix"
);

assert(
  normalizeTitle("Bank of England holds UK interest rate at 4.25% - BBC News") ===
    "Bank of England holds UK interest rate at 4.25%",
  "Strips BBC News suffix"
);

assert(
  normalizeTitle("Bank of England keeps rates on hold at 4.25% | Financial Times") ===
    "Bank of England keeps rates on hold at 4.25%",
  "Strips FT pipe suffix"
);

assert(
  normalizeTitle("BREAKING: EU opens probe into data practices") ===
    "EU opens probe into data practices",
  "Strips BREAKING prefix"
);

assert(
  normalizeTitle("German consumer advocates welcome EU probe into Company X | Berliner Zeitung") ===
    "German consumer advocates welcome EU probe into Company X",
  "Strips publisher pipe suffix"
);

// --- Test 2: Score + normalize articles through 8A → 8B ---
console.log("\n2. Article scoring (8A) + normalization (8B)");

const scoredArticles: ScoredCompanyArticleEvidence[] = [];
const auditTraces: string[] = [];

for (const raw of FIXTURES) {
  const result = scoreArticleEvidence(raw);
  auditTraces.push(
    `${raw.domain}: src=${result.source.source_quality_grade} art=${result.article.article_quality_grade} ` +
    `sludge=${result.sludge.seo_sludge_score} action=${result.evidence_action}`
  );

  // Build ScoredCompanyArticleEvidence
  const scored: ScoredCompanyArticleEvidence = {
    article: {
      article_id: `art_${raw.domain}_${Math.random().toString(36).slice(2, 8)}`,
      raw_url: raw.raw_url,
      canonical_url: raw.canonical_url || undefined,
      source_id: `domain:${raw.domain}`,
      source_quality_grade: result.source.source_quality_grade,
      source_type: result.source.source_type,
      title_raw: raw.title || "",
      title_normalized: normalizeTitle(raw.title || ""),
      language: raw.language_hint || "en",
      published_at: raw.published_at,
      updated_at: raw.updated_at || null,
      retrieved_at: raw.retrieved_at,
      author: {
        name: raw.author_raw || undefined,
        type: result.article.author_type,
        confidence: raw.author_raw ? 0.8 : 0.2,
      },
      has_reliable_timestamp: Boolean(raw.published_at),
      has_extractable_event: result.article.has_extractable_event,
      has_primary_evidence: result.article.has_primary_evidence,
      has_original_reporting: result.article.has_original_reporting,
      has_local_detail: false,
      has_named_quotes_or_documents: result.article.has_named_quotes || false,
      factual_density_score: result.article.factual_density_score,
      boilerplate_ratio: 0.2,
      syndication: {
        is_syndicated: false,
        attribution_present: false,
        confidence: 0,
      },
      seo_sludge_score: result.sludge.seo_sludge_score,
      seo_sludge_signals: result.sludge.seo_sludge_signals,
      article_quality_score: result.article.article_quality_score,
      article_quality_grade: result.article.article_quality_grade,
      hard_block_reasons: [
        ...result.source.hard_block_reasons,
        ...result.article.hard_block_reasons,
        ...result.sludge.hard_block_reasons,
      ],
      sensitivity_flags: result.article.sensitivity_flags,
      regional_context_bonus: 0,
      corroboration_count_ab: 0,
      cluster_has_ab_anchor: false,
      unique_regional_or_specialist_detail: false,
      evidence_action: result.evidence_action,
      evidence_action_reasons: result.evidence_action_reasons,
      attribution_required: result.attribution_required,
    },
    source: {
      source_id: `domain:${raw.domain}`,
      display_name: raw.source_name || raw.domain || "Unknown",
      domain: raw.domain || "unknown",
      source_type: result.source.source_type,
      home_region: undefined,
      source_quality_score: result.source.source_quality_score,
      source_quality_grade: result.source.source_quality_grade,
      source_quality_reasons: result.source.source_quality_reasons,
    },
    extracted_facts: (raw.extracted_text || "").split(". ")
      .filter(s => s.length > 20)
      .slice(0, 5)
      .map((text, i) => ({
        fact_id: `fact_${i}`,
        text: text.trim(),
        entities: [],
        claim_type: "event" as const,
        evidence_url: raw.raw_url,
        attribution_required: false,
        confidence: 0.7,
      })),
  };
  scoredArticles.push(scored);
}

console.log("\n  8A audit traces:");
for (const trace of auditTraces) {
  console.log(`    ${trace}`);
}

// Run normalization
const { normalized, skipped, failed } = normalizeArticleBatch(
  scoredArticles,
  "test_run_001"
);

console.log(`\n  Normalized: ${normalized.length}, Skipped: ${skipped}, Failed: ${failed}`);
assert(normalized.length >= 3, "At least 3 articles normalized (unknown domains + SEO sludge skipped/blocked)");
assert(skipped >= 1, "At least 1 article skipped (SEO sludge or low quality)");

// --- Test 3: Jaccard similarity ---
console.log("\n3. Jaccard similarity");

const tokensA = tokenize("EU opens formal probe into Company X data practices");
const tokensB = tokenize("EU opens formal probe into Company X data practices");
const tokensC = tokenize("Bank of England holds UK interest rate at 4.25%");

assert(
  jaccardSimilarity(tokensA, tokensB) === 1.0,
  "Identical titles → Jaccard 1.0"
);

assert(
  jaccardSimilarity(tokensA, tokensC) < 0.2,
  "Completely different titles → Jaccard < 0.2",
  `got ${jaccardSimilarity(tokensA, tokensC).toFixed(3)}`
);

// --- Test 4: Pairwise similarity ---
console.log("\n4. Pairwise similarity");

if (normalized.length >= 2) {
  // Find articles from the same group (EU probe)
  const euArticles = normalized.filter(a =>
    a.article_meta.title_normalized.toLowerCase().includes("eu") ||
    a.article_meta.title_normalized.toLowerCase().includes("company x") ||
    a.article_meta.title_normalized.toLowerCase().includes("commission")
  );

  const boeArticles = normalized.filter(a =>
    a.article_meta.title_normalized.toLowerCase().includes("bank of england") ||
    a.article_meta.title_normalized.toLowerCase().includes("interest rate")
  );

  if (euArticles.length >= 2) {
    const sim = computePairwiseSimilarity(euArticles[0], euArticles[1]);
    assert(
      sim.decision === "same_event" || sim.decision === "duplicate_copy",
      "Two EU probe articles → same_event or duplicate",
      `got ${sim.decision} (score=${sim.weighted_score.toFixed(3)})`
    );
  }

  if (euArticles.length >= 1 && boeArticles.length >= 1) {
    const sim = computePairwiseSimilarity(euArticles[0], boeArticles[0]);
    assert(
      sim.decision === "separate",
      "EU probe vs BoE rate → separate events",
      `got ${sim.decision} (score=${sim.weighted_score.toFixed(3)})`
    );
  }
}

// --- Test 5: Event clustering ---
console.log("\n5. Event clustering");

const { clusters, report } = clusterArticles({
  articles: normalized,
  ingest_run_id: "test_run_001",
});

console.log(`  Clusters created: ${clusters.length}`);
console.log(`  Report: ${report.cluster_count} clusters, ` +
            `${report.clusters_email_eligible} email-eligible, ` +
            `${report.clusters_dashboard_only} dashboard-only`);

assert(
  clusters.length >= 2,
  "At least 2 clusters (EU probe + BoE rate)",
  `got ${clusters.length}`
);

// Check that EU probe articles are in one cluster
const euCluster = clusters.find(c =>
  c.canonical_event_name.toLowerCase().includes("eu") ||
  c.canonical_event_name.toLowerCase().includes("company x") ||
  c.canonical_event_name.toLowerCase().includes("commission") ||
  c.canonical_event_name.toLowerCase().includes("probe") ||
  c.canonical_event_name.toLowerCase().includes("investigation")
);

const boeCluster = clusters.find(c =>
  c.canonical_event_name.toLowerCase().includes("bank of england") ||
  c.canonical_event_name.toLowerCase().includes("interest rate") ||
  c.canonical_event_name.toLowerCase().includes("rate")
);

if (euCluster) {
  assert(
    euCluster.articles.article_ids.length >= 2,
    "EU probe cluster has 2+ articles",
    `got ${euCluster.articles.article_ids.length}`
  );

  assert(
    euCluster.source_mix.anchor_source_grade === "A" || euCluster.source_mix.anchor_source_grade === "B",
    "EU cluster has A/B anchor",
    `got ${euCluster.source_mix.anchor_source_grade}`
  );

  assert(
    euCluster.confidence.confidence_label === "high" || euCluster.confidence.confidence_label === "medium",
    "EU cluster confidence is high or medium",
    `got ${euCluster.confidence.confidence_label} (${euCluster.confidence.cluster_confidence.toFixed(3)})`
  );

  console.log(`\n  EU cluster detail:`);
  console.log(`    Name: ${euCluster.canonical_event_name}`);
  console.log(`    Articles: ${euCluster.articles.article_ids.length}`);
  console.log(`    Anchor grade: ${euCluster.source_mix.anchor_source_grade}`);
  console.log(`    Independent sources: ${euCluster.source_mix.independent_source_count}`);
  console.log(`    Syndicated copies: ${euCluster.source_mix.syndicated_copy_count}`);
  console.log(`    Confidence: ${euCluster.confidence.cluster_confidence.toFixed(3)} (${euCluster.confidence.confidence_label})`);
  console.log(`    Email eligible: ${euCluster.downstream.email_eligible_by_cluster_quality}`);
  console.log(`    Facts: ${euCluster.facts.length}`);
  console.log(`    Frames: ${euCluster.frames.length}`);
  console.log(`    Merge methods: ${euCluster.decision_trace.merge_method.join(", ")}`);
} else {
  fail("EU probe cluster not found");
}

if (boeCluster) {
  assert(
    boeCluster.articles.article_ids.length >= 1,
    "BoE cluster has 1+ articles",
    `got ${boeCluster.articles.article_ids.length}`
  );

  console.log(`\n  BoE cluster detail:`);
  console.log(`    Name: ${boeCluster.canonical_event_name}`);
  console.log(`    Articles: ${boeCluster.articles.article_ids.length}`);
  console.log(`    Anchor grade: ${boeCluster.source_mix.anchor_source_grade}`);
  console.log(`    Confidence: ${boeCluster.confidence.cluster_confidence.toFixed(3)} (${boeCluster.confidence.confidence_label})`);
  console.log(`    Email eligible: ${boeCluster.downstream.email_eligible_by_cluster_quality}`);
} else {
  fail("BoE rate cluster not found");
}

// --- Test 6: Cluster event tuples ---
console.log("\n6. Event tuple quality");

for (const cluster of clusters) {
  const tuple = cluster.primary_event_tuple;
  assert(
    tuple.actor.name !== "Unknown" || tuple.action.raw.length > 5,
    `Cluster "${cluster.canonical_event_name.slice(0, 50)}..." has meaningful tuple`,
    `actor=${tuple.actor.name}, action=${tuple.action.raw.slice(0, 30)}`
  );
}

// --- Test 7: Dedupe - syndicated copies don't inflate independence ---
console.log("\n7. Syndication handling");

if (euCluster) {
  // The syndicated Reuters copy should not count as independent
  const syndicatedCount = euCluster.source_mix.syndicated_copy_count;
  const independentCount = euCluster.source_mix.independent_source_count;

  console.log(`  Syndicated copies: ${syndicatedCount}, Independent: ${independentCount}`);
  assert(
    independentCount <= euCluster.articles.article_ids.length,
    "Independent source count ≤ total articles",
  );
}

// --- Test 8: Email eligibility blockers ---
console.log("\n8. Email eligibility");

for (const cluster of clusters) {
  if (cluster.downstream.email_eligible_by_cluster_quality) {
    assert(
      cluster.confidence.cluster_confidence >= 0.70,
      `Email-eligible cluster "${cluster.canonical_event_name.slice(0, 40)}..." has confidence ≥ 0.70`,
      `got ${cluster.confidence.cluster_confidence.toFixed(3)}`
    );
    assert(
      ["A", "B"].includes(cluster.source_mix.anchor_source_grade),
      `Email-eligible cluster has A/B anchor`,
      `got ${cluster.source_mix.anchor_source_grade}`
    );
  }

  if (cluster.downstream.blockers.length > 0) {
    console.log(`  Cluster "${cluster.canonical_event_name.slice(0, 40)}..." blocked: ${cluster.downstream.blockers.join(", ")}`);
  }
}

// --- Write debug report ---
console.log("\n9. Writing debug report");

const reportDir = join(process.cwd(), "reports");
if (!existsSync(reportDir)) mkdirSync(reportDir, { recursive: true });

const reportPath = join(reportDir, "pkg-8b-clustering-debug.json");
const debugOutput = {
  generated_at: new Date().toISOString(),
  pipeline_summary: {
    input_articles: FIXTURES.length,
    scored_articles: scoredArticles.length,
    normalized_articles: normalized.length,
    skipped_articles: skipped,
    failed_articles: failed,
    clusters_created: clusters.length,
  },
  audit_traces: auditTraces,
  normalization_report: report,
  clusters: clusters.map(c => ({
    cluster_id: c.cluster_id,
    canonical_event_name: c.canonical_event_name,
    status: c.status,
    freshness: c.freshness,
    article_count: c.articles.article_ids.length,
    anchor_grade: c.source_mix.anchor_source_grade,
    independent_sources: c.source_mix.independent_source_count,
    syndicated_copies: c.source_mix.syndicated_copy_count,
    facts_count: c.facts.length,
    conflicts_count: c.conflicts.length,
    frames_count: c.frames.length,
    confidence: c.confidence,
    email_eligible: c.downstream.email_eligible_by_cluster_quality,
    blockers: c.downstream.blockers,
    merge_methods: c.decision_trace.merge_method,
    reason_codes: c.decision_trace.reason_codes,
    primary_tuple: {
      actor: c.primary_event_tuple.actor.name,
      action: c.primary_event_tuple.action.lemma,
      object: c.primary_event_tuple.object.name,
      place: c.primary_event_tuple.place.map(p => p.name),
      status: c.primary_event_tuple.status,
    },
  })),
};

writeFileSync(reportPath, JSON.stringify(debugOutput, null, 2));
console.log(`  Debug report written to: ${reportPath}`);

// --- Summary ---
console.log(`\n=== Results: ${testCount - failures}/${testCount} passed, ${failures} failed ===`);
if (failures > 0) {
  process.exit(1);
}
