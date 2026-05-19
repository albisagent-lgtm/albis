import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompanyProfile } from "../company-profile";
import type {
  CompanyIntelligenceProfile,
  DailyLearning,
  LearningConfidence,
  Pass2Result,
  ProfileUpdatePatch,
} from "./company-daily-learning";

export type CompanyIntelligencePageType =
  | "overview"
  | "regions_routes"
  | "language_map"
  | "source_map"
  | "regulatory_bodies"
  | "key_risks"
  | "recurring_entities"
  | "topic_clusters"
  | "noise_exclusions"
  | "open_questions"
  | "source_performance"
  | "language_performance"
  | "deep_dive_query_seeds";

export interface CompanyIntelligenceBudgets {
  daily_query_budget: number;
  deep_dive_query_budget: number;
}

export interface CompanyIntelligencePage<TPayload extends object = object> {
  company_profile_id: string;
  page_type: CompanyIntelligencePageType;
  title: string;
  page_payload: TPayload;
  customer_safe_memory: string[];
  internal_notes: string[];
  evidence_refs: CompanyEvidenceRef[];
  confidence: LearningConfidence;
  last_learning_date?: string;
}

export interface CompanyEvidenceRef {
  learning_id?: string;
  briefing_id?: string | null;
  scan_date?: string;
  value?: string;
  reason?: string;
}

export interface CompanyDailyLearning extends DailyLearning {
  customer_safe_insights: string[];
  internal_reasoning: DailyLearning["internal_reasoning"];
}

export interface CompanyProfileChangeLog {
  company_profile_id: string;
  learning_id?: string;
  scan_date?: string;
  change_type: string;
  page_type?: CompanyIntelligencePageType;
  field_name?: string;
  old_value?: unknown;
  new_value?: unknown;
  reason?: string;
  evidence_refs: CompanyEvidenceRef[];
  confidence: LearningConfidence;
  auto_applied: boolean;
  review_needed: boolean;
  customer_safe: boolean;
}

export interface SourceMapPagePayload {
  useful_domains: string[];
  noisy_domains: string[];
  source_cache_notes: string[];
  useful_sources_today: DailyLearning["useful_sources"];
}

export interface LanguageMapPagePayload {
  useful_languages: string[];
  useful_languages_today: DailyLearning["useful_languages"];
}

export interface TopicClustersPagePayload {
  promoted_topics: string[];
  latest_topics: string[];
}

export interface RecurringEntitiesPagePayload {
  promoted_entities: string[];
  recurring_entities: string[];
  new_entities_watchlist: string[];
}

export interface IntelligenceWikiUpdatePlan {
  profile: CompanyIntelligenceProfile;
  pages: CompanyIntelligencePage[];
  daily_learning: CompanyDailyLearning;
  change_log: CompanyProfileChangeLog[];
  review_needed: boolean;
  write_enabled: boolean;
}

export interface PersistCompanyIntelligenceWikiResult {
  enabled: boolean;
  write_enabled: boolean;
  profile_written: boolean;
  learning_written: boolean;
  pages_written: number;
  changes_written: number;
  review_needed: boolean;
  dry_run_plan?: IntelligenceWikiUpdatePlan;
}

const DEFAULT_DAILY_QUERY_BUDGET = 24;
const DEFAULT_DEEP_DIVE_QUERY_BUDGET = 8;
const ARRAY_LIMIT = 60;

function uniq(values: Array<string | null | undefined>, limit = ARRAY_LIMIT): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const clean = String(value || "").replace(/\s+/g, " ").trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
    if (out.length >= limit) break;
  }
  return out;
}

function budgetsFromProfile(profile?: CompanyIntelligenceProfile | null): CompanyIntelligenceBudgets {
  return {
    daily_query_budget: profile?.retrieval_memory?.daily_query_budget || DEFAULT_DAILY_QUERY_BUDGET,
    deep_dive_query_budget: profile?.retrieval_memory?.deep_dive_query_budget || DEFAULT_DEEP_DIVE_QUERY_BUDGET,
  };
}

function mergePatch(existing: CompanyIntelligenceProfile | null, suggested: CompanyIntelligenceProfile, patch: ProfileUpdatePatch, daily: DailyLearning): CompanyIntelligenceProfile {
  const base = existing || suggested;
  const budgets = budgetsFromProfile(base);
  return {
    ...base,
    profile_version: "company_intelligence_profile_v1",
    company_profile_id: suggested.company_profile_id,
    company_name: suggested.company_name,
    generated_at: new Date().toISOString(),
    last_learning_date: daily.scan_date,
    source_memory: {
      useful_domains: uniq([...(base.source_memory?.useful_domains || []), ...patch.useful_domains]),
      noisy_domains: uniq([...(base.source_memory?.noisy_domains || []), ...patch.noisy_domains]),
      useful_languages: uniq([...(base.source_memory?.useful_languages || []), ...patch.useful_languages], 24),
      source_cache_notes: uniq([...(base.source_memory?.source_cache_notes || []), ...daily.cost_controls.source_cache_notes], 30),
    },
    retrieval_memory: {
      promoted_regions: uniq([...(base.retrieval_memory?.promoted_regions || []), ...patch.promoted_regions]),
      promoted_topics: uniq([...(base.retrieval_memory?.promoted_topics || []), ...patch.promoted_topics]),
      promoted_entities: uniq([...(base.retrieval_memory?.promoted_entities || []), ...patch.promoted_entities]),
      exclusions: uniq([...(base.retrieval_memory?.exclusions || []), ...patch.exclusions], 80),
      deep_dive_query_seeds: uniq([...(base.retrieval_memory?.deep_dive_query_seeds || []), ...patch.deep_dive_query_seeds], 40),
      daily_query_budget: daily.cost_controls.suggested_daily_query_budget || budgets.daily_query_budget,
      deep_dive_query_budget: daily.cost_controls.suggested_deep_dive_query_budget || budgets.deep_dive_query_budget,
    },
    customer_safe_memory: uniq([...(base.customer_safe_memory || []), ...daily.customer_safe_insights], 30),
    internal_notes: uniq([...(base.internal_notes || []), ...daily.what_was_learned_today], 80),
  };
}

function page<TPayload extends object>(
  companyProfileId: string,
  pageType: CompanyIntelligencePageType,
  title: string,
  payload: TPayload,
  daily: DailyLearning,
  customerSafeMemory: string[] = [],
  internalNotes: string[] = [],
  confidence: LearningConfidence = "medium",
): CompanyIntelligencePage<TPayload> {
  return {
    company_profile_id: companyProfileId,
    page_type: pageType,
    title,
    page_payload: payload,
    customer_safe_memory: customerSafeMemory,
    internal_notes: internalNotes,
    evidence_refs: [{ learning_id: daily.learning_id, scan_date: daily.scan_date }],
    confidence,
    last_learning_date: daily.scan_date,
  };
}

function buildPages(profile: CompanyIntelligenceProfile, daily: DailyLearning): CompanyIntelligencePage[] {
  const companyProfileId = profile.company_profile_id;
  return [
    page(companyProfileId, "overview", "Overview", {
      company_name: profile.company_name,
      last_learning_date: daily.scan_date,
      latest_learning: daily.what_was_learned_today.slice(0, 10),
    }, daily, daily.customer_safe_insights, daily.what_was_learned_today),
    page(companyProfileId, "regions_routes", "Regions and routes", {
      promoted_regions: profile.retrieval_memory.promoted_regions,
      latest_regions: daily.regions_to_promote,
    }, daily),
    page<LanguageMapPagePayload>(companyProfileId, "language_map", "Language map", {
      useful_languages: profile.source_memory.useful_languages,
      useful_languages_today: daily.useful_languages,
    }, daily),
    page<SourceMapPagePayload>(companyProfileId, "source_map", "Source map", {
      useful_domains: profile.source_memory.useful_domains,
      noisy_domains: profile.source_memory.noisy_domains,
      source_cache_notes: profile.source_memory.source_cache_notes,
      useful_sources_today: daily.useful_sources,
    }, daily),
    page(companyProfileId, "regulatory_bodies", "Regulatory bodies", {
      candidates: uniq([...daily.recurring_entities, ...daily.new_entities].filter((e) => /authority|ministry|commission|regulator|department|agency|council/i.test(e)), 30),
    }, daily),
    page(companyProfileId, "key_risks", "Key risks", {
      latest_risk_signals: daily.what_was_learned_today,
    }, daily),
    page<RecurringEntitiesPagePayload>(companyProfileId, "recurring_entities", "Recurring entities", {
      promoted_entities: profile.retrieval_memory.promoted_entities,
      recurring_entities: daily.recurring_entities,
      new_entities_watchlist: daily.new_entities,
    }, daily),
    page<TopicClustersPagePayload>(companyProfileId, "topic_clusters", "Topic clusters", {
      promoted_topics: profile.retrieval_memory.promoted_topics,
      latest_topics: daily.topics_to_promote,
    }, daily),
    page(companyProfileId, "noise_exclusions", "Noise and exclusions", {
      exclusions: profile.retrieval_memory.exclusions,
      latest_noise: daily.noise_or_exclusions,
    }, daily),
    page(companyProfileId, "open_questions", "Open questions", {
      questions: daily.deep_dive_query_seeds
        .filter((seed) => seed.priority !== "low")
        .map((seed) => ({ question: `Should we keep tracking ${seed.seed}?`, reason: seed.reason })),
    }, daily),
    page(companyProfileId, "source_performance", "Source performance", {
      useful_sources: daily.useful_sources,
      useful_domains: profile.source_memory.useful_domains,
      noisy_domains: profile.source_memory.noisy_domains,
    }, daily),
    page(companyProfileId, "language_performance", "Language performance", {
      useful_languages: daily.useful_languages,
      retained_languages: profile.source_memory.useful_languages,
    }, daily),
    page(companyProfileId, "deep_dive_query_seeds", "Deep-dive query seeds", {
      seeds: daily.deep_dive_query_seeds,
      retained_seeds: profile.retrieval_memory.deep_dive_query_seeds,
      budgets: budgetsFromProfile(profile),
    }, daily),
  ];
}

function changedValues(previous: string[], next: string[]): string[] {
  const old = new Set(previous.map((v) => v.toLowerCase()));
  return next.filter((v) => !old.has(v.toLowerCase()));
}

function buildChangeLog(existing: CompanyIntelligenceProfile | null, profile: CompanyIntelligenceProfile, daily: DailyLearning): CompanyProfileChangeLog[] {
  const fields: Array<[keyof ProfileUpdatePatch, string[], string[], CompanyIntelligencePageType]> = [
    ["useful_domains", existing?.source_memory?.useful_domains || [], profile.source_memory.useful_domains, "source_map"],
    ["noisy_domains", existing?.source_memory?.noisy_domains || [], profile.source_memory.noisy_domains, "source_map"],
    ["useful_languages", existing?.source_memory?.useful_languages || [], profile.source_memory.useful_languages, "language_map"],
    ["promoted_entities", existing?.retrieval_memory?.promoted_entities || [], profile.retrieval_memory.promoted_entities, "recurring_entities"],
    ["promoted_regions", existing?.retrieval_memory?.promoted_regions || [], profile.retrieval_memory.promoted_regions, "regions_routes"],
    ["promoted_topics", existing?.retrieval_memory?.promoted_topics || [], profile.retrieval_memory.promoted_topics, "topic_clusters"],
    ["exclusions", existing?.retrieval_memory?.exclusions || [], profile.retrieval_memory.exclusions, "noise_exclusions"],
    ["deep_dive_query_seeds", existing?.retrieval_memory?.deep_dive_query_seeds || [], profile.retrieval_memory.deep_dive_query_seeds, "deep_dive_query_seeds"],
  ];

  const dailySuggestionConfidence = new Map(
    daily.suggested_profile_updates.map((s) => [`${s.field}:${s.value.toLowerCase()}`, s.confidence] as const),
  );

  const changes: CompanyProfileChangeLog[] = [];
  for (const [fieldName, oldValue, newValue, pageType] of fields) {
    const additions = changedValues(oldValue, newValue);
    for (const value of additions.slice(0, 12)) {
      const confidence = dailySuggestionConfidence.get(`${fieldName}:${value.toLowerCase()}`) || "medium";
      const reviewNeeded = confidence === "low" || additions.length > 8;
      changes.push({
        company_profile_id: profile.company_profile_id,
        learning_id: daily.learning_id,
        scan_date: daily.scan_date,
        change_type: "profile_memory_added",
        page_type: pageType,
        field_name: fieldName,
        old_value: oldValue,
        new_value: value,
        reason: `Carried forward from Pass 2 daily learning: ${value}`,
        evidence_refs: [{ learning_id: daily.learning_id, scan_date: daily.scan_date, value }],
        confidence,
        auto_applied: !reviewNeeded,
        review_needed: reviewNeeded,
        customer_safe: false,
      });
    }
  }
  return changes;
}

export function buildCompanyIntelligenceWikiUpdatePlan(
  pass2: Pass2Result,
  existingProfile?: CompanyIntelligenceProfile | null,
): IntelligenceWikiUpdatePlan {
  const profile = mergePatch(existingProfile || null, pass2.suggested_profile, pass2.profile_update_patch, pass2.daily_learning);
  const pages = buildPages(profile, pass2.daily_learning);
  const changeLog = buildChangeLog(existingProfile || null, profile, pass2.daily_learning);
  return {
    profile,
    pages,
    daily_learning: pass2.daily_learning,
    change_log: changeLog,
    review_needed: changeLog.some((change) => change.review_needed),
    write_enabled: companyIntelligenceWikiWriteEnabled(),
  };
}

export function companyIntelligenceWikiEnabled(): boolean {
  return process.env.COMPANY_INTELLIGENCE_WIKI_ENABLED === "1";
}

export function companyIntelligenceWikiWriteEnabled(): boolean {
  return companyIntelligenceWikiEnabled() && process.env.COMPANY_INTELLIGENCE_WIKI_WRITE_ENABLED === "1";
}

export async function loadCompanyIntelligenceWikiProfile(
  supabase: SupabaseClient,
  companyProfileId: string,
): Promise<CompanyIntelligenceProfile | null> {
  if (process.env.COMPANY_PASS2_RETRIEVAL_HINTS_ENABLED !== "1" && !companyIntelligenceWikiEnabled()) return null;
  const { data, error } = await supabase
    .from("company_intelligence_profiles")
    .select("profile_payload")
    .eq("company_profile_id", companyProfileId)
    .maybeSingle();
  if (error) return null;
  const profile = (data?.profile_payload as CompanyIntelligenceProfile | undefined) || null;
  if (!profile) return null;

  // Page payloads are the durable wiki records. Fold their hints back into the
  // compact profile shape consumed by tomorrow's retrieval path, but fail open
  // to the profile-only hints if the pages table is not present yet.
  const { data: pages } = await supabase
    .from("company_intelligence_pages")
    .select("page_type,page_payload")
    .eq("company_profile_id", companyProfileId);
  for (const row of (pages || []) as Array<{ page_type: CompanyIntelligencePageType; page_payload: Record<string, unknown> }>) {
    const payload = row.page_payload || {};
    if (row.page_type === "language_map") {
      profile.source_memory.useful_languages = uniq([
        ...profile.source_memory.useful_languages,
        ...((payload.useful_languages as string[] | undefined) || []),
      ], 24);
    }
    if (row.page_type === "source_map") {
      profile.source_memory.useful_domains = uniq([
        ...profile.source_memory.useful_domains,
        ...((payload.useful_domains as string[] | undefined) || []),
      ]);
      profile.source_memory.noisy_domains = uniq([
        ...profile.source_memory.noisy_domains,
        ...((payload.noisy_domains as string[] | undefined) || []),
      ]);
    }
    if (row.page_type === "topic_clusters") {
      profile.retrieval_memory.promoted_topics = uniq([
        ...profile.retrieval_memory.promoted_topics,
        ...((payload.promoted_topics as string[] | undefined) || []),
      ]);
    }
    if (row.page_type === "recurring_entities") {
      profile.retrieval_memory.promoted_entities = uniq([
        ...profile.retrieval_memory.promoted_entities,
        ...((payload.promoted_entities as string[] | undefined) || []),
      ]);
    }
    if (row.page_type === "regions_routes") {
      profile.retrieval_memory.promoted_regions = uniq([
        ...profile.retrieval_memory.promoted_regions,
        ...((payload.promoted_regions as string[] | undefined) || []),
      ]);
    }
    if (row.page_type === "noise_exclusions") {
      profile.retrieval_memory.exclusions = uniq([
        ...profile.retrieval_memory.exclusions,
        ...((payload.exclusions as string[] | undefined) || []),
      ], 80);
    }
    if (row.page_type === "deep_dive_query_seeds") {
      profile.retrieval_memory.deep_dive_query_seeds = uniq([
        ...profile.retrieval_memory.deep_dive_query_seeds,
        ...((payload.retained_seeds as string[] | undefined) || []),
      ], 40);
    }
  }
  return profile;
}

export async function persistCompanyIntelligenceWiki(
  supabase: SupabaseClient,
  pass2: Pass2Result | undefined,
  briefingId?: string | null,
): Promise<PersistCompanyIntelligenceWikiResult> {
  if (!pass2 || !companyIntelligenceWikiEnabled()) {
    return { enabled: false, write_enabled: false, profile_written: false, learning_written: false, pages_written: 0, changes_written: 0, review_needed: false };
  }

  const existingProfile = await loadCompanyIntelligenceWikiProfile(supabase, pass2.daily_learning.company_profile_id);
  const plan = buildCompanyIntelligenceWikiUpdatePlan(pass2, existingProfile);
  const writeEnabled = companyIntelligenceWikiWriteEnabled();
  if (!writeEnabled) {
    return { enabled: true, write_enabled: false, profile_written: false, learning_written: false, pages_written: 0, changes_written: 0, review_needed: plan.review_needed, dry_run_plan: plan };
  }

  const profileRow = {
    company_profile_id: plan.profile.company_profile_id,
    profile_version: "company_intelligence_profile_v2",
    company_name: plan.profile.company_name,
    last_learning_date: pass2.daily_learning.scan_date,
    useful_domains: plan.profile.source_memory.useful_domains,
    noisy_domains: plan.profile.source_memory.noisy_domains,
    useful_languages: plan.profile.source_memory.useful_languages,
    promoted_entities: plan.profile.retrieval_memory.promoted_entities,
    promoted_regions: plan.profile.retrieval_memory.promoted_regions,
    promoted_topics: plan.profile.retrieval_memory.promoted_topics,
    exclusions: plan.profile.retrieval_memory.exclusions,
    deep_dive_query_seeds: plan.profile.retrieval_memory.deep_dive_query_seeds,
    customer_safe_memory: plan.profile.customer_safe_memory,
    internal_notes: plan.profile.internal_notes,
    source_cache_notes: plan.profile.source_memory.source_cache_notes,
    budgets: budgetsFromProfile(plan.profile),
    profile_payload: plan.profile,
    updated_at: new Date().toISOString(),
  };

  const learningRow = {
    id: pass2.daily_learning.learning_id,
    company_profile_id: pass2.daily_learning.company_profile_id,
    briefing_id: briefingId || null,
    scan_date: pass2.daily_learning.scan_date,
    layer_version: "company_daily_learning_v2",
    what_was_learned_today: pass2.daily_learning.what_was_learned_today,
    useful_sources: pass2.daily_learning.useful_sources,
    useful_languages: pass2.daily_learning.useful_languages,
    recurring_entities: pass2.daily_learning.recurring_entities,
    new_entities: pass2.daily_learning.new_entities,
    regions_to_promote: pass2.daily_learning.regions_to_promote,
    topics_to_promote: pass2.daily_learning.topics_to_promote,
    noise_or_exclusions: pass2.daily_learning.noise_or_exclusions,
    suggested_profile_updates: pass2.daily_learning.suggested_profile_updates,
    deep_dive_query_seeds: pass2.daily_learning.deep_dive_query_seeds,
    customer_safe_insights: pass2.daily_learning.customer_safe_insights,
    cost_controls: pass2.daily_learning.cost_controls,
    internal_reasoning: pass2.daily_learning.internal_reasoning,
    learning_payload: pass2.daily_learning,
  };

  const pageRows = plan.pages.map((p) => ({
    company_profile_id: p.company_profile_id,
    page_type: p.page_type,
    title: p.title,
    page_payload: p.page_payload,
    customer_safe_memory: p.customer_safe_memory,
    internal_notes: p.internal_notes,
    evidence_refs: p.evidence_refs.map((ref) => ({ ...ref, briefing_id: briefingId || null })),
    confidence: p.confidence,
    last_learning_date: p.last_learning_date,
    updated_at: new Date().toISOString(),
  }));

  const changeRows = plan.change_log.map((change) => ({
    company_profile_id: change.company_profile_id,
    learning_id: change.learning_id,
    scan_date: change.scan_date,
    change_type: change.change_type,
    page_type: change.page_type,
    field_name: change.field_name,
    old_value: change.old_value ?? null,
    new_value: change.new_value ?? null,
    reason: change.reason,
    evidence_refs: change.evidence_refs.map((ref) => ({ ...ref, briefing_id: briefingId || null })),
    confidence: change.confidence,
    auto_applied: change.auto_applied,
    review_needed: change.review_needed,
    customer_safe: change.customer_safe,
  }));

  const { error: profileError } = await supabase
    .from("company_intelligence_profiles")
    .upsert(profileRow as never, { onConflict: "company_profile_id" });
  if (profileError) throw new Error(`Failed to persist company_intelligence_profiles: ${profileError.message}`);

  const { error: learningError } = await supabase
    .from("company_daily_learnings")
    .upsert(learningRow as never, { onConflict: "id" });
  if (learningError) throw new Error(`Failed to persist company_daily_learnings: ${learningError.message}`);

  const { error: pageError } = await supabase
    .from("company_intelligence_pages")
    .upsert(pageRows as never, { onConflict: "company_profile_id,page_type" });
  if (pageError) throw new Error(`Failed to persist company_intelligence_pages: ${pageError.message}`);

  if (changeRows.length) {
    const { error: changeError } = await supabase
      .from("company_profile_change_log")
      .insert(changeRows as never);
    if (changeError) throw new Error(`Failed to persist company_profile_change_log: ${changeError.message}`);
  }

  return {
    enabled: true,
    write_enabled: true,
    profile_written: true,
    learning_written: true,
    pages_written: pageRows.length,
    changes_written: changeRows.length,
    review_needed: plan.review_needed,
  };
}

export function buildCompanyIntelligenceDryRunReport(plan: IntelligenceWikiUpdatePlan): string {
  const lines = [
    `Company intelligence wiki dry run: ${plan.profile.company_name}`,
    `scan_date=${plan.daily_learning.scan_date}`,
    `review_needed=${plan.review_needed}`,
    `profile additions: domains=${plan.profile.source_memory.useful_domains.length}, languages=${plan.profile.source_memory.useful_languages.length}, entities=${plan.profile.retrieval_memory.promoted_entities.length}, regions=${plan.profile.retrieval_memory.promoted_regions.length}, topics=${plan.profile.retrieval_memory.promoted_topics.length}`,
    `pages=${plan.pages.map((p) => p.page_type).join(", ")}`,
    `changes=${plan.change_log.length}`,
  ];
  for (const change of plan.change_log.slice(0, 20)) {
    lines.push(`- ${change.review_needed ? "REVIEW" : "AUTO"} ${change.field_name}: ${String(change.new_value)} (${change.confidence})`);
  }
  return lines.join("\n");
}

export function emptyCompanyIntelligenceProfile(profile: CompanyProfile, scanDate: string): CompanyIntelligenceProfile {
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
