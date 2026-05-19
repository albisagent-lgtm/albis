import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompanyProfile } from "../company-profile";
import type {
  CompanyBriefingEvidencePacket,
  CompanyBriefingGenerationOutput,
  CompanyResearchedUnderstandingLayer,
  EvidenceEmailItem,
} from "./types";
import { persistCompanyIntelligenceWiki } from "./company-intelligence-wiki";

export type LearningConfidence = "high" | "medium" | "low";
export type ProfileUpdateAction = "promote" | "demote" | "add" | "watch" | "exclude";

export interface CompanyIntelligenceProfile {
  profile_version: "company_intelligence_profile_v1";
  company_profile_id: string;
  company_name: string;
  generated_at: string;
  last_learning_date?: string;
  source_memory: {
    useful_domains: string[];
    noisy_domains: string[];
    useful_languages: string[];
    source_cache_notes: string[];
  };
  retrieval_memory: {
    promoted_regions: string[];
    promoted_topics: string[];
    promoted_entities: string[];
    exclusions: string[];
    deep_dive_query_seeds: string[];
    daily_query_budget: number;
    deep_dive_query_budget: number;
  };
  customer_safe_memory: string[];
  internal_notes: string[];
}

export interface DailyLearning {
  learning_id: string;
  layer_version: "company_daily_learning_v1";
  company_profile_id: string;
  company_name: string;
  scan_date: string;
  generated_at: string;
  what_was_learned_today: string[];
  useful_sources: Array<{ domain: string; reason: string; confidence: LearningConfidence }>;
  useful_languages: Array<{ language: string; reason: string; confidence: LearningConfidence }>;
  recurring_entities: string[];
  new_entities: string[];
  regions_to_promote: string[];
  topics_to_promote: string[];
  noise_or_exclusions: Array<{ value: string; reason: string }>;
  suggested_profile_updates: ProfileUpdateSuggestion[];
  deep_dive_query_seeds: DeepDiveQuerySeed[];
  customer_safe_insights: string[];
  cost_controls: {
    max_daily_learning_items: number;
    max_profile_updates: number;
    deep_dive_only_for_strong_signals: boolean;
    source_cache_notes: string[];
    suggested_daily_query_budget: number;
    suggested_deep_dive_query_budget: number;
  };
  internal_reasoning: {
    source: "deterministic_pass2_v1";
    evidence_item_count: number;
    researched_cluster_count: number;
    notes: string[];
  };
}

export interface ProfileUpdateSuggestion {
  field:
    | "useful_domains"
    | "noisy_domains"
    | "useful_languages"
    | "promoted_entities"
    | "promoted_regions"
    | "promoted_topics"
    | "exclusions"
    | "deep_dive_query_seeds";
  action: ProfileUpdateAction;
  value: string;
  reason: string;
  confidence: LearningConfidence;
  customer_visible: boolean;
}

export interface DeepDiveQuerySeed {
  seed: string;
  reason: string;
  priority: "high" | "medium" | "low";
  required_context: string[];
  source_budget_hint: number;
}

export interface ProfileUpdatePatch {
  useful_domains: string[];
  noisy_domains: string[];
  useful_languages: string[];
  promoted_entities: string[];
  promoted_regions: string[];
  promoted_topics: string[];
  exclusions: string[];
  deep_dive_query_seeds: string[];
}

export interface Pass2Input {
  profile: CompanyProfile;
  scanDate: string;
  evidencePacket: CompanyBriefingEvidencePacket;
  briefingContent?: CompanyBriefingGenerationOutput;
  researchedUnderstanding?: CompanyResearchedUnderstandingLayer;
  selectedSignals?: Array<Record<string, unknown>>;
  retrievalSummary?: Record<string, unknown>;
  deepDiveRetrieval?: Record<string, unknown> | null;
}

export interface Pass2Result {
  daily_learning: DailyLearning;
  suggested_profile: CompanyIntelligenceProfile;
  profile_update_patch: ProfileUpdatePatch;
  customer_safe_report_insights: string[];
}

const DEFAULT_DAILY_QUERY_BUDGET = 24;
const DEFAULT_DEEP_DIVE_QUERY_BUDGET = 8;

function uniq(values: Array<string | null | undefined>, limit = 20): string[] {
  return [...new Set(values.map((v) => String(v || "").trim()).filter(Boolean))].slice(0, limit);
}

function slugHash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function domainFromUrl(url?: string | null): string | null {
  try {
    return url ? new URL(url).hostname.replace(/^www\./i, "") : null;
  } catch {
    return null;
  }
}

function topCounts(values: string[], limit = 8): string[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([value]) => value);
}

function itemDomains(items: EvidenceEmailItem[]): string[] {
  return items.flatMap((item) => [
    item.source_summary?.anchor?.source_id?.replace(/^domain:/, ""),
    domainFromUrl(item.source_summary?.anchor?.url),
    ...(item.source_summary?.supporting || []).map((s) => s.source_id?.replace(/^domain:/, "") || domainFromUrl(s.url)),
  ]).filter(Boolean) as string[];
}

function itemLanguages(items: EvidenceEmailItem[]): string[] {
  return items.flatMap((item) => item.source_summary?.languages_represented || []);
}

function compactSentence(value: string, maxWords = 24): string {
  const words = String(value || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  return words.length > maxWords ? `${words.slice(0, maxWords).join(" ")}…` : words.join(" ");
}

function profileBaseline(profile: CompanyProfile, scanDate: string): CompanyIntelligenceProfile {
  return {
    profile_version: "company_intelligence_profile_v1",
    company_profile_id: profile.id,
    company_name: profile.company_name,
    generated_at: new Date().toISOString(),
    last_learning_date: scanDate,
    source_memory: { useful_domains: [], noisy_domains: [], useful_languages: [], source_cache_notes: [] },
    retrieval_memory: {
      promoted_regions: [],
      promoted_topics: [],
      promoted_entities: [],
      exclusions: [],
      deep_dive_query_seeds: [],
      daily_query_budget: DEFAULT_DAILY_QUERY_BUDGET,
      deep_dive_query_budget: DEFAULT_DEEP_DIVE_QUERY_BUDGET,
    },
    customer_safe_memory: [],
    internal_notes: [],
  };
}

export function runCompanyDailyLearningPass2(input: Pass2Input): Pass2Result {
  const packet = input.evidencePacket;
  const researched = input.researchedUnderstanding || input.briefingContent?.understanding?.researched_understanding_v1;
  const emailItems = packet.email_items || [];
  const findings = researched?.findings || [];
  const notes = researched?.notes || [];
  const researchSources = researched?.sources || [];

  const domains = topCounts([...itemDomains(emailItems), ...researchSources.map((s) => s.source_domain)], 10);
  const languages = topCounts([...itemLanguages(emailItems), ...researchSources.map((s) => s.language || "")], 8);
  const entities = uniq([
    ...emailItems.flatMap((item) => item.facts.flatMap((fact) => fact.text.match(/\b[A-Z][A-Za-z0-9&.'-]*(?:\s+[A-Z][A-Za-z0-9&.'-]*){0,4}\b/g) || [])),
    ...notes.flatMap((note) => note.key_actors || []),
  ], 24);
  const profileEntities = new Set((input.profile.watchlist_entities || []).map((e) => e.toLowerCase()));
  const recurringEntities = entities.filter((e) => profileEntities.has(e.toLowerCase())).slice(0, 8);
  const newEntities = entities.filter((e) => !profileEntities.has(e.toLowerCase())).slice(0, 8);
  const regions = topCounts([
    ...packet.company.regions,
    ...emailItems.flatMap((item) => item.source_summary?.regions_represented || []),
    ...notes.flatMap((note) => note.named_places || []),
  ], 8);
  const topics = topCounts([
    ...emailItems.flatMap((item) => item.section_ids || []),
    ...findings.map((finding) => finding.title),
  ], 10);
  const noisy = packet.excluded_summary?.notable_exclusions || [];

  const whatLearned = uniq([
    ...findings.slice(0, 5).map((f) => `${f.title}: ${compactSentence(f.body, 28)}`),
    ...notes.slice(0, 5).map((n) => compactSentence(n.albis_learning || n.summary, 28)),
    ...emailItems.slice(0, 4).map((i) => `Signal retained for ${i.section_ids.join(", ")}: ${compactSentence(i.canonical_event_name, 18)}`),
  ], 10);

  const usefulSources = domains.slice(0, 8).map((domain) => ({
    domain,
    reason: "Appeared in retained evidence or researched understanding for this company scan.",
    confidence: (emailItems.length >= 3 ? "medium" : "low") as LearningConfidence,
  }));
  const usefulLanguages = languages.slice(0, 6).map((language) => ({
    language,
    reason: "Language appeared in evidence/source trail; keep available for future retrieval where region/topic context supports it.",
    confidence: (language.toLowerCase() === "en" ? "medium" : "low") as LearningConfidence,
  }));
  const noiseOrExclusions = noisy.slice(0, 8).map((n) => ({
    value: n.title || n.cluster_id || n.article_id || n.reason,
    reason: `${n.reason}: ${n.audit_note}`,
  }));

  const seedBase = uniq([
    ...newEntities.slice(0, 5),
    ...topics.slice(0, 5),
    ...regions.slice(0, 4),
  ], 10);
  const deepDiveSeeds = seedBase.map((seed, index) => ({
    seed,
    reason: index < 4 ? "Strong retained signal or repeated entity/topic from today's scan." : "Secondary learning candidate; use only if tomorrow's first pass is thin.",
    priority: (index < 4 ? "high" : index < 7 ? "medium" : "low") as "high" | "medium" | "low",
    required_context: uniq([input.profile.company_name, input.profile.sector, ...topics.slice(0, 3), ...regions.slice(0, 2)], 6),
    source_budget_hint: index < 4 ? 3 : 1,
  }));

  const suggestions: ProfileUpdateSuggestion[] = [
    ...usefulSources.slice(0, 5).map((s) => ({ field: "useful_domains" as const, action: "promote" as const, value: s.domain, reason: s.reason, confidence: s.confidence, customer_visible: false })),
    ...usefulLanguages.slice(0, 4).map((l) => ({ field: "useful_languages" as const, action: "watch" as const, value: l.language, reason: l.reason, confidence: l.confidence, customer_visible: false })),
    ...newEntities.slice(0, 5).map((e) => ({ field: "promoted_entities" as const, action: "watch" as const, value: e, reason: "New named actor/place appeared in retained company-specific evidence.", confidence: "low" as const, customer_visible: false })),
    ...regions.slice(0, 5).map((r) => ({ field: "promoted_regions" as const, action: "promote" as const, value: r, reason: "Region recurred in retained evidence or source trail.", confidence: "medium" as const, customer_visible: false })),
    ...topics.slice(0, 5).map((t) => ({ field: "promoted_topics" as const, action: "promote" as const, value: t, reason: "Topic/scan area carried useful evidence today.", confidence: "medium" as const, customer_visible: false })),
    ...noiseOrExclusions.slice(0, 4).map((n) => ({ field: "exclusions" as const, action: "exclude" as const, value: n.value, reason: n.reason, confidence: "medium" as const, customer_visible: false })),
  ].slice(0, 24);

  const customerSafeInsights = uniq([
    whatLearned[0] ? `Learning carried forward: ${whatLearned[0]}` : undefined,
    usefulSources[0] ? `Source memory: ${usefulSources[0].domain} was useful in today's evidence trail.` : undefined,
    regions[0] ? `Coverage memory: ${regions[0]} should stay prominent in tomorrow's retrieval plan.` : undefined,
  ], 3);

  const patch: ProfileUpdatePatch = {
    useful_domains: suggestions.filter((s) => s.field === "useful_domains").map((s) => s.value),
    noisy_domains: suggestions.filter((s) => s.field === "noisy_domains").map((s) => s.value),
    useful_languages: suggestions.filter((s) => s.field === "useful_languages").map((s) => s.value),
    promoted_entities: suggestions.filter((s) => s.field === "promoted_entities").map((s) => s.value),
    promoted_regions: suggestions.filter((s) => s.field === "promoted_regions").map((s) => s.value),
    promoted_topics: suggestions.filter((s) => s.field === "promoted_topics").map((s) => s.value),
    exclusions: suggestions.filter((s) => s.field === "exclusions").map((s) => s.value),
    deep_dive_query_seeds: deepDiveSeeds.filter((s) => s.priority !== "low").map((s) => s.seed),
  };

  const daily: DailyLearning = {
    learning_id: `cdl_${input.scanDate}_${input.profile.id}_${slugHash(JSON.stringify(patch))}`,
    layer_version: "company_daily_learning_v1",
    company_profile_id: input.profile.id,
    company_name: input.profile.company_name,
    scan_date: input.scanDate,
    generated_at: new Date().toISOString(),
    what_was_learned_today: whatLearned,
    useful_sources: usefulSources,
    useful_languages: usefulLanguages,
    recurring_entities: recurringEntities,
    new_entities: newEntities,
    regions_to_promote: regions,
    topics_to_promote: topics,
    noise_or_exclusions: noiseOrExclusions,
    suggested_profile_updates: suggestions,
    deep_dive_query_seeds: deepDiveSeeds,
    customer_safe_insights: customerSafeInsights,
    cost_controls: {
      max_daily_learning_items: 24,
      max_profile_updates: 24,
      deep_dive_only_for_strong_signals: true,
      source_cache_notes: [
        "Reuse research_sources/text cache before fetching article bodies again.",
        "Run deep-dive seeds only after first-pass retained evidence exists or tomorrow's scan is thin.",
      ],
      suggested_daily_query_budget: DEFAULT_DAILY_QUERY_BUDGET,
      suggested_deep_dive_query_budget: DEFAULT_DEEP_DIVE_QUERY_BUDGET,
    },
    internal_reasoning: {
      source: "deterministic_pass2_v1",
      evidence_item_count: emailItems.length,
      researched_cluster_count: researched?.clusters.length || 0,
      notes: [
        `retrieval_summary=${JSON.stringify(input.retrievalSummary || {}).slice(0, 400)}`,
        `deep_dive=${JSON.stringify(input.deepDiveRetrieval || {}).slice(0, 400)}`,
      ],
    },
  };

  const suggestedProfile = profileBaseline(input.profile, input.scanDate);
  suggestedProfile.source_memory.useful_domains = patch.useful_domains;
  suggestedProfile.source_memory.noisy_domains = patch.noisy_domains;
  suggestedProfile.source_memory.useful_languages = patch.useful_languages;
  suggestedProfile.source_memory.source_cache_notes = daily.cost_controls.source_cache_notes;
  suggestedProfile.retrieval_memory.promoted_entities = patch.promoted_entities;
  suggestedProfile.retrieval_memory.promoted_regions = patch.promoted_regions;
  suggestedProfile.retrieval_memory.promoted_topics = patch.promoted_topics;
  suggestedProfile.retrieval_memory.exclusions = patch.exclusions;
  suggestedProfile.retrieval_memory.deep_dive_query_seeds = patch.deep_dive_query_seeds;
  suggestedProfile.customer_safe_memory = customerSafeInsights;
  suggestedProfile.internal_notes = whatLearned;

  return {
    daily_learning: daily,
    suggested_profile: suggestedProfile,
    profile_update_patch: patch,
    customer_safe_report_insights: customerSafeInsights,
  };
}

export async function persistCompanyDailyLearningPass2(
  supabase: SupabaseClient,
  result: Pass2Result | undefined,
  briefingId?: string | null,
): Promise<{ enabled: boolean; profile_written: boolean; learning_written: boolean; pages_written?: number; changes_written?: number; review_needed?: boolean }> {
  const wiki = await persistCompanyIntelligenceWiki(supabase, result, briefingId);
  return {
    enabled: wiki.enabled,
    profile_written: wiki.profile_written,
    learning_written: wiki.learning_written,
    pages_written: wiki.pages_written,
    changes_written: wiki.changes_written,
    review_needed: wiki.review_needed,
  };
}

export function buildPass2RetrievalHints(profile?: CompanyIntelligenceProfile | null): {
  promoted_terms: string[];
  excluded_terms: string[];
  useful_languages: string[];
  deep_dive_query_seeds: string[];
  daily_query_budget: number;
  deep_dive_query_budget: number;
} {
  return {
    promoted_terms: uniq([
      ...(profile?.retrieval_memory.promoted_entities || []),
      ...(profile?.retrieval_memory.promoted_regions || []),
      ...(profile?.retrieval_memory.promoted_topics || []),
    ], 32),
    excluded_terms: uniq(profile?.retrieval_memory.exclusions || [], 24),
    useful_languages: uniq(profile?.source_memory.useful_languages || [], 12),
    deep_dive_query_seeds: uniq(profile?.retrieval_memory.deep_dive_query_seeds || [], 16),
    daily_query_budget: profile?.retrieval_memory.daily_query_budget || DEFAULT_DAILY_QUERY_BUDGET,
    deep_dive_query_budget: profile?.retrieval_memory.deep_dive_query_budget || DEFAULT_DEEP_DIVE_QUERY_BUDGET,
  };
}
