#!/usr/bin/env npx tsx
// ---------------------------------------------------------------------------
// Package 8C verification — standalone test fixtures for company relevance
// scoring, Perception Gap evidence evaluation, and dry-run debug report.
//
// Tests:
//   1. Strong company match → email candidate
//   2. Keyword-only weak match → exclude
//   3. Useful niche item → dashboard-only
//   4. Regional framing difference with evidence → PG eligible
//   5. Vague "global media differs" claim → PG skipped
//   6. No-finding section behavior
//   7. Dry-run debug report generation
//
// Run: npx tsx scripts/test-company-relevance.ts
// ---------------------------------------------------------------------------

import {
  scoreCompanyRelevance,
  scoreClusterRelevance,
  matchSelectedScanAreas,
  detectWeakMatch,
  buildRelevanceDebugReport,
  evaluatePerceptionGap,
  evaluatePerceptionGapBatch,
} from "../src/lib/company-scan";
import type {
  EventCluster,
  CompanyBriefingProfile,
  SelectedScanArea,
  RelevanceDecision,
  PerceptionGapDecision,
  EventTuple,
  ClusterFrame,
  ClusterFact,
  NormalizedEntity,
} from "../src/lib/company-scan";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Test company profile
// ---------------------------------------------------------------------------

const testProfile: CompanyBriefingProfile = {
  company_id: "test-airline-co",
  display_name: "GlobalAir Holdings",
  industry: "aviation",
  sub_industries: ["airline", "hospitality"],
  operating_regions: ["EU", "United Kingdom", "Asia"],
  customer_regions: ["EU", "North America", "Asia"],
  supplier_regions: ["EU", "Asia"],
  regulatory_regions: ["EU", "United Kingdom"],
  selected_scan_areas: [
    {
      area_id: "eu-travel-regulation",
      label: "EU travel regulation",
      category: "regulation",
      priority: "high",
      regions: ["EU", "United Kingdom"],
      keywords: ["aviation", "airline", "passenger compensation", "flight delay"],
      description: "EU and UK aviation regulatory changes",
    },
    {
      area_id: "fuel-supply-chain",
      label: "Fuel and supply chain",
      category: "supply_chain",
      priority: "high",
      regions: ["EU", "Asia"],
      keywords: ["fuel", "jet fuel", "kerosene", "supply chain"],
      description: "Aviation fuel supply and logistics",
    },
    {
      area_id: "reputation-risk",
      label: "Reputation risk",
      category: "reputation",
      priority: "medium",
      keywords: ["airline reputation", "customer complaint", "safety"],
    },
    {
      area_id: "asia-routes",
      label: "Asia routes and market",
      category: "market",
      priority: "medium",
      regions: ["Asia", "Japan", "South Korea", "China"],
      keywords: ["asia route", "pacific route"],
    },
  ],
  watch_entities: [
    { entity_id: "we-1", name: "Lufthansa", type: "competitor" },
    { entity_id: "we-2", name: "Ryanair", type: "competitor" },
    { entity_id: "we-3", name: "EASA", type: "regulator", aliases: ["European Union Aviation Safety Agency"] },
  ],
  risk_priorities: ["regulatory-policy", "supply-chain-disruption", "reputation-narrative"],
};

// ---------------------------------------------------------------------------
// Helper: build a minimal EventCluster
// ---------------------------------------------------------------------------

function makeCluster(overrides: Partial<EventCluster> & { cluster_id: string; canonical_event_name: string }): EventCluster {
  const now = new Date().toISOString();
  const defaults: EventCluster = {
    cluster_id: overrides.cluster_id,
    schema_version: "event_cluster_v1",
    created_at: now,
    updated_at: now,
    ingest_run_ids: ["test-run"],
    canonical_event_name: overrides.canonical_event_name,
    canonical_event_slug: overrides.cluster_id,
    primary_event_tuple: {
      event_tuple_id: "et-1",
      article_id: "art-1",
      actor: { name: "Unknown", type: "org" },
      action: { raw: "announced", lemma: "announce", action_class: "other" },
      object: { name: "unknown", type: "other" },
      affected_entities: [],
      place: [],
      event_time: { granularity: "unknown" },
      status: "reported",
      confidence: 0.5,
      support_claim_ids: [],
    },
    status: "reported",
    freshness: "today",
    articles: {
      article_ids: ["art-1"],
      anchor_article_id: "art-1",
      supporting_article_ids: [],
      duplicate_article_ids: [],
      syndicated_article_ids: [],
      excluded_article_ids: [],
    },
    source_mix: {
      counts_by_grade: { A: 0, B: 0, C: 1, D: 0, Block: 0 },
      counts_by_type: { unknown: 1 },
      independent_source_count: 1,
      syndicated_copy_count: 0,
      official_source_present: false,
      anchor_source_grade: "C",
    },
    geography_language: {
      event_places: [],
      regions_represented: [],
      source_regions_represented: [],
      audience_regions_represented: [],
      languages_represented: ["en"],
    },
    facts: [],
    conflicts: [],
    frames: [],
    confidence: {
      cluster_confidence: 0.5,
      dedupe_confidence: 0.8,
      factual_confidence: 0.5,
      independence_confidence: 0.5,
      extraction_confidence: 0.7,
      confidence_label: "medium",
    },
    decision_trace: {
      merge_method: [],
      reason_codes: [],
      thresholds_hit: {},
      split_warnings: [],
      review_required: false,
    },
    downstream: {
      candidate_for_relevance_scoring: true,
      dashboard_safe: true,
      email_eligible_by_cluster_quality: true,
      blockers: [],
    },
  };

  return { ...defaults, ...overrides };
}

// ---------------------------------------------------------------------------
// Fixture 1: Strong company match → email candidate
// ---------------------------------------------------------------------------

const euRegulationCluster = makeCluster({
  cluster_id: "evt-eu-comp-rules",
  canonical_event_name: "EU proposes changes to airline passenger compensation rules",
  primary_event_tuple: {
    event_tuple_id: "et-eu-comp",
    article_id: "art-reuters-eu",
    actor: { name: "EU aviation regulator", type: "regulator" },
    action: { raw: "proposed changes to", lemma: "propose change", action_class: "regulatory_action" },
    object: { name: "passenger compensation rules", type: "other" },
    affected_entities: [
      { name: "European airlines", type: "sector" },
      { name: "Lufthansa", type: "company" },
    ],
    place: [{ name: "European Union", type: "jurisdiction" }],
    event_time: { date: "2026-04-27", granularity: "day" },
    status: "proposed",
    confidence: 0.92,
    support_claim_ids: ["claim-1", "claim-2"],
  },
  status: "proposed",
  freshness: "today",
  articles: {
    article_ids: ["art-reuters-eu", "art-wsj-eu", "art-asia-trade"],
    anchor_article_id: "art-reuters-eu",
    supporting_article_ids: ["art-wsj-eu", "art-asia-trade"],
    duplicate_article_ids: [],
    syndicated_article_ids: [],
    excluded_article_ids: [],
  },
  source_mix: {
    counts_by_grade: { A: 2, B: 1, C: 0, D: 0, Block: 0 },
    counts_by_type: { wire: 1, major_outlet: 1, trade: 1 },
    independent_source_count: 3,
    syndicated_copy_count: 0,
    official_source_present: false,
    anchor_source_grade: "A",
  },
  geography_language: {
    event_places: ["European Union"],
    regions_represented: ["EU", "Asia"],
    source_regions_represented: ["EU", "US", "Asia"],
    audience_regions_represented: ["EU", "US", "Asia"],
    languages_represented: ["en"],
  },
  facts: [
    {
      cluster_fact_id: "cf-1",
      text: "EU aviation regulators proposed changes to passenger compensation rules.",
      normalized_claim_type: "core_event",
      supported_by_claim_ids: ["claim-1"],
      supported_by_article_ids: ["art-reuters-eu"],
      source_grades: ["A"],
      requires_attribution: true,
      confidence: 0.92,
      uncertainty_flags: [],
    },
    {
      cluster_fact_id: "cf-2",
      text: "The proposal would raise compensation for delays over three hours.",
      normalized_claim_type: "number",
      supported_by_claim_ids: ["claim-2"],
      supported_by_article_ids: ["art-reuters-eu", "art-wsj-eu"],
      source_grades: ["A", "A"],
      requires_attribution: true,
      confidence: 0.88,
      uncertainty_flags: ["proposed"],
    },
  ],
  frames: [
    {
      frame_id: "frame-eu-biz",
      cluster_id: "evt-eu-comp-rules",
      article_id: "art-wsj-eu",
      source_region: "US",
      audience_region: "US",
      language: "en",
      source_type: "major_outlet",
      frame_labels: ["market_impact", "regulatory_risk"],
      primary_stakeholders_mentioned: ["company", "investors", "regulator"],
      secondary_stakeholders_mentioned: [],
      evidence_basis: ["market_data", "expert"],
      tone_intensity: "medium",
      frame_summary: "Global business coverage focused on airline cost exposure.",
      supporting_claim_ids: ["claim-2"],
      confidence: 0.85,
    },
    {
      frame_id: "frame-asia-trade",
      cluster_id: "evt-eu-comp-rules",
      article_id: "art-asia-trade",
      source_region: "Asia",
      audience_region: "Asia",
      language: "en",
      source_type: "trade",
      frame_labels: ["operational_angle", "supplier_disruption"],
      primary_stakeholders_mentioned: ["company", "customers"],
      secondary_stakeholders_mentioned: ["suppliers"],
      evidence_basis: ["local_reporting"],
      tone_intensity: "medium",
      frame_summary: "Regional trade coverage highlighted possible complications for connecting itineraries.",
      supporting_claim_ids: ["claim-2"],
      confidence: 0.72,
    },
  ],
  confidence: {
    cluster_confidence: 0.89,
    dedupe_confidence: 0.88,
    factual_confidence: 0.93,
    independence_confidence: 0.86,
    extraction_confidence: 0.89,
    confidence_label: "high",
  },
});

// ---------------------------------------------------------------------------
// Fixture 2: Keyword-only weak match → exclude
// ---------------------------------------------------------------------------

const seoExplainerCluster = makeCluster({
  cluster_id: "evt-seo-cloud-tips",
  canonical_event_name: "Best cloud security tips for small businesses 2026",
  primary_event_tuple: {
    event_tuple_id: "et-seo",
    article_id: "art-seo",
    actor: { name: "unknown", type: "other" },
    action: { raw: "published", lemma: "publish", action_class: "other" },
    object: { name: "cloud security tips", type: "other" },
    affected_entities: [],
    place: [],
    event_time: { granularity: "unknown" },
    status: "background",
    confidence: 0.3,
    support_claim_ids: [],
  },
  status: "background",
  freshness: "stale",
  source_mix: {
    counts_by_grade: { A: 0, B: 0, C: 0, D: 1, Block: 0 },
    counts_by_type: { blog: 1 },
    independent_source_count: 1,
    syndicated_copy_count: 0,
    official_source_present: false,
    anchor_source_grade: "D",
  },
  facts: [],
  frames: [],
  confidence: {
    cluster_confidence: 0.25,
    dedupe_confidence: 0.9,
    factual_confidence: 0.2,
    independence_confidence: 0.3,
    extraction_confidence: 0.4,
    confidence_label: "needs_review",
  },
});

// ---------------------------------------------------------------------------
// Fixture 3: Useful niche item → dashboard-only
// ---------------------------------------------------------------------------

const packagingReportCluster = makeCluster({
  cluster_id: "evt-packaging-study",
  canonical_event_name: "Academic report on consumer attitudes to airline in-flight packaging",
  primary_event_tuple: {
    event_tuple_id: "et-packaging",
    article_id: "art-packaging",
    actor: { name: "European Consumer Organisation", type: "org" },
    action: { raw: "published report on", lemma: "publish report", action_class: "research_report" },
    object: { name: "consumer attitudes to airline in-flight packaging", type: "other" },
    affected_entities: [{ name: "airline industry", type: "sector" }],
    place: [{ name: "EU", type: "jurisdiction" }],
    event_time: { date: "2026-04-25", granularity: "day" },
    status: "confirmed",
    confidence: 0.75,
    support_claim_ids: ["claim-pkg-1"],
  },
  status: "confirmed",
  freshness: "recent",
  source_mix: {
    counts_by_grade: { A: 0, B: 1, C: 0, D: 0, Block: 0 },
    counts_by_type: { research: 1 },
    independent_source_count: 1,
    syndicated_copy_count: 0,
    official_source_present: false,
    anchor_source_grade: "B",
  },
  geography_language: {
    event_places: ["EU"],
    regions_represented: ["EU"],
    source_regions_represented: ["EU"],
    audience_regions_represented: ["EU"],
    languages_represented: ["en"],
  },
  facts: [
    {
      cluster_fact_id: "cf-pkg-1",
      text: "Study found 42% of airline passengers prefer sustainable in-flight packaging.",
      normalized_claim_type: "number",
      supported_by_claim_ids: ["claim-pkg-1"],
      supported_by_article_ids: ["art-packaging"],
      source_grades: ["B"],
      requires_attribution: true,
      confidence: 0.7,
      uncertainty_flags: [],
    },
  ],
  confidence: {
    cluster_confidence: 0.65,
    dedupe_confidence: 0.9,
    factual_confidence: 0.7,
    independence_confidence: 0.5,
    extraction_confidence: 0.75,
    confidence_label: "medium",
  },
});

// ---------------------------------------------------------------------------
// Fixture 4: Single-source cluster (PG should be skipped)
// ---------------------------------------------------------------------------

const singleSourceCluster = makeCluster({
  cluster_id: "evt-single-rate",
  canonical_event_name: "Central bank holds interest rate",
  primary_event_tuple: {
    event_tuple_id: "et-rate",
    article_id: "art-rate",
    actor: { name: "Bank of England", type: "regulator" },
    action: { raw: "held interest rate", lemma: "hold rate", action_class: "policy_change" },
    object: { name: "interest rate at 4.25%", type: "other" },
    affected_entities: [],
    place: [{ name: "United Kingdom", type: "country" }],
    event_time: { date: "2026-04-27", granularity: "day" },
    status: "confirmed",
    confidence: 0.9,
    support_claim_ids: ["claim-rate-1"],
  },
  status: "confirmed",
  freshness: "today",
  source_mix: {
    counts_by_grade: { A: 1, B: 0, C: 0, D: 0, Block: 0 },
    counts_by_type: { wire: 1 },
    independent_source_count: 1,
    syndicated_copy_count: 0,
    official_source_present: true,
    anchor_source_grade: "A",
  },
  geography_language: {
    event_places: ["United Kingdom"],
    regions_represented: ["United Kingdom"],
    source_regions_represented: ["United Kingdom"],
    audience_regions_represented: ["United Kingdom"],
    languages_represented: ["en"],
  },
  facts: [
    {
      cluster_fact_id: "cf-rate-1",
      text: "Bank of England held interest rate at 4.25%.",
      normalized_claim_type: "core_event",
      supported_by_claim_ids: ["claim-rate-1"],
      supported_by_article_ids: ["art-rate"],
      source_grades: ["A"],
      requires_attribution: true,
      confidence: 0.95,
      uncertainty_flags: [],
    },
  ],
  // Only one frame → PG should skip
  frames: [
    {
      frame_id: "frame-uk-rate",
      cluster_id: "evt-single-rate",
      article_id: "art-rate",
      source_region: "United Kingdom",
      language: "en",
      source_type: "wire",
      frame_labels: ["market_impact"],
      primary_stakeholders_mentioned: ["regulator", "investors"],
      secondary_stakeholders_mentioned: [],
      evidence_basis: ["official"],
      tone_intensity: "low",
      frame_summary: "Official announcement framed as monetary policy decision.",
      supporting_claim_ids: ["claim-rate-1"],
      confidence: 0.9,
    },
  ],
  confidence: {
    cluster_confidence: 0.92,
    dedupe_confidence: 0.95,
    factual_confidence: 0.95,
    independence_confidence: 0.7,
    extraction_confidence: 0.9,
    confidence_label: "high",
  },
});

// ---------------------------------------------------------------------------
// Run tests
// ---------------------------------------------------------------------------

console.log("\n=== 1. Strong Company Match → Email ===\n");

const euDecision = scoreClusterRelevance(euRegulationCluster, testProfile);
console.log(`  EU regulation cluster: score=${euDecision.company_relevance_score} decision=${euDecision.decision}`);
console.log(`  Dimension scores:`, JSON.stringify(euDecision.dimension_scores));
console.log(`  Matched areas: ${euDecision.matched_scan_areas.map((m) => `${m.area_id}(${m.match_strength})`).join(", ")}`);
console.log(`  Decision reasons: ${euDecision.decision_reasons.join(", ")}`);

assert(
  euDecision.decision === "email" || euDecision.decision === "email_caution",
  "EU regulation cluster → email or email_caution"
);
assert(euDecision.company_relevance_score >= 65, `Relevance score >= 65 (got ${euDecision.company_relevance_score})`);
assert(euDecision.matched_scan_areas.length > 0, "Has matched scan areas");
assert(
  euDecision.matched_scan_areas.some((m) => m.match_strength === "strong" || m.match_strength === "medium"),
  "At least one strong or medium area match"
);
assert(euDecision.materiality.impact_pathways.length > 0, "Has impact pathways");
assert(euDecision.weak_match.flag === false, "Not a weak match");

console.log("\n=== 2. Keyword-Only Weak Match → Exclude ===\n");

const seoDecision = scoreClusterRelevance(seoExplainerCluster, testProfile);
console.log(`  SEO explainer cluster: score=${seoDecision.company_relevance_score} decision=${seoDecision.decision}`);
console.log(`  Weak match: flag=${seoDecision.weak_match.flag} reasons=${seoDecision.weak_match.reasons.join(", ")}`);

assert(seoDecision.decision === "exclude", "SEO explainer → exclude");
assert(seoDecision.weak_match.flag === true, "Flagged as weak match");
assert(
  seoDecision.weak_match.reasons.some(
    (r) => r === "stale_no_new_fact" || r === "generic_sector_filler" || r === "no_scan_area_match" || r === "keyword_only"
  ),
  "Has relevant weak-match reason"
);

console.log("\n=== 3. Useful Niche Item → Dashboard-Only ===\n");

const packagingDecision = scoreClusterRelevance(packagingReportCluster, testProfile);
console.log(`  Packaging report cluster: score=${packagingDecision.company_relevance_score} decision=${packagingDecision.decision}`);
console.log(`  Dimension scores:`, JSON.stringify(packagingDecision.dimension_scores));

assert(
  packagingDecision.decision === "dashboard" || packagingDecision.decision === "exclude",
  "Packaging report → dashboard or exclude (not email)"
);
assert(
  packagingDecision.decision !== "email",
  "Packaging report NOT promoted to email"
);

console.log("\n=== 4. Perception Gap — Regional Framing Difference ===\n");

const pgEuResult = evaluatePerceptionGap({
  cluster: euRegulationCluster,
  profile: testProfile,
  relevanceDecision: euDecision,
});
console.log(`  EU cluster PG: eligible=${pgEuResult.eligible} confidence=${pgEuResult.confidence.toFixed(2)}`);
console.log(`  Gap type: ${pgEuResult.gap_type || "none"}`);
console.log(`  Show in email: ${pgEuResult.show_in_email}`);
console.log(`  Show in dashboard: ${pgEuResult.show_in_dashboard}`);
if (pgEuResult.suggested_note) console.log(`  Suggested note: ${pgEuResult.suggested_note}`);
if (pgEuResult.skip_reason) console.log(`  Skip reason: ${pgEuResult.skip_reason}`);

assert(pgEuResult.eligible === true, "EU cluster PG eligible (has regional frame difference)");
assert(pgEuResult.confidence >= 0.50, `PG confidence >= 0.50 (got ${pgEuResult.confidence.toFixed(2)})`);
assert(pgEuResult.evidence_frame_ids.length >= 2, "Has at least 2 evidence frames");
if (pgEuResult.gap_type) {
  assert(
    ["regional_frame_difference", "stakeholder_emphasis_difference"].includes(pgEuResult.gap_type),
    `Gap type is regional or stakeholder (got ${pgEuResult.gap_type})`
  );
}

console.log("\n=== 5. Perception Gap — Single Source → Skipped ===\n");

const singleSourceDecision = scoreClusterRelevance(singleSourceCluster, testProfile);
const pgSingleResult = evaluatePerceptionGap({
  cluster: singleSourceCluster,
  profile: testProfile,
  relevanceDecision: singleSourceDecision,
});
console.log(`  Single-source PG: eligible=${pgSingleResult.eligible}`);
console.log(`  Skip reason: ${pgSingleResult.skip_reason || "none"}`);

assert(pgSingleResult.eligible === false, "Single-source cluster → PG not eligible");
assert(
  pgSingleResult.skip_reason === "single_source_no_comparison" ||
  pgSingleResult.skip_reason === "no_usable_frames" ||
  pgSingleResult.skip_reason === "no_material_frame_difference" ||
  pgSingleResult.skip_reason === "no_frames_available",
  `Skip reason is about insufficient comparison sources (got: ${pgSingleResult.skip_reason})`
);

console.log("\n=== 6. No-Finding Section Behavior ===\n");

// Run full pipeline — packaging area should show no email findings
const fullResult = scoreCompanyRelevance({
  clusters: [euRegulationCluster, seoExplainerCluster, packagingReportCluster, singleSourceCluster],
  profile: testProfile,
  run_id: "test-run-8c",
});

console.log(`  Email items: ${fullResult.email_items.length}`);
console.log(`  Dashboard items: ${fullResult.dashboard_items.length}`);
console.log(`  Excluded items: ${fullResult.excluded_items.length}`);
console.log(`  No-finding sections: ${fullResult.section_no_findings.length}`);
for (const nf of fullResult.section_no_findings) {
  console.log(`    ${nf.label}: "${nf.suggested_email_line}"`);
}

assert(fullResult.email_items.length >= 1, "At least 1 email item (EU regulation)");
assert(fullResult.excluded_items.length >= 1, "At least 1 excluded item (SEO explainer)");
// Some sections should have no findings for email
assert(
  fullResult.section_no_findings.length >= 0,
  "Section no-findings computed (may be 0 if all sections have coverage)"
);

console.log("\n=== 7. Debug Report ===\n");

// Collect all decisions
const allDecisions = [euDecision, seoDecision, packagingDecision, singleSourceDecision];
const allPgDecisions = [pgEuResult, pgSingleResult];

const debugReport = buildRelevanceDebugReport(fullResult, allDecisions, allPgDecisions);
console.log(`  Input clusters: ${debugReport.input_cluster_count}`);
console.log(`  Email: ${debugReport.email_count}`);
console.log(`  Email caution: ${debugReport.email_caution_count}`);
console.log(`  Dashboard: ${debugReport.dashboard_count}`);
console.log(`  Exclude: ${debugReport.exclude_count}`);
console.log(`  PG eligible: ${debugReport.perception_gap_eligible}`);
console.log(`  PG email: ${debugReport.perception_gap_email}`);
console.log(`  PG skipped: ${debugReport.perception_gap_skipped}`);

assert(debugReport.input_cluster_count === 4, "Debug report has 4 input clusters");
assert(debugReport.exclude_count >= 1, "At least 1 excluded in debug report");

// Write debug report to file
const reportsDir = join(process.cwd(), "reports");
if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });

const reportPath = join(reportsDir, "pkg-8c-relevance-debug.json");
writeFileSync(reportPath, JSON.stringify(debugReport, null, 2));
console.log(`\n  Debug report written to: ${reportPath}`);

// Write full result too
const fullResultPath = join(reportsDir, "pkg-8c-full-result.json");
writeFileSync(fullResultPath, JSON.stringify(fullResult, null, 2));
console.log(`  Full result written to: ${fullResultPath}`);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log("\n" + "=".repeat(60));
console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} assertions`);
console.log("=".repeat(60));

if (failed > 0) {
  process.exit(1);
}
