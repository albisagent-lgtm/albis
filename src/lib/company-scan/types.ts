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
