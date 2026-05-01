import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScanItemInput } from "./relevance-engine";
import type { CompanyScanRun, Signal } from "./company-scan/types";

export type PgiEvidenceOrigin = "public_scan" | "company_scan";
export type PgiEvidencePrivacyLevel = "public_safe" | "aggregate_only" | "private_customer";
export type PgiEvidenceAllowedAudience = "public" | "aggregate" | "company_private";

export interface PgiEvidenceRow {
  evidence_date: string;
  origin: PgiEvidenceOrigin;
  privacy_level: PgiEvidencePrivacyLevel;
  allowed_audience: PgiEvidenceAllowedAudience;
  company_profile_id?: string | null;
  company_scan_run_id?: string | null;
  signal_id?: string | null;
  scan_item_id?: string | null;
  source_record_id: string;
  source_url?: string | null;
  source_domain?: string | null;
  source_language?: string | null;
  source_region?: string | null;
  stakeholder_type: string;
  event_topic: string;
  headline: string;
  summary?: string | null;
  factual_claims?: unknown[];
  causal_claim?: string | null;
  frame?: string | null;
  actor_portrayal?: string | null;
  emotional_valence?: string | null;
  emphasis?: unknown[];
  omissions?: unknown[];
  cui_bono_signal?: string | null;
  tributary?: string | null;
  pgi_dimensions?: Record<string, unknown>;
  gai_visibility?: Record<string, unknown>;
  confidence?: number;
}

function clean(value: unknown): string {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function slugify(input: string): string {
  return clean(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function normaliseCategory(category: string | null | undefined): string {
  return clean(category || "current-events").toLowerCase().replace(/_/g, "-");
}

export function tributaryForCategory(category: string | null | undefined): string {
  const key = normaliseCategory(category);
  const map: Record<string, string> = {
    geopolitics: "PGI-GP",
    conflict: "PGI-GP",
    diplomacy: "PGI-GP",
    governance: "PGI-GP",
    legal: "PGI-GP",
    migration: "PGI-GP",
    security: "PGI-GP",
    media: "PGI-IW",
    "information-warfare": "PGI-IW",
    "cyber-info-warfare": "PGI-IW",
    technology: "PGI-TE",
    "tech-ai": "PGI-TE",
    economics: "PGI-EC",
    markets: "PGI-EC",
    health: "PGI-HE",
    "life-systems": "PGI-HE",
    climate: "PGI-CL",
    "climate-energy": "PGI-CL",
    "womens-rights": "PGI-WR",
  };
  return map[key] || (key.includes("tech") ? "PGI-TE" : key.includes("climate") ? "PGI-CL" : key.includes("health") ? "PGI-HE" : key.includes("media") || key.includes("cyber") ? "PGI-IW" : "PGI-GP");
}

function isUuid(value: string | null | undefined): boolean {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function inferStakeholderType(signal: Signal): string {
  const type = signal.signal_type;
  if (type === "regulatory" || type === "policy") return "regulator";
  if (type === "market") return "investor_market";
  if (type === "statement" || type === "announcement") return "company_or_institution";
  return "media";
}

function inferFrame(text: string): string {
  const lower = text.toLowerCase();
  if (/court|law|lawsuit|regulat|compliance|policy|sanction/.test(lower)) return "governance and compliance frame";
  if (/market|price|rate|stock|investor|demand|supply|cost/.test(lower)) return "market and operating-cost frame";
  if (/attack|war|strike|security|cyber|risk|threat/.test(lower)) return "security and risk frame";
  if (/customer|consumer|patient|worker|community|civilian/.test(lower)) return "human impact frame";
  return "early signal frame";
}

function inferCuiBono(text: string): string {
  const lower = text.toLowerCase();
  if (/regulat|court|law|compliance|policy/.test(lower)) return "Public institutions benefit from leading with accountability and rule-setting; affected firms benefit from leading with implementation complexity.";
  if (/market|price|rate|investor|cost/.test(lower)) return "Market actors benefit from treating the event as a pricing signal, while affected communities may see the same event as a stability or access issue.";
  if (/security|cyber|attack|war|strike/.test(lower)) return "Security actors benefit from leading with threat and response; affected actors may benefit from leading with harm, restraint, or responsibility.";
  return "The useful test is which facts are made central, which are left secondary, and whose decisions that ordering supports.";
}

function safeRows(rows: PgiEvidenceRow[]): PgiEvidenceRow[] {
  return rows.map((row) => ({
    factual_claims: [],
    emphasis: [],
    omissions: [],
    pgi_dimensions: {},
    gai_visibility: {},
    confidence: 0.7,
    ...row,
  }));
}

async function upsertPgiEvidence(
  supabase: SupabaseClient,
  rows: PgiEvidenceRow[],
  logPrefix: string,
): Promise<number> {
  if (!rows.length) return 0;
  const { error } = await supabase
    .from("pgi_evidence")
    .upsert(safeRows(rows), {
      onConflict: "source_record_id",
      ignoreDuplicates: false,
    });
  if (error) {
    // Migration may not be applied in every environment yet. Fail soft so
    // scans/briefings do not break while the evidence layer is being rolled out.
    if (error.code === "42P01" || /pgi_evidence/i.test(error.message)) {
      console.warn(`${logPrefix}: pgi_evidence unavailable (${error.message})`);
      return 0;
    }
    throw new Error(`${logPrefix}: ${error.message}`);
  }
  return rows.length;
}

export async function upsertPublicScanPgiEvidence(
  supabase: SupabaseClient,
  params: {
    scanDate: string;
    scanPeriod: string;
    items: ScanItemInput[];
    storySlugs: string[];
  },
): Promise<number> {
  const rows = params.items.map((item, index): PgiEvidenceRow => {
    const text = `${item.headline}. ${item.connection || ""}`;
    const sourceRecordId = `public:${params.scanDate}:${params.scanPeriod}:${params.storySlugs[index] || slugify(item.headline)}`;
    return {
      evidence_date: params.scanDate,
      origin: "public_scan",
      privacy_level: "public_safe",
      allowed_audience: "public",
      source_record_id: sourceRecordId,
      stakeholder_type: "media",
      event_topic: item.category,
      headline: item.headline,
      summary: item.connection || null,
      factual_claims: [item.headline].filter(Boolean),
      causal_claim: item.connection || null,
      frame: inferFrame(text),
      actor_portrayal: null,
      emotional_valence: item.significance || null,
      emphasis: [...(item.tags || []), ...(item.patterns || [])].slice(0, 8),
      omissions: [],
      cui_bono_signal: inferCuiBono(text),
      tributary: tributaryForCategory(item.category),
      pgi_dimensions: {
        perception_gap: item.perception_gap ?? null,
        significance: item.significance,
        evidence_stage: "scan_item_initial",
      },
      gai_visibility: {
        regions_found: item.regions || [],
        coverage_breadth: item.coverage_breadth ?? null,
      },
      confidence: 0.72,
    };
  });
  return upsertPgiEvidence(supabase, rows, "public PGI evidence upsert");
}

export async function upsertCompanyProfilePgiEvidence(
  supabase: SupabaseClient,
  params: {
    evidenceDate: string;
    companyProfileId: string;
    signals: Signal[];
    selectedSignalIds?: string[];
    companyScanRunId?: string | null;
  },
): Promise<number> {
  const selected = new Set(params.selectedSignalIds || []);
  const rows = params.signals.map((signal): PgiEvidenceRow => {
    const text = `${signal.headline}. ${signal.summary || ""}`;
    const isSelected = selected.has(signal.id);
    return {
      evidence_date: params.evidenceDate,
      origin: "company_scan",
      privacy_level: isSelected ? "private_customer" : "aggregate_only",
      allowed_audience: isSelected ? "company_private" : "aggregate",
      company_profile_id: params.companyProfileId,
      company_scan_run_id: isUuid(signal.company_scan_run_id)
        ? signal.company_scan_run_id
        : isUuid(params.companyScanRunId)
          ? params.companyScanRunId
          : null,
      signal_id: isUuid(signal.id) ? signal.id : null,
      source_record_id: `company:${params.evidenceDate}:${params.companyProfileId}:${signal.id}`,
      source_url: signal.source_url,
      source_domain: signal.source_domain,
      source_language: signal.source_language,
      source_region: signal.source_region,
      stakeholder_type: inferStakeholderType(signal),
      event_topic: signal.signal_type,
      headline: signal.headline,
      summary: signal.summary,
      factual_claims: [signal.headline].filter(Boolean),
      causal_claim: signal.summary || null,
      frame: inferFrame(text),
      actor_portrayal: null,
      emotional_valence: signal.urgency >= 0.75 ? "high urgency" : signal.urgency >= 0.5 ? "moderate urgency" : "low urgency",
      emphasis: [...(signal.entities || []), ...(signal.themes || [])].slice(0, 8),
      omissions: [],
      cui_bono_signal: inferCuiBono(text),
      tributary: tributaryForCategory(signal.signal_type),
      pgi_dimensions: {
        signal_confidence: signal.confidence,
        urgency: signal.urgency,
        significance: signal.significance,
        selected_for_briefing: isSelected,
        evidence_stage: "company_profile_signal_initial",
      },
      gai_visibility: {
        regions_found: signal.regions || [],
        source_region: signal.source_region,
        source_language: signal.source_language,
      },
      confidence: Math.max(0.5, Math.min(0.95, Number(signal.confidence || 0.7))),
    };
  });
  return upsertPgiEvidence(supabase, rows, "company profile PGI evidence upsert");
}

export async function upsertCompanySignalPgiEvidence(
  supabase: SupabaseClient,
  params: {
    run: Pick<CompanyScanRun, "id" | "run_date">;
    signals: Signal[];
  },
): Promise<number> {
  if (!params.signals.length) return 0;
  const signalIds = params.signals.map((signal) => signal.id);
  const { data: matches, error } = await supabase
    .from("company_signal_matches")
    .select("company_profile_id, signal_id, relevance_score, selected_for_briefing, match_reasons")
    .in("signal_id", signalIds);
  if (error) throw new Error(`company PGI evidence match lookup: ${error.message}`);

  type CompanySignalMatchEvidence = {
    company_profile_id: string;
    signal_id: string;
    relevance_score: number;
    selected_for_briefing: boolean;
    match_reasons: unknown;
  };
  const typedMatches = (matches || []) as CompanySignalMatchEvidence[];
  const rows: PgiEvidenceRow[] = [];
  for (const signal of params.signals) {
    const signalMatches = typedMatches.filter((match) => match.signal_id === signal.id);
    for (const match of signalMatches) {
      const text = `${signal.headline}. ${signal.summary || ""}`;
      rows.push({
        evidence_date: params.run.run_date,
        origin: "company_scan",
        privacy_level: match.selected_for_briefing ? "private_customer" : "aggregate_only",
        allowed_audience: match.selected_for_briefing ? "company_private" : "aggregate",
        company_profile_id: match.company_profile_id,
        company_scan_run_id: params.run.id,
        signal_id: signal.id,
        source_record_id: `company:${params.run.id}:${match.company_profile_id}:${signal.id}`,
        source_url: signal.source_url,
        source_domain: signal.source_domain,
        source_language: signal.source_language,
        source_region: signal.source_region,
        stakeholder_type: inferStakeholderType(signal),
        event_topic: signal.signal_type,
        headline: signal.headline,
        summary: signal.summary,
        factual_claims: [signal.headline].filter(Boolean),
        causal_claim: signal.summary || null,
        frame: inferFrame(text),
        actor_portrayal: null,
        emotional_valence: signal.urgency >= 0.75 ? "high urgency" : signal.urgency >= 0.5 ? "moderate urgency" : "low urgency",
        emphasis: [...(signal.entities || []), ...(signal.themes || [])].slice(0, 8),
        omissions: [],
        cui_bono_signal: inferCuiBono(text),
        tributary: tributaryForCategory(signal.signal_type),
        pgi_dimensions: {
          relevance_score: match.relevance_score,
          match_reasons: match.match_reasons || [],
          signal_confidence: signal.confidence,
          urgency: signal.urgency,
          significance: signal.significance,
          evidence_stage: "company_signal_initial",
        },
        gai_visibility: {
          regions_found: signal.regions || [],
          source_region: signal.source_region,
          source_language: signal.source_language,
        },
        confidence: Math.max(0.5, Math.min(0.95, Number(signal.confidence || 0.7))),
      });
    }
  }
  return upsertPgiEvidence(supabase, rows, "company PGI evidence upsert");
}
