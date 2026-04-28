#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// Package 8D — Dry-run test for company briefing generation.
//
// Builds a fixture Test Company evidence packet from synthetic 8A/8B/8C data,
// generates a dry-run briefing, validates the output schema, and writes
// debug artifacts under reports/.
//
// Usage:
//   npx tsx scripts/test-company-briefing-generation.ts
//
// This script does NOT:
//   - Connect to Supabase
//   - Send real emails
//   - Require an OpenAI API key
//   - Use public scan data
// ---------------------------------------------------------------------------

import { buildEvidencePacket } from "../src/lib/company-scan/briefing-evidence-packet";
import { generateCompanyBriefing } from "../src/lib/company-scan/company-briefing-generator";
import { generateCompanyBriefingHtmlV2, generateBriefingSubjectV2 } from "../src/lib/email-templates/company-briefing-v2";
import type {
  CompanyBriefingProfile,
  EventCluster,
  EmailCandidateItem,
  PerceptionGapDecision,
  CompanyRelevanceResult,
  SectionNoFinding,
  ClusterFact,
  ClusterConflict,
  ClusterFrame,
  QualityGrade,
} from "../src/lib/company-scan/types";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Fixture data: Test Company
// ---------------------------------------------------------------------------

const TEST_PROFILE: CompanyBriefingProfile = {
  company_id: "co_test_company",
  display_name: "Test Company",
  industry: "Technology",
  sub_industries: ["SaaS", "Cloud Infrastructure"],
  operating_regions: ["US", "EU", "UK"],
  customer_regions: ["US", "EU", "Asia"],
  supplier_regions: ["Asia", "US"],
  regulatory_regions: ["EU", "UK", "US"],
  selected_scan_areas: [
    {
      area_id: "ai_regulation",
      label: "AI Regulation",
      category: "regulation",
      priority: "high",
      regions: ["EU", "UK", "US"],
      description: "AI compliance and regulatory developments",
    },
    {
      area_id: "cloud_infrastructure",
      label: "Cloud Infrastructure",
      category: "technology",
      priority: "high",
      regions: ["US", "EU"],
      description: "Cloud/data center supply and capacity",
    },
    {
      area_id: "data_privacy",
      label: "Data Privacy",
      category: "regulation",
      priority: "medium",
      regions: ["EU", "UK"],
      description: "GDPR and data protection developments",
    },
  ],
  watch_entities: [
    { entity_id: "we_1", name: "AWS", type: "supplier", aliases: ["Amazon Web Services"] },
    { entity_id: "we_2", name: "Microsoft Azure", type: "competitor" },
    { entity_id: "we_3", name: "European Commission", type: "regulator" },
  ],
};

function makeCluster(overrides: Partial<EventCluster> & { cluster_id: string; canonical_event_name: string }): EventCluster {
  return {
    schema_version: "event_cluster_v1",
    created_at: "2026-04-28T06:00:00Z",
    updated_at: "2026-04-28T06:00:00Z",
    ingest_run_ids: ["run_test"],
    canonical_event_slug: overrides.canonical_event_name.toLowerCase().replace(/\s+/g, "-").slice(0, 60),
    primary_event_tuple: {
      event_tuple_id: `et_${overrides.cluster_id}`,
      article_id: "art_anchor",
      actor: { name: "EU Commission", type: "org" },
      action: { raw: "proposed", lemma: "propose", action_class: "regulatory_action" as any },
      object: { name: "new AI compliance rules", type: "other" },
      affected_entities: [],
      place: [{ name: "EU", type: "region" as any }],
      event_time: { date: "2026-04-27", granularity: "day" as any },
      status: "proposed" as any,
      confidence: 0.88,
      support_claim_ids: ["c1"],
    },
    related_event_tuples: [],
    status: "proposed",
    freshness: "today",
    articles: {
      article_ids: ["art_reuters_ai", "art_ft_ai", "art_asia_trade_ai"],
      anchor_article_id: "art_reuters_ai",
      supporting_article_ids: ["art_ft_ai", "art_asia_trade_ai"],
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
      anchor_source_grade: "A" as QualityGrade,
    },
    geography_language: {
      event_places: ["EU"],
      regions_represented: ["EU", "US", "Asia"],
      source_regions_represented: ["EU", "US", "Asia"],
      audience_regions_represented: ["global"],
      languages_represented: ["en"],
    },
    facts: [
      {
        cluster_fact_id: "fact_ai_proposal",
        text: "The European Commission proposed new AI compliance documentation requirements for high-risk AI systems.",
        normalized_claim_type: "core_event",
        supported_by_claim_ids: ["c1"],
        supported_by_article_ids: ["art_reuters_ai"],
        source_grades: ["A" as QualityGrade],
        requires_attribution: true,
        confidence: 0.92,
        uncertainty_flags: [],
      },
      {
        cluster_fact_id: "fact_ai_cost",
        text: "Business analysis indicates the proposal could increase compliance costs for AI product companies operating in EU markets.",
        normalized_claim_type: "impact",
        supported_by_claim_ids: ["c2"],
        supported_by_article_ids: ["art_ft_ai"],
        source_grades: ["A" as QualityGrade],
        requires_attribution: true,
        confidence: 0.78,
        uncertainty_flags: [],
      },
      {
        cluster_fact_id: "fact_ai_asia_angle",
        text: "Asian technology trade coverage highlighted that the rules may affect cross-border AI service agreements.",
        normalized_claim_type: "context",
        supported_by_claim_ids: ["c3"],
        supported_by_article_ids: ["art_asia_trade_ai"],
        source_grades: ["B" as QualityGrade],
        requires_attribution: false,
        confidence: 0.70,
        uncertainty_flags: [],
      },
    ] as ClusterFact[],
    conflicts: [],
    frames: [
      {
        frame_id: "frame_eu_compliance",
        cluster_id: "evt_eu_ai_compliance_2026_04_27",
        article_id: "art_ft_ai",
        source_region: "EU",
        audience_region: "EU",
        language: "en",
        source_type: "major_outlet",
        frame_labels: ["market_impact", "regulatory_risk"],
        primary_stakeholders_mentioned: ["AI companies", "regulators", "consumers"],
        secondary_stakeholders_mentioned: [],
        evidence_basis: ["EU Commission proposal document", "industry cost estimates"],
        tone_intensity: "medium",
        frame_summary: "European business coverage focused on compliance cost and documentation burden for AI companies.",
        supporting_claim_ids: ["c1", "c2"],
        confidence: 0.85,
      },
      {
        frame_id: "frame_asia_services",
        cluster_id: "evt_eu_ai_compliance_2026_04_27",
        article_id: "art_asia_trade_ai",
        source_region: "Asia",
        audience_region: "Asia",
        language: "en",
        source_type: "trade",
        frame_labels: ["operational_angle", "technology_angle"],
        primary_stakeholders_mentioned: ["technology exporters", "service providers"],
        secondary_stakeholders_mentioned: ["EU regulators"],
        evidence_basis: ["cross-border service agreements analysis"],
        tone_intensity: "low",
        frame_summary: "Asian trade coverage highlighted cross-border AI service agreement complications.",
        supporting_claim_ids: ["c3"],
        confidence: 0.72,
      },
    ] as ClusterFrame[],
    confidence: {
      cluster_confidence: 0.87,
      dedupe_confidence: 0.95,
      factual_confidence: 0.85,
      independence_confidence: 0.90,
      extraction_confidence: 0.82,
      confidence_label: "high",
    },
    decision_trace: {
      merge_method: ["event_tuple"],
      reason_codes: ["strong_tuple_match"],
      thresholds_hit: { event_tuple_similarity: 0.92 },
      split_warnings: [],
      review_required: false,
    },
    downstream: {
      candidate_for_relevance_scoring: true,
      dashboard_safe: true,
      email_eligible_by_cluster_quality: true,
      blockers: [],
    },
    ...overrides,
  };
}

const CLUSTER_AI = makeCluster({
  cluster_id: "evt_eu_ai_compliance_2026_04_27",
  canonical_event_name: "EU proposes new AI compliance documentation requirements",
});

const CLUSTER_CLOUD = makeCluster({
  cluster_id: "evt_aws_datacenter_eu_2026_04_27",
  canonical_event_name: "AWS announces new EU data center region",
  status: "confirmed",
  primary_event_tuple: {
    ...CLUSTER_AI.primary_event_tuple,
    event_tuple_id: "et_cloud",
    actor: { name: "AWS", type: "company" },
    action: { raw: "announced", lemma: "announce", action_class: "product_launch" as any },
    object: { name: "new EU data center region", type: "other" },
    status: "confirmed" as any,
  },
  articles: {
    article_ids: ["art_reuters_cloud", "art_techcrunch_cloud"],
    anchor_article_id: "art_reuters_cloud",
    supporting_article_ids: ["art_techcrunch_cloud"],
    duplicate_article_ids: [],
    syndicated_article_ids: [],
    excluded_article_ids: [],
  },
  facts: [
    {
      cluster_fact_id: "fact_aws_datacenter",
      text: "AWS confirmed plans to open a new data center region in the EU to meet growing cloud demand.",
      normalized_claim_type: "core_event",
      supported_by_claim_ids: ["c4"],
      supported_by_article_ids: ["art_reuters_cloud"],
      source_grades: ["A" as QualityGrade],
      requires_attribution: false,
      confidence: 0.94,
      uncertainty_flags: [],
    },
    {
      cluster_fact_id: "fact_cloud_capacity",
      text: "The expansion addresses capacity constraints reported by European cloud customers.",
      normalized_claim_type: "context",
      supported_by_claim_ids: ["c5"],
      supported_by_article_ids: ["art_techcrunch_cloud"],
      source_grades: ["B" as QualityGrade],
      requires_attribution: false,
      confidence: 0.80,
      uncertainty_flags: [],
    },
  ] as ClusterFact[],
  frames: [],
  source_mix: {
    counts_by_grade: { A: 1, B: 1, C: 0, D: 0, Block: 0 },
    counts_by_type: { wire: 1, trade: 1 },
    independent_source_count: 2,
    syndicated_copy_count: 0,
    official_source_present: false,
    anchor_source_grade: "A" as QualityGrade,
  },
});

// Email candidate items from 8C
const EMAIL_CANDIDATES: EmailCandidateItem[] = [
  {
    item_id: "item_ai_compliance",
    cluster_id: "evt_eu_ai_compliance_2026_04_27",
    section_ids: ["ai_regulation"],
    title: "EU proposes new AI compliance documentation requirements",
    canonical_event_name: "EU proposes new AI compliance documentation requirements",
    short_summary_facts: [
      "The European Commission proposed new AI compliance documentation requirements for high-risk AI systems.",
      "Business analysis indicates the proposal could increase compliance costs for AI product companies.",
    ],
    why_it_matters: {
      text: "Directly relevant to Test Company's EU AI-regulation exposure and product compliance planning.",
      supported_by: ["scan_area:ai_regulation", "fact_ai_proposal", "fact_ai_cost"],
    },
    uncertainty: ["The proposal is not yet final and implementation timing is not settled."],
    relevance_decision: {
      cluster_id: "evt_eu_ai_compliance_2026_04_27",
      decision: "email",
      company_relevance_score: 88,
      dimension_scores: {
        selected_area_fit: 18,
        entity_proximity: 10,
        business_materiality: 20,
        geography_fit: 10,
        timeliness: 8,
        specificity: 8,
        actionability: 7,
        evidence_strength: 7,
        novelty: 0,
      },
      matched_scan_areas: [
        { area_id: "ai_regulation", match_strength: "strong", match_type: ["direct_company"], evidence: ["EU AI regulation"], explanation: "Direct match to AI regulation scan area" },
      ],
      materiality: { score: 20, categories: ["regulatory_compliance", "cost"], impact_pathways: [{ category: "regulatory_compliance", pathway: "AI documentation requirements", supported_by: ["fact_ai_proposal"], confidence: 0.85 }] },
      geography: { affected_regions: ["EU"], source_regions: ["EU", "US", "Asia"], company_relevant_regions: ["EU"], geography_fit_score: 10, geography_reason: "EU regulatory development" },
      time: { published_window: "last_24h", first_seen_at: "2026-04-27T14:00:00Z", last_seen_at: "2026-04-28T06:00:00Z", freshness: "today" },
      novelty: { seen_before: false, novelty_score: 0, novelty_reason: "new" },
      weak_match: { flag: false, reasons: [] },
      decision_reasons: ["strong_area_match", "high_materiality", "A_source_anchor"],
    },
    perception_gap: {
      cluster_id: "evt_eu_ai_compliance_2026_04_27",
      eligible: true,
      show_in_email: true,
      show_in_dashboard: true,
      gap_type: "regional_frame_difference",
      evidence_frame_ids: ["frame_eu_compliance", "frame_asia_services"],
      compared_dimensions: ["region", "stakeholder"],
      material_difference: "EU coverage focused on compliance cost, Asian trade coverage highlighted cross-border service agreement complexity.",
      company_relevance: "Both frames matter: compliance cost affects EU operations; cross-border service complexity affects Asian customer agreements.",
      suggested_note: "European business coverage focused on compliance cost and documentation burden, while Asian trade coverage highlighted possible complications for cross-border AI service agreements.",
      confidence: 0.76,
    },
    source_summary: {
      anchor: { source: "Reuters", grade: "A" as QualityGrade, url: "https://example.com/reuters-ai-rules", article_id: "art_reuters_ai" },
      supporting: [
        { source: "Financial Times", grade: "A", url: "https://example.com/ft-ai-costs", article_id: "art_ft_ai" },
        { source: "Asia Tech Trade", grade: "B", url: "https://example.com/asia-ai-services", article_id: "art_asia_trade_ai" },
      ],
    },
  },
  {
    item_id: "item_aws_datacenter",
    cluster_id: "evt_aws_datacenter_eu_2026_04_27",
    section_ids: ["cloud_infrastructure"],
    title: "AWS announces new EU data center region",
    canonical_event_name: "AWS announces new EU data center region",
    short_summary_facts: [
      "AWS confirmed plans to open a new data center region in the EU.",
      "The expansion addresses capacity constraints reported by European cloud customers.",
    ],
    why_it_matters: {
      text: "AWS is a key infrastructure supplier for Test Company. New EU capacity may improve service availability and latency for European customers.",
      supported_by: ["scan_area:cloud_infrastructure", "fact_aws_datacenter"],
    },
    uncertainty: undefined,
    relevance_decision: {
      cluster_id: "evt_aws_datacenter_eu_2026_04_27",
      decision: "email",
      company_relevance_score: 82,
      dimension_scores: {
        selected_area_fit: 16,
        entity_proximity: 14,
        business_materiality: 18,
        geography_fit: 10,
        timeliness: 8,
        specificity: 6,
        actionability: 6,
        evidence_strength: 4,
        novelty: 0,
      },
      matched_scan_areas: [
        { area_id: "cloud_infrastructure", match_strength: "strong", match_type: ["watch_entity"], evidence: ["AWS"], explanation: "Watch entity match: AWS" },
      ],
      materiality: { score: 18, categories: ["operations", "supply_chain"], impact_pathways: [{ category: "operations", pathway: "Cloud infrastructure capacity", supported_by: ["fact_aws_datacenter"], confidence: 0.9 }] },
      geography: { affected_regions: ["EU"], source_regions: ["US"], company_relevant_regions: ["EU"], geography_fit_score: 10, geography_reason: "EU operational region" },
      time: { published_window: "last_24h", first_seen_at: "2026-04-28T02:00:00Z", last_seen_at: "2026-04-28T06:00:00Z", freshness: "today" },
      novelty: { seen_before: false, novelty_score: 0, novelty_reason: "new" },
      weak_match: { flag: false, reasons: [] },
      decision_reasons: ["watch_entity_match", "high_materiality", "A_source_anchor"],
    },
    source_summary: {
      anchor: { source: "Reuters", grade: "A" as QualityGrade, url: "https://example.com/reuters-aws-datacenter", article_id: "art_reuters_cloud" },
      supporting: [
        { source: "TechCrunch", grade: "B", url: "https://example.com/techcrunch-aws-eu", article_id: "art_techcrunch_cloud" },
      ],
    },
  },
];

const PG_DECISIONS: PerceptionGapDecision[] = [
  {
    cluster_id: "evt_eu_ai_compliance_2026_04_27",
    eligible: true,
    show_in_email: true,
    show_in_dashboard: true,
    gap_type: "regional_frame_difference",
    evidence_frame_ids: ["frame_eu_compliance", "frame_asia_services"],
    compared_dimensions: ["region", "stakeholder"],
    material_difference: "EU compliance cost vs cross-border service complexity",
    company_relevance: "Both frames affect operations",
    suggested_note: "European business coverage focused on compliance cost and documentation burden, while Asian trade coverage highlighted possible complications for cross-border AI service agreements.",
    confidence: 0.76,
  },
];

const RELEVANCE_RESULT: CompanyRelevanceResult = {
  company_id: "co_test_company",
  run_id: "run_8d_test_2026_04_28",
  created_at: "2026-04-28T07:00:00Z",
  email_items: EMAIL_CANDIDATES,
  dashboard_items: [
    {
      cluster_id: "evt_minor_privacy_update",
      canonical_event_name: "Minor GDPR guidance update",
      decision: {
        cluster_id: "evt_minor_privacy_update",
        decision: "dashboard",
        company_relevance_score: 52,
        dimension_scores: { selected_area_fit: 10, entity_proximity: 4, business_materiality: 12, geography_fit: 8, timeliness: 6, specificity: 4, actionability: 4, evidence_strength: 4, novelty: 0 },
        matched_scan_areas: [{ area_id: "data_privacy", match_strength: "medium", match_type: ["topic_semantic"], evidence: ["GDPR"], explanation: "GDPR topic match" }],
        materiality: { score: 12, categories: ["regulatory_compliance"], impact_pathways: [] },
        geography: { affected_regions: ["EU"], source_regions: ["EU"], company_relevant_regions: ["EU"], geography_fit_score: 8, geography_reason: "EU" },
        time: { published_window: "last_24h", first_seen_at: "2026-04-28T04:00:00Z", last_seen_at: "2026-04-28T06:00:00Z", freshness: "today" },
        novelty: { seen_before: false, novelty_score: 0, novelty_reason: "new" },
        weak_match: { flag: false, reasons: [] },
        decision_reasons: ["low_materiality", "medium_relevance"],
      },
    },
  ],
  excluded_items: [
    {
      cluster_id: "evt_seo_spam_article",
      canonical_event_name: "Best AI Tools 2026: Complete Guide",
      decision: {
        cluster_id: "evt_seo_spam_article",
        decision: "exclude",
        company_relevance_score: 15,
        dimension_scores: { selected_area_fit: 4, entity_proximity: 0, business_materiality: 2, geography_fit: 2, timeliness: 4, specificity: 2, actionability: 1, evidence_strength: 0, novelty: 0 },
        matched_scan_areas: [],
        materiality: { score: 2, categories: [], impact_pathways: [] },
        geography: { affected_regions: [], source_regions: [], company_relevant_regions: [], geography_fit_score: 2, geography_reason: "generic" },
        time: { published_window: "last_24h", first_seen_at: "2026-04-28T00:00:00Z", last_seen_at: "2026-04-28T00:00:00Z", freshness: "today" },
        novelty: { seen_before: false, novelty_score: 0, novelty_reason: "" },
        weak_match: { flag: true, reasons: ["keyword_only", "seo_sludge"] },
        decision_reasons: ["keyword_only", "seo_sludge"],
        exclusion_reasons: ["keyword_only", "seo_sludge"],
      },
    },
  ],
  section_no_findings: [
    {
      section_id: "data_privacy",
      label: "Data Privacy",
      scan_coverage_count: 12,
      no_material_findings: true,
      top_excluded_reasons: ["low_materiality"],
      email_line_allowed: false,
    },
  ],
  perception_gap_decisions: PG_DECISIONS,
};

// ---------------------------------------------------------------------------
// Main test runner
// ---------------------------------------------------------------------------

function main() {
  console.log("=== Package 8D: Company Briefing Generation Dry-Run Test ===\n");

  const runId = "run_8d_test_2026_04_28";
  const clusters = [CLUSTER_AI, CLUSTER_CLOUD];

  // Step 1: Build evidence packet
  console.log("Step 1: Building evidence packet...");
  const packet = buildEvidencePacket({
    profile: TEST_PROFILE,
    relevanceResult: RELEVANCE_RESULT,
    clusters,
    perceptionGapDecisions: PG_DECISIONS,
    normalizedArticles: [], // no full articles in test fixture
    run_id: runId,
    scan_window: { from: "2026-04-27T00:00:00Z", to: "2026-04-28T06:00:00Z" },
    raw_articles_count: 48,
    normalized_articles_count: 32,
  });

  console.log(`  Packet version: ${packet.packet_version}`);
  console.log(`  Pipeline route: ${packet.pipeline.generation_route}`);
  console.log(`  Email items: ${packet.email_items.length}`);
  console.log(`  Dashboard items: ${packet.dashboard_only_items.length}`);
  console.log(`  Packet valid: ${packet.audit.packet_validation.valid}`);
  if (packet.audit.packet_validation.warnings.length > 0) {
    console.log(`  Warnings: ${packet.audit.packet_validation.warnings.join(", ")}`);
  }

  // Step 2: Generate briefing
  console.log("\nStep 2: Generating briefing (dry-run)...");
  const { output, metadata } = generateCompanyBriefing(packet, { dryRun: true });
  let liveGenerationBlocked = false;
  try {
    generateCompanyBriefing(packet, { dryRun: false });
  } catch {
    liveGenerationBlocked = true;
  }

  console.log(`  Output version: ${output.output_version}`);
  console.log(`  Generator version: ${metadata.generator_version}`);
  console.log(`  Today's Brief top line: "${output.today_brief.top_line.text}"`);
  console.log(`  Main Briefing sections: ${output.main_briefing.sections.length}`);
  console.log(`  Perception Gap notes: ${output.perception_gap.notes.length}`);
  console.log(`  Useful Observations: ${output.useful_observations.observations.length}`);
  console.log(`  Trace: dashboard items used in email: ${output.trace.dashboard_items_used_in_email.length} (must be 0)`);
  console.log(`  Trace: excluded items used in email: ${output.trace.excluded_items_used_in_email.length} (must be 0)`);
  console.log(`  Live generation guard: ${liveGenerationBlocked ? "blocked until wired" : "NOT BLOCKED"}`);

  // Step 3: Validate output
  console.log("\nStep 3: Validating output...");
  const validationErrors: string[] = [];

  // Check no banned headings
  const bannedHeadings = ["What Changed", "What to Watch Next"];
  for (const section of output.main_briefing.sections) {
    for (const banned of bannedHeadings) {
      if (section.heading.toLowerCase().includes(banned.toLowerCase())) {
        validationErrors.push(`Banned heading found: "${section.heading}"`);
      }
    }
  }

  // Check trace integrity
  if (output.trace.dashboard_items_used_in_email.length > 0) {
    validationErrors.push("Dashboard items used in email generation");
  }
  if (output.trace.excluded_items_used_in_email.length > 0) {
    validationErrors.push("Excluded items used in email generation");
  }
  if (output.trace.generator_route !== "internal_openclaw_cron") {
    validationErrors.push(`Wrong generator route: ${output.trace.generator_route}`);
  }

  // Check all packet items are used and still have source-backed facts
  const usedIds = new Set(output.trace.packet_item_ids_used);
  for (const item of packet.email_items) {
    if (!usedIds.has(item.item_id)) {
      validationErrors.push(`Packet item not used: ${item.item_id}`);
    }
    if (item.facts.length === 0) {
      validationErrors.push(`Packet item has no email-eligible facts: ${item.item_id}`);
    }
    for (const fact of item.facts) {
      if (fact.supported_by.length === 0) {
        validationErrors.push(`Packet fact lacks source support: ${fact.claim_id}`);
      }
    }
  }

  const generatedItems = output.main_briefing.sections.flatMap((s) => s.items);
  for (const item of generatedItems) {
    if (!item.body.text.trim()) {
      validationErrors.push(`Generated item has empty body: ${item.generated_item_id}`);
    }
    if (item.claim_map.length === 0) {
      validationErrors.push(`Generated item has no claim map: ${item.generated_item_id}`);
    }
  }

  if (!liveGenerationBlocked) {
    validationErrors.push("dryRun:false did not fail closed before live generation is wired");
  }

  // Check no raw source-headline clutter (WSJ: ..., Reuters: ...)
  const allText = JSON.stringify(output);
  const sourceClutter = /\b(WSJ|Reuters|Bloomberg|FT|BBC):\s/g;
  const clutterMatches = allText.match(sourceClutter);
  if (clutterMatches) {
    validationErrors.push(`Raw source-headline clutter found: ${clutterMatches.join(", ")}`);
  }

  // Check output schema has required sections
  if (!output.today_brief) validationErrors.push("Missing today_brief");
  if (!output.main_briefing) validationErrors.push("Missing main_briefing");
  if (!output.perception_gap) validationErrors.push("Missing perception_gap");
  if (!output.useful_observations) validationErrors.push("Missing useful_observations");
  if (!output.source_notes) validationErrors.push("Missing source_notes");

  if (validationErrors.length === 0) {
    console.log("  ✓ All validation checks passed.");
  } else {
    console.log("  ✗ Validation errors:");
    for (const err of validationErrors) {
      console.log(`    - ${err}`);
    }
  }

  // Step 4: Generate HTML email
  console.log("\nStep 4: Generating HTML email...");
  const html = generateCompanyBriefingHtmlV2(output, "Test Company", "2026-04-28");
  const subject = generateBriefingSubjectV2("Test Company", "2026-04-28");

  // Check HTML for banned headings
  const htmlBannedCheck = bannedHeadings.filter((h) => html.toLowerCase().includes(h.toLowerCase()));
  if (htmlBannedCheck.length > 0) {
    console.log(`  ✗ Banned headings in HTML: ${htmlBannedCheck.join(", ")}`);
  } else {
    console.log("  ✓ No banned headings in HTML.");
  }

  // Check HTML for required sections
  const requiredSections = ["Today's Brief", "Main Briefing", "Perception Gap", "Useful Observations"];
  for (const section of requiredSections) {
    if (!html.includes(section)) {
      console.log(`  ✗ Missing section in HTML: ${section}`);
    }
  }
  console.log(`  Subject: "${subject}"`);

  // Step 5: Write debug artifacts
  console.log("\nStep 5: Writing debug artifacts...");
  const reportsDir = path.resolve(__dirname, "../reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const packetPath = path.join(reportsDir, "pkg-8d-evidence-packet.json");
  const outputPath = path.join(reportsDir, "pkg-8d-generation-output.json");
  const metadataPath = path.join(reportsDir, "pkg-8d-generation-metadata.json");
  const htmlPath = path.join(reportsDir, "pkg-8d-briefing-preview.html");

  fs.writeFileSync(packetPath, JSON.stringify(packet, null, 2));
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  fs.writeFileSync(htmlPath, html);

  console.log(`  Written: ${packetPath}`);
  console.log(`  Written: ${outputPath}`);
  console.log(`  Written: ${metadataPath}`);
  console.log(`  Written: ${htmlPath}`);

  // Summary
  console.log("\n=== Summary ===");
  console.log(`  Packet valid: ${packet.audit.packet_validation.valid}`);
  console.log(`  Validation errors: ${validationErrors.length}`);
  console.log(`  Email items: ${packet.email_items.length}`);
  console.log(`  Dashboard items: ${packet.dashboard_only_items.length}`);
  console.log(`  Excluded items: ${Object.values(packet.excluded_summary.counts_by_reason).reduce((a, b) => (a ?? 0) + (b ?? 0), 0)}`);
  console.log(`  Sections with items: ${output.main_briefing.sections.filter((s) => s.items.length > 0).length}`);
  console.log(`  Perception Gap notes: ${output.perception_gap.notes.length}`);
  console.log(`  Observations: ${output.useful_observations.observations.length}`);
  console.log(`  Generator: ${metadata.generator_version} (${metadata.generation_route})`);
  console.log(`  Dry-run: ${metadata.dry_run}`);

  if (validationErrors.length > 0) {
    process.exit(1);
  }

  console.log("\n✓ Package 8D dry-run test completed successfully.");
}

main();
