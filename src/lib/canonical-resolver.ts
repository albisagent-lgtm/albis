// ---------------------------------------------------------------------------
// Canonical resolver — Package 4.
//
// Shared logic for mapping a company profile's raw-string fields onto the
// canonical topic / alias registry. Used by:
//   - scripts/migrate-company-profiles-to-canonical.ts (one-shot backfill)
//   - /api/company-canonical-mappings/resolve (per-save profile editor hook)
//
// Behavior:
//   1. case-insensitive alias lookup (canonical_topic_aliases.alias)
//   2. fallback case-insensitive canonical_label lookup
//   3. fallback create new canonical_topic (with topic_type inferred from
//      source_field) and seed an alias = the raw value (confidence 0.7)
//
// Ambiguity guard: if step 1 returns multiple distinct canonical_topic_ids,
// we DO NOT GUESS. Skip the mapping and surface the value in the result.
// ---------------------------------------------------------------------------
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompanyProfile } from "./company-profile";

export type CanonicalSourceField =
  | "tracked_themes"
  | "watchlist_entities"
  | "regions"
  | "sectors"
  | "risk_priorities"
  | "supply_chain_exposure";

export type CanonicalTopicType =
  | "entity"
  | "theme"
  | "region"
  | "sector"
  | "commodity"
  | "policy"
  | "route"
  | "risk"
  | "institution";

const COMMODITY_HINTS = new Set([
  "oil", "fuel", "lng", "gas", "wheat", "corn", "rice", "soy", "coffee",
  "cocoa", "palm-oil", "palm oil", "sugar", "steel", "aluminium", "aluminum",
  "copper", "nickel", "lithium", "cobalt", "rare-earths", "rare earths",
  "uranium", "gold", "silver", "titanium", "fertilizer", "fertiliser",
  "semiconductors", "gpus", "apis-pharma",
]);

const ROUTE_HINTS = new Set([
  "hormuz", "hormuz-route", "red-sea", "red-sea-route", "suez", "suez-route",
  "panama", "panama-route", "malacca", "malacca-route", "pipelines",
  "undersea-cables", "black-sea", "black-sea-route",
]);

export function inferTopicType(
  field: CanonicalSourceField,
  rawValue: string
): CanonicalTopicType {
  switch (field) {
    case "tracked_themes":
      return "theme";
    case "watchlist_entities":
      return "entity";
    case "regions":
      return "region";
    case "sectors":
      return "sector";
    case "risk_priorities":
      return "risk";
    case "supply_chain_exposure": {
      const lower = rawValue.toLowerCase();
      if (ROUTE_HINTS.has(lower)) return "route";
      if (COMMODITY_HINTS.has(lower)) return "commodity";
      return "theme";
    }
  }
}

export interface ResolveResult {
  canonical_topic_id: string | null;
  created_new: boolean;
  ambiguous: boolean;
}

export async function resolveValue(
  supabase: SupabaseClient,
  rawValue: string,
  field: CanonicalSourceField,
  options: { dryRun?: boolean } = {}
): Promise<ResolveResult> {
  const trimmed = rawValue.trim();
  if (!trimmed) return { canonical_topic_id: null, created_new: false, ambiguous: false };
  const dryRun = options.dryRun === true;

  // Step 1: case-insensitive alias lookup
  const { data: aliasHits } = await supabase
    .from("canonical_topic_aliases")
    .select("canonical_topic_id, alias")
    .ilike("alias", trimmed);

  if (aliasHits && aliasHits.length > 0) {
    const distinct = [
      ...new Set(aliasHits.map((r) => r.canonical_topic_id as string)),
    ];
    if (distinct.length > 1) {
      return { canonical_topic_id: null, created_new: false, ambiguous: true };
    }
    return { canonical_topic_id: distinct[0], created_new: false, ambiguous: false };
  }

  // Step 2: case-insensitive canonical_label lookup
  const { data: labelHits } = await supabase
    .from("canonical_topics")
    .select("id")
    .ilike("canonical_label", trimmed);

  if (labelHits && labelHits.length > 0) {
    const distinct = [...new Set(labelHits.map((r) => r.id as string))];
    if (distinct.length > 1) {
      return { canonical_topic_id: null, created_new: false, ambiguous: true };
    }
    return { canonical_topic_id: distinct[0], created_new: false, ambiguous: false };
  }

  // Step 3: create a new canonical (auto-extracted, lower confidence)
  if (dryRun) {
    return { canonical_topic_id: null, created_new: true, ambiguous: false };
  }

  const topicType = inferTopicType(field, trimmed);
  const { data: inserted, error } = await supabase
    .from("canonical_topics")
    .insert({ canonical_label: trimmed, topic_type: topicType })
    .select("id")
    .single();
  if (error || !inserted) {
    const { data: retry } = await supabase
      .from("canonical_topics")
      .select("id")
      .eq("topic_type", topicType)
      .ilike("canonical_label", trimmed)
      .maybeSingle();
    if (retry?.id) return { canonical_topic_id: retry.id, created_new: false, ambiguous: false };
    return { canonical_topic_id: null, created_new: false, ambiguous: false };
  }

  await supabase.from("canonical_topic_aliases").insert({
    canonical_topic_id: inserted.id,
    alias: trimmed,
    alias_language: null,
    alias_type: "synonym",
    confidence: 0.7,
  });

  return { canonical_topic_id: inserted.id, created_new: true, ambiguous: false };
}

export interface ProfileMappingSummary {
  mapped_existing: number;
  created_new: number;
  ambiguous: number;
  mappings_inserted: number;
  mappings_skipped: number;
  ambiguity_log: Array<{ field: CanonicalSourceField; value: string }>;
}

type ProfileForMapping = Pick<
  CompanyProfile,
  | "id"
  | "tracked_themes"
  | "watchlist_entities"
  | "regions"
  | "sector"
  | "sub_sector"
  | "risk_priorities"
  | "supply_chain_exposure"
>;

function fieldEntries(
  profile: ProfileForMapping
): Array<{ field: CanonicalSourceField; value: string }> {
  const out: Array<{ field: CanonicalSourceField; value: string }> = [];
  const arr = (vals: string[] | null | undefined): string[] =>
    Array.isArray(vals) ? vals.filter((s) => typeof s === "string") : [];
  for (const v of arr(profile.tracked_themes)) out.push({ field: "tracked_themes", value: v });
  for (const v of arr(profile.watchlist_entities)) out.push({ field: "watchlist_entities", value: v });
  for (const v of arr(profile.regions)) out.push({ field: "regions", value: v });
  for (const v of arr(profile.risk_priorities)) out.push({ field: "risk_priorities", value: v });
  for (const v of arr(profile.supply_chain_exposure)) out.push({ field: "supply_chain_exposure", value: v });
  if (typeof profile.sector === "string" && profile.sector) {
    out.push({ field: "sectors", value: profile.sector });
  }
  if (typeof profile.sub_sector === "string" && profile.sub_sector) {
    out.push({ field: "sectors", value: profile.sub_sector });
  }
  return out;
}

export async function mapProfileToCanonicals(
  supabase: SupabaseClient,
  profile: ProfileForMapping,
  options: { dryRun?: boolean } = {}
): Promise<ProfileMappingSummary> {
  const summary: ProfileMappingSummary = {
    mapped_existing: 0,
    created_new: 0,
    ambiguous: 0,
    mappings_inserted: 0,
    mappings_skipped: 0,
    ambiguity_log: [],
  };

  const entries = fieldEntries(profile);
  const dryRun = options.dryRun === true;

  for (const { field, value } of entries) {
    const result = await resolveValue(supabase, value, field, { dryRun });
    if (result.ambiguous) {
      summary.ambiguous += 1;
      summary.ambiguity_log.push({ field, value });
      continue;
    }
    if (!result.canonical_topic_id) continue;
    if (result.created_new) summary.created_new += 1;
    else summary.mapped_existing += 1;
    if (dryRun) continue;

    const { error } = await supabase.from("company_canonical_mappings").insert({
      company_profile_id: profile.id,
      canonical_topic_id: result.canonical_topic_id,
      source_field: field,
      source_value: value,
    });
    if (!error) {
      summary.mappings_inserted += 1;
    } else if (error.code === "23505" || /duplicate key/i.test(error.message)) {
      summary.mappings_skipped += 1;
    }
  }

  return summary;
}
