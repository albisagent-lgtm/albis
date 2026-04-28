// ---------------------------------------------------------------------------
// Typed signals layer — shared TypeScript types.
//
// Mirrors the Package 5 schema (supabase/migrations/20260426_typed_signals_schema.sql).
// Kept here so the scan engine, signal parser, signal resolver, and
// downstream scoring pipeline share one source of truth for shapes.
// ---------------------------------------------------------------------------

export type ClusterType =
  | "entity_cluster"
  | "theme_cluster"
  | "region_cluster"
  | "sector_cluster"
  | "commodity_cluster"
  | "risk_cluster";

export interface RetrievalCluster {
  id: string;
  cluster_label: string;
  cluster_type: ClusterType;
  canonical_topic_ids: string[];
  demand_company_count: number;
  last_built_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ScanTargetType = "canonical_topic" | "keyword_query" | "source_domain";

export interface ScanTarget {
  id: string;
  retrieval_cluster_id: string | null;
  target_type: ScanTargetType;
  target_value: string;
  expansion_terms: string[];
  last_used_at: string | null;
  is_active: boolean;
  created_at: string;
}

export type ScanRunWindow = "07-00" | "13-00" | "19-00";
export type ScanRunStatus = "running" | "completed" | "partial_failure" | "failed";

export interface CompanyScanRun {
  id: string;
  run_date: string;
  run_window: ScanRunWindow;
  started_at: string;
  completed_at: string | null;
  status: ScanRunStatus;
  targets_inspected: number;
  signals_extracted: number;
  sources_consulted: number;
  error_summary: string | null;
  created_at: string;
}

export type SignalType =
  | "regulatory"
  | "market"
  | "statement"
  | "disruption"
  | "policy"
  | "announcement"
  | "other";

/**
 * Signal as it lives in Postgres. Used for reads.
 */
export interface Signal {
  id: string;
  company_scan_run_id: string;
  signal_date: string;
  headline: string;
  summary: string;
  signal_type: SignalType;
  entities: string[];
  canonical_entity_ids: string[];
  themes: string[];
  canonical_theme_ids: string[];
  regions: string[];
  canonical_region_ids: string[];
  source_url: string | null;
  source_domain: string | null;
  source_language: string | null;
  source_region: string | null;
  confidence: number;
  urgency: number;
  significance: number;
  created_at: string;
}

/**
 * Signal as produced by the parser, before it has been written. id and
 * created_at are DB-assigned. company_scan_run_id is set by the scan
 * engine before insert.
 */
export type SignalDraft = Omit<Signal, "id" | "created_at" | "company_scan_run_id">;

/**
 * Raw article input the parser turns into a SignalDraft. Shaped to match
 * what real retrieval providers (NewsAPI, Bing News, RSS readers) tend
 * to return after light normalisation. Package 6 wires up retrieval; for
 * now this is the contract the stub satisfies (with an empty array).
 */
export interface RawArticle {
  url: string;
  headline: string;
  body: string;
  source_domain: string | null;
  source_language: string | null;
  source_region: string | null;
  published_at: string | null;
}

// ---------------------------------------------------------------------------
// Package 8A — Source quality, article quality, and SEO-sludge types.
// ---------------------------------------------------------------------------

export type QualityGrade = "A" | "B" | "C" | "D" | "Block";

export type EvidenceAction =
  | "email_anchor"
  | "email_support"
  | "dashboard_only"
  | "watchlist_only"
  | "exclude"
  | "block"
  | "review_required";

export type SourceType =
  | "wire"
  | "major_outlet"
  | "local_outlet"
  | "trade"
  | "official"
  | "company"
  | "regulator"
  | "government"
  | "court"
  | "ngo"
  | "research"
  | "aggregator"
  | "blog"
  | "newsletter"
  | "unknown";

export type AuthorType = "named" | "staff" | "wire" | "official" | "none" | "unknown";

export type SludgeSignal =
  | "missing_author"
  | "missing_or_suspicious_timestamp"
  | "no_original_facts"
  | "keyword_stuffed_title"
  | "affiliate_or_commercial_intent"
  | "thin_content"
  | "uncited_syndication_or_scrape"
  | "generic_ai_like_filler"
  | "excessive_ads_or_deceptive_ux"
  | "known_content_farm_or_spam_domain"
  | "prompt_injection_or_malware"
  | "no_extractable_event";

export type HardBlockReason =
  | "malware_or_deceptive_page"
  | "prompt_injection"
  | "fake_outlet_or_author"
  | "known_spam_domain"
  | "scraped_without_attribution"
  | "undisclosed_sponsored_or_affiliate"
  | "no_factual_event"
  | "severe_unreliability"
  | "fabricated_content";

export type SludgeAction = "allow" | "downrank" | "dashboard_only" | "block";

export interface SourceQualityRecord {
  source_id: string;
  display_name: string;
  domain: string;
  source_type: SourceType;
  home_region?: string;
  coverage_regions: string[];
  languages: string[];

  ownership_transparent: boolean;
  masthead_or_contact_found: boolean;
  corrections_policy_found: boolean;
  editorial_policy_found: boolean;
  funding_or_ad_policy_found: boolean;
  news_opinion_ad_labels_clear: boolean;

  author_transparency_default: "high" | "medium" | "low" | "unknown";
  original_reporting_likelihood: number;
  syndication_likelihood: number;
  known_wire_partner: boolean;
  known_unreliable_pattern: boolean;
  manual_whitelist: boolean;
  manual_blocklist: boolean;

  regional_context_bonus: number;
  source_quality_score: number;
  source_quality_grade: QualityGrade;
  source_quality_reasons: string[];
  last_reviewed_at: string;
}

export interface ArticleQualityRecord {
  article_id: string;
  raw_url: string;
  canonical_url?: string;
  source_id: string;
  source_quality_grade: QualityGrade;
  source_type: SourceType;

  title_raw: string;
  title_normalized?: string;
  language?: string;
  published_at?: string | null;
  updated_at?: string | null;
  retrieved_at: string;

  author: {
    name?: string;
    type: AuthorType;
    confidence: number;
  };

  has_reliable_timestamp: boolean;
  has_extractable_event: boolean;
  has_primary_evidence: boolean;
  has_original_reporting: boolean;
  has_local_detail: boolean;
  has_named_quotes_or_documents: boolean;
  factual_density_score: number;
  boilerplate_ratio: number;

  syndication: {
    is_syndicated: boolean;
    original_source?: string | null;
    canonical_wire?: string | null;
    attribution_present: boolean;
    confidence: number;
  };

  seo_sludge_score: number;
  seo_sludge_signals: SludgeSignal[];
  article_quality_score: number;
  article_quality_grade: QualityGrade;
  hard_block_reasons: HardBlockReason[];

  sensitivity_flags: Array<
    | "legal"
    | "regulatory"
    | "market_moving"
    | "safety"
    | "security"
    | "casualty"
    | "geopolitical"
    | "sanctions"
    | "misconduct"
    | "health"
    | "environment"
  >;

  regional_context_bonus: number;
  corroboration_count_ab: number;
  cluster_has_ab_anchor: boolean;
  unique_regional_or_specialist_detail: boolean;

  evidence_action: EvidenceAction;
  evidence_action_reasons: string[];
  attribution_required: boolean;
  attribution_label?: string;
}

export interface ScoredCompanyArticleEvidence {
  article: ArticleQualityRecord;
  source: Pick<
    SourceQualityRecord,
    | "source_id"
    | "display_name"
    | "domain"
    | "source_type"
    | "home_region"
    | "source_quality_score"
    | "source_quality_grade"
    | "source_quality_reasons"
  >;
  extracted_facts: Array<{
    fact_id: string;
    text: string;
    entities: string[];
    claim_type: "event" | "number" | "quote" | "policy" | "filing" | "context" | "impact" | "unknown";
    evidence_url: string;
    attribution_required: boolean;
    confidence: number;
  }>;
}

/**
 * Input shape for Package 8A scoring functions.
 * Maps loosely to RawArticle but carries richer metadata for quality assessment.
 */
export interface RawArticleInput {
  raw_url: string;
  fetched_url?: string;
  canonical_url?: string | null;
  source_name?: string | null;
  domain?: string | null;
  title?: string | null;
  description?: string | null;
  html?: string | null;
  extracted_text?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  retrieved_at: string;
  author_raw?: string | null;
  language_hint?: string | null;
  search_query?: string | null;
  scan_area_ids?: string[];
  source_registry_ref?: string | null;
}

/**
 * Debug/audit trace for a single article through the 8A quality funnel.
 */
export interface QualityAuditTrace {
  raw_url: string;
  domain: string | null;
  source_grade: QualityGrade;
  source_score: number;
  source_reasons: string[];
  article_grade: QualityGrade;
  article_score: number;
  article_reasons: string[];
  sludge_score: number;
  sludge_signals: SludgeSignal[];
  sludge_action: SludgeAction;
  evidence_action: EvidenceAction;
  evidence_action_reasons: string[];
  hard_block_reasons: HardBlockReason[];
}

export interface CompanySignalMatch {
  id: string;
  company_profile_id: string;
  signal_id: string;
  relevance_score: number;
  match_reasons: unknown;
  selected_for_briefing: boolean;
  briefing_id: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Package 8B — Article normalization + event clustering types.
//
// Layer 2 of the Package 8 funnel: turn scored articles into clean
// NormalizedArticle records and group related coverage into EventClusters.
// ---------------------------------------------------------------------------

export type ActionClass =
  | "regulatory_action"
  | "legal_action"
  | "policy_change"
  | "financial_result"
  | "market_move"
  | "merger_acquisition"
  | "product_launch"
  | "partnership"
  | "supply_chain_disruption"
  | "security_incident"
  | "labor_workforce"
  | "geopolitical_event"
  | "natural_disaster"
  | "public_health_safety"
  | "executive_change"
  | "company_statement"
  | "research_report"
  | "other";

export type EventStatus =
  | "announced"
  | "proposed"
  | "confirmed"
  | "reported"
  | "developing"
  | "alleged"
  | "denied"
  | "rumored"
  | "analysis"
  | "background";

export type ClusterFreshness =
  | "breaking"
  | "today"
  | "recent"
  | "stale"
  | "historical_context";

export type FrameLabel =
  | "regulatory_risk"
  | "legal_liability"
  | "market_impact"
  | "consumer_impact"
  | "worker_impact"
  | "supplier_disruption"
  | "local_community_impact"
  | "geopolitical_angle"
  | "environmental_angle"
  | "public_safety"
  | "company_strategy"
  | "investor_angle"
  | "technology_angle"
  | "reputation_angle"
  | "operational_angle"
  | "human_interest"
  | "other";

export type NormalizationStatus =
  | "normalized"
  | "blocked"
  | "needs_review"
  | "failed_extraction";

export type ConfidenceLabel = "high" | "medium" | "low" | "needs_review";

// --- Supporting types for NormalizedArticle ---

export interface NormalizedEntity {
  entity_id?: string | null;
  name: string;
  aliases?: string[];
  type:
    | "company"
    | "person"
    | "org"
    | "place"
    | "regulator"
    | "government"
    | "product"
    | "sector"
    | "event"
    | "other";
  role?:
    | "actor"
    | "object"
    | "affected_party"
    | "source"
    | "location"
    | "mentioned"
    | null;
  confidence: number;
}

export interface FactualClaim {
  claim_id: string;
  article_id: string;
  text: string;
  claim_type:
    | "fact"
    | "quote"
    | "stat"
    | "forecast"
    | "allegation"
    | "denial"
    | "background"
    | "analysis";
  entities: string[];
  numeric_values?: { label: string; value: number; unit?: string; raw: string }[];
  time_refs?: string[];
  confidence: number;
  requires_attribution: boolean;
  uncertainty_flags: string[];
}

export interface ExtractedQuote {
  quote_id: string;
  speaker: string;
  speaker_role?: string | null;
  text: string;
  quote_type: "direct" | "indirect";
  confidence: number;
}

export interface EntityRef {
  name: string;
  canonical_id?: string | null;
  type: string;
}

export interface PlaceRef {
  name: string;
  canonical_id?: string | null;
  type: "country" | "region" | "city" | "jurisdiction" | "market" | "other";
}

// --- Event tuple ---

export interface EventTuple {
  event_tuple_id: string;
  article_id: string;
  actor: EntityRef;
  action: {
    raw: string;
    lemma: string;
    action_class: ActionClass;
  };
  object: EntityRef;
  affected_entities: EntityRef[];
  place: PlaceRef[];
  event_time: {
    date?: string | null;
    start?: string | null;
    end?: string | null;
    granularity:
      | "exact"
      | "day"
      | "week"
      | "month"
      | "quarter"
      | "year"
      | "vague"
      | "unknown";
    text?: string | null;
  };
  status: EventStatus;
  polarity?: "positive" | "negative" | "neutral" | "mixed" | null;
  material_numbers?: { label: string; value: number; unit?: string; raw: string }[];
  confidence: number;
  support_claim_ids: string[];
}

// --- NormalizedArticle ---

export interface NormalizedArticle {
  article_id: string;
  ingest_run_id: string;

  urls: {
    raw_url: string;
    fetched_url?: string | null;
    canonical_url?: string | null;
    url_hash: string;
    domain: string;
  };

  source: {
    source_id: string;
    display_name: string;
    domain: string;
    source_type: SourceType;
    source_quality_grade: QualityGrade;
    home_region?: string | null;
    source_region?: string | null;
    audience_region?: string | null;
  };

  article_meta: {
    title_raw: string;
    title_normalized: string;
    language: string;
    translated_from?: string | null;
    author: {
      name?: string | null;
      type: AuthorType;
      confidence: number;
    };
    published_at?: string | null;
    updated_at?: string | null;
    retrieved_at: string;
    dateline?: string | null;
  };

  quality: {
    seo_sludge_score: number;
    article_quality_score: number;
    evidence_action: EvidenceAction;
    email_evidence_eligible: boolean;
    extraction_confidence: number;
    prompt_injection_flags: string[];
    quality_flags: string[];
  };

  syndication: {
    is_syndicated: boolean;
    original_source_id?: string | null;
    original_article_id?: string | null;
    canonical_wire?: string | null;
    syndication_confidence: number;
    evidence: string[];
  };

  normalized_content: {
    summary_1_sentence: string;
    factual_claims: FactualClaim[];
    quotes: ExtractedQuote[];
    entities: NormalizedEntity[];
    topics: string[];
    region_scope: string[];
    raw_text_ref: string;
  };

  event_extraction: {
    event_tuples: EventTuple[];
    primary_event_tuple_id?: string | null;
    event_extraction_notes?: string[];
  };

  dedupe_features: {
    normalized_title_tokens: string[];
    title_fingerprint: string;
    entity_key: string;
    time_bucket?: string | null;
    place_key?: string | null;
    action_key?: string | null;
  };

  processing: {
    status: NormalizationStatus;
    block_reason?: string | null;
    created_at: string;
    updated_at: string;
    schema_version: "normalized_article_v1";
  };
}

// --- Event cluster ---

export interface ClusterFact {
  cluster_fact_id: string;
  text: string;
  normalized_claim_type:
    | "core_event"
    | "number"
    | "quote"
    | "context"
    | "impact"
    | "timeline"
    | "uncertainty";
  supported_by_claim_ids: string[];
  supported_by_article_ids: string[];
  source_grades: QualityGrade[];
  requires_attribution: boolean;
  confidence: number;
  uncertainty_flags: string[];
}

export interface ClusterConflict {
  conflict_id: string;
  conflict_type:
    | "number_mismatch"
    | "status_mismatch"
    | "time_mismatch"
    | "cause_mismatch"
    | "denial"
    | "scope_mismatch"
    | "other";
  description: string;
  positions: {
    text: string;
    article_ids: string[];
    source_grade: QualityGrade;
    confidence: number;
  }[];
  resolution:
    | "unresolved"
    | "prefer_official"
    | "prefer_latest"
    | "prefer_anchor"
    | "minor_difference"
    | "manual_review";
  generation_instruction: string;
}

export interface ClusterFrame {
  frame_id: string;
  cluster_id: string;
  article_id: string;
  source_region?: string | null;
  audience_region?: string | null;
  language: string;
  source_type: SourceType;
  frame_labels: FrameLabel[];
  primary_stakeholders_mentioned: string[];
  secondary_stakeholders_mentioned: string[];
  evidence_basis: string[];
  tone_intensity: "low" | "medium" | "high";
  sentiment_toward_actor?: "positive" | "neutral" | "negative" | "mixed" | "unclear";
  frame_summary: string;
  supporting_claim_ids: string[];
  confidence: number;
}

export interface EventCluster {
  cluster_id: string;
  schema_version: "event_cluster_v1";
  created_at: string;
  updated_at: string;
  ingest_run_ids: string[];

  canonical_event_name: string;
  canonical_event_slug: string;
  primary_event_tuple: EventTuple;
  related_event_tuples?: EventTuple[];

  status: EventStatus;
  freshness: ClusterFreshness;

  articles: {
    article_ids: string[];
    anchor_article_id: string;
    supporting_article_ids: string[];
    duplicate_article_ids: string[];
    syndicated_article_ids: string[];
    excluded_article_ids: { article_id: string; reason: string }[];
  };

  source_mix: {
    counts_by_grade: { A: number; B: number; C: number; D: number; Block: number };
    counts_by_type: Record<string, number>;
    independent_source_count: number;
    syndicated_copy_count: number;
    official_source_present: boolean;
    anchor_source_grade: QualityGrade;
  };

  geography_language: {
    event_places: string[];
    regions_represented: string[];
    source_regions_represented: string[];
    audience_regions_represented: string[];
    languages_represented: string[];
  };

  facts: ClusterFact[];
  conflicts: ClusterConflict[];
  frames: ClusterFrame[];

  confidence: {
    cluster_confidence: number;
    dedupe_confidence: number;
    factual_confidence: number;
    independence_confidence: number;
    extraction_confidence: number;
    confidence_label: ConfidenceLabel;
  };

  decision_trace: {
    merge_method: (
      | "canonical_url"
      | "syndication"
      | "jaccard"
      | "event_tuple"
      | "embedding"
      | "manual"
      | "validator"
    )[];
    reason_codes: string[];
    thresholds_hit: Record<string, number | string | boolean>;
    split_warnings: string[];
    review_required: boolean;
  };

  downstream: {
    candidate_for_relevance_scoring: boolean;
    dashboard_safe: boolean;
    email_eligible_by_cluster_quality: boolean;
    blockers: string[];
  };
}

/**
 * Debug artifact for the full 8B normalization → clustering pipeline.
 */
export interface NormalizationClusteringReport {
  run_id: string;
  created_at: string;
  input_article_count: number;
  normalized_article_count: number;
  blocked_count: number;
  failed_extraction_count: number;
  duplicate_pairs: { article_a: string; article_b: string; reason: string; confidence: number }[];
  cluster_count: number;
  clusters_email_eligible: number;
  clusters_dashboard_only: number;
  clusters_needs_review: number;
  cluster_summaries: {
    cluster_id: string;
    canonical_event_name: string;
    article_count: number;
    independent_sources: number;
    confidence_label: ConfidenceLabel;
    email_eligible: boolean;
    merge_methods: string[];
  }[];
}

// ---------------------------------------------------------------------------
// Package 8C — Company relevance + Perception Gap decision types.
//
// Layer 3 of the Package 8 funnel: decide which event clusters truly belong
// in a company briefing, which are dashboard-only, and when a Perception Gap
// note is evidence-based enough to show.
// ---------------------------------------------------------------------------

// --- Company briefing profile (8C input) ---

export type ScanAreaCategory =
  | "regulation"
  | "market"
  | "supply_chain"
  | "geopolitics"
  | "technology"
  | "security"
  | "reputation"
  | "customers"
  | "competitors"
  | "climate"
  | "macro"
  | "custom";

export type ScanAreaPriority = "high" | "medium" | "low";

export interface SelectedScanArea {
  area_id: string;
  label: string;
  category: ScanAreaCategory;
  priority: ScanAreaPriority;
  regions?: string[];
  entities?: string[];
  keywords?: string[]; // supporting only, not sufficient
  description?: string;
}

export interface WatchEntity {
  entity_id: string;
  name: string;
  type: "competitor" | "supplier" | "regulator" | "customer" | "partner" | "market" | "product" | "other";
  aliases?: string[];
}

export interface CompanyBriefingProfile {
  company_id: string;
  display_name: string;
  industry: string;
  sub_industries?: string[];
  operating_regions: string[];
  customer_regions?: string[];
  supplier_regions?: string[];
  regulatory_regions?: string[];
  selected_scan_areas: SelectedScanArea[];
  watch_entities?: WatchEntity[];
  risk_priorities?: string[];
  opportunity_priorities?: string[];
  materiality_notes?: string;
}

// --- Materiality ---

export type MaterialityCategory =
  | "revenue"
  | "cost"
  | "operations"
  | "supply_chain"
  | "regulatory_compliance"
  | "legal"
  | "capital_markets"
  | "reputation"
  | "security"
  | "talent"
  | "customer_behaviour"
  | "strategy"
  | "market_access"
  | "partnerships";

export interface ImpactPathway {
  category: MaterialityCategory;
  pathway: string;
  supported_by: string[];
  confidence: number;
}

// --- Scan area match ---

export type ScanAreaMatchType =
  | "direct_company"
  | "watch_entity"
  | "regulatory_region"
  | "operating_region"
  | "supplier_region"
  | "customer_region"
  | "sector_event"
  | "topic_semantic"
  | "keyword_only";

export interface ScanAreaMatch {
  area_id: string;
  match_strength: "strong" | "medium" | "weak" | "none";
  match_type: ScanAreaMatchType[];
  evidence: string[];
  explanation: string;
}

// --- Geography, time, novelty metadata ---

export interface GeographyMetadata {
  event_place?: string;
  affected_regions: string[];
  source_regions: string[];
  audience_regions?: string[];
  company_relevant_regions: string[];
  geography_fit_score: number;
  geography_reason: string;
}

export interface TimeMetadata {
  event_time?: string;
  published_window: "last_24h" | "last_48h" | "last_7d" | "older";
  first_seen_at: string;
  last_seen_at: string;
  freshness: ClusterFreshness;
  stale_reason?: string;
}

export interface NoveltySignals {
  seen_before: boolean;
  previous_cluster_id?: string;
  new_development_type?: "new_fact" | "official_confirmation" | "regional_angle" | "impact_update" | "none";
  novelty_score: number;
  novelty_reason: string;
}

// --- Relevance decision ---

export type RelevanceDecisionType = "email" | "email_caution" | "dashboard" | "exclude";

export interface RelevanceDimensionScores {
  selected_area_fit: number;
  entity_proximity: number;
  business_materiality: number;
  geography_fit: number;
  timeliness: number;
  specificity: number;
  actionability: number;
  evidence_strength: number;
  novelty: number;
}

export interface RelevanceDecision {
  cluster_id: string;
  decision: RelevanceDecisionType;
  company_relevance_score: number;
  dimension_scores: RelevanceDimensionScores;
  matched_scan_areas: ScanAreaMatch[];
  materiality: {
    score: number;
    categories: MaterialityCategory[];
    impact_pathways: ImpactPathway[];
  };
  geography: GeographyMetadata;
  time: TimeMetadata;
  novelty: NoveltySignals;
  weak_match: {
    flag: boolean;
    reasons: string[];
  };
  decision_reasons: string[];
  exclusion_reasons?: string[];
  confidence_notes?: string[];
}

// --- Section no-findings ---

export interface SectionNoFinding {
  section_id: string;
  label: string;
  scan_coverage_count: number;
  no_material_findings: true;
  top_excluded_reasons: string[];
  email_line_allowed: boolean;
  suggested_email_line?: string;
}

// --- Reason codes ---

export type PositiveReasonCode =
  | "direct_company_match"
  | "selected_area_strong_match"
  | "high_materiality_regulatory"
  | "high_materiality_supply_chain"
  | "high_materiality_market"
  | "company_region_affected"
  | "watch_entity_involved"
  | "official_or_a_anchor"
  | "new_development"
  | "useful_regional_frame"
  | "clear_actionability";

export type ExclusionReasonCode =
  | "keyword_only"
  | "wrong_entity"
  | "no_impact_pathway"
  | "generic_sector_filler"
  | "seo_sludge"
  | "duplicate_event"
  | "stale_no_new_fact"
  | "low_cluster_confidence"
  | "weak_source_mix"
  | "c_d_only_uncorroborated"
  | "remote_geography_low_materiality"
  | "selected_area_weak_match"
  | "perception_gap_thin_evidence"
  | "perception_gap_tone_only"
  | "perception_gap_single_source"
  | "dashboard_only_low_materiality";

export type ReasonCode = PositiveReasonCode | ExclusionReasonCode;

// --- Perception Gap ---

export type PerceptionGapType =
  | "regional_frame_difference"
  | "stakeholder_emphasis_difference"
  | "coverage_asymmetry"
  | "evidence_basis_difference"
  | "language_market_difference"
  | "risk_opportunity_interpretation";

export type ComparedDimension =
  | "region"
  | "language"
  | "source_type"
  | "stakeholder"
  | "evidence_type"
  | "coverage_volume";

export interface PerceptionGapDecision {
  cluster_id: string;
  eligible: boolean;
  show_in_email: boolean;
  show_in_dashboard: boolean;
  gap_type?: PerceptionGapType;
  evidence_frame_ids: string[];
  compared_dimensions: ComparedDimension[];
  material_difference: string;
  company_relevance: string;
  suggested_note?: string;
  confidence: number;
  skip_reason?: string;
}

// --- Email candidate item ---

export interface EmailCandidateItem {
  item_id: string;
  cluster_id: string;
  section_ids: string[];
  title: string;
  canonical_event_name: string;
  short_summary_facts: string[];
  why_it_matters: {
    text: string;
    supported_by: string[];
  };
  uncertainty?: string[];
  relevance_decision: RelevanceDecision;
  perception_gap?: PerceptionGapDecision;
  source_summary: {
    anchor: { source: string; grade: QualityGrade; url: string; article_id: string };
    supporting: Array<{ source: string; grade: string; url: string; article_id: string }>;
  };
}

// --- 8C pipeline output ---

export interface CompanyRelevanceResult {
  company_id: string;
  run_id: string;
  created_at: string;
  email_items: EmailCandidateItem[];
  dashboard_items: Array<{
    cluster_id: string;
    canonical_event_name: string;
    decision: RelevanceDecision;
    perception_gap?: PerceptionGapDecision;
  }>;
  excluded_items: Array<{
    cluster_id: string;
    canonical_event_name: string;
    decision: RelevanceDecision;
  }>;
  section_no_findings: SectionNoFinding[];
  perception_gap_decisions: PerceptionGapDecision[];
}

// --- 8C debug report ---

export interface RelevanceDebugReport {
  run_id: string;
  company_id: string;
  created_at: string;
  input_cluster_count: number;
  email_count: number;
  email_caution_count: number;
  dashboard_count: number;
  exclude_count: number;
  perception_gap_eligible: number;
  perception_gap_email: number;
  perception_gap_dashboard: number;
  perception_gap_skipped: number;
  section_no_findings: SectionNoFinding[];
  cluster_decisions: Array<{
    cluster_id: string;
    canonical_event_name: string;
    decision: RelevanceDecisionType;
    company_relevance_score: number;
    dimension_scores: RelevanceDimensionScores;
    decision_reasons: string[];
    exclusion_reasons?: string[];
    perception_gap_eligible: boolean;
    perception_gap_confidence?: number;
    perception_gap_skip_reason?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Package 8D — Evidence Packet + Generation Output + Briefing Structure.
// ---------------------------------------------------------------------------

// --- Evidence Packet ---

export interface CompanyBriefingEvidencePacket {
  packet_version: "company_briefing_evidence_v1";
  run_id: string;
  generated_at: string;
  pipeline: {
    generation_route: "internal_openclaw_cron";
    public_pipeline_compatible: true;
    separate_openai_api_required: false;
  };
  company: EvidencePacketCompanyContext;
  briefing_policy: CompanyBriefingPolicy;
  input_summary: EvidenceInputSummary;
  email_items: EvidenceEmailItem[];
  section_no_findings: SectionNoFinding[];
  dashboard_only_items: EvidencePacketDashboardItem[];
  excluded_summary: ExcludedSummary;
  source_registry_refs: string[];
  qa_requirements: QARequirement[];
  audit: EvidencePacketAudit;
}

export interface EvidencePacketCompanyContext {
  company_id: string;
  display_name: string;
  industry?: string;
  description_short?: string;
  regions: string[];
  selected_scan_areas: EvidencePacketScanArea[];
  watch_entities: EvidencePacketWatchEntity[];
}

export interface EvidencePacketScanArea {
  area_id: string;
  label: string;
  priority: "critical" | "high" | "medium" | "low";
  notes?: string;
}

export interface EvidencePacketWatchEntity {
  entity_id?: string;
  name: string;
  type: "company" | "competitor" | "supplier" | "customer" | "regulator" | "market" | "technology" | "place" | "other";
  relationship?: string;
}

export interface CompanyBriefingPolicy {
  tone: "calm_concise_useful_non_alarmist";
  max_email_items: number;
  max_words_total?: number;
  max_words_per_item?: number;
  no_inference_beyond_evidence: true;
  allow_no_send: true;
  allow_no_material_signal_line: boolean;
  attribution_required_for: AttributionTrigger[];
  prohibited_language: string[];
  required_qualifiers: RequiredQualifierRule[];
}

export type AttributionTrigger =
  | "single_source"
  | "legal_or_regulatory"
  | "market_moving"
  | "conflict"
  | "local_context"
  | "allegation"
  | "forecast"
  | "casualty_or_safety"
  | "official_document";

export interface RequiredQualifierRule {
  condition: "proposed" | "alleged" | "single_source" | "developing" | "conflicting_reports" | "low_confidence";
  qualifier_examples: string[];
}

export interface EvidenceInputSummary {
  raw_articles_count: number;
  normalized_articles_count: number;
  candidate_clusters_count: number;
  email_candidate_count: number;
  final_email_item_count: number;
  dashboard_only_count: number;
  excluded_count: number;
  scan_window: {
    from: string;
    to: string;
  };
}

export interface EvidenceEmailItem {
  item_id: string;
  cluster_id: string;
  section_ids: string[];
  canonical_event_name: string;
  event_tuple: EvidenceEventTuple;
  item_status: "confirmed" | "developing" | "alleged" | "analysis" | "proposed";
  decision: {
    target: "email";
    relevance_score: number;
    cluster_confidence: number;
    decision_reason: string;
    threshold_basis: string[];
  };
  why_it_matters: EvidenceSupportedText;
  facts: EvidenceClaim[];
  uncertainty: EvidenceUncertaintyNote[];
  conflicts: EvidenceConflictNote[];
  source_summary: EvidenceSourceSummary;
  perception_gap?: EvidencePerceptionGapBlock;
  generation_hints?: EvidenceGenerationHints;
}

export interface EvidenceEventTuple {
  actor?: string;
  action: string;
  object?: string;
  place?: string;
  event_time?: string;
  status: "announced" | "reported" | "rumored" | "confirmed" | "denied" | "proposed" | "analysis";
}

export interface EvidenceSupportedText {
  text: string;
  supported_by: EvidenceSupportRef[];
  confidence: number;
}

export interface EvidenceSupportRef {
  type: "claim_id" | "company_profile_field" | "scan_area" | "source_id" | "frame_id";
  id: string;
}

export interface EvidenceClaim {
  claim_id: string;
  text: string;
  claim_type: "fact" | "quote" | "stat" | "forecast" | "allegation" | "analysis" | "official_statement";
  supported_by: EvidenceArticleSupport[];
  confidence: number;
  attribution_required: boolean;
  attribution_reason?: AttributionTrigger[];
  required_qualifier?: string;
}

export interface EvidenceArticleSupport {
  article_id: string;
  source_id: string;
  source_display_name: string;
  source_grade: QualityGrade;
  source_type: SourceType;
  url: string;
  role: "anchor" | "supporting" | "local_context" | "official_primary" | "contradicting";
  published_at?: string;
  evidence_action?: EvidenceAction;
  email_evidence_eligible?: boolean;
  seo_sludge_score?: number;
}

export interface EvidenceUncertaintyNote {
  uncertainty_id: string;
  type: "single_source" | "developing" | "proposed" | "alleged" | "unclear_timing" | "low_confidence" | "limited_detail";
  text: string;
  applies_to_claim_ids: string[];
  must_mention: boolean;
}

export interface EvidenceConflictNote {
  conflict_id: string;
  claim_topic: string;
  positions: Array<{
    source_id: string;
    article_id: string;
    position_text: string;
    confidence: number;
  }>;
  resolution?: "unresolved" | "official_source_preferred" | "newer_source_preferred" | "manual_reviewed";
  must_mention: boolean;
}

export interface EvidenceSourceSummary {
  anchor: EvidenceArticleSupport;
  supporting: EvidenceArticleSupport[];
  source_mix: { A: number; B: number; C: number; D: number; Block: number };
  regions_represented: string[];
  languages_represented: string[];
  source_diversity_note?: string;
}

export interface EvidencePerceptionGapBlock {
  eligible: boolean;
  show_recommendation: "show" | "skip" | "manual_review";
  frame_ids: string[];
  frames: EvidencePerceptionFrame[];
  suggested_note?: EvidenceSupportedText;
  skip_reason?: string;
}

export interface EvidencePerceptionFrame {
  frame_id: string;
  cluster_id: string;
  article_id: string;
  source_region: string;
  audience_region?: string;
  language: string;
  frame_labels: string[];
  primary_stakeholders_mentioned: string[];
  tone_intensity: "low" | "medium" | "high";
  evidence_type: "official" | "expert" | "local" | "market" | "opinion" | "wire" | "company";
  summary: string;
  source_grade: QualityGrade;
}

export interface EvidenceGenerationHints {
  preferred_tone?: string;
  max_words?: number;
  attribution_note?: string;
}

export interface EvidencePacketDashboardItem {
  cluster_id: string;
  canonical_event_name: string;
  reason: "low_materiality" | "medium_confidence" | "single_source" | "not_time_sensitive" | "watchlist_signal" | "thin_relevance" | "manual_review_needed";
  relevance_score: number;
  cluster_confidence: number;
  allowed_in_email_generation: false;
}

export type ExcludeReason =
  | "seo_sludge"
  | "duplicate"
  | "weak_match"
  | "stale"
  | "source_blocked"
  | "low_confidence"
  | "wrong_entity"
  | "no_event"
  | "prompt_injection"
  | "already_seen";

export interface ExcludedSummary {
  counts_by_reason: Partial<Record<ExcludeReason, number>>;
  notable_exclusions: Array<{
    article_id?: string;
    cluster_id?: string;
    title?: string;
    reason: ExcludeReason;
    audit_note: string;
  }>;
}

export type QARequirement =
  | "schema_validation"
  | "claim_source_check"
  | "style_lint"
  | "relevance_check"
  | "duplicate_check"
  | "perception_gap_check"
  | "prompt_injection_check"
  | "source_quality_check"
  | "policy_limit_check";

export interface EvidencePacketAudit {
  built_by: "company_scan_funnel";
  build_version: string;
  upstream_run_refs: string[];
  packet_validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

// --- Generation Output ---

export interface CompanyBriefingGenerationOutput {
  output_version: "company_briefing_generation_v1";
  run_id: string;
  company_id: string;
  generated_at: string;
  source_packet_version: "company_briefing_evidence_v1";
  today_brief: GeneratedTodayBrief;
  main_briefing: GeneratedMainBriefing;
  perception_gap: GeneratedPerceptionGap;
  useful_observations: GeneratedUsefulObservations;
  source_notes: GeneratedSourceNotes;
  trace: GenerationTrace;
}

export interface GeneratedTodayBrief {
  top_line: GeneratedText;
  bullets: GeneratedText[];
}

export interface GeneratedMainBriefing {
  sections: GeneratedBriefingSection[];
}

export interface GeneratedBriefingSection {
  section_id: string;
  heading: string;
  items: GeneratedBriefingItem[];
  no_material_signal_line?: GeneratedText;
}

export interface GeneratedBriefingItem {
  generated_item_id: string;
  packet_item_id: string;
  cluster_id: string;
  title: GeneratedText;
  body: GeneratedText;
  why_it_matters?: GeneratedText;
  uncertainty_line?: GeneratedText;
  perception_gap_note?: GeneratedText;
  source_attribution?: GeneratedText;
  claim_map: GeneratedClaimMap[];
}

export interface GeneratedText {
  text: string;
  supported_by: EvidenceSupportRef[];
}

export interface GeneratedClaimMap {
  generated_text_path: string;
  text: string;
  claim_ids: string[];
  support_refs: EvidenceSupportRef[];
}

export interface GeneratedPerceptionGap {
  notes: GeneratedPerceptionGapNote[];
}

export interface GeneratedPerceptionGapNote {
  packet_item_id: string;
  cluster_id: string;
  note: GeneratedText;
  frame_ids: string[];
}

export interface GeneratedUsefulObservations {
  observations: GeneratedText[];
}

export interface GeneratedSourceNotes {
  text: GeneratedText;
  scanned_count: number;
  scan_areas_covered: string[];
  dashboard_link?: string;
}

export interface GenerationTrace {
  generator_route: "internal_openclaw_cron";
  generator_version: string;
  prompt_template_version: string;
  model_or_agent_label?: string;
  packet_item_ids_used: string[];
  packet_item_ids_omitted: string[];
  dashboard_items_used_in_email: string[];
  excluded_items_used_in_email: string[];
}

// ---------------------------------------------------------------------------
// Package 8E — QA Gates + Pre-Send Verification types.
//
// Layer 6 of the Package 8 funnel: verify that generated output is
// schema-valid, source-grounded, relevance-supported, non-duplicative,
// calm, and safe before send.
// ---------------------------------------------------------------------------

export type QAStatus = "send" | "hold" | "dashboard_only" | "manual_review" | "dry_run_only";

export interface CompanyBriefingQAReport {
  qa_report_version: "company_briefing_qa_v1";
  run_id: string;
  company_id: string;
  checked_at: string;
  status: QAStatus;

  input_counts: {
    raw_articles: number;
    normalized_articles: number;
    candidate_clusters: number;
    email_items_in_packet: number;
    generated_email_items: number;
    dashboard_only_items: number;
    excluded_items: number;
  };

  filters: {
    blocked_sources: number;
    seo_sludge: number;
    duplicates: number;
    weak_matches: number;
    prompt_injection: number;
    stale: number;
  };

  schema_checks: QASchemaCheck[];
  source_checks: QASourceCheck[];
  claim_checks: QAClaimCheck[];
  relevance_checks: QARelevanceCheck[];
  duplicate_checks: QADuplicateCheck[];
  perception_gap_checks: QAPerceptionGapCheck[];
  style_checks: QAStyleCheck;
  policy_checks: QAPolicyCheck[];

  blocking_failures: QAFailure[];
  warnings: QAFailure[];
  auto_revisions: QARevision[];
  final_decision_reason: string;
}

export interface QASchemaCheck {
  target: "packet" | "generation_output";
  valid: boolean;
  errors: string[];
}

export interface QASourceCheck {
  item_id: string;
  cluster_id: string;
  anchor_source_id: string;
  anchor_grade: QualityGrade;
  email_safe_anchor: boolean;
  blocked_source_used: boolean;
  seo_sludge_used: boolean;
  result: "pass" | "warn" | "block";
}

export interface QAClaimCheck {
  generated_text_path: string;
  draft_claim: string;
  claim_ids: string[];
  supported: boolean;
  source_ids: string[];
  attribution_required: boolean;
  attribution_present: boolean;
  uncertainty_required: boolean;
  uncertainty_present: boolean;
  contradiction_found: boolean;
  result: "pass" | "warn" | "block";
}

export interface QARelevanceCheck {
  item_id: string;
  cluster_id: string;
  score: number;
  decision: "email" | "dashboard_only" | "exclude";
  why_it_matters_supported: boolean;
  scan_area_supported: boolean;
  weak_match_detected: boolean;
  result: "pass" | "warn" | "block";
  reason: string;
}

export interface QADuplicateCheck {
  generated_item_ids: string[];
  cluster_ids: string[];
  duplicate_event_detected: boolean;
  result: "pass" | "warn" | "block";
  action?: "merged" | "removed_duplicate" | "manual_review";
}

export interface QAPerceptionGapCheck {
  item_id: string;
  note_shown: boolean;
  eligible_in_packet: boolean;
  frame_count: number;
  credible_frame_count: number;
  neutral_wording: boolean;
  supported: boolean;
  result: "pass" | "warn" | "block";
  reason?: string;
}

export interface QAStyleCheck {
  calm_tone: boolean;
  no_hype: boolean;
  concise: boolean;
  prohibited_language_found: string[];
  reading_load_ok: boolean;
  repeated_phrasing: boolean;
  result: "pass" | "warn" | "block";
}

export interface QAPolicyCheck {
  policy: string;
  passed: boolean;
  result: "pass" | "warn" | "block";
  detail?: string;
}

export interface QAFailure {
  code: string;
  severity: "blocking" | "warning";
  item_id?: string;
  generated_text_path?: string;
  message: string;
  suggested_fix?: string;
}

export interface QARevision {
  revision_id: string;
  reason: string;
  before: string;
  after: string;
  result: "fixed" | "still_warning" | "failed";
}

export interface DryRunMetadata {
  dry_run: true;
  would_have_sent: boolean;
  would_have_status: QAStatus;
  external_delivery_suppressed: true;
  operator_notes?: string;
}

// --- Generation metadata ---

export interface CompanyBriefingGenerationMetadata {
  packet_version: "company_briefing_evidence_v1";
  generator_version: string;
  prompt_template_version: string;
  cluster_ids: string[];
  source_ids: string[];
  generated_sections: string[];
  generation_route: "internal_openclaw_cron";
  dry_run: boolean;
  generated_at: string;
}
