// ---------------------------------------------------------------------------
// Albis Understanding Layer — shared types.
//
// This is the layer between scan/retrieval and writing. A scan item is not
// allowed to become a full report just because it exists; it first has to pass
// through an interpretation object that says what changed, what is missing,
// who sees it differently, and what the clean thesis is.
// ---------------------------------------------------------------------------

import type {
  CompanyPgiStoryArc,
  CompanyPgiStoryExample,
} from "./company-pgi-story-arc";

export type UnderstandingScope = "public" | "company";

export type UnderstandingRoute =
  | "deep_read"
  | "quick_hit"
  | "dashboard_note"
  | "hold"
  | "discard";

export type UnderstandingConfidence = "high" | "medium" | "low";

export interface UnderstandingSourceRef {
  type:
    | "claim_id"
    | "source_id"
    | "article_id"
    | "signal_id"
    | "scan_area"
    | "cluster_id"
    | "company_profile_field"
    | "frame_id";
  id: string;
}

export interface UnderstandingCandidateItem {
  item_id: string;
  title: string;
  summary?: string | null;
  source_domain?: string | null;
  source_region?: string | null;
  source_language?: string | null;
  regions?: string[];
  themes?: string[];
  entities?: string[];
  support_refs: UnderstandingSourceRef[];
}

export interface UnderstandingCandidateCluster {
  cluster_id: string;
  date: string;
  scope: UnderstandingScope;
  company_profile_id?: string;
  title_guess: string;
  items: UnderstandingCandidateItem[];
  source_domains: string[];
  regions: string[];
  languages: string[];
  categories: string[];
  company_scan_areas?: string[];
  possible_event_type?: string;
}

export interface UnderstandingDiagnostics {
  route: UnderstandingRoute;
  source_count: number;
  region_count: number;
  language_count: number;
  has_frame_evidence: boolean;
  has_company_relevance: boolean;
  missing_evidence: string[];
  voice_warnings: string[];
}

export interface UnderstandingNote {
  note_id: string;
  created_at: string;
  scope: UnderstandingScope;
  date: string;
  company_profile_id?: string;
  cluster_id: string;
  route: UnderstandingRoute;
  confidence: UnderstandingConfidence;
  what_changed: string;
  why_it_matters: string;
  what_reader_might_miss: string;
  who_sees_it_differently: string[];
  what_is_missing_or_undercovered: string[];
  human_consequence?: string;
  systems_consequence?: string;
  company_relevance?: string;
  cui_bono: string;
  one_clean_thesis: string;
  supporting_facts: string[];
  uncertainty: string;
  output_recommendation: string;
  support_refs: UnderstandingSourceRef[];
  diagnostics: UnderstandingDiagnostics;
}

export interface CompanyPgiV2Report {
  version: "company_pgi_v2";
  generated_at: string;
  company_profile_id: string;
  company_name: string;
  date: string;
  email_read: string;
  dashboard_read: {
    headline: string;
    score: number;
    level: string;
    main_split: string;
    missing_or_undercovered: string[];
    cui_bono: string;
    company_relevance: string;
    evidence: Array<{
      label: string;
      source_domains: string[];
      regions: string[];
    }>;
    notes_used: string[];
    story_arcs?: CompanyPgiStoryArc[];
    suppressed_repeats?: CompanyPgiStoryExample[];
  };
  story_arcs?: CompanyPgiStoryArc[];
  pgi_observations?: Array<{
    text: string;
    supported_by: Array<{ type: string; id: string }>;
  }>;
  understanding_notes: UnderstandingNote[];
}
