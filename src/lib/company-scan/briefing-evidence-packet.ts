// ---------------------------------------------------------------------------
// Package 8D — Evidence Packet Builder.
//
// Layer 4 of the Package 8 funnel: turns approved 8A/8B/8C outputs into a
// clean CompanyBriefingEvidencePacket for the internal generation layer.
//
// Input:  CompanyRelevanceResult + EventCluster[] + PerceptionGapDecision[]
//         + NormalizedArticle[] (for source detail) + CompanyBriefingProfile
// Output: CompanyBriefingEvidencePacket
//
// The packet passes ONLY email-approved items into the generation layer.
// Dashboard items carry allowed_in_email_generation: false.
// Raw article text, Block sources, and sludge >=80 are never included.
// ---------------------------------------------------------------------------

import type {
  CompanyBriefingProfile,
  CompanyRelevanceResult,
  EventCluster,
  EmailCandidateItem,
  PerceptionGapDecision,
  NormalizedArticle,
  SectionNoFinding,
  QualityGrade,
  SourceType,
  CompanyBriefingEvidencePacket,
  EvidencePacketCompanyContext,
  CompanyBriefingPolicy,
  EvidenceInputSummary,
  EvidenceEmailItem,
  EvidenceEventTuple,
  EvidenceSupportedText,
  EvidenceSupportRef,
  EvidenceClaim,
  EvidenceArticleSupport,
  EvidenceUncertaintyNote,
  EvidenceConflictNote,
  EvidenceSourceSummary,
  EvidencePerceptionGapBlock,
  EvidencePerceptionFrame,
  EvidencePacketDashboardItem,
  ExcludedSummary,
  ExcludeReason,
  QARequirement,
  EvidencePacketAudit,
  AttributionTrigger,
  ClusterFrame,
  ClusterFact,
  ClusterConflict,
  EvidenceAction,
} from "./types";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const PACKET_BUILD_VERSION = "8d_v1";

export interface BuildEvidencePacketInput {
  profile: CompanyBriefingProfile;
  relevanceResult: CompanyRelevanceResult;
  clusters: EventCluster[];
  perceptionGapDecisions: PerceptionGapDecision[];
  /** Normalized articles from 8B, used for source detail extraction */
  normalizedArticles?: NormalizedArticle[];
  run_id: string;
  scan_window?: { from: string; to: string };
  /** Counts from earlier funnel stages for the input summary */
  raw_articles_count?: number;
  normalized_articles_count?: number;
}

/**
 * Build a CompanyBriefingEvidencePacket from 8A/8B/8C pipeline outputs.
 *
 * This is the handoff point: everything before this is selection/scoring;
 * everything after is writing/generation. The packet includes only what the
 * generator is allowed to use.
 */
export function buildEvidencePacket(input: BuildEvidencePacketInput): CompanyBriefingEvidencePacket {
  const {
    profile,
    relevanceResult,
    clusters,
    perceptionGapDecisions,
    normalizedArticles = [],
    run_id,
    scan_window,
    raw_articles_count = 0,
    normalized_articles_count = 0,
  } = input;

  const now = new Date().toISOString();
  const clusterMap = new Map(clusters.map((c) => [c.cluster_id, c]));
  const articleMap = new Map(normalizedArticles.map((a) => [a.article_id, a]));
  const pgMap = new Map(perceptionGapDecisions.map((p) => [p.cluster_id, p]));

  // Build email items from 8C candidates
  const emailItems = relevanceResult.email_items.map((candidate) =>
    buildEvidenceEmailItem(candidate, clusterMap.get(candidate.cluster_id), pgMap.get(candidate.cluster_id), articleMap),
  );

  // Build dashboard-only items
  const dashboardItems: EvidencePacketDashboardItem[] = relevanceResult.dashboard_items.map((d) => ({
    cluster_id: d.cluster_id,
    canonical_event_name: d.canonical_event_name,
    reason: mapDashboardReason(d.decision),
    relevance_score: d.decision.company_relevance_score,
    cluster_confidence: clusterMap.get(d.cluster_id)?.confidence.cluster_confidence ?? 0,
    allowed_in_email_generation: false as const,
  }));

  // Build excluded summary
  const excludedSummary = buildExcludedSummary(relevanceResult);

  // Collect all source IDs referenced in email items
  const sourceRegistryRefs = collectSourceIds(emailItems);

  // Input summary
  const inputSummary: EvidenceInputSummary = {
    raw_articles_count,
    normalized_articles_count,
    candidate_clusters_count: clusters.length,
    email_candidate_count: relevanceResult.email_items.length,
    final_email_item_count: emailItems.length,
    dashboard_only_count: dashboardItems.length,
    excluded_count: relevanceResult.excluded_items.length,
    scan_window: scan_window ?? { from: now, to: now },
  };

  // Validate packet
  const validation = validatePacket(emailItems, dashboardItems);

  const packet: CompanyBriefingEvidencePacket = {
    packet_version: "company_briefing_evidence_v1",
    run_id,
    generated_at: now,
    pipeline: {
      generation_route: "internal_openclaw_cron",
      public_pipeline_compatible: true,
      separate_openai_api_required: false,
    },
    company: buildCompanyContext(profile),
    briefing_policy: buildDefaultPolicy(),
    input_summary: inputSummary,
    email_items: emailItems,
    section_no_findings: relevanceResult.section_no_findings,
    dashboard_only_items: dashboardItems,
    excluded_summary: excludedSummary,
    source_registry_refs: sourceRegistryRefs,
    qa_requirements: [
      "schema_validation",
      "claim_source_check",
      "style_lint",
      "relevance_check",
      "duplicate_check",
      "perception_gap_check",
      "source_quality_check",
      "policy_limit_check",
    ],
    audit: {
      built_by: "company_scan_funnel",
      build_version: PACKET_BUILD_VERSION,
      upstream_run_refs: [run_id],
      packet_validation: validation,
    },
  };

  return packet;
}

// ---------------------------------------------------------------------------
// Internal builders
// ---------------------------------------------------------------------------

function buildCompanyContext(profile: CompanyBriefingProfile): EvidencePacketCompanyContext {
  return {
    company_id: profile.company_id,
    display_name: profile.display_name,
    industry: profile.industry,
    regions: profile.operating_regions,
    selected_scan_areas: profile.selected_scan_areas.map((area) => ({
      area_id: area.area_id,
      label: area.label,
      priority: area.priority === "high" ? "high" : area.priority === "medium" ? "medium" : "low",
      notes: area.description,
    })),
    watch_entities: (profile.watch_entities ?? []).map((e) => ({
      entity_id: e.entity_id,
      name: e.name,
      type: mapWatchEntityType(e.type),
      relationship: undefined,
    })),
  };
}

function mapWatchEntityType(t: string): EvidencePacketCompanyContext["watch_entities"][0]["type"] {
  const valid = ["company", "competitor", "supplier", "customer", "regulator", "market", "technology", "place", "other"];
  return valid.includes(t) ? (t as any) : "other";
}

function buildDefaultPolicy(): CompanyBriefingPolicy {
  return {
    tone: "calm_concise_useful_non_alarmist",
    max_email_items: 8,
    max_words_total: 1100,
    max_words_per_item: 120,
    no_inference_beyond_evidence: true,
    allow_no_send: true,
    allow_no_material_signal_line: true,
    attribution_required_for: [
      "single_source",
      "legal_or_regulatory",
      "market_moving",
      "conflict",
      "allegation",
      "forecast",
      "casualty_or_safety",
    ],
    prohibited_language: [
      "shocking",
      "explosive",
      "game-changing",
      "crisis",
      "must act now",
      "urgent action required",
      "proves that",
      "guarantees",
      "will definitely",
      "ignored by the media",
      "underscores",
      "evolving landscape",
      "stakeholders should monitor",
      "delve",
      "complex interplay",
      "amid",
    ],
    required_qualifiers: [
      { condition: "proposed", qualifier_examples: ["proposed", "under consideration", "not yet final"] },
      { condition: "alleged", qualifier_examples: ["alleged", "reported", "claimed"] },
      { condition: "single_source", qualifier_examples: ["according to", "reported by"] },
      { condition: "developing", qualifier_examples: ["developing", "early reports suggest", "unconfirmed"] },
      { condition: "conflicting_reports", qualifier_examples: ["reports differ on", "sources disagree"] },
    ],
  };
}

function buildEvidenceEmailItem(
  candidate: EmailCandidateItem,
  cluster: EventCluster | undefined,
  pgDecision: PerceptionGapDecision | undefined,
  articleMap: Map<string, NormalizedArticle>,
): EvidenceEmailItem {
  const decision = candidate.relevance_decision;
  const cl = cluster;

  // Build event tuple from cluster primary event tuple or candidate data
  const eventTuple = buildEventTuple(cl);

  // Build facts from cluster facts
  const facts = buildFacts(cl, candidate, articleMap);

  // Build uncertainty notes
  const uncertainty = buildUncertaintyNotes(cl, candidate);

  // Build conflict notes
  const conflicts = buildConflictNotes(cl);

  // Build source summary
  const sourceSummary = buildSourceSummary(candidate, cl, articleMap);

  // Build perception gap block
  const perceptionGap = buildPerceptionGapBlock(pgDecision, cl);

  // Build why_it_matters as supported text
  const whyItMatters = buildWhyItMatters(candidate);

  // Map item status from cluster status
  const itemStatus = mapItemStatus(cl?.status);

  return {
    item_id: candidate.item_id,
    cluster_id: candidate.cluster_id,
    section_ids: candidate.section_ids,
    canonical_event_name: candidate.canonical_event_name,
    event_tuple: eventTuple,
    item_status: itemStatus,
    decision: {
      target: "email",
      relevance_score: decision.company_relevance_score,
      cluster_confidence: cl?.confidence.cluster_confidence ?? 0.7,
      decision_reason: decision.decision_reasons.join("; "),
      threshold_basis: decision.decision_reasons.slice(0, 3),
    },
    why_it_matters: whyItMatters,
    facts,
    uncertainty,
    conflicts,
    source_summary: sourceSummary,
    perception_gap: perceptionGap,
  };
}

function buildEventTuple(cluster: EventCluster | undefined): EvidenceEventTuple {
  if (!cluster?.primary_event_tuple) {
    return { action: "reported event", status: "reported" };
  }
  const pt = cluster.primary_event_tuple;
  return {
    actor: pt.actor?.name ?? undefined,
    action: pt.action?.raw ?? "reported event",
    object: pt.object?.name ?? undefined,
    place: pt.place?.[0]?.name ?? undefined,
    event_time: pt.event_time?.date ?? pt.event_time?.text ?? undefined,
    status: mapTupleStatus(pt.status),
  };
}

function mapTupleStatus(s: string | undefined): EvidenceEventTuple["status"] {
  const valid = ["announced", "reported", "rumored", "confirmed", "denied", "proposed", "analysis"];
  if (s && valid.includes(s)) return s as EvidenceEventTuple["status"];
  return "reported";
}

function mapItemStatus(s: string | undefined): EvidenceEmailItem["item_status"] {
  const map: Record<string, EvidenceEmailItem["item_status"]> = {
    confirmed: "confirmed",
    developing: "developing",
    alleged: "alleged",
    analysis: "analysis",
    proposed: "proposed",
    denied: "alleged",
    rumored: "alleged",
    announced: "confirmed",
    reported: "developing",
    background: "analysis",
  };
  return map[s ?? ""] ?? "developing";
}

function buildFacts(
  cluster: EventCluster | undefined,
  candidate: EmailCandidateItem,
  articleMap: Map<string, NormalizedArticle>,
): EvidenceClaim[] {
  if (!cluster) {
    // Fallback: build simple facts from candidate summary facts
    return candidate.short_summary_facts.map((text, i) => ({
      claim_id: `${candidate.item_id}_fact_${i}`,
      text,
      claim_type: "fact" as const,
      supported_by: buildArticleSupportFromCandidate(candidate),
      confidence: 0.7,
      attribution_required: false,
    }));
  }

  const candidateSupportMap = new Map(buildArticleSupportFromCandidate(candidate).map((support) => [support.article_id, support]));

  return cluster.facts
    .map((fact, i): EvidenceClaim | null => {
      const supported = fact.supported_by_article_ids
        .map((aid: string) => {
          const art = articleMap.get(aid);
          return art
            ? buildArticleSupportFromArticle(aid, art, cluster)
            : candidateSupportMap.get(aid) ?? buildArticleSupportFromArticle(aid, undefined, cluster);
        })
        .filter((support) => isEmailEligibleSupport(support));

      if (supported.length === 0) return null;

      return {
        claim_id: fact.cluster_fact_id || `${candidate.item_id}_cf_${i}`,
        text: fact.text,
        claim_type: mapClaimType(fact.normalized_claim_type),
        supported_by: supported,
        confidence: fact.confidence,
        attribution_required: isAttributionRequired(fact, cluster),
        attribution_reason: getAttributionReasons(fact),
        required_qualifier: getRequiredQualifier(cluster, fact),
      };
    })
    .filter((claim): claim is EvidenceClaim => claim !== null);
}

function isEmailEligibleSupport(support: EvidenceArticleSupport): boolean {
  return support.email_evidence_eligible === true && support.seo_sludge_score !== undefined && support.seo_sludge_score < 60;
}

function isEmailEvidenceAction(action: EvidenceAction | undefined): boolean {
  return action === "email_anchor" || action === "email_support" || action === "review_required";
}

function mapClaimType(t: string | undefined): EvidenceClaim["claim_type"] {
  const map: Record<string, EvidenceClaim["claim_type"]> = {
    core_event: "fact",
    number: "stat",
    quote: "quote",
    context: "analysis",
    impact: "analysis",
    timeline: "fact",
    uncertainty: "analysis",
  };
  return map[t ?? ""] ?? "fact";
}

function isAttributionRequired(fact: ClusterFact, cluster: EventCluster): boolean {
  // Attribution required for single-source facts, legal/regulatory, market-moving
  if (fact.supported_by_article_ids.length <= 1) return true;
  if (fact.requires_attribution) return true;
  const status = cluster.status;
  if (status === "alleged" || status === "denied" || status === "rumored") return true;
  return false;
}

function getAttributionReasons(fact: ClusterFact): AttributionTrigger[] | undefined {
  const reasons: AttributionTrigger[] = [];
  if (fact.supported_by_article_ids.length <= 1) reasons.push("single_source");
  const ct = fact.normalized_claim_type;
  if (ct === "core_event") reasons.push("legal_or_regulatory");
  return reasons.length > 0 ? reasons : undefined;
}

function getRequiredQualifier(cluster: EventCluster, _fact: ClusterFact): string | undefined {
  if (cluster.status === "proposed") return "proposed";
  if (cluster.status === "alleged") return "alleged";
  if (cluster.status === "rumored") return "reported";
  if (cluster.status === "developing") return "developing";
  return undefined;
}

function buildArticleSupportFromCandidate(candidate: EmailCandidateItem): EvidenceArticleSupport[] {
  const supports: EvidenceArticleSupport[] = [];
  const anchor = candidate.source_summary.anchor;
  supports.push({
    article_id: anchor.article_id,
    source_id: `domain:${extractDomain(anchor.url)}`,
    source_display_name: anchor.source,
    source_grade: anchor.grade,
    source_type: "unknown" as SourceType,
    url: anchor.url,
    role: "anchor",
    evidence_action: anchor.grade === "A" || anchor.grade === "B" ? "email_anchor" : undefined,
    email_evidence_eligible: anchor.grade === "A" || anchor.grade === "B",
    seo_sludge_score: 0,
  });
  for (const sup of candidate.source_summary.supporting) {
    const grade = sup.grade as QualityGrade;
    supports.push({
      article_id: sup.article_id,
      source_id: `domain:${extractDomain(sup.url)}`,
      source_display_name: sup.source,
      source_grade: grade,
      source_type: "unknown" as SourceType,
      url: sup.url,
      role: "supporting",
      evidence_action: grade === "A" || grade === "B" || grade === "C" ? "email_support" : undefined,
      email_evidence_eligible: grade === "A" || grade === "B" || grade === "C",
      seo_sludge_score: 0,
    });
  }
  return supports;
}

function buildArticleSupportFromArticle(
  articleId: string,
  article: NormalizedArticle | undefined,
  cluster: EventCluster,
): EvidenceArticleSupport {
  if (!article) {
    return {
      article_id: articleId,
      source_id: "unknown",
      source_display_name: "Unknown",
      source_grade: "C" as QualityGrade,
      source_type: "unknown" as SourceType,
      url: "",
      role: articleId === cluster.articles.anchor_article_id ? "anchor" : "supporting",
      email_evidence_eligible: false,
    };
  }
  return {
    article_id: articleId,
    source_id: article.source.source_id,
    source_display_name: article.source.display_name,
    source_grade: article.source.source_quality_grade,
    source_type: article.source.source_type as SourceType,
    url: article.urls.raw_url,
    role: articleId === cluster.articles.anchor_article_id ? "anchor" : "supporting",
    published_at: article.article_meta.published_at ?? undefined,
    evidence_action: article.quality.evidence_action,
    email_evidence_eligible: article.quality.email_evidence_eligible && isEmailEvidenceAction(article.quality.evidence_action),
    seo_sludge_score: article.quality.seo_sludge_score,
  };
}

function buildUncertaintyNotes(
  cluster: EventCluster | undefined,
  candidate: EmailCandidateItem,
): EvidenceUncertaintyNote[] {
  const notes: EvidenceUncertaintyNote[] = [];

  // From candidate uncertainty strings
  if (candidate.uncertainty) {
    for (const text of candidate.uncertainty) {
      notes.push({
        uncertainty_id: `unc_${candidate.item_id}_${notes.length}`,
        type: inferUncertaintyType(text, cluster?.status),
        text,
        applies_to_claim_ids: [],
        must_mention: true,
      });
    }
  }

  // From cluster status
  if (cluster) {
    if (cluster.status === "proposed" && !notes.some((n) => n.type === "proposed")) {
      notes.push({
        uncertainty_id: `unc_status_${cluster.cluster_id}`,
        type: "proposed",
        text: "This is a proposal and may not become final.",
        applies_to_claim_ids: [],
        must_mention: true,
      });
    }
    if (cluster.status === "developing" && !notes.some((n) => n.type === "developing")) {
      notes.push({
        uncertainty_id: `unc_status_${cluster.cluster_id}`,
        type: "developing",
        text: "This is a developing situation; details may change.",
        applies_to_claim_ids: [],
        must_mention: true,
      });
    }
    if (cluster.status === "alleged" && !notes.some((n) => n.type === "alleged")) {
      notes.push({
        uncertainty_id: `unc_status_${cluster.cluster_id}`,
        type: "alleged",
        text: "This is reported as alleged and has not been independently confirmed.",
        applies_to_claim_ids: [],
        must_mention: true,
      });
    }
  }

  return notes;
}

function inferUncertaintyType(
  text: string,
  clusterStatus?: string,
): EvidenceUncertaintyNote["type"] {
  const lower = text.toLowerCase();
  if (lower.includes("proposed") || lower.includes("not yet final")) return "proposed";
  if (lower.includes("alleged")) return "alleged";
  if (lower.includes("developing")) return "developing";
  if (lower.includes("single source") || lower.includes("one source")) return "single_source";
  if (lower.includes("unclear") || lower.includes("timing")) return "unclear_timing";
  if (clusterStatus === "proposed") return "proposed";
  if (clusterStatus === "alleged" || clusterStatus === "rumored") return "alleged";
  return "limited_detail";
}

function buildConflictNotes(cluster: EventCluster | undefined): EvidenceConflictNote[] {
  if (!cluster?.conflicts?.length) return [];
  return cluster.conflicts.map((conflict, i) => ({
    conflict_id: conflict.conflict_id || `conf_${cluster.cluster_id}_${i}`,
    claim_topic: conflict.description,
    positions: conflict.positions.map((p) => ({
      source_id: `articles:${p.article_ids.join(",")}`,
      article_id: p.article_ids[0] ?? "",
      position_text: p.text,
      confidence: p.confidence,
    })),
    resolution: conflict.resolution as EvidenceConflictNote["resolution"],
    must_mention: conflict.resolution === "unresolved",
  }));
}

function buildSourceSummary(
  candidate: EmailCandidateItem,
  cluster: EventCluster | undefined,
  articleMap: Map<string, NormalizedArticle>,
): EvidenceSourceSummary {
  const candidateSupports = buildArticleSupportFromCandidate(candidate);
  const anchorArticleId = cluster?.articles.anchor_article_id ?? candidate.source_summary.anchor.article_id;
  const anchorFallback = candidateSupports.find((s) => s.article_id === anchorArticleId && s.role === "anchor") ?? candidateSupports[0];
  const anchorArticle = articleMap.get(anchorArticleId);
  const anchorSupport = buildArticleSupportFromArticle(anchorArticleId, anchorArticle, cluster ?? fallbackClusterForSupport(candidate.cluster_id, anchorArticleId));
  const hydratedAnchor = !anchorArticle && anchorFallback ? anchorFallback : anchorSupport;

  const supportingIds = cluster?.articles.supporting_article_ids ?? candidate.source_summary.supporting.map((s) => s.article_id);
  const candidateSupportByArticle = new Map(candidateSupports.map((support) => [support.article_id, support]));
  const supporting: EvidenceArticleSupport[] = supportingIds
    .map((id) => {
      const article = articleMap.get(id);
      return article
        ? buildArticleSupportFromArticle(id, article, cluster ?? fallbackClusterForSupport(candidate.cluster_id, anchorArticleId))
        : candidateSupportByArticle.get(id) ?? buildArticleSupportFromArticle(id, undefined, cluster ?? fallbackClusterForSupport(candidate.cluster_id, anchorArticleId));
    })
    .filter((support) => isEmailEligibleSupport(support));

  const sourceMix = cluster?.source_mix?.counts_by_grade ?? countSourceMix([hydratedAnchor, ...supporting]);
  const regionsRepresented = cluster?.geography_language?.regions_represented ?? [];
  const languagesRepresented = cluster?.geography_language?.languages_represented ?? [];

  return {
    anchor: hydratedAnchor,
    supporting,
    source_mix: sourceMix,
    regions_represented: regionsRepresented,
    languages_represented: languagesRepresented,
  };
}

function fallbackClusterForSupport(clusterId: string, anchorArticleId: string): EventCluster {
  return {
    cluster_id: clusterId,
    canonical_event_name: "unknown event",
    event_key: clusterId,
    articles: {
      anchor_article_id: anchorArticleId,
      supporting_article_ids: [],
      duplicate_article_ids: [],
      syndicated_article_ids: [],
      total_article_count: 1,
    },
  } as unknown as EventCluster;
}

function countSourceMix(supports: EvidenceArticleSupport[]): EvidenceSourceSummary["source_mix"] {
  const counts: EvidenceSourceSummary["source_mix"] = { A: 0, B: 0, C: 0, D: 0, Block: 0 };
  for (const support of supports) {
    counts[support.source_grade] += 1;
  }
  return counts;
}

function buildPerceptionGapBlock(
  pgDecision: PerceptionGapDecision | undefined,
  cluster: EventCluster | undefined,
): EvidencePerceptionGapBlock | undefined {
  if (!pgDecision || !pgDecision.eligible) return undefined;

  const frames: EvidencePerceptionFrame[] = (cluster?.frames ?? [])
    .filter((f) => pgDecision.evidence_frame_ids.includes(f.frame_id))
    .map((f) => ({
      frame_id: f.frame_id,
      cluster_id: cluster?.cluster_id ?? "",
      article_id: f.article_id,
      source_region: f.source_region ?? "unknown",
      audience_region: f.audience_region ?? undefined,
      language: f.language,
      frame_labels: f.frame_labels as string[],
      primary_stakeholders_mentioned: f.primary_stakeholders_mentioned,
      tone_intensity: f.tone_intensity as "low" | "medium" | "high",
      evidence_type: inferEvidenceType(f.source_type),
      summary: f.frame_summary,
      source_grade: inferFrameGrade(f, cluster),
    }));

  const showRec = pgDecision.show_in_email
    ? "show"
    : pgDecision.show_in_dashboard
    ? "manual_review"
    : "skip";

  const suggestedNote = pgDecision.suggested_note
    ? {
        text: pgDecision.suggested_note,
        supported_by: pgDecision.evidence_frame_ids.map((id) => ({
          type: "frame_id" as const,
          id,
        })),
        confidence: pgDecision.confidence,
      }
    : undefined;

  return {
    eligible: pgDecision.eligible,
    show_recommendation: showRec,
    frame_ids: pgDecision.evidence_frame_ids,
    frames,
    suggested_note: suggestedNote,
    skip_reason: pgDecision.skip_reason,
  };
}

function buildWhyItMatters(candidate: EmailCandidateItem): EvidenceSupportedText {
  const supportRefs: EvidenceSupportRef[] = candidate.why_it_matters.supported_by.map((s) => {
    // Guess type from the ref string
    if (s.startsWith("scan_area:") || s.startsWith("company.selected_area.")) {
      return { type: "scan_area", id: s };
    }
    if (s.startsWith("claim_") || s.startsWith("fact_")) {
      return { type: "claim_id", id: s };
    }
    if (s.startsWith("domain:") || s.startsWith("source:")) {
      return { type: "source_id", id: s };
    }
    if (s.startsWith("frame_")) {
      return { type: "frame_id", id: s };
    }
    return { type: "company_profile_field", id: s };
  });

  return {
    text: candidate.why_it_matters.text,
    supported_by: supportRefs,
    confidence: candidate.relevance_decision.company_relevance_score / 100,
  };
}

// ---------------------------------------------------------------------------
// Excluded summary builder
// ---------------------------------------------------------------------------

function buildExcludedSummary(result: CompanyRelevanceResult): ExcludedSummary {
  const counts: Partial<Record<ExcludeReason, number>> = {};
  const notable: ExcludedSummary["notable_exclusions"] = [];

  for (const item of result.excluded_items) {
    const reasons = item.decision.exclusion_reasons ?? item.decision.decision_reasons;
    const reason = mapExcludeReason(reasons);
    counts[reason] = (counts[reason] ?? 0) + 1;
    if (notable.length < 5) {
      notable.push({
        cluster_id: item.cluster_id,
        title: item.canonical_event_name,
        reason,
        audit_note: reasons.join("; "),
      });
    }
  }

  return { counts_by_reason: counts, notable_exclusions: notable };
}

function mapExcludeReason(reasons: string[]): ExcludeReason {
  const joined = reasons.join(" ").toLowerCase();
  if (joined.includes("sludge") || joined.includes("seo")) return "seo_sludge";
  if (joined.includes("duplicate")) return "duplicate";
  if (joined.includes("weak") || joined.includes("keyword_only")) return "weak_match";
  if (joined.includes("stale")) return "stale";
  if (joined.includes("block")) return "source_blocked";
  if (joined.includes("wrong_entity")) return "wrong_entity";
  if (joined.includes("confidence")) return "low_confidence";
  if (joined.includes("no_event")) return "no_event";
  if (joined.includes("injection")) return "prompt_injection";
  if (joined.includes("already_seen") || joined.includes("seen_before")) return "already_seen";
  return "weak_match";
}

function mapDashboardReason(
  decision: import("./types").RelevanceDecision,
): EvidencePacketDashboardItem["reason"] {
  const reasons = decision.decision_reasons.join(" ").toLowerCase();
  if (reasons.includes("single_source")) return "single_source";
  if (reasons.includes("confidence") || reasons.includes("medium")) return "medium_confidence";
  if (reasons.includes("materiality") || reasons.includes("low_materiality")) return "low_materiality";
  if (reasons.includes("stale") || reasons.includes("time")) return "not_time_sensitive";
  if (reasons.includes("thin") || reasons.includes("relevance")) return "thin_relevance";
  if (reasons.includes("review") || reasons.includes("manual")) return "manual_review_needed";
  return "low_materiality";
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validatePacket(
  emailItems: EvidenceEmailItem[],
  dashboardItems: EvidencePacketDashboardItem[],
): EvidencePacketAudit["packet_validation"] {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check dashboard items have allowed_in_email_generation: false
  for (const d of dashboardItems) {
    if (d.allowed_in_email_generation !== false) {
      errors.push(`dashboard item ${d.cluster_id} has allowed_in_email_generation !== false`);
    }
  }

  // Check email items have source summary
  for (const item of emailItems) {
    if (!item.source_summary?.anchor) {
      warnings.push(`email item ${item.item_id} missing anchor source`);
    }
    if (!item.why_it_matters?.text) {
      warnings.push(`email item ${item.item_id} missing why_it_matters text`);
    }
    if (!item.why_it_matters?.supported_by?.length) {
      warnings.push(`email item ${item.item_id} why_it_matters lacks support refs`);
    }
    if (item.facts.length === 0) {
      warnings.push(`email item ${item.item_id} has no facts`);
    }
  }

  if (emailItems.length > 10) {
    warnings.push(`${emailItems.length} email items exceeds recommended max of 10`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function collectSourceIds(items: EvidenceEmailItem[]): string[] {
  const ids = new Set<string>();
  for (const item of items) {
    ids.add(item.source_summary.anchor.source_id);
    for (const s of item.source_summary.supporting) {
      ids.add(s.source_id);
    }
    for (const fact of item.facts) {
      for (const s of fact.supported_by) {
        ids.add(s.source_id);
      }
    }
  }
  return [...ids];
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function guessSourceType(displayName: string): SourceType {
  const lower = displayName.toLowerCase();
  if (lower.includes("reuters") || lower.includes("ap ") || lower.includes("associated press") || lower.includes("afp")) return "wire";
  if (lower.includes("bbc") || lower.includes("wsj") || lower.includes("ft ") || lower.includes("bloomberg") || lower.includes("nyt") || lower.includes("guardian")) return "major_outlet";
  return "unknown";
}

function inferEvidenceType(sourceType: SourceType): EvidencePerceptionFrame["evidence_type"] {
  const map: Partial<Record<SourceType, EvidencePerceptionFrame["evidence_type"]>> = {
    wire: "wire",
    major_outlet: "market",
    local_outlet: "local",
    trade: "expert",
    official: "official",
    company: "company",
    regulator: "official",
    government: "official",
    research: "expert",
  };
  return map[sourceType] ?? "market";
}

function inferFrameGrade(
  frame: ClusterFrame,
  cluster: EventCluster | undefined,
): QualityGrade {
  if (!cluster) return "C";
  // Look up the article in the cluster to determine source grade
  const anchorGrade = cluster.source_mix?.anchor_source_grade;
  if (frame.article_id === cluster.articles.anchor_article_id) {
    return anchorGrade ?? "B";
  }
  // Default to B for supporting, C for others
  if (cluster.articles.supporting_article_ids.includes(frame.article_id)) return "B";
  return "C";
}
