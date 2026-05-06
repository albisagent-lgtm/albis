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
  GeneratedText,
  CompanyBriefingEditorPass,
} from "./types";

import { lintBriefingStyle } from "./company-briefing-style-lint";
import { runHumanVoiceQa } from "../understanding/voice-qa";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface QAGateOptions {
  /** Force dry-run mode: never send, record would-have status. */
  dryRun?: boolean;
  /** If true, auto-revisions are attempted for fixable warnings. */
  autoRevise?: boolean;
  /** Optional Package 9.3B editor audit. QA runs after the editor. */
  editorPass?: CompanyBriefingEditorPass;
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
  const { dryRun = false, editorPass } = options;
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
        code: sc.blocked_source_used
          ? "BLOCKED_SOURCE_USED"
          : sc.seo_sludge_used
            ? "SEO_SLUDGE_USED"
            : !sc.email_safe_anchor
              ? "NO_AB_ANCHOR"
              : "SOURCE_CHECK_FAILED",
        severity: "blocking",
        item_id: sc.item_id,
        message:
          `Source check failed for item ${sc.item_id}: ` +
          (sc.blocked_source_used
            ? "Block-grade source used in email evidence"
            : sc.seo_sludge_used
              ? "SEO sludge source used in email evidence"
              : !sc.email_safe_anchor
                ? `Anchor source grade ${sc.anchor_grade} is not email-safe (need A/B)`
                : "Source check failed"),
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
        code: cc.contradiction_found
          ? "CLAIM_CONTRADICTION"
          : !cc.supported
            ? "UNSUPPORTED_CLAIM"
            : cc.attribution_required && !cc.attribution_present
              ? "MISSING_ATTRIBUTION"
              : cc.uncertainty_required && !cc.uncertainty_present
                ? "MISSING_UNCERTAINTY"
                : "CLAIM_CHECK_FAILED",
        severity: "blocking",
        generated_text_path: cc.generated_text_path,
        message:
          `Claim check failed: "${cc.draft_claim.slice(0, 80)}..." — ` +
          (!cc.supported
            ? "no packet claim support"
            : cc.contradiction_found
              ? "contradicts packet facts"
              : cc.attribution_required && !cc.attribution_present
                ? "attribution required but missing"
                : cc.uncertainty_required && !cc.uncertainty_present
                  ? "mandatory uncertainty note missing"
                  : "claim check failed"),
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
        code: rc.weak_match_detected
          ? "WEAK_MATCH_PROMOTED"
          : !rc.why_it_matters_supported
            ? "UNSUPPORTED_WHY_IT_MATTERS"
            : !rc.scan_area_supported
              ? "NO_SCAN_AREA_MATCH"
              : rc.decision !== "email"
                ? "DASHBOARD_ITEM_PROMOTED"
                : "RELEVANCE_CHECK_FAILED",
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
        code: !pg.eligible_in_packet
          ? "PG_NOT_ELIGIBLE"
          : !pg.supported
            ? "PG_UNSUPPORTED"
            : !pg.neutral_wording
              ? "PG_NOT_NEUTRAL"
              : "PG_CHECK_FAILED",
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

  // --- 8.5. Package 9.2 depth checks ---
  const depthFailures = checkDepthRequirements(packet, output);
  for (const failure of depthFailures) {
    if (failure.severity === "blocking") blockingFailures.push(failure);
    else warnings.push(failure);
  }

  // --- 8.6. Package 9.3A editorial/usefulness checks ---
  const editorialFailures = checkEditorialRequirements(packet, output);
  const voiceFailures = checkHumanVoiceRequirements(output);
  for (const failure of voiceFailures) {
    if (failure.severity === "blocking") blockingFailures.push(failure);
    else warnings.push(failure);
  }
  for (const failure of editorialFailures) {
    if (failure.severity === "blocking") blockingFailures.push(failure);
    else warnings.push(failure);
  }

  // --- 8.7. Package 9.3B editor-pass safety checks ---
  const editorFailures = checkEditorPass(editorPass);
  for (const failure of editorFailures) {
    if (failure.severity === "blocking") blockingFailures.push(failure);
    else warnings.push(failure);
  }

  // --- 8.8. Package 9.3 confidence/evidence-language checks ---
  const confidenceFailures = checkConfidenceLanguage(output);
  for (const failure of confidenceFailures) {
    if (failure.severity === "blocking") blockingFailures.push(failure);
    else warnings.push(failure);
  }

  // --- 8.9. Package 10 company-specific retrieval provenance checks ---
  const retrievalFailures = checkCompanySpecificRetrieval(packet);
  for (const failure of retrievalFailures) {
    if (failure.severity === "blocking") blockingFailures.push(failure);
    else warnings.push(failure);
  }

  // --- 8.10. Package 10C scanner-report breadth / anti-compression checks ---
  const scannerReportFailures = checkScannerReportLayout(packet, output);
  for (const failure of scannerReportFailures) {
    if (failure.severity === "blocking") blockingFailures.push(failure);
    else warnings.push(failure);
  }

  // --- 8.11. V1 launch gold-standard checks ---
  const goldStandardFailures = checkCompanyDailyScanV1GoldStandard(output);
  for (const failure of goldStandardFailures) {
    if (failure.severity === "blocking") blockingFailures.push(failure);
    else warnings.push(failure);
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
    finalReason =
      blockingFailures.length > 0
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
    const allBlockersAreReviewable = blockingFailures.every((f) =>
      manualReviewCodes.has(f.code),
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
    finalReason =
      warnings.length > 0
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
      blocked_sources:
        packet.excluded_summary.counts_by_reason?.source_blocked ?? 0,
      seo_sludge: packet.excluded_summary.counts_by_reason?.seo_sludge ?? 0,
      duplicates: packet.excluded_summary.counts_by_reason?.duplicate ?? 0,
      weak_matches: packet.excluded_summary.counts_by_reason?.weak_match ?? 0,
      prompt_injection:
        packet.excluded_summary.counts_by_reason?.prompt_injection ?? 0,
      stale: packet.excluded_summary.counts_by_reason?.stale ?? 0,
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
      would_have_sent:
        blockingFailures.length === 0 && getGeneratedItemCount(output) > 0,
      would_have_status:
        blockingFailures.length > 0
          ? "hold"
          : getGeneratedItemCount(output) === 0
            ? "dashboard_only"
            : "send",
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
  if (!packet.company?.company_id)
    packetErrors.push("Missing company.company_id");
  if (packet.pipeline?.generation_route !== "internal_openclaw_cron") {
    packetErrors.push(
      `Invalid generation_route: ${packet.pipeline?.generation_route}`,
    );
  }
  if (!Array.isArray(packet.email_items))
    packetErrors.push("email_items is not an array");
  // Validate dashboard items have correct flag
  for (const di of packet.dashboard_only_items) {
    if (di.allowed_in_email_generation !== false) {
      packetErrors.push(
        `Dashboard item ${di.cluster_id} has allowed_in_email_generation !== false`,
      );
    }
  }
  checks.push({
    target: "packet",
    valid: packetErrors.length === 0,
    errors: packetErrors,
  });

  // Output schema
  const outputErrors: string[] = [];
  if (output.output_version !== "company_briefing_generation_v1") {
    outputErrors.push(`Invalid output_version: ${output.output_version}`);
  }
  if (output.run_id !== packet.run_id) {
    outputErrors.push(
      `run_id mismatch: output=${output.run_id}, packet=${packet.run_id}`,
    );
  }
  if (output.company_id !== packet.company.company_id) {
    outputErrors.push(
      `company_id mismatch: output=${output.company_id}, packet=${packet.company.company_id}`,
    );
  }
  if (output.source_packet_version !== "company_briefing_evidence_v1") {
    outputErrors.push(
      `Invalid source_packet_version: ${output.source_packet_version}`,
    );
  }
  if (output.trace?.generator_route !== "internal_openclaw_cron") {
    outputErrors.push(
      `Invalid generator_route in trace: ${output.trace?.generator_route}`,
    );
  }
  if (!output.today_brief) outputErrors.push("Missing today_brief");
  if (!output.main_briefing) outputErrors.push("Missing main_briefing");
  if (!output.perception_gap) outputErrors.push("Missing perception_gap");
  if (!output.useful_observations)
    outputErrors.push("Missing useful_observations");
  if (!output.source_notes) outputErrors.push("Missing source_notes");

  // Trace integrity
  if (output.trace?.dashboard_items_used_in_email?.length > 0) {
    outputErrors.push("Dashboard items used in email generation");
  }
  if (output.trace?.excluded_items_used_in_email?.length > 0) {
    outputErrors.push("Excluded items used in email generation");
  }
  checks.push({
    target: "generation_output",
    valid: outputErrors.length === 0,
    errors: outputErrors,
  });

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
    const packetItem = packet.email_items.find(
      (e) => e.item_id === genItem.packet_item_id,
    );
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
    const blockedUsed = allSupports.some(
      (s) => s.source_grade === "Block" || s.email_evidence_eligible === false,
    );
    const sludgeUsed = allSupports.some((s) => (s.seo_sludge_score ?? 0) >= 60);

    let result: "pass" | "warn" | "block" = "pass";
    if (blockedUsed) result = "block";
    else if (sludgeUsed) result = "block";
    else if (!emailSafe) result = "block";
    else if (
      anchorGrade === "B" &&
      packetItem.source_summary.source_mix.A === 0
    )
      result = "warn";

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
        draft_claim:
          genItem.body.text.slice(0, 200) || "Generated item body is empty.",
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
      const claimIdsSupported = cm.claim_ids.every((id) =>
        packetClaimIds.has(id),
      );
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
            if (
              unc.must_mention &&
              unc.applies_to_claim_ids.includes(claimId)
            ) {
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

    const packetItem = packet.email_items.find(
      (e) => e.item_id === genItem.packet_item_id,
    );
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

    const mustMentionUncertainty =
      packetItem?.uncertainty?.some((u) => u.must_mention) ?? false;
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
  const dashboardItemIds = new Set(
    packet.dashboard_only_items.map((d) => d.cluster_id),
  );

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

    const packetItem = packet.email_items.find(
      (e) => e.item_id === genItem.packet_item_id,
    )!;
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
      reason =
        "why_it_matters support could be stronger (missing claim or scan area ref)";
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

function checkDuplicates(
  output: CompanyBriefingGenerationOutput,
): QADuplicateCheck[] {
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
    const packetItem = packet.email_items.find(
      (e) => e.item_id === pgNote.packet_item_id,
    );

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
    const credibleFrameCount =
      pg?.frames?.filter(
        (f) => f.source_grade === "A" || f.source_grade === "B",
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
  const maxItems = policy.max_email_items ?? 30;
  checks.push({
    policy: "max_email_items",
    passed: generatedItemCount <= maxItems,
    result: generatedItemCount <= maxItems ? "pass" : "block",
    detail:
      generatedItemCount > maxItems
        ? `Generated ${generatedItemCount} items, max is ${maxItems}`
        : undefined,
  });

  // Generation route
  checks.push({
    policy: "internal_openclaw_cron_generation",
    passed: output.trace.generator_route === "internal_openclaw_cron",
    result:
      output.trace.generator_route === "internal_openclaw_cron"
        ? "pass"
        : "block",
    detail:
      output.trace.generator_route !== "internal_openclaw_cron"
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
      result: withinLimit
        ? "pass"
        : totalWords <= policy.max_words_total * 1.2
          ? "warn"
          : "block",
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

function collectEvidenceSupports(
  item: EvidenceEmailItem,
): EvidenceArticleSupport[] {
  const supports = new Map<string, EvidenceArticleSupport>();
  const add = (support: EvidenceArticleSupport) =>
    supports.set(`${support.article_id}:${support.source_id}`, support);
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

function getAllGeneratedItems(
  output: CompanyBriefingGenerationOutput,
): GeneratedBriefingItem[] {
  return output.main_briefing.sections.flatMap((s) => s.items);
}

function getGeneratedItemCount(
  output: CompanyBriefingGenerationOutput,
): number {
  return getAllGeneratedItems(output).length;
}

function checkEditorPass(editorPass?: CompanyBriefingEditorPass): QAFailure[] {
  const failures: QAFailure[] = [];
  if (!editorPass?.enabled) return failures;

  if (editorPass.blocked) {
    failures.push({
      code: "EDITOR_BLOCKED",
      severity: "blocking",
      message:
        editorPass.blocked_reason ||
        "Package 9.3B editor pass blocked its own output.",
    });
  }

  for (const audit of editorPass.field_audits || []) {
    if (!audit.support_refs_unchanged) {
      failures.push({
        code: "EDITOR_CHANGED_SUPPORT_STRUCTURE",
        severity: "blocking",
        generated_text_path: audit.path,
        message:
          "Package 9.3B editor must not change support refs or evidence structure.",
      });
    }

    if (!audit.after_text.trim()) {
      failures.push({
        code: "EDITOR_OUTPUT_EMPTY",
        severity: "blocking",
        generated_text_path: audit.path,
        message: "Package 9.3B editor produced empty customer-facing text.",
      });
    }

    if (audit.added_numbers.length > 0) {
      failures.push({
        code: "EDITOR_ADDED_UNSUPPORTED_NUMBER",
        severity: "blocking",
        generated_text_path: audit.path,
        message: `Package 9.3B editor introduced number(s) not present in the draft field: ${audit.added_numbers.join(", ")}`,
      });
    }

    if (audit.added_entities.length > 0) {
      failures.push({
        code: "EDITOR_ADDED_UNSUPPORTED_ENTITY",
        severity: "warning",
        generated_text_path: audit.path,
        message: `Package 9.3B editor introduced possible new entity/entities: ${audit.added_entities.join(", ")}`,
      });
    }

    if (
      audit.path.includes("perception_gap") &&
      /view:|The gap:|Why it matters:/i.test(audit.before_text)
    ) {
      const labelsStillPresent =
        /view:/i.test(audit.after_text) &&
        /The gap:/i.test(audit.after_text) &&
        /Why it matters:/i.test(audit.after_text);
      if (!labelsStillPresent) {
        failures.push({
          code: "EDITOR_LABEL_FORMAT_BROKEN",
          severity: "blocking",
          generated_text_path: audit.path,
          message:
            "Package 9.3B editor broke the labelled Perception Gap format.",
        });
      }
    }
  }

  return failures;
}

function generatedTextSegments(
  output: CompanyBriefingGenerationOutput,
): Array<{ path: string; value: GeneratedText }> {
  return [
    { path: "today_brief.top_line", value: output.today_brief.top_line },
    ...output.today_brief.bullets.map((value, i) => ({
      path: `today_brief.bullets[${i}]`,
      value,
    })),
    ...output.main_briefing.sections.flatMap((section, sectionIndex) =>
      section.items.flatMap((item, itemIndex) => [
        {
          path: `main_briefing.sections[${sectionIndex}].items[${itemIndex}].title`,
          value: item.title,
        },
        {
          path: `main_briefing.sections[${sectionIndex}].items[${itemIndex}].body`,
          value: item.body,
        },
        ...(item.uncertainty_line
          ? [
              {
                path: `main_briefing.sections[${sectionIndex}].items[${itemIndex}].uncertainty_line`,
                value: item.uncertainty_line,
              },
            ]
          : []),
        ...(item.source_attribution
          ? [
              {
                path: `main_briefing.sections[${sectionIndex}].items[${itemIndex}].source_attribution`,
                value: item.source_attribution,
              },
            ]
          : []),
      ]),
    ),
    ...output.perception_gap.notes.map((note, i) => ({
      path: `perception_gap.notes[${i}].note`,
      value: note.note,
    })),
    ...output.useful_observations.observations.map((value, i) => ({
      path: `useful_observations.observations[${i}]`,
      value,
    })),
    { path: "source_notes.text", value: output.source_notes.text },
  ];
}

function confidenceLanguagePresent(text: string, kind: string): boolean {
  if (kind === "estimate_or_forecast")
    return /\b(estimate|estimated|directional|up to|forecast|reported)\b/i.test(
      text,
    );
  if (kind === "early_signal")
    return /\b(early|not proof|does not prove|rather than proof|if it repeats|later scans?)\b/i.test(
      text,
    );
  if (kind === "single_source" || kind === "reported_claim")
    return /\b(one report|one source|reported|said|cited|according to)\b/i.test(
      text,
    );
  if (kind === "regional_frame")
    return /\b(view:|frame|framed|coverage|source|gap|why it matters)\b/i.test(
      text,
    );
  if (kind === "multi_source_signal")
    return /\b(several|multiple|two reports|sources?|scan|selected evidence)\b/i.test(
      text,
    );
  return true;
}

function checkConfidenceLanguage(
  output: CompanyBriefingGenerationOutput,
): QAFailure[] {
  const failures: QAFailure[] = [];
  const segments = generatedTextSegments(output).filter(
    (segment) =>
      !segment.path.endsWith(".title") &&
      !segment.path.endsWith(".source_attribution") &&
      !segment.path.endsWith(".uncertainty_line") &&
      segment.path !== "source_notes.text",
  );

  for (const segment of segments) {
    const label = segment.value.evidence_confidence;
    if (!label) {
      failures.push({
        code: "CONFIDENCE_LABEL_MISSING",
        severity: "warning",
        generated_text_path: segment.path,
        message:
          "Package 9.3 confidence/evidence language metadata is missing from customer-facing text.",
      });
      continue;
    }

    if (!confidenceLanguagePresent(segment.value.text, label.kind)) {
      failures.push({
        code: "CONFIDENCE_LANGUAGE_MISSING",
        severity:
          label.kind === "estimate_or_forecast" || label.kind === "early_signal"
            ? "blocking"
            : "warning",
        generated_text_path: segment.path,
        message: `Package 9.3 ${label.kind} text should carry natural confidence/evidence language: ${label.customer_phrase}`,
      });
    }
  }

  return failures;
}

function checkCompanySpecificRetrieval(
  packet: CompanyBriefingEvidencePacket,
): QAFailure[] {
  const failures: QAFailure[] = [];
  const items = packet.email_items || [];
  const provenanceItems = items.filter((item) => item.retrieval_provenance);
  if (items.length === 0 || provenanceItems.length === 0) return failures;

  const companyId = packet.company.company_id;
  const broadOnlyTerms = new Set([
    "china",
    "russia",
    "iran",
    "india",
    "korea",
    "united states",
    "european union",
    "ai",
    "media",
    "policy",
    "market",
  ]);

  for (const item of items) {
    const provenance = item.retrieval_provenance;
    const path = `item:${item.item_id}.retrieval_provenance`;
    if (!provenance) {
      failures.push({
        code: "RETRIEVAL_PROVENANCE_MISSING",
        severity: "blocking",
        generated_text_path: path,
        message:
          "Company-specific briefing item is missing retrieval provenance.",
      });
      continue;
    }

    if (provenance.company_profile_id !== companyId) {
      failures.push({
        code: "RETRIEVAL_WRONG_COMPANY",
        severity: "blocking",
        generated_text_path: path,
        message:
          "Company-specific briefing item provenance points to a different company profile.",
      });
    }

    if (
      provenance.mode !== "company_specific_retrieval" &&
      provenance.mode !== "company_deep_dive_retrieval"
    ) {
      failures.push({
        code: "RETRIEVAL_MODE_NOT_COMPANY_SPECIFIC",
        severity: "blocking",
        generated_text_path: path,
        message:
          "Company-specific briefing item came from a non-company-specific retrieval mode.",
      });
    }

    if (
      (provenance.query_ids || []).length === 0 ||
      (provenance.query_labels || []).length === 0
    ) {
      failures.push({
        code: "RETRIEVAL_QUERY_TRACE_MISSING",
        severity: "blocking",
        generated_text_path: path,
        message:
          "Company-specific briefing item is missing query trace IDs/labels.",
      });
    }

    if ((provenance.matched_context_terms || []).length === 0) {
      failures.push({
        code: "RETRIEVAL_CONTEXT_MISSING",
        severity: "blocking",
        generated_text_path: path,
        message:
          "Company-specific briefing item has no matched company context terms.",
      });
    }

    const matchedQueryTerms = (provenance.matched_query_terms || []).map(
      (term) => term.toLowerCase(),
    );
    const scanAreaIds = provenance.scan_area_ids || [];
    const watchlistOnly =
      scanAreaIds.length > 0 &&
      scanAreaIds.every((id) => id === "watchlist-entities");
    if (watchlistOnly && matchedQueryTerms.length === 0) {
      failures.push({
        code: "RETRIEVAL_WATCHLIST_ANCHOR_MISSING",
        severity: "blocking",
        generated_text_path: path,
        message:
          "Watchlist-only item must match the watched entity/query term in the article text.",
      });
    }

    if (
      matchedQueryTerms.length > 0 &&
      matchedQueryTerms.every((term) => broadOnlyTerms.has(term))
    ) {
      failures.push({
        code: "RETRIEVAL_BROAD_ONLY_ANCHOR",
        severity: "warning",
        generated_text_path: path,
        message:
          "Company-specific item appears anchored only by broad terms; review for scatter/noise.",
      });
    }
  }

  const sectionCount = new Set(items.flatMap((item) => item.section_ids || []))
    .size;
  if (items.length >= 6 && sectionCount >= 6) {
    failures.push({
      code: "RETRIEVAL_SCATTER_SCORE_HIGH",
      severity: "warning",
      message:
        "Briefing has a wide spread of singleton sections; review for scattered/non-coherent company narrative.",
    });
  }

  return failures;
}

function checkScannerReportLayout(
  packet: CompanyBriefingEvidencePacket,
  output: CompanyBriefingGenerationOutput,
): QAFailure[] {
  const failures: QAFailure[] = [];
  const selectedCount = new Set(
    packet.email_items.map((item) =>
      normaliseStoryTitleForQa(
        `${item.canonical_event_name} ${item.facts[0]?.text || ""}`,
      ),
    ),
  ).size;
  const researchedEmailFindings = output.understanding?.researched_understanding_v1?.findings?.filter(
    (finding) => ["email_main", "email_secondary"].includes(finding.placement),
  ).length ?? 0;
  const generatedMainFindings = researchedEmailFindings || output.main_briefing.sections.flatMap(
    (section) => section.items,
  ).length;
  const scanner = output.scanner_report;
  const customerFacingOutput = {
    today_brief: output.today_brief,
    main_briefing: output.main_briefing,
    scanner_report: output.scanner_report,
    perception_gap: output.perception_gap,
    source_notes: output.source_notes,
  };
  const generatedText = JSON.stringify(customerFacingOutput).toLowerCase();
  const bannedInternalPhrases = [
    "datapoint was useful",
    "route access and route confidence",
    "the comparison is whether",
    "the relevance is",
    "the useful distinction is",
    "company-specific scan",
    "registered against",
    "the scan picked up",
    "picked up",
    "it belongs here",
    "belongs here because",
    "relevant because",
    "selected because",
    "matched scan area",
    "this item was selected",
    "operational exposure",
    "material implications",
    "stakeholders should monitor",
    "evolving landscape",
    "this matters because",
  ];

  if (selectedCount >= 8 && !scanner?.enabled) {
    failures.push({
      code: "SCANNER_REPORT_MISSING",
      severity: "blocking",
      message:
        "Company scan selected many findings but output did not use the Package 10C scanner-report layout.",
    });
  }

  if (scanner?.enabled) {
    const coverageRatio =
      selectedCount > 0 ? generatedMainFindings / selectedCount : 1;
    if (
      scanner.layout_version !== "company_daily_scan_v1" &&
      selectedCount >= 8 &&
      coverageRatio < 0.6
    ) {
      failures.push({
        code: "SCANNER_REPORT_OVER_COMPRESSED",
        severity: "blocking",
        message: `Scanner report selected ${selectedCount} item(s) but rendered only ${generatedMainFindings} main finding(s).`,
        suggested_fix:
          "Render useful selected findings in Main Findings instead of compressing them into a few bundled paragraphs.",
      });
    }

    if (
      scanner.layout_version !== "company_daily_scan_v1" &&
      (scanner.deeper_reads || []).length < Math.min(3, selectedCount)
    ) {
      failures.push({
        code: "SCANNER_REPORT_DEEPER_READ_MISSING",
        severity: "warning",
        message:
          "Scanner report should include up to three deeper reads for the most useful daily findings.",
      });
    }
  }

  for (const phrase of bannedInternalPhrases) {
    if (generatedText.includes(phrase)) {
      failures.push({
        code: "CUSTOMER_COPY_INTERNAL_RAIL",
        severity: "blocking",
        message: `Customer-facing copy contains internal scanner/analyst wording: "${phrase}".`,
      });
    }
  }

  return failures;
}

function checkDepthRequirements(
  packet: CompanyBriefingEvidencePacket,
  output: CompanyBriefingGenerationOutput,
): QAFailure[] {
  const failures: QAFailure[] = [];
  const items = getAllGeneratedItems(output);
  if (items.length === 0) return failures;

  const countWords = (text: string) => text.split(/\s+/).filter(Boolean).length;
  const firstSentence = (text: string) =>
    splitTextSentences(text)[0] || text.trim();
  const hasConcreteEvidenceTerm = (text: string) =>
    /\b(Hormuz|Suez|Red Sea|Bab el-Mandeb|traffic|freight|rates?|vessel|ports?|corridors?|routes?|rail|LNG|transport|disruption|estimate|report|cost|\d+\s?%|\$\d+|million|weeks?|sources?|scan|coverage|insurance)\b/i.test(
      text,
    );
  const hasMeaningLanguage = (text: string) =>
    /\b(separates?|shows?|showed|distinction|pattern|evidence|reported|report|datapoint|not proof|not yet|confidence|access|cost|risk|source|frame|coverage|practical|concrete|marker|useful|read)\b/i.test(
      text,
    );
  const hasNumber = (text: string) =>
    /(\d+\s?%|\$\d+|\d+\s?(million|billion|days|weeks|months|years)|pre-war)/i.test(
      text,
    );
  const rawCount = packet.input_summary.raw_articles_count;
  const sourceNoteText = output.source_notes?.text?.text || "";
  const sourceNoteMentionsScanDepth =
    rawCount > 0 &&
    sourceNoteText.includes(String(rawCount)) &&
    /scanned items/i.test(sourceNoteText);

  if (!sourceNoteMentionsScanDepth) {
    failures.push({
      code: "DEPTH_SOURCE_NOTE_THIN",
      severity: "warning",
      message:
        "Package 9.2 source note should state scan depth and point to the evidence/dashboard layer.",
    });
  }

  const topFirst = firstSentence(output.today_brief.top_line.text);
  if (!hasConcreteEvidenceTerm(topFirst) || !hasMeaningLanguage(topFirst)) {
    failures.push({
      code: "EDITORIAL_FIRST_SENTENCE_WEAK",
      severity: "warning",
      generated_text_path: "today_brief.top_line",
      message:
        "Package 9.3A opening sentence should carry a concrete evidence point, not warm-up wording.",
    });
  }

  // Concise sections are intentional: the customer-facing briefing should
  // present findings cleanly, not pad for length. Keep the gate only for
  // genuinely underdeveloped items.
  const thinItems = items.filter((item) => countWords(item.body.text) < 24);
  for (const item of thinItems) {
    const body = item.body.text;
    const looksMalformed =
      /(?:—|–|-|,)\s*(?:typically|usually|averaging|including|with|and|or)?\.?\s+It belongs here because/i.test(
        body,
      ) ||
      /\bThe scan picked up\s+(?:daily transits|home|read more|click here)\b/i.test(
        body,
      );
    failures.push({
      code: "DEPTH_SECTION_TOO_THIN",
      severity: looksMalformed ? "blocking" : "warning",
      generated_text_path: `item:${item.generated_item_id}.body`,
      message: `Package 9.2 section is too thin (${countWords(item.body.text)} words): ${item.title.text}`,
    });
  }

  const paragraphThinItems = items.filter(
    (item) => !item.body.text.includes("\n\n"),
  );
  for (const item of paragraphThinItems) {
    failures.push({
      code: "DEPTH_SECTION_SINGLE_PARAGRAPH",
      severity: "warning",
      generated_text_path: `item:${item.generated_item_id}.body`,
      message: `Package 9.2 section should usually include a short evidence paragraph and a short context paragraph: ${item.title.text}`,
    });
  }

  for (const item of items) {
    const opening = firstSentence(item.body.text);
    if (!hasConcreteEvidenceTerm(opening) || !hasMeaningLanguage(opening)) {
      failures.push({
        code: "EDITORIAL_ITEM_OPENING_WEAK",
        severity: "warning",
        generated_text_path: `item:${item.generated_item_id}.body`,
        message: `Package 9.3A item opening should carry the evidence point and why the item belongs: ${item.title.text}`,
      });
    }

    if (hasNumber(item.body.text) && !hasMeaningLanguage(item.body.text)) {
      failures.push({
        code: "EDITORIAL_NUMBER_UNEXPLAINED",
        severity: "warning",
        generated_text_path: `item:${item.generated_item_id}.body`,
        message: `Package 9.3A number/statistic needs an evidence-to-meaning explanation: ${item.title.text}`,
      });
    }
  }

  const observationCount =
    output.useful_observations?.observations?.length ?? 0;
  const expectedObservationCount =
    output.scanner_report?.layout_version === "company_daily_scan_v1"
      ? Math.min(2, items.length)
      : Math.min(3, items.length);
  if (observationCount < expectedObservationCount) {
    failures.push({
      code: "DEPTH_OBSERVATIONS_THIN",
      severity: "blocking",
      message: `Package 9.2 needs analyst-grade observations. Found ${observationCount}; expected at least ${expectedObservationCount}.`,
    });
  }

  const observations = output.useful_observations?.observations ?? [];
  for (let i = 0; i < observations.length; i++) {
    const text = observations[i].text;
    if (
      !hasMeaningLanguage(text) ||
      /\b(could|may|might)\s+have\s+(important|significant|material)?\s*implications\b/i.test(
        text,
      )
    ) {
      failures.push({
        code: "EDITORIAL_OBSERVATION_GENERIC",
        severity: "warning",
        generated_text_path: `useful_observations.observations[${i}]`,
        message:
          "Package 9.3A observations should be classified insight: hidden distinction, boundary, source-frame insight, quiet widening, or evidence-quality insight.",
      });
    }
  }

  const pgEligibleCount = packet.email_items.filter(
    (item) =>
      item.perception_gap?.eligible &&
      item.perception_gap.show_recommendation === "show",
  ).length;
  const pgCount = output.perception_gap?.notes?.length ?? 0;
  if (pgEligibleCount > 0 && pgCount === 0) {
    failures.push({
      code: "DEPTH_PG_MISSING",
      severity: "blocking",
      message:
        "Package 9.2 has eligible Perception Gap evidence but no Perception Gap output.",
    });
  }

  for (let i = 0; i < (output.perception_gap?.notes ?? []).length; i++) {
    const note = output.perception_gap.notes[i].note.text;
    const hasStandardLabels =
      /view:/i.test(note) &&
      /\bThe gap:/i.test(note) &&
      /\bWhy it matters:/i.test(note);
    const hasReaderRisk =
      /\b(make|makes|look|misread|miss|separates?|only see|one frame|before)\b/i.test(
        note,
      );
    const knownSector =
      /logistics|shipping|maritime|freight|port|energy|oil|gas|lng|agriculture|food|finance|bank|market|technology|software|semiconductor|telecom|ai|cyber/i.test(
        packet.company.industry || "",
      );
    const genericKnownSectorFrame =
      knownSector &&
      /\b(Operational view|Policy\/regional view|Sources differed mainly)\b/i.test(
        note,
      );
    if (!hasStandardLabels) {
      failures.push({
        code: "EDITORIAL_PG_FORMAT_WEAK",
        severity: "blocking",
        generated_text_path: `perception_gap.notes[${i}]`,
        message:
          "Package 9.3A Perception Gap must use labelled view/gap/why-it-matters format.",
      });
    } else if (genericKnownSectorFrame) {
      failures.push({
        code: "EDITORIAL_PG_SECTOR_FRAME_GENERIC",
        severity: "warning",
        generated_text_path: `perception_gap.notes[${i}]`,
        message:
          "Package 9.3 Perception Gap should use sector-adaptive frame labels for known company sectors, not generic frame language.",
      });
    } else if (!hasReaderRisk) {
      failures.push({
        code: "EDITORIAL_PG_READER_RISK_MISSING",
        severity: "warning",
        generated_text_path: `perception_gap.notes[${i}]`,
        message:
          "Package 9.3A Perception Gap should name what a reader could misread if they saw only one frame.",
      });
    }
  }

  return failures;
}

function checkHumanVoiceRequirements(
  output: CompanyBriefingGenerationOutput,
): QAFailure[] {
  const texts: string[] = [
    output.today_brief.top_line.text,
    ...output.today_brief.bullets.map((bullet) => bullet.text),
    ...output.main_briefing.sections.flatMap((section) =>
      section.items.flatMap((item) => [
        item.title.text,
        item.body.text,
        item.why_it_matters?.text,
        item.uncertainty_line?.text,
        item.perception_gap_note?.text,
      ]),
    ),
    ...output.perception_gap.notes.map((note) => note.note.text),
    ...output.useful_observations.observations.map(
      (observation) => observation.text,
    ),
    output.source_notes.text.text,
  ].filter(Boolean) as string[];

  const understanding = output.understanding as
    | { company_pgi_v2?: { email_read?: string; dashboard_read?: unknown } }
    | undefined;
  if (understanding?.company_pgi_v2?.email_read) {
    texts.push(understanding.company_pgi_v2.email_read);
  }

  return runHumanVoiceQa(texts).map(
    (issue): QAFailure => ({
      code: issue.code,
      severity: issue.severity,
      message: `Human voice QA: ${issue.message}`,
      generated_text_path: "human_voice_qa",
      suggested_fix:
        "Rewrite as a direct, specific explanation a human teammate would say out loud.",
    }),
  );
}

function checkCompanyDailyScanV1GoldStandard(
  output: CompanyBriefingGenerationOutput,
): QAFailure[] {
  const failures: QAFailure[] = [];
  if (output.scanner_report?.layout_version !== "company_daily_scan_v1") {
    return failures;
  }

  const layer = output.understanding?.researched_understanding_v1;
  if (!layer) {
    failures.push({
      code: "V1_GOLD_RESEARCH_LAYER_MISSING",
      severity: "blocking",
      message:
        "Company Daily Scan V1 requires the researched-understanding layer before customer delivery.",
    });
    return failures;
  }

  const editorialWriter = (output.understanding as any)?.gold_standard_editorial_writer_v1;
  if (!editorialWriter?.enabled) {
    failures.push({
      code: "V1_GOLD_EDITORIAL_WRITER_MISSING",
      severity: "blocking",
      message:
        "Company Daily Scan V1 must pass through the gold-standard editorial writer before customer delivery. Deterministic assembled summaries are not launchable.",
    });
  }

  const emailFindings = layer.findings.filter((finding) =>
    ["email_main", "email_secondary"].includes(finding.placement),
  );
  const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;
  const sourceById = new Map(layer.sources.map((source) => [source.id, source]));
  const hasSourceClusterDepth = (finding: typeof emailFindings[number]) => {
    const sources = finding.evidence_source_ids
      .map((id) => sourceById.get(id))
      .filter(Boolean);
    const sourceIds = new Set(sources.map((source) => source!.id).filter(Boolean));
    const domains = new Set(
      sources
        .map((source) => source!.source_domain.replace(/^www\./i, "").toLowerCase())
        .filter(Boolean),
    );
    return sourceIds.size >= 2;
  };
  const sourceRichFindings = emailFindings.filter(hasSourceClusterDepth);
  const substantialFindings = emailFindings.filter(
    (finding) => wordCount(finding.body || "") >= 120,
  );

  if (emailFindings.length < 7) {
    failures.push({
      code: "V1_GOLD_TOO_FEW_EMAIL_SECTIONS",
      severity: "blocking",
      message:
        "Company Daily Scan V1 needs seven researched email sections every day. Fewer than seven means scanning/retrieval did not find enough usable stories.",
    });
  }

  if (sourceRichFindings.length < Math.min(7, emailFindings.length)) {
    failures.push({
      code: "V1_GOLD_SOURCE_CLUSTERS_TOO_THIN",
      severity: "blocking",
      message:
        "Company Daily Scan V1 email sections must come from evidence clusters, not single-source summaries. Require at least two evidence sources per story; three is the healthy target."
    });
  }

  if (substantialFindings.length < Math.min(7, emailFindings.length)) {
    failures.push({
      code: "V1_GOLD_FINDINGS_TOO_SHORT",
      severity: "blocking",
      message:
        "Company Daily Scan V1 sections are too short. The target is 150–250 words where evidence supports it, using researched multi-paragraph sections rather than one-paragraph summaries.",
    });
  }

  const badLanguage = /\b(selected scan areas|matched|evidence threshold|source items|more in evidence trail|signals need careful reading|press-freedom signals|this item relates to|belongs in the email|dashboard source trail|generic category summary)\b/i;
  for (const finding of emailFindings) {
    const text = `${finding.title}\n${finding.body}\n${finding.why_it_matters || ""}`;
    if (badLanguage.test(text)) {
      failures.push({
        code: "V1_GOLD_INTERNAL_LANGUAGE",
        severity: "blocking",
        generated_text_path: `researched_understanding.finding:${finding.id}`,
        message:
          "Company Daily Scan V1 contains internal/pipeline language. Customer copy must read like the approved Lindell gold-standard brief.",
      });
      break;
    }
  }

  const notesWithConcreteGap = layer.notes.filter((note) => {
    const gap = note.possible_perception_gap;
    if (!gap || gap.strength === "none") return false;
    const text = `${gap.gap} ${gap.why_it_matters}`;
    return (
      wordCount(text) >= 45 &&
      !/not yet a full PGI|reviewed before writing|generic category summary|single source/i.test(text)
    );
  });
  if (notesWithConcreteGap.length === 0) {
    failures.push({
      code: "V1_GOLD_PERCEPTION_GAP_TOO_ABSTRACT",
      severity: "blocking",
      message:
        "Company Daily Scan V1 needs a concrete Perception Gap in the approved style: where the split appears, why it matters, and how source frames differ.",
    });
  }

  return failures;
}

function normaliseStoryTitleForQa(value: string): string {
  const lower = value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (
    /rsf|reporters without borders|press freedom index|press freedom.*lowest/.test(
      lower,
    )
  ) {
    return "press freedom index rsf";
  }
  if (/foreign disinformation|misinformation|disinformation/.test(lower)) {
    return "disinformation channel pressure";
  }
  if (/deepfake|synthetic|ai video|likeness|voice/.test(lower)) {
    return "synthetic identity trust";
  }
  if (/hormuz|shipping route|freight|suez|red sea/.test(lower)) {
    return "shipping route confidence";
  }
  return lower
    .split(/\s+/)
    .filter((word) => word.length > 4)
    .slice(0, 7)
    .join(" ");
}

function checkEditorialRequirements(
  packet: CompanyBriefingEvidencePacket,
  output: CompanyBriefingGenerationOutput,
): QAFailure[] {
  const failures: QAFailure[] = [];
  const packetClaimIds = new Set(
    packet.email_items.flatMap((item) =>
      item.facts.map((fact) => fact.claim_id),
    ),
  );
  const packetItemIds = new Set(packet.email_items.map((item) => item.item_id));
  const allGeneratedTexts: Array<{
    path: string;
    text: GeneratedText;
    itemId?: string;
  }> = [
    { path: "today_brief.top_line", text: output.today_brief.top_line },
    ...output.today_brief.bullets.map((text, i) => ({
      path: `today_brief.bullets[${i}]`,
      text,
    })),
    ...output.perception_gap.notes.map((note, i) => ({
      path: `perception_gap.notes[${i}]`,
      text: note.note,
      itemId: note.packet_item_id,
    })),
    ...output.useful_observations.observations.map((text, i) => ({
      path: `useful_observations.observations[${i}]`,
      text,
    })),
    { path: "source_notes.text", text: output.source_notes.text },
  ];

  for (const segment of allGeneratedTexts) {
    if (!segment.text.supported_by?.length) {
      failures.push({
        code: "EDITORIAL_TEXT_UNSUPPORTED",
        severity: segment.path === "source_notes.text" ? "warning" : "blocking",
        generated_text_path: segment.path,
        item_id: segment.itemId,
        message:
          "Package 9.3A customer-facing editorial text needs support references, not unsupported synthesis.",
      });
      continue;
    }

    const claimRefs = segment.text.supported_by
      .filter((ref) => ref.type === "claim_id")
      .map((ref) => ref.id);
    const invalidClaimRefs = claimRefs.filter((id) => !packetClaimIds.has(id));
    if (invalidClaimRefs.length > 0) {
      failures.push({
        code: "EDITORIAL_INVALID_CLAIM_REF",
        severity: "blocking",
        generated_text_path: segment.path,
        item_id: segment.itemId,
        message: `Package 9.3A editorial text references unknown claim IDs: ${invalidClaimRefs.join(", ")}`,
      });
    }
  }

  const topLine = output.today_brief.top_line.text;
  const topLineLooksHardcoded =
    /\bHormuz\b/i.test(topLine) &&
    !packet.email_items.some((item) =>
      /\bHormuz\b/i.test(
        `${item.canonical_event_name} ${item.facts.map((fact) => fact.text).join(" ")}`,
      ),
    );
  if (topLineLooksHardcoded) {
    failures.push({
      code: "EDITORIAL_HARDCODED_CONTEXT",
      severity: "blocking",
      generated_text_path: "today_brief.top_line",
      message:
        "Package 9.3A top line appears to use hardcoded topic context that is not supported by selected evidence.",
    });
  }

  const nonLogisticsIndustry =
    !/logistics|shipping|maritime|freight|port|supply-chain|transport/i.test(
      packet.company.industry || "",
    );
  const generatedAllText = JSON.stringify(output);
  if (
    nonLogisticsIndustry &&
    /\b(weak shipping confidence|global logistics|freight markets|vessel traffic, insurance cover|carriers, insurers|route-confidence story)\b/i.test(
      generatedAllText,
    )
  ) {
    failures.push({
      code: "EDITORIAL_SECTOR_LEAKAGE",
      severity: "blocking",
      message:
        "Company briefing appears to leak logistics/Test Company framing into a non-logistics company output.",
    });
  }

  for (const section of output.main_briefing.sections) {
    for (const item of section.items) {
      if (!packetItemIds.has(item.packet_item_id)) continue;
      const packetItem = packet.email_items.find(
        (candidate) => candidate.item_id === item.packet_item_id,
      );
      const sectionLabel =
        packet.company.selected_scan_areas.find(
          (area) => area.area_id === section.section_id,
        )?.label || section.heading;
      const bodyAndTitle = `${item.title.text} ${item.body.text}`.toLowerCase();
      const sectionTerms = sectionLabel
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 4);
      const coherent =
        sectionTerms.length === 0 ||
        sectionTerms.some((term) => bodyAndTitle.includes(term)) ||
        packetItem?.section_ids.includes(section.section_id);
      if (!coherent) {
        failures.push({
          code: "EDITORIAL_SECTION_COHERENCE_WEAK",
          severity: "warning",
          item_id: item.packet_item_id,
          generated_text_path: `item:${item.generated_item_id}`,
          message: `Package 9.3A section heading/body coherence is weak for heading "${section.heading}".`,
        });
      }
    }
  }

  const titleCounts = new Map<string, number>();
  for (const item of getAllGeneratedItems(output)) {
    const key = normaliseStoryTitleForQa(item.title.text);
    if (!key) continue;
    titleCounts.set(key, (titleCounts.get(key) || 0) + 1);
  }
  for (const [key, count] of titleCounts.entries()) {
    if (count > 2) {
      failures.push({
        code: "EDITORIAL_REPEAT_STORY_IN_EMAIL",
        severity: "blocking",
        message: `Story-level dedupe failed: "${key}" appeared ${count} times in the customer email. Repeated coverage should become supporting evidence or dashboard detail.`,
      });
    }
  }

  const understanding = output.understanding as
    | {
        company_pgi_v2?: {
          story_arcs?: Array<{ story_examples?: Array<{ title?: string }> }>;
          dashboard_read?: {
            story_arcs?: Array<{ story_examples?: Array<{ title?: string }> }>;
          };
        };
      }
    | undefined;
  const storyArcExamples =
    understanding?.company_pgi_v2?.story_arcs?.flatMap(
      (arc) => arc.story_examples || [],
    ) ||
    understanding?.company_pgi_v2?.dashboard_read?.story_arcs?.flatMap(
      (arc) => arc.story_examples || [],
    ) ||
    [];
  const pgText = output.perception_gap.notes
    .map((note) => note.note.text)
    .join(" ");
  if (storyArcExamples.length > 0) {
    const mentionsActualStory = storyArcExamples.some((example) => {
      const title = example.title || "";
      const tokens = title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 5)
        .slice(0, 4);
      return (
        tokens.length > 0 &&
        tokens.some((token) => pgText.toLowerCase().includes(token))
      );
    });
    if (!mentionsActualStory) {
      failures.push({
        code: "EDITORIAL_PG_STORY_NOT_NAMED",
        severity: "blocking",
        generated_text_path: "perception_gap.notes",
        message:
          "Perception Gap has story-arc evidence but does not name any actual scanned story/finding.",
      });
    }
  }

  if (
    output.useful_observations.observations.length > 0 &&
    storyArcExamples.length > 0
  ) {
    const obsText = output.useful_observations.observations
      .map((observation) => observation.text)
      .join(" ")
      .toLowerCase();
    const learningLanguage =
      /learning|carry forward|what we learned|related stream|useful signal|would change/i.test(
        obsText,
      );
    if (!learningLanguage) {
      failures.push({
        code: "EDITORIAL_OBSERVATIONS_NOT_FROM_PGI",
        severity: "warning",
        generated_text_path: "useful_observations.observations",
        message:
          "Observations should carry forward learning from the PGI Story Arc, not procedural scan notes.",
      });
    }
  }

  for (let i = 0; i < output.perception_gap.notes.length; i++) {
    const note = output.perception_gap.notes[i];
    const packetItem = packet.email_items.find(
      (item) => item.item_id === note.packet_item_id,
    );
    const credibleFrames =
      packetItem?.perception_gap?.frames?.filter(
        (frame) => frame.source_grade === "A" || frame.source_grade === "B",
      ) ?? [];
    const distinctFrameBases = new Set(
      credibleFrames.map(
        (frame) =>
          `${frame.source_region}:${frame.evidence_type}:${frame.summary}`,
      ),
    );
    if (distinctFrameBases.size < 2) {
      failures.push({
        code: "EDITORIAL_PG_DISTINCT_EVIDENCE_WEAK",
        severity: "warning",
        item_id: note.packet_item_id,
        generated_text_path: `perception_gap.notes[${i}]`,
        message:
          "Package 9.3A Perception Gap should rest on at least two distinct credible frame bases before saying frames differ.",
      });
    }
  }

  if (/\bwatch\s+next\b/i.test(JSON.stringify(output))) {
    failures.push({
      code: "EDITORIAL_WATCH_NEXT_DEFAULT_BLOCKED",
      severity: "blocking",
      message:
        "Package 9.3A should not output a standalone generic Watch Next section by default.",
    });
  }

  return failures;
}

function estimateTotalWords(output: CompanyBriefingGenerationOutput): number {
  let total = 0;
  const count = (t: string) =>
    t.split(/\s+/).filter((w) => w.length > 0).length;

  total += count(output.today_brief.top_line.text);
  for (const b of output.today_brief.bullets) total += count(b.text);

  for (const section of output.main_briefing.sections) {
    for (const item of section.items) {
      total += count(item.title.text);
      total += count(item.body.text);
      if (item.why_it_matters?.text) total += count(item.why_it_matters.text);
      if (item.uncertainty_line?.text)
        total += count(item.uncertainty_line.text);
      if (item.perception_gap_note?.text)
        total += count(item.perception_gap_note.text);
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
