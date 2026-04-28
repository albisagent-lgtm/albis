// ---------------------------------------------------------------------------
// Package 8E — Company Briefing QA Gates.
//
// Layer 6 of the Package 8 funnel: pre-send verification.
// Runs after generation, before email send. Produces a
// CompanyBriefingQAReport and a final send/hold/dashboard/manual/dry-run
// decision.
//
// QA flow:
//   1. Validate evidence packet schema
//   2. Validate generation output schema
//   3. Check generation used only allowed packet items
//   4. Check every factual sentence against claim map and packet claims
//   5. Check attribution/uncertainty requirements
//   6. Check relevance support for every email item
//   7. Check duplicates across final items
//   8. Check Perception Gap eligibility and wording
//   9. Check style/tone/length/prohibited language
//  10. Decide send/hold/dashboard/manual/dry-run
//
// Blocking failures prevent send. Warning failures are recorded and
// allow send if no blockers exist.
// ---------------------------------------------------------------------------

import type {
  CompanyBriefingEvidencePacket,
  CompanyBriefingGenerationOutput,
  CompanyBriefingQAReport,
  QAStatus,
  QASchemaCheck,
  QASourceCheck,
  QAClaimCheck,
  QARelevanceCheck,
  QADuplicateCheck,
  QAPerceptionGapCheck,
  QAStyleCheck,
  QAPolicyCheck,
  QAFailure,
  QARevision,
  DryRunMetadata,
  EvidenceEmailItem,
  EvidenceArticleSupport,
  GeneratedBriefingItem,
} from "./types";

import { lintBriefingStyle, type StyleLintResult } from "./company-briefing-style-lint";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface QAGateOptions {
  /** Force dry-run mode: never send, record would-have status. */
  dryRun?: boolean;
  /** If true, auto-revisions are attempted for fixable warnings. */
  autoRevise?: boolean;
}

export interface QAGateResult {
  report: CompanyBriefingQAReport;
  dryRunMetadata?: DryRunMetadata;
}

/**
 * Run pre-send QA gates on a company briefing.
 *
 * Takes the evidence packet and generation output, runs all checks,
 * and returns a QA report with a final decision.
 */
export function runQAGates(
  packet: CompanyBriefingEvidencePacket,
  output: CompanyBriefingGenerationOutput,
  options: QAGateOptions = {},
): QAGateResult {
  const { dryRun = false } = options;
  const now = new Date().toISOString();

  const blockingFailures: QAFailure[] = [];
  const warnings: QAFailure[] = [];
  const autoRevisions: QARevision[] = [];

  // --- 1. Schema validation ---
  const schemaChecks = checkSchemas(packet, output);
  for (const sc of schemaChecks) {
    if (!sc.valid) {
      for (const err of sc.errors) {
        blockingFailures.push({
          code: "SCHEMA_INVALID",
          severity: "blocking",
          message: `${sc.target} schema error: ${err}`,
        });
      }
    }
  }

  // --- 2. Source/evidence checks ---
  const sourceChecks = checkSources(packet, output);
  for (const sc of sourceChecks) {
    if (sc.result === "block") {
      blockingFailures.push({
        code: sc.blocked_source_used ? "BLOCKED_SOURCE_USED" :
              sc.seo_sludge_used ? "SEO_SLUDGE_USED" :
              !sc.email_safe_anchor ? "NO_AB_ANCHOR" : "SOURCE_CHECK_FAILED",
        severity: "blocking",
        item_id: sc.item_id,
        message: `Source check failed for item ${sc.item_id}: ` +
          (sc.blocked_source_used ? "Block-grade source used in email evidence" :
           sc.seo_sludge_used ? "SEO sludge source used in email evidence" :
           !sc.email_safe_anchor ? `Anchor source grade ${sc.anchor_grade} is not email-safe (need A/B)` :
           "Source check failed"),
      });
    } else if (sc.result === "warn") {
      warnings.push({
        code: "SOURCE_WARNING",
        severity: "warning",
        item_id: sc.item_id,
        message: `Source warning for item ${sc.item_id}: anchor grade is ${sc.anchor_grade}`,
      });
    }
  }

  // --- 3. Claim/grounding checks ---
  const claimChecks = checkClaims(packet, output);
  for (const cc of claimChecks) {
    if (cc.result === "block") {
      blockingFailures.push({
        code: cc.contradiction_found ? "CLAIM_CONTRADICTION" :
              !cc.supported ? "UNSUPPORTED_CLAIM" :
              (cc.attribution_required && !cc.attribution_present) ? "MISSING_ATTRIBUTION" :
              (cc.uncertainty_required && !cc.uncertainty_present) ? "MISSING_UNCERTAINTY" :
              "CLAIM_CHECK_FAILED",
        severity: "blocking",
        generated_text_path: cc.generated_text_path,
        message: `Claim check failed: "${cc.draft_claim.slice(0, 80)}..." — ` +
          (!cc.supported ? "no packet claim support" :
           cc.contradiction_found ? "contradicts packet facts" :
           (cc.attribution_required && !cc.attribution_present) ? "attribution required but missing" :
           (cc.uncertainty_required && !cc.uncertainty_present) ? "mandatory uncertainty note missing" :
           "claim check failed"),
      });
    } else if (cc.result === "warn") {
      warnings.push({
        code: "CLAIM_WARNING",
        severity: "warning",
        generated_text_path: cc.generated_text_path,
        message: `Claim warning: "${cc.draft_claim.slice(0, 60)}..."`,
      });
    }
  }

  // --- 4. Relevance checks ---
  const relevanceChecks = checkRelevance(packet, output);
  for (const rc of relevanceChecks) {
    if (rc.result === "block") {
      blockingFailures.push({
        code: rc.weak_match_detected ? "WEAK_MATCH_PROMOTED" :
              !rc.why_it_matters_supported ? "UNSUPPORTED_WHY_IT_MATTERS" :
              !rc.scan_area_supported ? "NO_SCAN_AREA_MATCH" :
              rc.decision !== "email" ? "DASHBOARD_ITEM_PROMOTED" :
              "RELEVANCE_CHECK_FAILED",
        severity: "blocking",
        item_id: rc.item_id,
        message: `Relevance check failed for item ${rc.item_id}: ${rc.reason}`,
      });
    } else if (rc.result === "warn") {
      warnings.push({
        code: "RELEVANCE_WARNING",
        severity: "warning",
        item_id: rc.item_id,
        message: `Relevance warning for item ${rc.item_id}: ${rc.reason}`,
      });
    }
  }

  // --- 5. Duplicate checks ---
  const duplicateChecks = checkDuplicates(output);
  for (const dc of duplicateChecks) {
    if (dc.result === "block") {
      blockingFailures.push({
        code: "DUPLICATE_EVENT",
        severity: "blocking",
        message: `Duplicate event detected: cluster IDs ${dc.cluster_ids.join(", ")}`,
      });
    } else if (dc.result === "warn") {
      warnings.push({
        code: "DUPLICATE_WARNING",
        severity: "warning",
        message: `Possible duplicate: cluster IDs ${dc.cluster_ids.join(", ")}`,
      });
    }
  }

  // --- 6. Perception Gap checks ---
  const pgChecks = checkPerceptionGap(packet, output);
  for (const pg of pgChecks) {
    if (pg.result === "block") {
      blockingFailures.push({
        code: !pg.eligible_in_packet ? "PG_NOT_ELIGIBLE" :
              !pg.supported ? "PG_UNSUPPORTED" :
              !pg.neutral_wording ? "PG_NOT_NEUTRAL" :
              "PG_CHECK_FAILED",
        severity: "blocking",
        item_id: pg.item_id,
        message: `Perception Gap check failed for item ${pg.item_id}: ${pg.reason ?? "check failed"}`,
      });
    } else if (pg.result === "warn") {
      warnings.push({
        code: "PG_WARNING",
        severity: "warning",
        item_id: pg.item_id,
        message: `Perception Gap warning for item ${pg.item_id}: ${pg.reason ?? "thin evidence"}`,
      });
    }
  }

  // --- 7. Style checks ---
  const styleLintResult = lintBriefingStyle(output);
  const styleCheck: QAStyleCheck = {
    calm_tone: styleLintResult.calm_tone,
    no_hype: styleLintResult.no_hype,
    concise: styleLintResult.concise,
    prohibited_language_found: styleLintResult.prohibited_language_found,
    reading_load_ok: styleLintResult.reading_load_ok,
    repeated_phrasing: styleLintResult.repeated_phrasing,
    result: styleLintResult.result,
  };

  for (const issue of styleLintResult.issues) {
    if (issue.severity === "blocking") {
      blockingFailures.push({
        code: issue.code,
        severity: "blocking",
        generated_text_path: issue.location,
        message: issue.message,
        suggested_fix: issue.suggested_fix,
      });
    } else {
      warnings.push({
        code: issue.code,
        severity: "warning",
        generated_text_path: issue.location,
        message: issue.message,
        suggested_fix: issue.suggested_fix,
      });
    }
  }

  // --- 8. Policy checks ---
  const policyChecks = checkPolicies(packet, output);
  for (const pc of policyChecks) {
    if (pc.result === "block") {
      blockingFailures.push({
        code: `POLICY_${pc.policy.toUpperCase()}`,
        severity: "blocking",
        message: pc.detail ?? `Policy check failed: ${pc.policy}`,
      });
    } else if (pc.result === "warn") {
      warnings.push({
        code: `POLICY_${pc.policy.toUpperCase()}`,
        severity: "warning",
        message: pc.detail ?? `Policy warning: ${pc.policy}`,
      });
    }
  }

  // --- 9. Decide final status ---
  let status: QAStatus;
  let finalReason: string;

  if (dryRun) {
    status = "dry_run_only";
    finalReason = blockingFailures.length > 0
      ? `Dry-run: would hold — ${blockingFailures.length} blocking failure(s).`
      : warnings.length > 0
        ? `Dry-run: would send with ${warnings.length} warning(s).`
        : "Dry-run: would send — all QA gates passed.";
  } else if (blockingFailures.length > 0) {
    // Check if it's a manual-review case or hard hold.
    // These are blocking failures, but a human editor can usually fix them
    // without rerunning the scan. Hard evidence failures still go to hold.
    const manualReviewCodes = new Set([
      "MISSING_ATTRIBUTION",
      "MISSING_UNCERTAINTY",
      "PG_NOT_NEUTRAL",
      "PG_CHECK_FAILED",
      "POLICY_MAX_EMAIL_ITEMS",
      "POLICY_MAX_WORDS_PER_ITEM",
    ]);
    const allBlockersAreReviewable = blockingFailures.every(
      (f) => manualReviewCodes.has(f.code),
    );
    if (allBlockersAreReviewable && blockingFailures.length <= 2) {
      status = "manual_review";
      finalReason = `Manual review needed: ${blockingFailures.map((f) => f.code).join(", ")}`;
    } else {
      status = "hold";
      finalReason = `Held: ${blockingFailures.length} blocking failure(s). First: ${blockingFailures[0].message}`;
    }
  } else if (getGeneratedItemCount(output) === 0) {
    status = "dashboard_only";
    finalReason = "No email-safe items generated. Dashboard-only briefing.";
  } else {
    status = "send";
    finalReason = warnings.length > 0
      ? `Send with ${warnings.length} warning(s) recorded.`
      : "All pre-send QA gates passed.";
  }

  // --- Build report ---
  const report: CompanyBriefingQAReport = {
    qa_report_version: "company_briefing_qa_v1",
    run_id: packet.run_id,
    company_id: packet.company.company_id,
    checked_at: now,
    status,
    input_counts: {
      raw_articles: packet.input_summary.raw_articles_count,
      normalized_articles: packet.input_summary.normalized_articles_count,
      candidate_clusters: packet.input_summary.candidate_clusters_count,
      email_items_in_packet: packet.email_items.length,
      generated_email_items: getGeneratedItemCount(output),
      dashboard_only_items: packet.dashboard_only_items.length,
      excluded_items: packet.input_summary.excluded_count,
    },
    filters: {
      blocked_sources: (packet.excluded_summary.counts_by_reason?.source_blocked ?? 0),
      seo_sludge: (packet.excluded_summary.counts_by_reason?.seo_sludge ?? 0),
      duplicates: (packet.excluded_summary.counts_by_reason?.duplicate ?? 0),
      weak_matches: (packet.excluded_summary.counts_by_reason?.weak_match ?? 0),
      prompt_injection: (packet.excluded_summary.counts_by_reason?.prompt_injection ?? 0),
      stale: (packet.excluded_summary.counts_by_reason?.stale ?? 0),
    },
    schema_checks: schemaChecks,
    source_checks: sourceChecks,
    claim_checks: claimChecks,
    relevance_checks: relevanceChecks,
    duplicate_checks: duplicateChecks,
    perception_gap_checks: pgChecks,
    style_checks: styleCheck,
    policy_checks: policyChecks,
    blocking_failures: blockingFailures,
    warnings,
    auto_revisions: autoRevisions,
    final_decision_reason: finalReason,
  };

  const result: QAGateResult = { report };

  if (dryRun) {
    result.dryRunMetadata = {
      dry_run: true,
      would_have_sent: blockingFailures.length === 0 && getGeneratedItemCount(output) > 0,
      would_have_status: blockingFailures.length > 0 ? "hold" :
        getGeneratedItemCount(output) === 0 ? "dashboard_only" : "send",
      external_delivery_suppressed: true,
    };
  }

  return result;
}

// ---------------------------------------------------------------------------
// 1. Schema checks
// ---------------------------------------------------------------------------

function checkSchemas(
  packet: CompanyBriefingEvidencePacket,
  output: CompanyBriefingGenerationOutput,
): QASchemaCheck[] {
  const checks: QASchemaCheck[] = [];

  // Packet schema
  const packetErrors: string[] = [];
  if (packet.packet_version !== "company_briefing_evidence_v1") {
    packetErrors.push(`Invalid packet_version: ${packet.packet_version}`);
  }
  if (!packet.run_id) packetErrors.push("Missing run_id");
  if (!packet.company?.company_id) packetErrors.push("Missing company.company_id");
  if (packet.pipeline?.generation_route !== "internal_openclaw_cron") {
    packetErrors.push(`Invalid generation_route: ${packet.pipeline?.generation_route}`);
  }
  if (!Array.isArray(packet.email_items)) packetErrors.push("email_items is not an array");
  // Validate dashboard items have correct flag
  for (const di of packet.dashboard_only_items) {
    if (di.allowed_in_email_generation !== false) {
      packetErrors.push(`Dashboard item ${di.cluster_id} has allowed_in_email_generation !== false`);
    }
  }
  checks.push({ target: "packet", valid: packetErrors.length === 0, errors: packetErrors });

  // Output schema
  const outputErrors: string[] = [];
  if (output.output_version !== "company_briefing_generation_v1") {
    outputErrors.push(`Invalid output_version: ${output.output_version}`);
  }
  if (output.run_id !== packet.run_id) {
    outputErrors.push(`run_id mismatch: output=${output.run_id}, packet=${packet.run_id}`);
  }
  if (output.company_id !== packet.company.company_id) {
    outputErrors.push(`company_id mismatch: output=${output.company_id}, packet=${packet.company.company_id}`);
  }
  if (output.source_packet_version !== "company_briefing_evidence_v1") {
    outputErrors.push(`Invalid source_packet_version: ${output.source_packet_version}`);
  }
  if (output.trace?.generator_route !== "internal_openclaw_cron") {
    outputErrors.push(`Invalid generator_route in trace: ${output.trace?.generator_route}`);
  }
  if (!output.today_brief) outputErrors.push("Missing today_brief");
  if (!output.main_briefing) outputErrors.push("Missing main_briefing");
  if (!output.perception_gap) outputErrors.push("Missing perception_gap");
  if (!output.useful_observations) outputErrors.push("Missing useful_observations");
  if (!output.source_notes) outputErrors.push("Missing source_notes");

  // Trace integrity
  if (output.trace?.dashboard_items_used_in_email?.length > 0) {
    outputErrors.push("Dashboard items used in email generation");
  }
  if (output.trace?.excluded_items_used_in_email?.length > 0) {
    outputErrors.push("Excluded items used in email generation");
  }
  checks.push({ target: "generation_output", valid: outputErrors.length === 0, errors: outputErrors });

  return checks;
}

// ---------------------------------------------------------------------------
// 2. Source checks
// ---------------------------------------------------------------------------

function checkSources(
  packet: CompanyBriefingEvidencePacket,
  output: CompanyBriefingGenerationOutput,
): QASourceCheck[] {
  const checks: QASourceCheck[] = [];
  const generatedItems = getAllGeneratedItems(output);

  for (const genItem of generatedItems) {
    const packetItem = packet.email_items.find((e) => e.item_id === genItem.packet_item_id);
    if (!packetItem) {
      checks.push({
        item_id: genItem.packet_item_id,
        cluster_id: genItem.cluster_id,
        anchor_source_id: "unknown",
        anchor_grade: "Block",
        email_safe_anchor: false,
        blocked_source_used: false,
        seo_sludge_used: false,
        result: "block",
      });
      continue;
    }

    const anchor = packetItem.source_summary.anchor;
    const anchorGrade = anchor.source_grade;
    const emailSafe = anchorGrade === "A" || anchorGrade === "B";
    const allSupports = collectEvidenceSupports(packetItem);
    const blockedUsed = allSupports.some((s) => s.source_grade === "Block" || s.email_evidence_eligible === false);
    const sludgeUsed = allSupports.some((s) => (s.seo_sludge_score ?? 0) >= 60);

    let result: "pass" | "warn" | "block" = "pass";
    if (blockedUsed) result = "block";
    else if (sludgeUsed) result = "block";
    else if (!emailSafe) result = "block";
    else if (anchorGrade === "B" && packetItem.source_summary.source_mix.A === 0) result = "warn";

    checks.push({
      item_id: genItem.packet_item_id,
      cluster_id: genItem.cluster_id,
      anchor_source_id: anchor.source_id,
      anchor_grade: anchorGrade,
      email_safe_anchor: emailSafe,
      blocked_source_used: blockedUsed,
      seo_sludge_used: sludgeUsed,
      result,
    });
  }

  return checks;
}

// ---------------------------------------------------------------------------
// 3. Claim/grounding checks
// ---------------------------------------------------------------------------

function checkClaims(
  packet: CompanyBriefingEvidencePacket,
  output: CompanyBriefingGenerationOutput,
): QAClaimCheck[] {
  const checks: QAClaimCheck[] = [];
  const packetClaimIds = new Set<string>();
  const packetClaimMap = new Map<string, EvidenceEmailItem>();

  for (const item of packet.email_items) {
    for (const fact of item.facts) {
      packetClaimIds.add(fact.claim_id);
      packetClaimMap.set(fact.claim_id, item);
    }
  }

  const generatedItems = getAllGeneratedItems(output);

  for (const genItem of generatedItems) {
    if (!genItem.body.text.trim() || genItem.claim_map.length === 0) {
      checks.push({
        generated_text_path: `main_briefing.item.${genItem.generated_item_id}.body`,
        draft_claim: genItem.body.text.slice(0, 200) || "Generated item body is empty.",
        claim_ids: [],
        supported: false,
        source_ids: [],
        attribution_required: false,
        attribution_present: !!genItem.source_attribution?.text,
        uncertainty_required: false,
        uncertainty_present: !!genItem.uncertainty_line?.text,
        contradiction_found: false,
        result: "block",
      });
    }

    // Check claim_map entries
    for (const cm of genItem.claim_map) {
      const claimIdsSupported = cm.claim_ids.every((id) => packetClaimIds.has(id));
      const hasClaims = cm.claim_ids.length > 0;

      // Check if attribution is required for any referenced claim
      let attributionRequired = false;
      let uncertaintyRequired = false;

      for (const claimId of cm.claim_ids) {
        const packetItem = packetClaimMap.get(claimId);
        if (packetItem) {
          const fact = packetItem.facts.find((f) => f.claim_id === claimId);
          if (fact?.attribution_required) attributionRequired = true;
          // Check if any uncertainty note with must_mention applies
          for (const unc of packetItem.uncertainty) {
            if (unc.must_mention && unc.applies_to_claim_ids.includes(claimId)) {
              uncertaintyRequired = true;
            }
          }
        }
      }

      // Check if attribution is present (source attribution in the item)
      const attributionPresent = !!genItem.source_attribution?.text;

      // Check if uncertainty is mentioned
      const uncertaintyPresent = !!genItem.uncertainty_line?.text;

      const sourceIds = cm.support_refs
        .filter((r) => r.type === "source_id")
        .map((r) => r.id)
        .filter(Boolean);
      const hasSourceSupport = sourceIds.length > 0;

      let result: "pass" | "warn" | "block" = "pass";
      if (!hasClaims || !claimIdsSupported) result = "block";
      else if (!hasSourceSupport) result = "block";
      else if (attributionRequired && !attributionPresent) result = "block";
      else if (uncertaintyRequired && !uncertaintyPresent) result = "block";

      checks.push({
        generated_text_path: cm.generated_text_path,
        draft_claim: cm.text.slice(0, 200),
        claim_ids: cm.claim_ids,
        supported: claimIdsSupported && hasClaims && hasSourceSupport,
        source_ids: sourceIds,
        attribution_required: attributionRequired,
        attribution_present: attributionPresent,
        uncertainty_required: uncertaintyRequired,
        uncertainty_present: uncertaintyPresent,
        contradiction_found: false,
        result,
      });
    }

    const packetItem = packet.email_items.find((e) => e.item_id === genItem.packet_item_id);
    const bodySentenceCount = splitTextSentences(genItem.body.text).length;
    if (bodySentenceCount > genItem.claim_map.length) {
      checks.push({
        generated_text_path: `main_briefing.item.${genItem.generated_item_id}.body`,
        draft_claim: genItem.body.text.slice(0, 200),
        claim_ids: [],
        supported: false,
        source_ids: [],
        attribution_required: false,
        attribution_present: !!genItem.source_attribution?.text,
        uncertainty_required: false,
        uncertainty_present: !!genItem.uncertainty_line?.text,
        contradiction_found: false,
        result: "block",
      });
    }

    const mustMentionUncertainty = packetItem?.uncertainty?.some((u) => u.must_mention) ?? false;
    if (mustMentionUncertainty && !genItem.uncertainty_line?.text) {
      checks.push({
        generated_text_path: `main_briefing.item.${genItem.generated_item_id}.uncertainty_line`,
        draft_claim: "Required uncertainty note missing from generated item.",
        claim_ids: packetItem?.facts.map((f) => f.claim_id) ?? [],
        supported: true,
        source_ids: [],
        attribution_required: false,
        attribution_present: !!genItem.source_attribution?.text,
        uncertainty_required: true,
        uncertainty_present: false,
        contradiction_found: false,
        result: "block",
      });
    }
  }

  return checks;
}

// ---------------------------------------------------------------------------
// 4. Relevance checks
// ---------------------------------------------------------------------------

function checkRelevance(
  packet: CompanyBriefingEvidencePacket,
  output: CompanyBriefingGenerationOutput,
): QARelevanceCheck[] {
  const checks: QARelevanceCheck[] = [];
  const generatedItems = getAllGeneratedItems(output);
  const packetItemIds = new Set(packet.email_items.map((e) => e.item_id));
  const dashboardItemIds = new Set(packet.dashboard_only_items.map((d) => d.cluster_id));

  for (const genItem of generatedItems) {
    // Check item exists in packet email_items
    if (!packetItemIds.has(genItem.packet_item_id)) {
      // Check if it's a promoted dashboard item
      if (dashboardItemIds.has(genItem.cluster_id)) {
        checks.push({
          item_id: genItem.packet_item_id,
          cluster_id: genItem.cluster_id,
          score: 0,
          decision: "dashboard_only",
          why_it_matters_supported: false,
          scan_area_supported: false,
          weak_match_detected: false,
          result: "block",
          reason: "Dashboard-only item promoted to email",
        });
        continue;
      }
      checks.push({
        item_id: genItem.packet_item_id,
        cluster_id: genItem.cluster_id,
        score: 0,
        decision: "exclude",
        why_it_matters_supported: false,
        scan_area_supported: false,
        weak_match_detected: false,
        result: "block",
        reason: "Generated item not found in packet email_items",
      });
      continue;
    }

    const packetItem = packet.email_items.find((e) => e.item_id === genItem.packet_item_id)!;
    const hasWhy = !!packetItem.why_it_matters?.text;
    const hasSupport = packetItem.why_it_matters?.supported_by?.length > 0;
    const hasScanArea = packetItem.section_ids.length > 0;

    // Check why_it_matters has both evidence and company support
    const supportRefs = packetItem.why_it_matters?.supported_by ?? [];
    const hasClaimSupport = supportRefs.some((r) => r.type === "claim_id");
    const hasScanAreaSupport = supportRefs.some((r) => r.type === "scan_area");

    let result: "pass" | "warn" | "block" = "pass";
    let reason = "Relevance checks passed";

    if (!hasWhy || !hasSupport) {
      result = "block";
      reason = "why_it_matters lacks evidence support";
    } else if (!hasClaimSupport || !hasScanAreaSupport) {
      result = "warn";
      reason = "why_it_matters support could be stronger (missing claim or scan area ref)";
    }

    checks.push({
      item_id: genItem.packet_item_id,
      cluster_id: genItem.cluster_id,
      score: packetItem.decision.relevance_score,
      decision: "email",
      why_it_matters_supported: hasWhy && hasSupport,
      scan_area_supported: hasScanArea,
      weak_match_detected: false,
      result,
      reason,
    });
  }

  return checks;
}

// ---------------------------------------------------------------------------
// 5. Duplicate checks
// ---------------------------------------------------------------------------

function checkDuplicates(output: CompanyBriefingGenerationOutput): QADuplicateCheck[] {
  const checks: QADuplicateCheck[] = [];
  const items = getAllGeneratedItems(output);

  // Check for same cluster_id appearing multiple times
  const clusterIdCounts = new Map<string, string[]>();
  for (const item of items) {
    const existing = clusterIdCounts.get(item.cluster_id) ?? [];
    existing.push(item.generated_item_id);
    clusterIdCounts.set(item.cluster_id, existing);
  }

  for (const [clusterId, itemIds] of clusterIdCounts) {
    if (itemIds.length > 1) {
      checks.push({
        generated_item_ids: itemIds,
        cluster_ids: [clusterId],
        duplicate_event_detected: true,
        result: "block",
        action: "manual_review",
      });
    }
  }

  // If no duplicates found, add a passing check
  if (checks.length === 0) {
    const allItemIds = items.map((i) => i.generated_item_id);
    const allClusterIds = [...new Set(items.map((i) => i.cluster_id))];
    checks.push({
      generated_item_ids: allItemIds,
      cluster_ids: allClusterIds,
      duplicate_event_detected: false,
      result: "pass",
    });
  }

  return checks;
}

// ---------------------------------------------------------------------------
// 6. Perception Gap checks
// ---------------------------------------------------------------------------

function checkPerceptionGap(
  packet: CompanyBriefingEvidencePacket,
  output: CompanyBriefingGenerationOutput,
): QAPerceptionGapCheck[] {
  const checks: QAPerceptionGapCheck[] = [];

  for (const pgNote of output.perception_gap.notes) {
    const packetItem = packet.email_items.find((e) => e.item_id === pgNote.packet_item_id);

    if (!packetItem) {
      checks.push({
        item_id: pgNote.packet_item_id,
        note_shown: true,
        eligible_in_packet: false,
        frame_count: 0,
        credible_frame_count: 0,
        neutral_wording: true,
        supported: false,
        result: "block",
        reason: "PG note shown for non-existent packet item",
      });
      continue;
    }

    const pg = packetItem.perception_gap;
    const eligible = pg?.eligible && pg?.show_recommendation === "show";
    const frameCount = pg?.frames?.length ?? 0;
    const credibleFrameCount = pg?.frames?.filter((f) =>
      f.source_grade === "A" || f.source_grade === "B",
    ).length ?? 0;

    // Check neutral wording: no accusatory patterns
    const noteText = pgNote.note.text.toLowerCase();
    const accusatoryPatterns = [
      /\bignored\b/,
      /\bcensored\b/,
      /\bhiding\b/,
      /\brefused?\s+to\s+(report|cover)\b/,
      /\bwestern\s+media\b.*\b(wrong|bias|ignore|miss)\b/,
      /\bmainstream\s+media\b.*\b(fail|wrong|miss|ignore)\b/,
    ];
    const neutralWording = !accusatoryPatterns.some((p) => p.test(noteText));

    let result: "pass" | "warn" | "block" = "pass";
    let reason: string | undefined;

    if (!eligible) {
      result = "block";
      reason = "PG note shown without eligible evidence in packet";
    } else if (frameCount < 2) {
      result = "warn";
      reason = "PG evidence thin: fewer than 2 frames";
    } else if (credibleFrameCount < 1) {
      result = "warn";
      reason = "PG frames lack A/B-grade source support";
    } else if (!neutralWording) {
      result = "block";
      reason = "PG note contains accusatory or non-neutral wording";
    }

    checks.push({
      item_id: pgNote.packet_item_id,
      note_shown: true,
      eligible_in_packet: !!eligible,
      frame_count: frameCount,
      credible_frame_count: credibleFrameCount,
      neutral_wording: neutralWording,
      supported: !!eligible && frameCount >= 2,
      result,
      reason,
    });
  }

  // Check items that have PG notes in packet but no note in output (acceptable — skip is OK)
  // No action needed: skipping is fine.

  return checks;
}

// ---------------------------------------------------------------------------
// 7. Policy checks
// ---------------------------------------------------------------------------

function checkPolicies(
  packet: CompanyBriefingEvidencePacket,
  output: CompanyBriefingGenerationOutput,
): QAPolicyCheck[] {
  const checks: QAPolicyCheck[] = [];
  const policy = packet.briefing_policy;

  // Max email items
  const generatedItemCount = getGeneratedItemCount(output);
  const maxItems = policy.max_email_items ?? 8;
  checks.push({
    policy: "max_email_items",
    passed: generatedItemCount <= maxItems,
    result: generatedItemCount <= maxItems ? "pass" : "block",
    detail: generatedItemCount > maxItems
      ? `Generated ${generatedItemCount} items, max is ${maxItems}`
      : undefined,
  });

  // Generation route
  checks.push({
    policy: "internal_openclaw_cron_generation",
    passed: output.trace.generator_route === "internal_openclaw_cron",
    result: output.trace.generator_route === "internal_openclaw_cron" ? "pass" : "block",
    detail: output.trace.generator_route !== "internal_openclaw_cron"
      ? `Wrong generation route: ${output.trace.generator_route}`
      : undefined,
  });

  // Total word count (if policy sets a limit)
  if (policy.max_words_total) {
    const totalWords = estimateTotalWords(output);
    const withinLimit = totalWords <= policy.max_words_total;
    checks.push({
      policy: "max_words_total",
      passed: withinLimit,
      result: withinLimit ? "pass" : totalWords <= policy.max_words_total * 1.2 ? "warn" : "block",
      detail: !withinLimit
        ? `Total words: ${totalWords}, limit: ${policy.max_words_total}`
        : undefined,
    });
  }

  // No-send is allowed
  checks.push({
    policy: "allow_no_send",
    passed: true,
    result: "pass",
  });

  return checks;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function collectEvidenceSupports(item: EvidenceEmailItem): EvidenceArticleSupport[] {
  const supports = new Map<string, EvidenceArticleSupport>();
  const add = (support: EvidenceArticleSupport) => supports.set(`${support.article_id}:${support.source_id}`, support);
  add(item.source_summary.anchor);
  for (const support of item.source_summary.supporting) add(support);
  for (const fact of item.facts) {
    for (const support of fact.supported_by) add(support);
  }
  return [...supports.values()];
}

function splitTextSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function getAllGeneratedItems(output: CompanyBriefingGenerationOutput): GeneratedBriefingItem[] {
  return output.main_briefing.sections.flatMap((s) => s.items);
}

function getGeneratedItemCount(output: CompanyBriefingGenerationOutput): number {
  return getAllGeneratedItems(output).length;
}

function estimateTotalWords(output: CompanyBriefingGenerationOutput): number {
  let total = 0;
  const count = (t: string) => t.split(/\s+/).filter((w) => w.length > 0).length;

  total += count(output.today_brief.top_line.text);
  for (const b of output.today_brief.bullets) total += count(b.text);

  for (const section of output.main_briefing.sections) {
    for (const item of section.items) {
      total += count(item.title.text);
      total += count(item.body.text);
      if (item.why_it_matters?.text) total += count(item.why_it_matters.text);
      if (item.uncertainty_line?.text) total += count(item.uncertainty_line.text);
      if (item.perception_gap_note?.text) total += count(item.perception_gap_note.text);
    }
  }

  for (const note of output.perception_gap.notes) {
    total += count(note.note.text);
  }

  for (const obs of output.useful_observations.observations) {
    total += count(obs.text);
  }

  return total;
}
