// ---------------------------------------------------------------------------
// Package 8C — Company Relevance Gates.
//
// Layer 3 of the Package 8 funnel: decide which event clusters truly belong
// in a company briefing email, which are dashboard-only, and which to exclude.
//
// Input:  EventCluster[] from 8B + CompanyBriefingProfile
// Output: RelevanceDecision per cluster, EmailCandidateItem[], section coverage
//
// Every email item must pass three tests:
//   1. It BELONGS in the areas the company asked Albis to scan.
//   2. It MATTERS enough to help the company understand the day.
//   3. It is GROUNDED strongly enough that the writer can explain it.
// ---------------------------------------------------------------------------

import type {
  EventCluster,
  CompanyBriefingProfile,
  SelectedScanArea,
  ScanAreaMatch,
  ScanAreaMatchType,
  RelevanceDecision,
  RelevanceDecisionType,
  RelevanceDimensionScores,
  GeographyMetadata,
  TimeMetadata,
  NoveltySignals,
  ImpactPathway,
  MaterialityCategory,
  SectionNoFinding,
  EmailCandidateItem,
  CompanyRelevanceResult,
  RelevanceDebugReport,
  QualityGrade,
} from "./types";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RelevancePipelineInput {
  clusters: EventCluster[];
  profile: CompanyBriefingProfile;
  run_id: string;
  /** Previously shown cluster IDs, for novelty detection */
  previous_cluster_ids?: string[];
}

/**
 * Score all clusters for company relevance and produce the full 8C output:
 * email candidates, dashboard items, excluded items, section coverage,
 * and a debug report.
 */
export function scoreCompanyRelevance(input: RelevancePipelineInput): CompanyRelevanceResult {
  const { clusters, profile, run_id, previous_cluster_ids } = input;
  const now = new Date().toISOString();

  const decisions: Array<{ cluster: EventCluster; decision: RelevanceDecision }> = [];

  for (const cluster of clusters) {
    const decision = scoreClusterRelevance(cluster, profile, previous_cluster_ids);
    decisions.push({ cluster, decision });
  }

  // Build email, dashboard, excluded buckets
  const emailItems: EmailCandidateItem[] = [];
  const dashboardItems: CompanyRelevanceResult["dashboard_items"] = [];
  const excludedItems: CompanyRelevanceResult["excluded_items"] = [];

  for (const { cluster, decision } of decisions) {
    if (decision.decision === "email" || decision.decision === "email_caution") {
      emailItems.push(buildEmailCandidateItem(cluster, decision));
    } else if (decision.decision === "dashboard") {
      dashboardItems.push({
        cluster_id: cluster.cluster_id,
        canonical_event_name: cluster.canonical_event_name,
        decision,
      });
    } else {
      excludedItems.push({
        cluster_id: cluster.cluster_id,
        canonical_event_name: cluster.canonical_event_name,
        decision,
      });
    }
  }

  // Section no-findings
  const sectionNoFindings = computeSectionNoFindings(
    profile.selected_scan_areas,
    decisions.map((d) => d.decision),
    clusters.length,
  );

  return {
    company_id: profile.company_id,
    run_id,
    created_at: now,
    email_items: emailItems,
    dashboard_items: dashboardItems,
    excluded_items: excludedItems,
    section_no_findings: sectionNoFindings,
    perception_gap_decisions: [], // filled by perception-gap-evidence module
  };
}

/**
 * Build a debug report from a CompanyRelevanceResult + PG decisions.
 */
export function buildRelevanceDebugReport(
  result: CompanyRelevanceResult,
  allDecisions: RelevanceDecision[],
  pgDecisions: import("./types").PerceptionGapDecision[],
): RelevanceDebugReport {
  return {
    run_id: result.run_id,
    company_id: result.company_id,
    created_at: result.created_at,
    input_cluster_count: allDecisions.length,
    email_count: allDecisions.filter((d) => d.decision === "email").length,
    email_caution_count: allDecisions.filter((d) => d.decision === "email_caution").length,
    dashboard_count: allDecisions.filter((d) => d.decision === "dashboard").length,
    exclude_count: allDecisions.filter((d) => d.decision === "exclude").length,
    perception_gap_eligible: pgDecisions.filter((p) => p.eligible).length,
    perception_gap_email: pgDecisions.filter((p) => p.show_in_email).length,
    perception_gap_dashboard: pgDecisions.filter((p) => p.show_in_dashboard && !p.show_in_email).length,
    perception_gap_skipped: pgDecisions.filter((p) => !p.eligible).length,
    section_no_findings: result.section_no_findings,
    cluster_decisions: allDecisions.map((d) => {
      const pg = pgDecisions.find((p) => p.cluster_id === d.cluster_id);
      return {
        cluster_id: d.cluster_id,
        canonical_event_name: d.cluster_id, // will be overridden with real name by caller
        decision: d.decision,
        company_relevance_score: d.company_relevance_score,
        dimension_scores: d.dimension_scores,
        decision_reasons: d.decision_reasons,
        exclusion_reasons: d.exclusion_reasons,
        perception_gap_eligible: pg?.eligible ?? false,
        perception_gap_confidence: pg?.confidence,
        perception_gap_skip_reason: pg?.skip_reason,
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Core scoring: per-cluster relevance
// ---------------------------------------------------------------------------

export function scoreClusterRelevance(
  cluster: EventCluster,
  profile: CompanyBriefingProfile,
  previousClusterIds?: string[],
): RelevanceDecision {
  // Step 1: match selected scan areas
  const areaMatches = matchSelectedScanAreas(cluster, profile);

  // Step 2: detect weak matches (hard exclude)
  const weakMatch = detectWeakMatch(cluster, areaMatches, profile);
  if (weakMatch.flag) {
    return buildExcludeDecision(cluster, areaMatches, weakMatch, profile, previousClusterIds);
  }

  // Step 3: score each dimension
  const selectedAreaFit = scoreAreaFit(areaMatches);
  const entityProximity = scoreEntityProximity(cluster, profile);
  const materiality = scoreMateriality(cluster, profile, areaMatches);
  const geography = scoreGeography(cluster, profile);
  const timelinessScore = scoreTimeliness(cluster);
  const specificity = scoreSpecificity(cluster);
  const actionability = scoreActionability(cluster, materiality);
  const evidenceStrength = scoreEvidence(cluster);
  const novelty = scoreNovelty(cluster, previousClusterIds);

  const dimensionScores: RelevanceDimensionScores = {
    selected_area_fit: selectedAreaFit,
    entity_proximity: entityProximity,
    business_materiality: materiality.score,
    geography_fit: geography.geography_fit_score,
    timeliness: timelinessScore,
    specificity,
    actionability,
    evidence_strength: evidenceStrength,
    novelty: novelty.novelty_score,
  };

  const totalScore =
    selectedAreaFit +
    entityProximity +
    materiality.score +
    geography.geography_fit_score +
    timelinessScore +
    specificity +
    actionability +
    evidenceStrength +
    novelty.novelty_score;

  // Step 4: apply thresholds
  const { decision, reasons, exclusionReasons, confidenceNotes } = applyThresholds({
    totalScore,
    dimensionScores,
    materiality,
    areaMatches,
    cluster,
    evidenceStrength,
    novelty,
  });

  return {
    cluster_id: cluster.cluster_id,
    decision,
    company_relevance_score: totalScore,
    dimension_scores: dimensionScores,
    matched_scan_areas: areaMatches,
    materiality: {
      score: materiality.score,
      categories: materiality.categories,
      impact_pathways: materiality.pathways,
    },
    geography,
    time: buildTimeMetadata(cluster),
    novelty,
    weak_match: { flag: false, reasons: [] },
    decision_reasons: reasons,
    exclusion_reasons: exclusionReasons,
    confidence_notes: confidenceNotes,
  };
}

// ---------------------------------------------------------------------------
// Selected scan area matching
// ---------------------------------------------------------------------------

export function matchSelectedScanAreas(
  cluster: EventCluster,
  profile: CompanyBriefingProfile,
): ScanAreaMatch[] {
  const matches: ScanAreaMatch[] = [];

  for (const area of profile.selected_scan_areas) {
    const match = matchSingleArea(cluster, area, profile);
    if (match.match_strength !== "none") {
      matches.push(match);
    }
  }

  return matches;
}

function matchSingleArea(
  cluster: EventCluster,
  area: SelectedScanArea,
  profile: CompanyBriefingProfile,
): ScanAreaMatch {
  const matchTypes: ScanAreaMatchType[] = [];
  const evidence: string[] = [];
  let strengthScore = 0;

  // Layer 1: Semantic area match — does cluster topic/action belong to this area category?
  const semanticScore = computeSemanticAreaMatch(cluster, area);
  if (semanticScore > 0) {
    matchTypes.push("topic_semantic");
    evidence.push(`topic_match:${area.category}`);
    strengthScore += semanticScore;
  }

  // Layer 2: Company context match — intersects company profile?
  // Check entities
  const entityMatch = checkEntityMatch(cluster, area, profile);
  if (entityMatch.matched) {
    matchTypes.push(...entityMatch.types);
    evidence.push(...entityMatch.evidence);
    strengthScore += entityMatch.score;
  }

  // Check regions
  const regionMatch = checkRegionMatch(cluster, area, profile);
  if (regionMatch.matched) {
    matchTypes.push(...regionMatch.types);
    evidence.push(...regionMatch.evidence);
    strengthScore += regionMatch.score;
  }

  // Keyword match (supporting only, never sufficient alone)
  const keywordMatch = checkKeywordMatch(cluster, area);
  if (keywordMatch && matchTypes.length === 0) {
    // keyword only — mark as weak
    matchTypes.push("keyword_only");
    evidence.push("keyword_only_match");
    strengthScore += 1;
  } else if (keywordMatch) {
    evidence.push("keyword_supporting");
    strengthScore += 1; // minor boost
  }

  // Determine strength
  let matchStrength: ScanAreaMatch["match_strength"];
  if (strengthScore >= 5) {
    matchStrength = "strong";
  } else if (strengthScore >= 3) {
    matchStrength = "medium";
  } else if (strengthScore >= 1) {
    matchStrength = "weak";
  } else {
    matchStrength = "none";
  }

  // Priority modifier: cap medium/low priority areas
  if (area.priority === "medium" && matchStrength === "strong" && !matchTypes.includes("direct_company")) {
    // cap at strong only if entity directly named
    if (strengthScore < 7) matchStrength = "medium";
  }
  if (area.priority === "low" && matchStrength === "strong") {
    matchStrength = "medium";
  }

  const explanation = matchTypes.length > 0
    ? `Cluster matches ${area.label} via ${matchTypes.join(", ")}`
    : `No match to ${area.label}`;

  return {
    area_id: area.area_id,
    match_strength: matchStrength,
    match_type: matchTypes,
    evidence,
    explanation,
  };
}

// Semantic match: does the cluster's action class / topics align with the scan area category?
const CATEGORY_ACTION_MAP: Record<string, string[]> = {
  regulation: ["regulatory_action", "legal_action", "policy_change"],
  market: ["financial_result", "market_move", "merger_acquisition"],
  supply_chain: ["supply_chain_disruption", "labor_workforce"],
  geopolitics: ["geopolitical_event", "policy_change"],
  technology: ["product_launch", "security_incident", "research_report"],
  security: ["security_incident", "geopolitical_event"],
  reputation: ["company_statement", "legal_action"],
  customers: ["product_launch", "market_move", "company_statement"],
  competitors: ["merger_acquisition", "product_launch", "financial_result", "market_move"],
  climate: ["natural_disaster", "policy_change"],
  macro: ["policy_change", "market_move", "geopolitical_event"],
};

const CATEGORY_TOPIC_MAP: Record<string, string[]> = {
  regulation: ["regulation", "regulatory", "compliance", "enforcement", "policy", "law", "legislation", "court", "ruling"],
  market: ["market", "earnings", "revenue", "stock", "share", "ipo", "investment", "acquisition", "merger"],
  supply_chain: ["supply chain", "logistics", "shipping", "port", "freight", "supplier", "procurement", "shortage"],
  geopolitics: ["sanctions", "tariff", "trade war", "geopolitical", "diplomatic", "foreign policy", "conflict"],
  technology: ["technology", "ai", "artificial intelligence", "cybersecurity", "software", "hardware", "innovation"],
  security: ["security", "cyber", "breach", "hack", "attack", "vulnerability", "threat", "espionage"],
  reputation: ["reputation", "scandal", "controversy", "brand", "public relations", "crisis"],
  customers: ["customer", "consumer", "user", "client", "demand", "retail", "subscription"],
  competitors: ["competitor", "rival", "market share", "competitive"],
  climate: ["climate", "environmental", "carbon", "emission", "weather", "sustainability", "green"],
  macro: ["gdp", "inflation", "interest rate", "central bank", "economic", "recession", "growth", "unemployment"],
};

function computeSemanticAreaMatch(cluster: EventCluster, area: SelectedScanArea): number {
  let score = 0;
  const actionClass = cluster.primary_event_tuple.action.action_class;
  const matchingActions = CATEGORY_ACTION_MAP[area.category] || [];

  if (matchingActions.includes(actionClass)) {
    score += 3;
  }

  // Check cluster topics against category topic keywords
  const topicKeywords = CATEGORY_TOPIC_MAP[area.category] || [];
  const clusterText = [
    cluster.canonical_event_name,
    cluster.primary_event_tuple.action.raw,
    cluster.primary_event_tuple.object.name,
    ...cluster.facts.map((f) => f.text),
  ]
    .join(" ")
    .toLowerCase();

  for (const keyword of topicKeywords) {
    if (clusterText.includes(keyword)) {
      score += 1;
      break; // one topic hit is enough
    }
  }

  return score;
}

function checkEntityMatch(
  cluster: EventCluster,
  area: SelectedScanArea,
  profile: CompanyBriefingProfile,
): { matched: boolean; types: ScanAreaMatchType[]; evidence: string[]; score: number } {
  const types: ScanAreaMatchType[] = [];
  const evidence: string[] = [];
  let score = 0;
  const clusterEntityNames = getClusterEntityNames(cluster);

  // Check if company itself is mentioned
  const companyNameLower = profile.display_name.toLowerCase();
  if (clusterEntityNames.some((e) => e.includes(companyNameLower) || companyNameLower.includes(e))) {
    types.push("direct_company");
    evidence.push(`company:${profile.display_name}`);
    score += 5;
  }

  // Check watch entities
  const watchEntities = profile.watch_entities || [];
  for (const we of watchEntities) {
    const names = [we.name.toLowerCase(), ...(we.aliases || []).map((a) => a.toLowerCase())];
    if (clusterEntityNames.some((e) => names.some((n) => e.includes(n) || n.includes(e)))) {
      types.push("watch_entity");
      evidence.push(`watch_entity:${we.name}`);
      score += 3;
      break; // one watch entity match is enough for scoring
    }
  }

  // Check area-specific entities
  const areaEntities = (area.entities || []).map((e) => e.toLowerCase());
  if (areaEntities.some((ae) => clusterEntityNames.some((ce) => ce.includes(ae) || ae.includes(ce)))) {
    evidence.push(`area_entity_match:${area.area_id}`);
    score += 2;
  }

  return { matched: score > 0, types, evidence, score };
}

function checkRegionMatch(
  cluster: EventCluster,
  area: SelectedScanArea,
  profile: CompanyBriefingProfile,
): { matched: boolean; types: ScanAreaMatchType[]; evidence: string[]; score: number } {
  const types: ScanAreaMatchType[] = [];
  const evidence: string[] = [];
  let score = 0;

  const clusterRegions = [
    ...cluster.geography_language.event_places,
    ...cluster.geography_language.regions_represented,
  ].map((r) => r.toLowerCase());

  const opRegions = profile.operating_regions.map((r) => r.toLowerCase());
  const custRegions = (profile.customer_regions || []).map((r) => r.toLowerCase());
  const suppRegions = (profile.supplier_regions || []).map((r) => r.toLowerCase());
  const regRegions = (profile.regulatory_regions || []).map((r) => r.toLowerCase());
  const areaRegions = (area.regions || []).map((r) => r.toLowerCase());

  if (clusterRegions.some((cr) => regRegions.some((rr) => regionsOverlap(cr, rr)))) {
    types.push("regulatory_region");
    evidence.push("regulatory_region_match");
    score += 3;
  }
  if (clusterRegions.some((cr) => opRegions.some((or) => regionsOverlap(cr, or)))) {
    types.push("operating_region");
    evidence.push("operating_region_match");
    score += 2;
  }
  if (clusterRegions.some((cr) => custRegions.some((cu) => regionsOverlap(cr, cu)))) {
    types.push("customer_region");
    evidence.push("customer_region_match");
    score += 1;
  }
  if (clusterRegions.some((cr) => suppRegions.some((sr) => regionsOverlap(cr, sr)))) {
    types.push("supplier_region");
    evidence.push("supplier_region_match");
    score += 1;
  }
  if (areaRegions.length > 0 && clusterRegions.some((cr) => areaRegions.some((ar) => regionsOverlap(cr, ar)))) {
    evidence.push(`area_region_match:${area.area_id}`);
    score += 1;
  }

  return { matched: score > 0, types, evidence, score };
}

function checkKeywordMatch(cluster: EventCluster, area: SelectedScanArea): boolean {
  if (!area.keywords || area.keywords.length === 0) return false;
  const clusterText = [
    cluster.canonical_event_name,
    cluster.primary_event_tuple.action.raw,
    cluster.primary_event_tuple.object.name,
    cluster.primary_event_tuple.actor.name,
  ]
    .join(" ")
    .toLowerCase();

  return area.keywords.some((kw) => clusterText.includes(kw.toLowerCase()));
}

// ---------------------------------------------------------------------------
// Weak-match detection
// ---------------------------------------------------------------------------

export function detectWeakMatch(
  cluster: EventCluster,
  areaMatches: ScanAreaMatch[],
  profile: CompanyBriefingProfile,
): { flag: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // 1. Keyword-only match
  const allKeywordOnly = areaMatches.length > 0 &&
    areaMatches.every((m) => m.match_type.length === 1 && m.match_type[0] === "keyword_only");
  if (allKeywordOnly) {
    reasons.push("keyword_only");
  }

  // 2. No scan area match at all
  if (areaMatches.length === 0) {
    reasons.push("no_scan_area_match");
  }

  // 3. Wrong entity check (basic: if cluster has no overlap with any company entity/watch entity)
  // This is conservative — we flag only if explicitly detected
  // Full wrong-entity detection would require canonical entity resolution

  // 4. Generic sector filler: vague tuple, analysis/background status, no concrete event
  if (
    (cluster.status === "analysis" || cluster.status === "background") &&
    cluster.primary_event_tuple.action.action_class === "other" &&
    cluster.facts.length <= 1
  ) {
    reasons.push("generic_sector_filler");
  }

  // 5. Stale with no new fact
  if (cluster.freshness === "stale" || cluster.freshness === "historical_context") {
    reasons.push("stale_no_new_fact");
  }

  // 6. SEO sludge evidence (cluster-level check via anchor article)
  // Already handled by 8B downstream flags, but double-check
  if (cluster.downstream.blockers.includes("anchor_high_sludge")) {
    reasons.push("seo_sludge");
  }

  // 7. No event extractable from primary tuple
  if (
    cluster.primary_event_tuple.action.action_class === "other" &&
    cluster.primary_event_tuple.action.lemma === "" &&
    cluster.primary_event_tuple.confidence < 0.3
  ) {
    reasons.push("no_impact_pathway");
  }

  return { flag: reasons.length > 0, reasons };
}

// ---------------------------------------------------------------------------
// Dimension scorers
// ---------------------------------------------------------------------------

function scoreAreaFit(areaMatches: ScanAreaMatch[]): number {
  if (areaMatches.length === 0) return 0;

  // Score the strongest match
  const strengthValues: Record<string, number> = { strong: 16, medium: 11, weak: 5, none: 0 };
  const best = areaMatches.reduce((a, b) =>
    (strengthValues[a.match_strength] || 0) >= (strengthValues[b.match_strength] || 0) ? a : b
  );
  let score = strengthValues[best.match_strength] || 0;

  // Cross-area support: +1 to +2 for additional medium+ matches
  const additionalMediumPlus = areaMatches.filter(
    (m) => m !== best && (m.match_strength === "strong" || m.match_strength === "medium")
  ).length;
  score += Math.min(additionalMediumPlus, 2);

  return Math.min(score, 18);
}

function scoreEntityProximity(cluster: EventCluster, profile: CompanyBriefingProfile): number {
  const clusterEntityNames = getClusterEntityNames(cluster);
  const companyNameLower = profile.display_name.toLowerCase();

  // Direct company match
  if (clusterEntityNames.some((e) => e.includes(companyNameLower) || companyNameLower.includes(e))) {
    return 14;
  }

  // Watch entity match
  const watchEntities = profile.watch_entities || [];
  for (const we of watchEntities) {
    const names = [we.name.toLowerCase(), ...(we.aliases || []).map((a) => a.toLowerCase())];
    if (clusterEntityNames.some((e) => names.some((n) => e.includes(n) || n.includes(e)))) {
      if (we.type === "competitor" || we.type === "supplier" || we.type === "regulator") {
        return 12;
      }
      return 10;
    }
  }

  // Sector-level: check if action class relates to the company's industry
  const industryLower = profile.industry.toLowerCase();
  const clusterText = [
    cluster.canonical_event_name,
    cluster.primary_event_tuple.actor.name,
    cluster.primary_event_tuple.object.name,
  ]
    .join(" ")
    .toLowerCase();

  if (clusterText.includes(industryLower)) {
    return 8;
  }

  // Sub-industry match
  const subIndustries = (profile.sub_industries || []).map((s) => s.toLowerCase());
  if (subIndustries.some((si) => clusterText.includes(si))) {
    return 7;
  }

  // Broad thematic connection only
  return 3;
}

interface MaterialityResult {
  score: number;
  categories: MaterialityCategory[];
  pathways: ImpactPathway[];
}

function scoreMateriality(
  cluster: EventCluster,
  profile: CompanyBriefingProfile,
  areaMatches: ScanAreaMatch[],
): MaterialityResult {
  const pathways: ImpactPathway[] = [];
  const categories: Set<MaterialityCategory> = new Set();
  let score = 0;

  const actionClass = cluster.primary_event_tuple.action.action_class;
  const hasABAnchor = cluster.source_mix.anchor_source_grade === "A" || cluster.source_mix.anchor_source_grade === "B";
  const isConfirmed = cluster.status === "confirmed" || cluster.status === "announced";

  // Regulatory/legal → compliance impact
  if (actionClass === "regulatory_action" || actionClass === "legal_action") {
    const regionOverlap = hasRegionOverlap(cluster, profile);
    if (regionOverlap) {
      categories.add("regulatory_compliance");
      const pathway: ImpactPathway = {
        category: "regulatory_compliance",
        pathway: `${cluster.primary_event_tuple.actor.name} ${cluster.primary_event_tuple.action.raw} affecting ${profile.display_name}'s regulatory environment`,
        supported_by: [cluster.facts[0]?.cluster_fact_id || cluster.cluster_id],
        confidence: hasABAnchor && isConfirmed ? 0.85 : 0.65,
      };
      pathways.push(pathway);
      score += isConfirmed ? 18 : 14;
    } else {
      score += 8; // relevant category but not in company regions
    }
  }

  // Supply chain disruption
  if (actionClass === "supply_chain_disruption" || actionClass === "labor_workforce") {
    categories.add("supply_chain");
    const pathway: ImpactPathway = {
      category: "supply_chain",
      pathway: `${cluster.canonical_event_name} may affect supply chain operations`,
      supported_by: [cluster.facts[0]?.cluster_fact_id || cluster.cluster_id],
      confidence: hasABAnchor ? 0.75 : 0.55,
    };
    pathways.push(pathway);
    score += hasABAnchor ? 16 : 11;
  }

  // Financial/market events
  if (actionClass === "financial_result" || actionClass === "market_move" || actionClass === "merger_acquisition") {
    categories.add("capital_markets");
    if (actionClass === "merger_acquisition") categories.add("strategy");
    const pathway: ImpactPathway = {
      category: "capital_markets",
      pathway: `${cluster.canonical_event_name} relevant to market/competitive context`,
      supported_by: [cluster.facts[0]?.cluster_fact_id || cluster.cluster_id],
      confidence: hasABAnchor ? 0.80 : 0.60,
    };
    pathways.push(pathway);
    score += 14;
  }

  // Security incident
  if (actionClass === "security_incident") {
    categories.add("security");
    pathways.push({
      category: "security",
      pathway: `Security incident: ${cluster.canonical_event_name}`,
      supported_by: [cluster.facts[0]?.cluster_fact_id || cluster.cluster_id],
      confidence: hasABAnchor ? 0.80 : 0.55,
    });
    score += 16;
  }

  // Product/partnership/strategy
  if (actionClass === "product_launch" || actionClass === "partnership") {
    categories.add("strategy");
    pathways.push({
      category: "strategy",
      pathway: `${cluster.canonical_event_name} relevant to competitive landscape`,
      supported_by: [cluster.facts[0]?.cluster_fact_id || cluster.cluster_id],
      confidence: 0.65,
    });
    score += 10;
  }

  // Geopolitical/policy
  if (actionClass === "geopolitical_event" || actionClass === "policy_change") {
    const regionOverlap = hasRegionOverlap(cluster, profile);
    if (regionOverlap) {
      categories.add("market_access");
      pathways.push({
        category: "market_access",
        pathway: `${cluster.canonical_event_name} in company-relevant region`,
        supported_by: [cluster.facts[0]?.cluster_fact_id || cluster.cluster_id],
        confidence: 0.70,
      });
      score += 14;
    } else {
      score += 6;
    }
  }

  // Natural disaster
  if (actionClass === "natural_disaster") {
    const regionOverlap = hasRegionOverlap(cluster, profile);
    categories.add("operations");
    if (regionOverlap) {
      pathways.push({
        category: "operations",
        pathway: `${cluster.canonical_event_name} in company operating/supply region`,
        supported_by: [cluster.facts[0]?.cluster_fact_id || cluster.cluster_id],
        confidence: 0.75,
      });
      score += 16;
    } else {
      score += 5;
    }
  }

  // If no pathways could be constructed, cap materiality at 10
  if (pathways.length === 0) {
    score = Math.min(score, 10);
  }

  // Risk priority boost: if cluster matches a declared risk priority
  const riskPriorities = (profile.risk_priorities || []).map((r) => r.toLowerCase());
  const clusterText = cluster.canonical_event_name.toLowerCase() + " " + actionClass;
  const riskMatch = riskPriorities.some((rp) => clusterText.includes(rp.replace(/-/g, " ")));
  if (riskMatch && score > 0) {
    score = Math.min(score + 2, 22);
  }

  return { score: Math.min(score, 22), categories: [...categories], pathways };
}

function scoreGeography(cluster: EventCluster, profile: CompanyBriefingProfile): GeographyMetadata {
  const eventPlaces = cluster.geography_language.event_places;
  const clusterRegions = [
    ...cluster.geography_language.event_places,
    ...cluster.geography_language.regions_represented,
  ].map((r) => r.toLowerCase());

  const allCompanyRegions = [
    ...profile.operating_regions,
    ...(profile.customer_regions || []),
    ...(profile.supplier_regions || []),
    ...(profile.regulatory_regions || []),
  ].map((r) => r.toLowerCase());

  const companyRelevantRegions = allCompanyRegions.filter((cr) =>
    clusterRegions.some((clr) => regionsOverlap(clr, cr))
  );

  let score: number;
  let reason: string;

  if (companyRelevantRegions.length > 0) {
    const isOperating = profile.operating_regions.some((or) =>
      clusterRegions.some((cr) => regionsOverlap(cr, or.toLowerCase()))
    );
    const isRegulatory = (profile.regulatory_regions || []).some((rr) =>
      clusterRegions.some((cr) => regionsOverlap(cr, rr.toLowerCase()))
    );

    if (isOperating || isRegulatory) {
      score = 10;
      reason = "Event in core operating/regulatory region";
    } else {
      score = 7;
      reason = "Event in company-related region (customer/supplier)";
    }
  } else if (clusterRegions.length === 0 || clusterRegions.some((r) => r === "global" || r === "worldwide")) {
    score = 6;
    reason = "Global event with potential relevance";
  } else {
    score = 2;
    reason = "Event in region not directly related to company";
  }

  return {
    event_place: eventPlaces[0],
    affected_regions: cluster.geography_language.regions_represented,
    source_regions: cluster.geography_language.source_regions_represented,
    audience_regions: cluster.geography_language.audience_regions_represented,
    company_relevant_regions: companyRelevantRegions,
    geography_fit_score: score,
    geography_reason: reason,
  };
}

function scoreTimeliness(cluster: EventCluster): number {
  switch (cluster.freshness) {
    case "breaking":
      return 8;
    case "today":
      return 7;
    case "recent":
      return 5;
    case "stale":
      return 2;
    case "historical_context":
      return 1;
    default:
      return 3;
  }
}

function scoreSpecificity(cluster: EventCluster): number {
  const tuple = cluster.primary_event_tuple;
  let score = 0;

  // Concrete actor
  if (tuple.actor.name && tuple.actor.name !== "unknown" && tuple.actor.name !== "") score += 2;
  // Concrete action
  if (tuple.action.action_class !== "other") score += 2;
  // Concrete object
  if (tuple.object.name && tuple.object.name !== "unknown" && tuple.object.name !== "") score += 1;
  // Has time
  if (tuple.event_time.date || tuple.event_time.granularity !== "unknown") score += 1;
  // Has place
  if (tuple.place.length > 0) score += 1;
  // Has material numbers
  if (tuple.material_numbers && tuple.material_numbers.length > 0) score += 1;

  return Math.min(score, 8);
}

function scoreActionability(cluster: EventCluster, materiality: MaterialityResult): number {
  let score = 0;

  // Has clear impact pathways
  if (materiality.pathways.length > 0) score += 3;

  // Status suggests actionability
  if (cluster.status === "developing" || cluster.status === "proposed") score += 2;
  if (cluster.status === "confirmed" || cluster.status === "announced") score += 3;

  // Multiple materiality categories
  if (materiality.categories.length >= 2) score += 1;

  // Has concrete facts
  if (cluster.facts.length >= 2) score += 1;

  return Math.min(score, 8);
}

function scoreEvidence(cluster: EventCluster): number {
  const anchorGrade = cluster.source_mix.anchor_source_grade;
  const confidence = cluster.confidence.cluster_confidence;

  if (anchorGrade === "A" && confidence >= 0.85) return 8;
  if ((anchorGrade === "A" || anchorGrade === "B") && confidence >= 0.70) return 7;
  if (anchorGrade === "B" && confidence >= 0.55) return 5;
  if (anchorGrade === "C") return Math.min(4, confidence >= 0.55 ? 3 : 2);
  if (anchorGrade === "D" || anchorGrade === "Block") return 1;
  return 3;
}

function scoreNovelty(cluster: EventCluster, previousClusterIds?: string[]): NoveltySignals {
  const seenBefore = previousClusterIds?.includes(cluster.cluster_id) ?? false;

  if (!seenBefore) {
    return {
      seen_before: false,
      novelty_score: 4,
      novelty_reason: "New event not previously shown",
      new_development_type: "new_fact",
    };
  }

  return {
    seen_before: true,
    previous_cluster_id: cluster.cluster_id,
    novelty_score: 1,
    novelty_reason: "Previously shown cluster",
    new_development_type: "none",
  };
}

// ---------------------------------------------------------------------------
// Decision thresholds
// ---------------------------------------------------------------------------

interface ThresholdInput {
  totalScore: number;
  dimensionScores: RelevanceDimensionScores;
  materiality: MaterialityResult;
  areaMatches: ScanAreaMatch[];
  cluster: EventCluster;
  evidenceStrength: number;
  novelty: NoveltySignals;
}

function applyThresholds(input: ThresholdInput): {
  decision: RelevanceDecisionType;
  reasons: string[];
  exclusionReasons?: string[];
  confidenceNotes?: string[];
} {
  const { totalScore, dimensionScores, materiality, areaMatches, cluster, evidenceStrength, novelty } = input;
  const reasons: string[] = [];
  const exclusionReasons: string[] = [];
  const confidenceNotes: string[] = [];

  const clusterConfidence = cluster.confidence.cluster_confidence;
  const anchorGrade = cluster.source_mix.anchor_source_grade;
  const hasABanchor = anchorGrade === "A" || anchorGrade === "B" || cluster.source_mix.official_source_present;
  const hasStrongArea = areaMatches.some((m) => m.match_strength === "strong");
  const hasMediumArea = areaMatches.some((m) => m.match_strength === "medium");
  const hasImpactPathway = materiality.pathways.length > 0;

  // Collect positive reason codes
  if (hasStrongArea) reasons.push("selected_area_strong_match");
  if (dimensionScores.entity_proximity >= 12) reasons.push("watch_entity_involved");
  if (dimensionScores.entity_proximity >= 14) reasons.push("direct_company_match");
  if (anchorGrade === "A" || cluster.source_mix.official_source_present) reasons.push("official_or_a_anchor");
  if (novelty.novelty_score >= 4) reasons.push("new_development");
  if (dimensionScores.geography_fit >= 8) reasons.push("company_region_affected");
  if (dimensionScores.actionability >= 6) reasons.push("clear_actionability");
  if (materiality.categories.includes("regulatory_compliance")) reasons.push("high_materiality_regulatory");
  if (materiality.categories.includes("supply_chain")) reasons.push("high_materiality_supply_chain");
  if (materiality.categories.includes("capital_markets")) reasons.push("high_materiality_market");

  // --- EMAIL threshold ---
  if (
    totalScore >= 75 &&
    dimensionScores.business_materiality >= 14 &&
    dimensionScores.selected_area_fit >= 12 &&
    clusterConfidence >= 0.70 &&
    hasABanchor &&
    hasImpactPathway &&
    !cluster.downstream.blockers.includes("anchor_high_sludge")
  ) {
    return { decision: "email", reasons, confidenceNotes };
  }

  // --- EMAIL WITH CAUTION ---
  if (
    totalScore >= 65 &&
    totalScore < 75 &&
    dimensionScores.business_materiality >= 18 &&
    evidenceStrength >= 6 &&
    clusterConfidence >= 0.70 &&
    hasImpactPathway &&
    cluster.downstream.blockers.length === 0
  ) {
    confidenceNotes.push("Email with caution — uncertainty should be labelled");
    reasons.push("email_caution_high_materiality");
    return { decision: "email_caution", reasons, confidenceNotes };
  }

  // --- DASHBOARD ---
  if (totalScore >= 45 || (clusterConfidence >= 0.45 && totalScore >= 35)) {
    if (totalScore < 75) exclusionReasons.push("dashboard_only_low_materiality");
    if (clusterConfidence < 0.70) exclusionReasons.push("low_cluster_confidence");
    if (!hasABanchor) exclusionReasons.push("weak_source_mix");
    return { decision: "dashboard", reasons, exclusionReasons, confidenceNotes };
  }

  // --- EXCLUDE ---
  if (totalScore < 45) exclusionReasons.push("low_relevance_score");
  if (dimensionScores.business_materiality < 8) exclusionReasons.push("no_impact_pathway");
  if (!hasStrongArea && !hasMediumArea) exclusionReasons.push("selected_area_weak_match");
  if (clusterConfidence < 0.45) exclusionReasons.push("low_cluster_confidence");

  return { decision: "exclude", reasons, exclusionReasons, confidenceNotes };
}

// ---------------------------------------------------------------------------
// Build helpers
// ---------------------------------------------------------------------------

function buildExcludeDecision(
  cluster: EventCluster,
  areaMatches: ScanAreaMatch[],
  weakMatch: { flag: boolean; reasons: string[] },
  profile: CompanyBriefingProfile,
  previousClusterIds?: string[],
): RelevanceDecision {
  const geography = scoreGeography(cluster, profile);
  const novelty = scoreNovelty(cluster, previousClusterIds);
  return {
    cluster_id: cluster.cluster_id,
    decision: "exclude",
    company_relevance_score: 0,
    dimension_scores: {
      selected_area_fit: 0,
      entity_proximity: 0,
      business_materiality: 0,
      geography_fit: geography.geography_fit_score,
      timeliness: 0,
      specificity: 0,
      actionability: 0,
      evidence_strength: 0,
      novelty: novelty.novelty_score,
    },
    matched_scan_areas: areaMatches,
    materiality: { score: 0, categories: [], impact_pathways: [] },
    geography,
    time: buildTimeMetadata(cluster),
    novelty,
    weak_match: weakMatch,
    decision_reasons: [],
    exclusion_reasons: weakMatch.reasons,
  };
}

function buildTimeMetadata(cluster: EventCluster): TimeMetadata {
  const eventTime = cluster.primary_event_tuple.event_time.date;
  let publishedWindow: TimeMetadata["published_window"] = "older";

  if (cluster.freshness === "breaking" || cluster.freshness === "today") {
    publishedWindow = "last_24h";
  } else if (cluster.freshness === "recent") {
    publishedWindow = "last_48h";
  }

  return {
    event_time: eventTime ?? undefined,
    published_window: publishedWindow,
    first_seen_at: cluster.created_at,
    last_seen_at: cluster.updated_at,
    freshness: cluster.freshness,
  };
}

function buildEmailCandidateItem(
  cluster: EventCluster,
  decision: RelevanceDecision,
): EmailCandidateItem {
  // Build source summary from cluster articles
  const anchorArticleId = cluster.articles.anchor_article_id;
  const anchorGrade = cluster.source_mix.anchor_source_grade;

  const shortFacts = cluster.facts
    .filter((f) => f.normalized_claim_type === "core_event" || f.normalized_claim_type === "number")
    .slice(0, 3)
    .map((f) => f.text);

  // Build why_it_matters from the best impact pathway
  const bestPathway = decision.materiality.impact_pathways[0];
  const whyText = bestPathway
    ? bestPathway.pathway
    : `Relevant to company scan areas: ${decision.matched_scan_areas.map((m) => m.area_id).join(", ")}`;
  const supportedBy = bestPathway
    ? bestPathway.supported_by
    : decision.matched_scan_areas.map((m) => `scan_area:${m.area_id}`);

  const uncertainty = cluster.facts
    .flatMap((f) => f.uncertainty_flags)
    .filter((u, i, arr) => arr.indexOf(u) === i);

  return {
    item_id: `email_${cluster.cluster_id}`,
    cluster_id: cluster.cluster_id,
    section_ids: decision.matched_scan_areas.map((m) => m.area_id),
    title: cluster.canonical_event_name,
    canonical_event_name: cluster.canonical_event_name,
    short_summary_facts: shortFacts,
    why_it_matters: { text: whyText, supported_by: supportedBy },
    uncertainty: uncertainty.length > 0 ? uncertainty : undefined,
    relevance_decision: decision,
    source_summary: {
      anchor: {
        source: cluster.source_mix.anchor_source_grade,
        grade: anchorGrade as QualityGrade,
        url: "",
        article_id: anchorArticleId,
      },
      supporting: cluster.articles.supporting_article_ids.map((id) => ({
        source: "",
        grade: "B",
        url: "",
        article_id: id,
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// Section no-findings
// ---------------------------------------------------------------------------

function computeSectionNoFindings(
  scanAreas: SelectedScanArea[],
  decisions: RelevanceDecision[],
  totalClusterCount: number,
): SectionNoFinding[] {
  const noFindings: SectionNoFinding[] = [];

  for (const area of scanAreas) {
    const areaDecisions = decisions.filter((d) =>
      d.matched_scan_areas.some(
        (m) => m.area_id === area.area_id && (m.match_strength === "strong" || m.match_strength === "medium")
      )
    );

    const emailDecisions = areaDecisions.filter(
      (d) => d.decision === "email" || d.decision === "email_caution"
    );

    if (emailDecisions.length === 0) {
      const dashboardDecisions = areaDecisions.filter((d) => d.decision === "dashboard");
      const excludeReasons = areaDecisions
        .filter((d) => d.decision === "exclude")
        .flatMap((d) => d.exclusion_reasons || [])
        .filter((r, i, arr) => arr.indexOf(r) === i)
        .slice(0, 3);

      noFindings.push({
        section_id: area.area_id,
        label: area.label,
        scan_coverage_count: totalClusterCount,
        no_material_findings: true,
        top_excluded_reasons: excludeReasons,
        email_line_allowed: dashboardDecisions.length > 0,
        suggested_email_line:
          dashboardDecisions.length > 0
            ? `We scanned ${area.label}; useful signals saved to dashboard but nothing strong enough for email today.`
            : `No material new signal found today in ${area.label}.`,
      });
    }
  }

  return noFindings;
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function getClusterEntityNames(cluster: EventCluster): string[] {
  const names: string[] = [];
  const tuple = cluster.primary_event_tuple;
  if (tuple.actor.name) names.push(tuple.actor.name.toLowerCase());
  if (tuple.object.name) names.push(tuple.object.name.toLowerCase());
  for (const ae of tuple.affected_entities) {
    if (ae.name) names.push(ae.name.toLowerCase());
  }
  // Also gather from cluster facts entity references
  for (const fact of cluster.facts) {
    for (const claimId of fact.supported_by_claim_ids) {
      // claim IDs may contain entity names — skip for now
    }
  }
  return names;
}

function hasRegionOverlap(cluster: EventCluster, profile: CompanyBriefingProfile): boolean {
  const clusterRegions = [
    ...cluster.geography_language.event_places,
    ...cluster.geography_language.regions_represented,
  ].map((r) => r.toLowerCase());

  const companyRegions = [
    ...profile.operating_regions,
    ...(profile.customer_regions || []),
    ...(profile.supplier_regions || []),
    ...(profile.regulatory_regions || []),
  ].map((r) => r.toLowerCase());

  return clusterRegions.some((cr) => companyRegions.some((cor) => regionsOverlap(cr, cor)));
}

/** Simple region overlap: substring match or common abbreviation handling */
function regionsOverlap(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  // Common abbreviation expansions
  const abbrevs: Record<string, string[]> = {
    eu: ["european union", "europe"],
    us: ["united states", "usa", "america"],
    uk: ["united kingdom", "britain", "great britain"],
    uae: ["united arab emirates"],
    prc: ["china", "peoples republic"],
    de: ["germany", "deutschland"],
    jp: ["japan"],
    kr: ["south korea", "korea"],
    apac: ["asia", "asia pacific", "asia-pacific"],
  };

  for (const [abbr, expansions] of Object.entries(abbrevs)) {
    const allForms = [abbr, ...expansions];
    const aMatch = allForms.some((f) => a === f || a.includes(f));
    const bMatch = allForms.some((f) => b === f || b.includes(f));
    if (aMatch && bMatch) return true;
  }

  return false;
}
