// ---------------------------------------------------------------------------
// Union watch graph builder — Package 6.
//
// Aggregates company demand across all active company_profiles, groups
// the canonicals they care about into shared retrieval clusters, and
// emits one scan_target per active canonical (with alias-expanded
// expansion_terms for the retrieval layer to query).
//
// "Shared discovery, isolated output" — multiple companies tracking the
// same canonical share the cost of one retrieval pass; matching against
// individual companies happens later, downstream of this layer.
//
// V1 clustering is deliberately blunt: every canonical of a given
// topic_type collapses into a single cluster ("All entities (V1)",
// "All themes (V1)", etc.). This is enough to land real signals while
// the scoring logic and retrieval volume settle. Future iterations may
// sub-cluster by parent_id chains, semantic similarity, or co-occurrence.
//
// TODO(pkg-9): finer-grained clustering. Options worth investigating
// once we have ≥20 active companies of usage data:
//   - parent_id chains (Pyongyang → North Korea → East Asia)
//   - semantic similarity via embedding distance
//   - co-occurrence: companies tracking X also track Y → cluster them
//   - LLM grouping with confidence threshold + human review
// Architecture supports all of these — only the grouping step changes.
//
// Deterministic. No LLM calls. Idempotent (re-running produces zero net
// change).
// ---------------------------------------------------------------------------
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CanonicalTopicType } from "../canonical-resolver";
import type { ClusterType } from "./types";

// V1 cluster labels. Stable strings so upserts hit the same rows.
const V1_CLUSTER_LABELS: Record<ClusterType, string> = {
  entity_cluster: "All entities (V1)",
  theme_cluster: "All themes (V1)",
  region_cluster: "All regions (V1)",
  sector_cluster: "All sectors (V1)",
  commodity_cluster: "All commodities (V1)",
  risk_cluster: "All risks (V1)",
};

// Map canonical topic_type → cluster_type. policy / route / institution
// fold into theme/entity respectively for V1 — flagged as a V1 limit.
function clusterTypeFor(topicType: CanonicalTopicType): ClusterType {
  switch (topicType) {
    case "entity":
      return "entity_cluster";
    case "theme":
      return "theme_cluster";
    case "region":
      return "region_cluster";
    case "sector":
      return "sector_cluster";
    case "commodity":
      return "commodity_cluster";
    case "risk":
      return "risk_cluster";
    case "policy":
    case "route":
      return "theme_cluster";
    case "institution":
      return "entity_cluster";
  }
}

interface CanonicalRow {
  id: string;
  canonical_label: string;
  topic_type: CanonicalTopicType;
  active_company_count: number;
}

interface AliasRow {
  canonical_topic_id: string;
  alias: string;
}

interface MappingRow {
  canonical_topic_id: string;
  company_profile_id: string;
}

interface RetrievalClusterRow {
  id: string;
  cluster_label: string;
  cluster_type: ClusterType;
}

interface ScanTargetRow {
  id: string;
  target_value: string;
  is_active: boolean;
}

export interface WatchGraphSummary {
  clusters_built: number;
  scan_targets_upserted: number;
  scan_targets_deactivated: number;
  cluster_breakdown: Record<ClusterType, { canonicals: number; companies: number }>;
}

/**
 * Build the union watch graph: retrieval_clusters + scan_targets from
 * the canonicals that any onboarded company has mapped. Idempotent.
 */
export async function buildUnionWatchGraph(
  supabase: SupabaseClient
): Promise<WatchGraphSummary> {
  // 1) Pull every canonical that has demand and the mappings that drive it.
  const [{ data: canonicals, error: canErr }, { data: mappings, error: mapErr }, { data: aliases, error: aliasErr }] =
    await Promise.all([
      supabase
        .from("canonical_topics")
        .select("id, canonical_label, topic_type, active_company_count")
        .eq("is_active", true)
        .gt("active_company_count", 0),
      supabase
        .from("company_canonical_mappings")
        .select("canonical_topic_id, company_profile_id"),
      supabase
        .from("canonical_topic_aliases")
        .select("canonical_topic_id, alias"),
    ]);
  if (canErr) throw new Error(`canonical_topics load failed: ${canErr.message}`);
  if (mapErr) throw new Error(`company_canonical_mappings load failed: ${mapErr.message}`);
  if (aliasErr) throw new Error(`canonical_topic_aliases load failed: ${aliasErr.message}`);

  const canonicalsActive = (canonicals || []) as CanonicalRow[];
  const mappingRows = (mappings || []) as MappingRow[];
  const aliasRows = (aliases || []) as AliasRow[];

  // Companies-by-canonical, used both for cluster counts and for the
  // active-canonical set check.
  const companiesByCanonical = new Map<string, Set<string>>();
  for (const m of mappingRows) {
    const set = companiesByCanonical.get(m.canonical_topic_id) || new Set<string>();
    set.add(m.company_profile_id);
    companiesByCanonical.set(m.canonical_topic_id, set);
  }

  const aliasesByCanonical = new Map<string, string[]>();
  for (const a of aliasRows) {
    const list = aliasesByCanonical.get(a.canonical_topic_id) || [];
    list.push(a.alias);
    aliasesByCanonical.set(a.canonical_topic_id, list);
  }

  // 2) Group canonicals into clusters (cluster_type → canonical[]).
  const byClusterType = new Map<ClusterType, CanonicalRow[]>();
  for (const c of canonicalsActive) {
    const ct = clusterTypeFor(c.topic_type);
    const list = byClusterType.get(ct) || [];
    list.push(c);
    byClusterType.set(ct, list);
  }

  // 3) Upsert retrieval_clusters (one per cluster_type for V1).
  const clusterByType = new Map<ClusterType, RetrievalClusterRow>();
  let clustersBuilt = 0;
  const breakdown: Record<ClusterType, { canonicals: number; companies: number }> = {
    entity_cluster: { canonicals: 0, companies: 0 },
    theme_cluster: { canonicals: 0, companies: 0 },
    region_cluster: { canonicals: 0, companies: 0 },
    sector_cluster: { canonicals: 0, companies: 0 },
    commodity_cluster: { canonicals: 0, companies: 0 },
    risk_cluster: { canonicals: 0, companies: 0 },
  };

  for (const [clusterType, members] of byClusterType) {
    const canonicalIds = members.map((m) => m.id);
    const distinctCompanies = new Set<string>();
    for (const id of canonicalIds) {
      const set = companiesByCanonical.get(id);
      if (set) for (const cid of set) distinctCompanies.add(cid);
    }
    breakdown[clusterType] = {
      canonicals: canonicalIds.length,
      companies: distinctCompanies.size,
    };

    const label = V1_CLUSTER_LABELS[clusterType];
    // No unique constraint on (cluster_label, cluster_type) in the
    // Package 5 migration, so we select-then-update/insert instead of
    // using PostgREST upsert. Idempotent: re-runs hit the same row.
    const { data: existing, error: lookupErr } = await supabase
      .from("retrieval_clusters")
      .select("id, cluster_label, cluster_type")
      .eq("cluster_label", label)
      .eq("cluster_type", clusterType)
      .maybeSingle();
    if (lookupErr) {
      throw new Error(`retrieval_clusters lookup failed (${clusterType}): ${lookupErr.message}`);
    }

    const payload = {
      cluster_label: label,
      cluster_type: clusterType,
      canonical_topic_ids: canonicalIds,
      demand_company_count: distinctCompanies.size,
      last_built_at: new Date().toISOString(),
      is_active: true,
    };

    let row: RetrievalClusterRow;
    if (existing) {
      const { data: updated, error: updateErr } = await supabase
        .from("retrieval_clusters")
        .update(payload)
        .eq("id", existing.id)
        .select("id, cluster_label, cluster_type")
        .single();
      if (updateErr || !updated) {
        throw new Error(`retrieval_clusters update failed (${clusterType}): ${updateErr?.message || "no row"}`);
      }
      row = updated as RetrievalClusterRow;
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from("retrieval_clusters")
        .insert(payload)
        .select("id, cluster_label, cluster_type")
        .single();
      if (insertErr || !inserted) {
        throw new Error(`retrieval_clusters insert failed (${clusterType}): ${insertErr?.message || "no row"}`);
      }
      row = inserted as RetrievalClusterRow;
    }

    clusterByType.set(clusterType, row);
    clustersBuilt += 1;
  }

  // 4) Build scan_targets — one per active canonical. expansion_terms is
  //    canonical_label + every alias, deduped, lowercased on insert (the
  //    retrieval layer can decide casing per-query).
  const targetRows: Array<{
    retrieval_cluster_id: string;
    target_type: "canonical_topic";
    target_value: string;
    expansion_terms: string[];
    is_active: boolean;
  }> = [];

  for (const [clusterType, members] of byClusterType) {
    const cluster = clusterByType.get(clusterType);
    if (!cluster) continue;
    for (const m of members) {
      const aliasList = aliasesByCanonical.get(m.id) || [];
      const terms = [m.canonical_label, ...aliasList]
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const dedupedTerms = [...new Set(terms)];
      targetRows.push({
        retrieval_cluster_id: cluster.id,
        target_type: "canonical_topic",
        target_value: m.id,
        expansion_terms: dedupedTerms,
        is_active: true,
      });
    }
  }

  let upsertedTargets = 0;
  if (targetRows.length > 0) {
    // Upsert in chunks to keep payloads small. PostgREST default limit is
    // generous but predictable to chunk anyway.
    const CHUNK = 200;
    for (let i = 0; i < targetRows.length; i += CHUNK) {
      const chunk = targetRows.slice(i, i + CHUNK);
      const { data, error: targetErr } = await supabase
        .from("scan_targets")
        .upsert(chunk, { onConflict: "target_type,target_value" })
        .select("id");
      if (targetErr) throw new Error(`scan_targets upsert failed: ${targetErr.message}`);
      upsertedTargets += data?.length || 0;
    }
  }

  // 5) Deactivate scan_targets whose canonical no longer has demand.
  //    Active canonical IDs from this build:
  const activeCanonicalIds = new Set(canonicalsActive.map((c) => c.id));
  const { data: existingTargets, error: existingErr } = await supabase
    .from("scan_targets")
    .select("id, target_value, is_active")
    .eq("target_type", "canonical_topic")
    .eq("is_active", true);
  if (existingErr) throw new Error(`scan_targets read failed: ${existingErr.message}`);

  const stale = ((existingTargets || []) as ScanTargetRow[]).filter(
    (t) => !activeCanonicalIds.has(t.target_value)
  );
  let scanTargetsDeactivated = 0;
  if (stale.length > 0) {
    const { error: deactivateErr } = await supabase
      .from("scan_targets")
      .update({ is_active: false })
      .in("id", stale.map((t) => t.id));
    if (deactivateErr) throw new Error(`scan_targets deactivate failed: ${deactivateErr.message}`);
    scanTargetsDeactivated = stale.length;
  }

  return {
    clusters_built: clustersBuilt,
    scan_targets_upserted: upsertedTargets,
    scan_targets_deactivated: scanTargetsDeactivated,
    cluster_breakdown: breakdown,
  };
}
