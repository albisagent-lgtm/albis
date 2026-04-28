// ---------------------------------------------------------------------------
// Package 8C — Perception Gap Evidence Evaluator.
//
// Decides when a Perception Gap note is evidence-based enough to show.
// A Perception Gap helps companies see how an event may look different across
// regions, source types, languages, or stakeholder emphasis. It is NOT media
// criticism — it is evidence-bound framing comparison.
//
// Input:  EventCluster + CompanyBriefingProfile + RelevanceDecision
// Output: PerceptionGapDecision per cluster
// ---------------------------------------------------------------------------

import type {
  EventCluster,
  ClusterFrame,
  CompanyBriefingProfile,
  RelevanceDecision,
  PerceptionGapDecision,
  PerceptionGapType,
  ComparedDimension,
  QualityGrade,
} from "./types";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface PerceptionGapInput {
  cluster: EventCluster;
  profile: CompanyBriefingProfile;
  relevanceDecision: RelevanceDecision;
}

/**
 * Evaluate whether a Perception Gap note is supported by evidence for this cluster.
 *
 * Baseline requirements:
 * 1. Parent cluster is email-worthy or dashboard-worthy with material relevance.
 * 2. At least two usable evidence points for comparison.
 * 3. Difference is material, not cosmetic tone.
 * 4. Difference is company-relevant.
 * 5. Note can be written neutrally without accusation/speculation.
 * 6. Sources used for the gap are not Block/high-sludge.
 */
export function evaluatePerceptionGap(input: PerceptionGapInput): PerceptionGapDecision {
  const { cluster, profile, relevanceDecision } = input;

  // Baseline 1: parent cluster must be at least dashboard-worthy
  if (relevanceDecision.decision === "exclude") {
    return skipDecision(cluster.cluster_id, "parent_cluster_excluded");
  }

  // Must have frames to compare
  const frames = cluster.frames;
  if (!frames || frames.length === 0) {
    return skipDecision(cluster.cluster_id, "no_frames_available");
  }

  // Baseline 6: filter out Block/high-sludge frames
  const usableFrames = frames.filter((f) => {
    const grade = inferFrameSourceGrade(f, cluster);
    return grade !== "Block" && grade !== "D";
  });

  if (usableFrames.length < 2) {
    return skipDecision(cluster.cluster_id, usableFrames.length === 0 ? "no_usable_frames" : "single_source_no_comparison");
  }

  // Detect frame differences
  const comparison = compareFrames(usableFrames, profile);

  if (!comparison.hasMaterialDifference) {
    return skipDecision(cluster.cluster_id, comparison.skipReason || "no_material_difference");
  }

  // Score confidence
  const confidence = scorePerceptionGapConfidence({
    clusterConfidence: cluster.confidence.cluster_confidence,
    frames: usableFrames,
    cluster,
    comparison,
  });

  // Determine visibility
  const isEmailWorthy = relevanceDecision.decision === "email" || relevanceDecision.decision === "email_caution";
  const showInEmail = confidence >= 0.70 && isEmailWorthy;
  const showInDashboard = confidence >= 0.50;

  if (confidence < 0.50) {
    return skipDecision(cluster.cluster_id, "confidence_too_low");
  }

  // Build suggested note
  const suggestedNote = buildSuggestedNote(comparison, profile);

  return {
    cluster_id: cluster.cluster_id,
    eligible: true,
    show_in_email: showInEmail,
    show_in_dashboard: showInDashboard,
    gap_type: comparison.gapType,
    evidence_frame_ids: comparison.frameIds,
    compared_dimensions: comparison.dimensions,
    material_difference: comparison.differenceDescription,
    company_relevance: comparison.companyRelevance,
    suggested_note: suggestedNote,
    confidence,
  };
}

/**
 * Evaluate Perception Gap for a batch of clusters.
 */
export function evaluatePerceptionGapBatch(
  inputs: PerceptionGapInput[],
): PerceptionGapDecision[] {
  return inputs.map(evaluatePerceptionGap);
}

// ---------------------------------------------------------------------------
// Frame comparison
// ---------------------------------------------------------------------------

interface FrameComparison {
  hasMaterialDifference: boolean;
  gapType?: PerceptionGapType;
  dimensions: ComparedDimension[];
  frameIds: string[];
  differenceDescription: string;
  companyRelevance: string;
  skipReason?: string;
  frameA?: ClusterFrame;
  frameB?: ClusterFrame;
}

function compareFrames(
  frames: ClusterFrame[],
  profile: CompanyBriefingProfile,
): FrameComparison {
  // Try each gap type in priority order

  // 1. Regional frame difference
  const regionalDiff = detectRegionalFrameDifference(frames, profile);
  if (regionalDiff.hasMaterialDifference) return regionalDiff;

  // 2. Stakeholder emphasis difference
  const stakeholderDiff = detectStakeholderDifference(frames, profile);
  if (stakeholderDiff.hasMaterialDifference) return stakeholderDiff;

  // 3. Coverage asymmetry
  const coverageDiff = detectCoverageAsymmetry(frames, profile);
  if (coverageDiff.hasMaterialDifference) return coverageDiff;

  // 4. Evidence basis difference
  const evidenceDiff = detectEvidenceBasisDifference(frames, profile);
  if (evidenceDiff.hasMaterialDifference) return evidenceDiff;

  // 5. Language/market difference
  const languageDiff = detectLanguageDifference(frames, profile);
  if (languageDiff.hasMaterialDifference) return languageDiff;

  return {
    hasMaterialDifference: false,
    dimensions: [],
    frameIds: [],
    differenceDescription: "",
    companyRelevance: "",
    skipReason: "no_material_frame_difference",
  };
}

function detectRegionalFrameDifference(
  frames: ClusterFrame[],
  profile: CompanyBriefingProfile,
): FrameComparison {
  // Group frames by source_region
  const byRegion = groupBy(frames, (f) => f.source_region || "unknown");
  const regions = Object.keys(byRegion).filter((r) => r !== "unknown");

  if (regions.length < 2) {
    return noMatch("single_region");
  }

  // Compare frame labels between regions
  for (let i = 0; i < regions.length; i++) {
    for (let j = i + 1; j < regions.length; j++) {
      const framesA = byRegion[regions[i]];
      const framesB = byRegion[regions[j]];

      const labelsA = new Set(framesA.flatMap((f) => f.frame_labels));
      const labelsB = new Set(framesB.flatMap((f) => f.frame_labels));

      // Check if there's a material difference in labels
      const onlyInA = [...labelsA].filter((l) => !labelsB.has(l));
      const onlyInB = [...labelsB].filter((l) => !labelsA.has(l));

      if (onlyInA.length > 0 || onlyInB.length > 0) {
        const bestA = framesA[0];
        const bestB = framesB[0];

        // Check company relevance of the difference
        const companyRelevance = assessCompanyRelevance(bestA, bestB, profile);
        if (!companyRelevance) continue;

        return {
          hasMaterialDifference: true,
          gapType: "regional_frame_difference",
          dimensions: ["region"],
          frameIds: [bestA.frame_id, bestB.frame_id],
          differenceDescription: `${regions[i]} coverage emphasised ${formatLabels(onlyInA.length > 0 ? onlyInA : [...labelsA])}, while ${regions[j]} coverage focused more on ${formatLabels(onlyInB.length > 0 ? onlyInB : [...labelsB])}`,
          companyRelevance,
          frameA: bestA,
          frameB: bestB,
        };
      }
    }
  }

  return noMatch("regions_frame_labels_identical");
}

function detectStakeholderDifference(
  frames: ClusterFrame[],
  profile: CompanyBriefingProfile,
): FrameComparison {
  // Compare primary stakeholders mentioned across frames
  const stakeholderSets = frames.map((f) => new Set(f.primary_stakeholders_mentioned));

  for (let i = 0; i < frames.length; i++) {
    for (let j = i + 1; j < frames.length; j++) {
      const setA = stakeholderSets[i];
      const setB = stakeholderSets[j];
      const onlyInA = [...setA].filter((s) => !setB.has(s));
      const onlyInB = [...setB].filter((s) => !setA.has(s));

      if (onlyInA.length > 0 || onlyInB.length > 0) {
        const frameA = frames[i];
        const frameB = frames[j];
        const regionA = frameA.source_region || frameA.source_type;
        const regionB = frameB.source_region || frameB.source_type;

        if (regionA === regionB) continue; // need different perspectives

        const companyRelevance = assessCompanyRelevance(frameA, frameB, profile);
        if (!companyRelevance) continue;

        return {
          hasMaterialDifference: true,
          gapType: "stakeholder_emphasis_difference",
          dimensions: ["stakeholder", "region"],
          frameIds: [frameA.frame_id, frameB.frame_id],
          differenceDescription: `${regionA} coverage emphasised ${onlyInA.join(", ") || [...setA].join(", ")} perspectives, while ${regionB} coverage focused more on ${onlyInB.join(", ") || [...setB].join(", ")}`,
          companyRelevance,
          frameA,
          frameB,
        };
      }
    }
  }

  return noMatch("stakeholders_similar");
}

function detectCoverageAsymmetry(
  frames: ClusterFrame[],
  profile: CompanyBriefingProfile,
): FrameComparison {
  // Check if coverage is heavily concentrated in one region
  const byRegion = groupBy(frames, (f) => f.source_region || "unknown");
  const regions = Object.keys(byRegion).filter((r) => r !== "unknown");

  if (regions.length < 2) return noMatch("single_region");

  // Look for significant volume difference
  const counts = regions.map((r) => ({ region: r, count: byRegion[r].length }));
  counts.sort((a, b) => b.count - a.count);

  if (counts.length >= 2 && counts[0].count >= 3 * counts[1].count) {
    const dominant = counts[0];
    const minor = counts[1];

    const companyRelevance = `Coverage of this event is concentrated in ${dominant.region} (${dominant.count} sources) with limited coverage from ${minor.region} (${minor.count})`;

    return {
      hasMaterialDifference: true,
      gapType: "coverage_asymmetry",
      dimensions: ["coverage_volume", "region"],
      frameIds: [byRegion[dominant.region][0].frame_id, byRegion[minor.region][0].frame_id],
      differenceDescription: `Event received significantly more coverage in ${dominant.region} than ${minor.region}`,
      companyRelevance,
    };
  }

  return noMatch("coverage_balanced");
}

function detectEvidenceBasisDifference(
  frames: ClusterFrame[],
  profile: CompanyBriefingProfile,
): FrameComparison {
  // Check if frames differ in evidence_basis
  for (let i = 0; i < frames.length; i++) {
    for (let j = i + 1; j < frames.length; j++) {
      const basisA = new Set(frames[i].evidence_basis);
      const basisB = new Set(frames[j].evidence_basis);
      const onlyInA = [...basisA].filter((b) => !basisB.has(b));
      const onlyInB = [...basisB].filter((b) => !basisA.has(b));

      if (onlyInA.length > 0 && onlyInB.length > 0) {
        const regionA = frames[i].source_region || frames[i].source_type;
        const regionB = frames[j].source_region || frames[j].source_type;

        if (regionA === regionB) continue;

        return {
          hasMaterialDifference: true,
          gapType: "evidence_basis_difference",
          dimensions: ["evidence_type", "region"],
          frameIds: [frames[i].frame_id, frames[j].frame_id],
          differenceDescription: `${regionA} coverage drew on ${onlyInA.join(", ")} evidence, while ${regionB} coverage relied on ${onlyInB.join(", ")}`,
          companyRelevance: `Different evidence bases may affect reliability assessment for ${profile.display_name}`,
          frameA: frames[i],
          frameB: frames[j],
        };
      }
    }
  }

  return noMatch("evidence_basis_similar");
}

function detectLanguageDifference(
  frames: ClusterFrame[],
  profile: CompanyBriefingProfile,
): FrameComparison {
  // Group by language
  const byLang = groupBy(frames, (f) => f.language);
  const languages = Object.keys(byLang);

  if (languages.length < 2) return noMatch("single_language");

  // Compare frame labels across languages
  for (let i = 0; i < languages.length; i++) {
    for (let j = i + 1; j < languages.length; j++) {
      const framesA = byLang[languages[i]];
      const framesB = byLang[languages[j]];
      const labelsA = new Set(framesA.flatMap((f) => f.frame_labels));
      const labelsB = new Set(framesB.flatMap((f) => f.frame_labels));
      const onlyInA = [...labelsA].filter((l) => !labelsB.has(l));
      const onlyInB = [...labelsB].filter((l) => !labelsA.has(l));

      if (onlyInA.length > 0 || onlyInB.length > 0) {
        return {
          hasMaterialDifference: true,
          gapType: "language_market_difference",
          dimensions: ["language"],
          frameIds: [framesA[0].frame_id, framesB[0].frame_id],
          differenceDescription: `${languages[i]}-language coverage emphasised ${formatLabels(onlyInA.length > 0 ? onlyInA : [...labelsA])}, while ${languages[j]}-language coverage focused on ${formatLabels(onlyInB.length > 0 ? onlyInB : [...labelsB])}`,
          companyRelevance: `Language-specific framing differences may affect how this event is perceived in different markets relevant to ${profile.display_name}`,
          frameA: framesA[0],
          frameB: framesB[0],
        };
      }
    }
  }

  return noMatch("language_frames_similar");
}

// ---------------------------------------------------------------------------
// Confidence scoring
// ---------------------------------------------------------------------------

interface ConfidenceInput {
  clusterConfidence: number;
  frames: ClusterFrame[];
  cluster: EventCluster;
  comparison: FrameComparison;
}

function scorePerceptionGapConfidence(input: ConfidenceInput): number {
  const { clusterConfidence, frames, cluster, comparison } = input;
  let confidence = 0;

  // +0.25 parent cluster confidence >= 0.70
  if (clusterConfidence >= 0.70) confidence += 0.25;
  else if (clusterConfidence >= 0.55) confidence += 0.15;

  // +0.20 two or more A/B frame sources
  const abFrames = frames.filter((f) => {
    const grade = inferFrameSourceGrade(f, cluster);
    return grade === "A" || grade === "B";
  });
  if (abFrames.length >= 2) confidence += 0.20;
  else if (abFrames.length === 1) confidence += 0.10;

  // +0.15 credible local/regional source adds unique factual context
  const localFrames = frames.filter(
    (f) => f.source_type === "local_outlet" || f.source_type === "trade"
  );
  if (localFrames.length > 0 && localFrames.some((f) => f.confidence >= 0.60)) {
    confidence += 0.15;
  }

  // +0.15 clear difference in frame labels/stakeholders/evidence type
  if (comparison.hasMaterialDifference) confidence += 0.15;

  // +0.10 company-relevant region/entity involved
  if (comparison.companyRelevance && comparison.companyRelevance.length > 0) {
    confidence += 0.10;
  }

  // +0.10 extraction confidence >= 0.75 for compared frames
  const comparedFrames = frames.filter((f) =>
    comparison.frameIds.includes(f.frame_id)
  );
  if (comparedFrames.length >= 2 && comparedFrames.every((f) => f.confidence >= 0.75)) {
    confidence += 0.10;
  }

  // +0.05 coverage-volume asymmetry measured (not guessed)
  if (comparison.gapType === "coverage_asymmetry") {
    confidence += 0.05;
  }

  // Penalties
  // -0.20 if any compared frame is C-only
  const cOnlyFrames = comparedFrames.filter((f) => {
    const grade = inferFrameSourceGrade(f, cluster);
    return grade === "C";
  });
  if (cOnlyFrames.length > 0) confidence -= 0.20;

  // -0.30 if extraction confidence is low
  if (comparedFrames.some((f) => f.confidence < 0.50)) {
    confidence -= 0.30;
  }

  return Math.max(0, Math.min(1, confidence));
}

// ---------------------------------------------------------------------------
// Suggested note builder
// ---------------------------------------------------------------------------

function buildSuggestedNote(comparison: FrameComparison, profile: CompanyBriefingProfile): string {
  if (!comparison.hasMaterialDifference) return "";

  // Template: "[Region/source type] coverage emphasised [frame A], while
  // [region/source type] coverage focused more on [frame B]. For [company/context],
  // the useful point is [supported business-relevant interpretation]."

  let note = comparison.differenceDescription;

  if (comparison.companyRelevance) {
    note += `. For ${profile.display_name}, ${comparison.companyRelevance.charAt(0).toLowerCase() + comparison.companyRelevance.slice(1)}`;
  }

  // Ensure it ends with a period
  if (!note.endsWith(".")) note += ".";

  return note;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function skipDecision(clusterId: string, reason: string): PerceptionGapDecision {
  return {
    cluster_id: clusterId,
    eligible: false,
    show_in_email: false,
    show_in_dashboard: false,
    evidence_frame_ids: [],
    compared_dimensions: [],
    material_difference: "",
    company_relevance: "",
    confidence: 0,
    skip_reason: reason,
  };
}

function noMatch(reason: string): FrameComparison {
  return {
    hasMaterialDifference: false,
    dimensions: [],
    frameIds: [],
    differenceDescription: "",
    companyRelevance: "",
    skipReason: reason,
  };
}

function inferFrameSourceGrade(frame: ClusterFrame, cluster: EventCluster): QualityGrade {
  // Infer grade from source_type as a proxy (actual grade is on the article level)
  const gradeMap: Record<string, QualityGrade> = {
    wire: "A",
    major_outlet: "A",
    official: "A",
    trade: "B",
    local_outlet: "B",
    company: "B",
    aggregator: "C",
    blog: "C",
    unknown: "C",
  };

  // If we can match frame article to cluster source_mix, use that
  // For now, use source_type heuristic
  return gradeMap[frame.source_type] || "C";
}

function assessCompanyRelevance(
  frameA: ClusterFrame,
  frameB: ClusterFrame,
  profile: CompanyBriefingProfile,
): string | null {
  // Check if any frame region overlaps with company regions
  const companyRegions = [
    ...profile.operating_regions,
    ...(profile.customer_regions || []),
    ...(profile.supplier_regions || []),
    ...(profile.regulatory_regions || []),
  ].map((r) => r.toLowerCase());

  const frameRegions = [
    frameA.source_region,
    frameB.source_region,
    frameA.audience_region,
    frameB.audience_region,
  ]
    .filter(Boolean)
    .map((r) => r!.toLowerCase());

  const hasOverlap = frameRegions.some((fr) =>
    companyRegions.some((cr) => fr.includes(cr) || cr.includes(fr))
  );

  if (hasOverlap) {
    return `this framing difference affects how the event is understood in ${profile.display_name}'s operating regions`;
  }

  // Check if frame labels relate to company risk priorities
  const allLabels = [...frameA.frame_labels, ...frameB.frame_labels];
  const riskPriorities = (profile.risk_priorities || []).map((r) => r.toLowerCase());

  const labelToRisk: Record<string, string[]> = {
    regulatory_risk: ["regulatory-policy", "regulation"],
    supply_chain: ["supply-chain-disruption", "supply chain"],
    market_impact: ["commodity-price-volatility", "market"],
    geopolitical_angle: ["geopolitical-conflict", "geopolitical"],
    consumer_impact: ["reputation-narrative", "reputation"],
    technology_angle: ["cyber-technology", "technology"],
  };

  for (const label of allLabels) {
    const matchingRisks = labelToRisk[label] || [];
    if (matchingRisks.some((mr) => riskPriorities.some((rp) => rp.includes(mr) || mr.includes(rp)))) {
      return `the framing difference touches ${profile.display_name}'s declared risk priorities`;
    }
  }

  // If the difference involves stakeholders relevant to company
  const stakeholders = [
    ...frameA.primary_stakeholders_mentioned,
    ...frameB.primary_stakeholders_mentioned,
  ];
  if (stakeholders.includes("regulator") || stakeholders.includes("customers") || stakeholders.includes("suppliers")) {
    return `the different stakeholder emphasis is relevant to ${profile.display_name}'s business relationships`;
  }

  return null;
}

function formatLabels(labels: string[]): string {
  return labels
    .map((l) => l.replace(/_/g, " "))
    .join(" and ");
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}
