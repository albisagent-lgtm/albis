import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AlbisFinding,
  CompanyResearchedUnderstandingLayer,
  ResearchCluster,
  ResearchNote,
  ResearchSource,
} from "./types";

const PERSIST_ENABLED = process.env.RESEARCHED_UNDERSTANDING_WRITE_ENABLED === "1";

function toTimestamp(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function clusterRow(
  layer: CompanyResearchedUnderstandingLayer,
  cluster: ResearchCluster,
  briefingId: string,
) {
  return {
    id: cluster.id,
    research_date: cluster.date,
    scope: cluster.scope,
    privacy_level: cluster.scope === "company" ? "company_private" : "public_safe",
    company_profile_id: layer.company_profile_id,
    briefing_id: briefingId,
    scan_area_ids: cluster.scan_area_ids,
    title: cluster.title,
    status: cluster.status,
    importance: cluster.importance,
    confidence: cluster.confidence,
    layer_version: layer.layer_version,
    created_at: cluster.created_at,
    updated_at: cluster.updated_at,
  };
}

function sourceRow(
  layer: CompanyResearchedUnderstandingLayer,
  source: ResearchSource,
  briefingId: string,
) {
  return {
    id: source.id,
    cluster_id: source.cluster_id,
    research_date: layer.scan_date,
    scope: "company",
    privacy_level: "company_private",
    company_profile_id: layer.company_profile_id,
    briefing_id: briefingId,
    url: source.url || null,
    source_domain: source.source_domain || "",
    title: source.title || source.extracted_title || "",
    published_at: toTimestamp(source.published_at),
    source_type: source.source_type || null,
    region: source.region || null,
    language: source.language || null,
    read_status: source.read_status,
    trail_role: source.trail_role,
    relevance_score: source.relevance_score ?? null,
    reliability_note: source.reliability_note || null,
    extracted_title: source.extracted_title || null,
    extracted_excerpt: source.extracted_excerpt || null,
    extracted_word_count: source.extracted_word_count ?? null,
    text_cache_status: source.text_cache_status || null,
    text_cache_path: source.text_cache_path || null,
    source_payload: source,
  };
}

function noteRow(
  layer: CompanyResearchedUnderstandingLayer,
  note: ResearchNote,
  briefingId: string,
) {
  return {
    id: note.id,
    cluster_id: note.cluster_id,
    research_date: layer.scan_date,
    scope: "company",
    privacy_level: "company_private",
    company_profile_id: layer.company_profile_id,
    briefing_id: briefingId,
    summary: note.summary,
    what_happened: note.what_happened,
    what_changed_today: note.what_changed_today,
    key_actors: note.key_actors,
    key_facts: note.key_facts,
    key_numbers: note.key_numbers,
    named_places: note.named_places,
    causes_or_drivers: note.causes_or_drivers,
    consequences: note.consequences,
    source_observations: note.source_observations,
    differences_in_reporting: note.differences_in_reporting,
    what_is_unclear: note.what_is_unclear,
    possible_perception_gap: note.possible_perception_gap || null,
    company_relevance: note.company_relevance || null,
    albis_learning: note.albis_learning,
    note_payload: note,
  };
}

function findingRow(
  layer: CompanyResearchedUnderstandingLayer,
  finding: AlbisFinding,
  briefingId: string,
) {
  return {
    id: finding.id,
    cluster_id: finding.cluster_id,
    research_date: finding.date,
    scope: finding.scope,
    privacy_level: finding.scope === "company" ? "company_private" : "public_safe",
    company_profile_id: layer.company_profile_id,
    briefing_id: briefingId,
    title: finding.title,
    body: finding.body,
    why_it_matters: finding.why_it_matters || null,
    uncertainty: finding.uncertainty || null,
    confidence: finding.confidence,
    email_source_ids: finding.email_source_ids,
    evidence_source_ids: finding.evidence_source_ids,
    dashboard_source_ids: finding.dashboard_source_ids,
    placement: finding.placement,
    finding_payload: finding,
  };
}

async function upsertChunk(
  supabase: SupabaseClient,
  table: string,
  rows: unknown[],
): Promise<number> {
  if (rows.length === 0) return 0;
  const { error } = await supabase.from(table).upsert(rows as never[], { onConflict: "id" });
  if (error) throw new Error(`Failed to persist ${table}: ${error.message}`);
  return rows.length;
}

export async function persistResearchedUnderstandingLayer(
  supabase: SupabaseClient,
  layer: CompanyResearchedUnderstandingLayer | undefined,
  briefingId: string,
): Promise<{
  enabled: boolean;
  clusters: number;
  sources: number;
  notes: number;
  findings: number;
}> {
  if (!PERSIST_ENABLED || !layer) {
    return { enabled: false, clusters: 0, sources: 0, notes: 0, findings: 0 };
  }

  const clusters = layer.clusters.map((cluster) => clusterRow(layer, cluster, briefingId));
  const sources = layer.sources.map((source) => sourceRow(layer, source, briefingId));
  const notes = layer.notes.map((note) => noteRow(layer, note, briefingId));
  const findings = layer.findings.map((finding) => findingRow(layer, finding, briefingId));

  // FK order matters on first insert; clusters must exist before sources/notes/findings.
  return {
    enabled: true,
    clusters: await upsertChunk(supabase, "research_clusters", clusters),
    sources: await upsertChunk(supabase, "research_sources", sources),
    notes: await upsertChunk(supabase, "research_notes", notes),
    findings: await upsertChunk(supabase, "albis_findings", findings),
  };
}
