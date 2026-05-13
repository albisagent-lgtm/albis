// ---------------------------------------------------------------------------
// Run the company signal pipeline — Package 6.
//
// Extracted from scripts/run-company-signal-pipeline.ts so the cron HTTP
// handler can call the pipeline directly without spawning a script. The
// script now wraps this function and adds CLI arg parsing + dotenv.
//
// Behavior summary:
//   1. Load signals from the company pool for (scanDate - lookbackHours)
//      to end of scanDate.
//   2. If zero signals: return early without touching company_briefings.
//      No legacy company fallback is active after Package 8 cleanup.
//   3. For every onboarded company_profile:
//      - load canonical index
//      - run Package 10C scanner-report generation by default
//      - optionally write company_briefings only behind write gates
//      - keep legacy match/what_changed persistence fail-closed unless the
//        emergency ALLOW_LEGACY_COMPANY_PIPELINE flag is explicitly set
// ---------------------------------------------------------------------------
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  scoreStoriesForCompany,
  getSelectedStories,
  determineSignalLevel,
} from "../relevance-engine";
import { adaptSignalToScoringInput } from "../scoring-adapters";
import { shouldGenerateBriefing } from "../tier-enforcement";
import type { CompanyProfile } from "../company-profile";
import type { BriefingContent } from "../email-templates/company-briefing";
import { buildCoverageSummary } from "../coverage-builder";
import {
  loadCanonicalIndexForProfile,
  emptyCanonicalIndex,
} from "../canonical-index";
import { buildBriefingContent } from "../company-briefing-templating";
import type { Signal } from "./types";
import { runCompanyPackage8PipelineForProfile } from "./company-package8-pipeline";
import { retrieveCompanySpecificSignals } from "./company-specific-retrieval";
import { allowLegacyCompanyPipeline } from "../company-briefing-content-version";
import { upsertCompanyProfilePgiEvidence, upsertCompanySignalPgiEvidence } from "../pgi-evidence";
import { persistResearchedUnderstandingLayer } from "./researched-understanding-persistence";

type OwnerProfile = {
  id: string;
  subscription_status: string | null;
  subscription_tier: string | null;
  subscription_period_end: string | null;
  is_test_account: boolean | null;
  trial_end_at: string | null;
};

export interface RunSignalPipelineOptions {
  scanDate: string;
  lookbackHours?: number;
  dryRun?: boolean;
  /** Use the Package 8/v2 real-data pipeline path instead of legacy content. */
  usePackage8Preview?: boolean;
  /** Write company_briefings rows. Requires COMPANY_BRIEFINGS_WRITE_ENABLED=1. */
  writeBriefingRows?: boolean;
  /** Optional safety filter for one company while testing/previewing. */
  companyProfileId?: string;
  companyName?: string;
  /** Package 10 preview path: retrieve a company-scoped signal pool per profile. */
  useCompanySpecificRetrieval?: boolean;
  /** Package 10B preview path: run deep-dive retrieval after first-pass selection. */
  enableDeepDiveRetrieval?: boolean;
  /** Optional company_scan_runs.id to attach provenance for review evidence rows. */
  companyScanRunId?: string | null;
  /** Optional logger; defaults to console-style noop on non-script paths. */
  log?: (msg: string) => void;
  warn?: (msg: string) => void;
}

export interface SignalPipelineProfileResult {
  company_name: string;
  company_profile_id?: string;
  signals_considered?: number;
  signals_selected?: number;
  signal_level?: ReturnType<typeof determineSignalLevel>;
  briefing_id?: string | null;
  content_version?:
    | "company_scanner_report_v1"
    | "company_briefing_v2"
    | "legacy_what_changed";
  qa_status?: string;
  qa_blocking_failures?: number;
  dry_run_would_have_status?: string;
  retrieval_mode?: "shared_signal_pool" | "company_specific_retrieval";
  retrieval_intent?: string;
  retrieval_queries?: number;
  retrieval_signals_loaded?: number;
  deep_dive_signals_added?: number;
  status?: "skipped" | "dry_run" | "already_delivered";
  reason?: string;
}

export interface SignalPipelineSummary {
  scan_date: string;
  lookback_hours: number;
  dry_run: boolean;
  signals_loaded: number;
  results: SignalPipelineProfileResult[];
  skipped_no_signals?: boolean;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

async function loadSignalsForWindow(
  supabase: SupabaseClient,
  scanDate: string,
  lookbackHours: number,
): Promise<Signal[]> {
  const endTs = new Date(`${scanDate}T23:59:59Z`).toISOString();
  const startTs = new Date(
    new Date(`${scanDate}T00:00:00Z`).getTime() -
      lookbackHours * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .gte("created_at", startTs)
    .lte("created_at", endTs)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`failed to load signals: ${error.message}`);
  return (data || []) as Signal[];
}

async function loadLatestCompanyScanRunId(
  supabase: SupabaseClient,
  scanDate: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("company_scan_runs")
    .select("id")
    .eq("run_date", scanDate)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`failed to load company scan run: ${error.message}`);
  return data?.id || null;
}

export async function runCompanySignalPipeline(
  supabase: SupabaseClient,
  options: RunSignalPipelineOptions,
): Promise<SignalPipelineSummary> {
  const { scanDate } = options;
  const lookbackHours = options.lookbackHours ?? 24;
  const dryRun = options.dryRun ?? false;
  const usePackage8Preview = options.usePackage8Preview ?? true;
  const useCompanySpecificRetrieval =
    options.useCompanySpecificRetrieval ??
    process.env.COMPANY_SPECIFIC_RETRIEVAL_ENABLED === "1";
  const enableDeepDiveRetrieval =
    options.enableDeepDiveRetrieval ??
    process.env.COMPANY_DEEP_DIVE_RETRIEVAL_ENABLED === "1";
  const writeBriefingRows = options.writeBriefingRows ?? false;
  const log = options.log || (() => undefined);
  const warn = options.warn || ((m: string) => console.warn(m));

  log(
    `🚀 Running company SIGNAL pipeline for ${scanDate}` +
      ` (lookback=${lookbackHours}h${dryRun ? ", dry-run" : ""})`,
  );

  const companyScanRunId =
    options.companyScanRunId ?? (await loadLatestCompanyScanRunId(supabase, scanDate));
  if (companyScanRunId) log(`  ↳ evidence provenance run: ${companyScanRunId}`);

  const signals = await loadSignalsForWindow(supabase, scanDate, lookbackHours);
  log(`  ↳ loaded ${signals.length} signals`);

  if (signals.length === 0 && !useCompanySpecificRetrieval) {
    log(
      "↷ No signals in window — Package 6 will populate. " +
        "Skipping briefing generation. No legacy company pipeline fallback is active.",
    );
    return {
      scan_date: scanDate,
      lookback_hours: lookbackHours,
      dry_run: dryRun,
      signals_loaded: 0,
      results: [],
      skipped_no_signals: true,
    };
  }

  const { data: profiles, error: profileErr } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("onboarding_completed", true);
  if (profileErr)
    throw new Error(`Failed to load company profiles: ${profileErr.message}`);
  if (!profiles || profiles.length === 0) {
    throw new Error("No onboarding-complete company profiles found");
  }
  const filteredProfiles = profiles.filter((profile) => {
    if (options.companyProfileId && profile.id !== options.companyProfileId)
      return false;
    if (options.companyName && profile.company_name !== options.companyName)
      return false;
    return true;
  });
  if (filteredProfiles.length === 0) {
    throw new Error("No company profiles matched the requested filter");
  }
  log(`✅ Loaded ${filteredProfiles.length} company profiles`);

  const ownerIds = unique(filteredProfiles.map((p) => p.owner_id));
  const { data: ownerProfiles, error: ownerErr } = await supabase
    .from("profiles")
    .select(
      "id, subscription_status, subscription_tier, subscription_period_end, is_test_account, trial_end_at",
    )
    .in("id", ownerIds);
  if (ownerErr)
    throw new Error(`Failed to load owner profiles: ${ownerErr.message}`);
  const ownerMap = new Map(
    (ownerProfiles || []).map((o: OwnerProfile) => [o.id, o]),
  );

  const results: SignalPipelineProfileResult[] = [];

  for (const rawProfile of filteredProfiles as CompanyProfile[]) {
    const owner = ownerMap.get(rawProfile.owner_id);
    if (owner?.is_test_account === true && process.env.COMPANY_SCAN_INCLUDE_TEST_ACCOUNTS !== "1") {
      log(`↷ Skipping ${rawProfile.company_name}: test account excluded from scheduled scanner`);
      results.push({
        company_name: rawProfile.company_name,
        status: "skipped",
        reason: "test_account_excluded",
      });
      continue;
    }
    if (!owner || !shouldGenerateBriefing(owner)) {
      log(`↷ Skipping ${rawProfile.company_name}: subscription inactive`);
      results.push({
        company_name: rawProfile.company_name,
        status: "skipped",
        reason: "subscription_inactive",
      });
      continue;
    }

    const result = await processProfileSignals(
      supabase,
      rawProfile,
      signals,
      scanDate,
      {
        dryRun,
        log,
        warn,
        usePackage8Preview,
        writeBriefingRows,
        lookbackHours,
        useCompanySpecificRetrieval,
        enableDeepDiveRetrieval,
        companyScanRunId,
      },
    );
    results.push(result);
  }

  return {
    scan_date: scanDate,
    lookback_hours: lookbackHours,
    dry_run: dryRun,
    signals_loaded: signals.length,
    results,
  };
}

// ---------------------------------------------------------------------------
// Per-profile signal processing — extracted from runCompanySignalPipeline
// so the preview-on-signup helper (Pkg 7 CP4) can share the same path.
//
// This intentionally does NOT check the entitlement gate — that is the
// caller's job. The daily pipeline gates ahead of calling this; the
// preview-on-signup flow runs it unconditionally so brand-new users see
// a briefing immediately even if the trial-state write hasn't propagated.
// ---------------------------------------------------------------------------
export interface ProcessProfileSignalsOptions {
  dryRun?: boolean;
  usePackage8Preview?: boolean;
  writeBriefingRows?: boolean;
  useCompanySpecificRetrieval?: boolean;
  enableDeepDiveRetrieval?: boolean;
  lookbackHours?: number;
  companyScanRunId?: string | null;
  log?: (msg: string) => void;
  warn?: (msg: string) => void;
}

export async function processProfileSignals(
  supabase: SupabaseClient,
  rawProfile: CompanyProfile,
  signals: Signal[],
  scanDate: string,
  options: ProcessProfileSignalsOptions = {},
): Promise<SignalPipelineProfileResult> {
  const dryRun = options.dryRun ?? false;
  const usePackage8Preview = options.usePackage8Preview ?? true;
  const writeBriefingRows = options.writeBriefingRows ?? false;
  const useCompanySpecificRetrieval =
    options.useCompanySpecificRetrieval ?? false;
  const enableDeepDiveRetrieval = options.enableDeepDiveRetrieval ?? false;
  const writeEnabled = process.env.COMPANY_BRIEFINGS_WRITE_ENABLED === "1";
  const log = options.log || (() => undefined);
  const warn = options.warn || ((m: string) => console.warn(m));

  log(`\n▶ Processing ${rawProfile.company_name}`);

  let canonicalIndex;
  try {
    canonicalIndex = await loadCanonicalIndexForProfile(
      supabase,
      rawProfile.id,
    );
  } catch (err) {
    warn(
      `⚠️ canonical index load failed (using raw fallback): ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    canonicalIndex = emptyCanonicalIndex();
  }

  let profileSignals = signals;
  let retrievalSummary: {
    mode: "shared_signal_pool" | "company_specific_retrieval";
    intent?: string;
    queries?: number;
    signals_loaded?: number;
  } = { mode: "shared_signal_pool", signals_loaded: signals.length };

  if (usePackage8Preview && useCompanySpecificRetrieval) {
    const retrieval = await retrieveCompanySpecificSignals(
      supabase,
      rawProfile,
      {
        signalDate: scanDate,
        log,
      },
    );
    profileSignals = retrieval.signals;
    retrievalSummary = {
      mode: "company_specific_retrieval",
      intent: retrieval.intent,
      queries: retrieval.queries.length,
      signals_loaded: retrieval.signals.length,
    };
    log(
      `  Package 10 company-specific retrieval loaded ${retrieval.signals.length} signal(s) ` +
        `from ${retrieval.queries.length} query/queries (${retrieval.intent})`,
    );
  }

  const adapted = profileSignals.map((s) => adaptSignalToScoringInput(s));
  const scored = scoreStoriesForCompany(adapted, rawProfile, canonicalIndex);
  const selected = getSelectedStories(scored);
  const signalLevel = determineSignalLevel(selected);

  if (usePackage8Preview) {
    const package8 = await runCompanyPackage8PipelineForProfile(
      supabase,
      rawProfile,
      profileSignals,
      {
        scanDate,
        lookbackHours: options.lookbackHours ?? 24,
        dryRun: true,
        enableDeepDiveRetrieval,
        log,
      },
    );

    const originalBlockingFailures = package8.qa_report?.blocking_failures || [];
    const dailySendGuarantee = process.env.COMPANY_DAILY_SEND_GUARANTEE === "1";
    const minimumCustomerStories = Math.max(
      1,
      Number(process.env.COMPANY_DAILY_SEND_MIN_EMAIL_STORIES || 7),
    );
    const researchedEmailFindings = package8.briefing_content?.understanding?.researched_understanding_v1?.findings?.filter(
      (finding: any) => ["email_main", "email_secondary"].includes(finding?.placement),
    ).length || 0;
    const mainBriefingItems = package8.briefing_content?.main_briefing?.sections?.reduce(
      (total: number, section: any) => total + (Array.isArray(section?.items) ? section.items.length : 0),
      0,
    ) || 0;
    const customerEmailStoryCount = researchedEmailFindings || mainBriefingItems;
    const downgradableForDailySend = new Set([
      ...(customerEmailStoryCount >= minimumCustomerStories
        ? ["V1_GOLD_TOO_FEW_EMAIL_SECTIONS"]
        : []),
      "V1_GOLD_SOURCE_CLUSTERS_TOO_THIN",
      "V1_GOLD_FINDINGS_TOO_SHORT",
      "POLICY_MAX_EMAIL_ITEMS",
    ]);
    const deliveryBlockingFailures = dailySendGuarantee
      ? originalBlockingFailures.filter((failure: any) => !downgradableForDailySend.has(failure?.code))
      : originalBlockingFailures;
    const qaReportForPersistence = dailySendGuarantee && deliveryBlockingFailures.length !== originalBlockingFailures.length
      ? {
          ...package8.qa_report,
          blocking_failures: deliveryBlockingFailures,
          daily_send_guarantee_override: {
            applied: true,
            original_blocking_failures: originalBlockingFailures,
            minimum_customer_stories: minimumCustomerStories,
            customer_email_story_count: customerEmailStoryCount,
            note: "Downgraded non-safety quality blockers so active companies still receive a daily briefing. The too-few-stories blocker is only downgraded when the customer-facing email still has at least the configured minimum story count. Fix retrieval/editorial quality, but do not silently skip delivery.",
          },
        }
      : package8.qa_report;
    const blockingFailures = deliveryBlockingFailures.length;
    log(
      `  Package 8 preview selected ${package8.selected_count} item(s); ` +
        `QA=${package8.qa_report?.status || "unknown"}, blockers=${originalBlockingFailures.length}, ` +
        `customer_stories=${customerEmailStoryCount}` +
        (dailySendGuarantee && blockingFailures !== originalBlockingFailures.length
          ? `, delivery_blockers=${blockingFailures} (daily-send guarantee, min_stories=${minimumCustomerStories})`
          : ""),
    );

    if (dryRun || !writeBriefingRows) {
      return {
        company_name: rawProfile.company_name,
        company_profile_id: rawProfile.id,
        signals_considered: profileSignals.length,
        signals_selected: package8.selected_count,
        signal_level: signalLevel,
        status: "dry_run",
        reason: dryRun
          ? "package8_preview_no_write"
          : "package8_preview_write_not_requested",
        content_version: "company_scanner_report_v1",
        qa_status: package8.qa_report?.status,
        qa_blocking_failures: blockingFailures,
        dry_run_would_have_status: package8.dry_run_metadata?.would_have_status,
        retrieval_mode: retrievalSummary.mode,
        retrieval_intent: retrievalSummary.intent,
        retrieval_queries: retrievalSummary.queries,
        retrieval_signals_loaded: retrievalSummary.signals_loaded,
        deep_dive_signals_added: package8.deep_dive_retrieval?.signals_added,
      };
    }

    if (!writeEnabled) {
      return {
        company_name: rawProfile.company_name,
        company_profile_id: rawProfile.id,
        signals_considered: profileSignals.length,
        signals_selected: package8.selected_count,
        signal_level: signalLevel,
        status: "skipped",
        reason: "COMPANY_BRIEFINGS_WRITE_ENABLED_not_set",
        content_version: "company_scanner_report_v1",
        qa_status: package8.qa_report?.status,
        qa_blocking_failures: blockingFailures,
        dry_run_would_have_status: package8.dry_run_metadata?.would_have_status,
        retrieval_mode: retrievalSummary.mode,
        retrieval_intent: retrievalSummary.intent,
        retrieval_queries: retrievalSummary.queries,
        retrieval_signals_loaded: retrievalSummary.signals_loaded,
        deep_dive_signals_added: package8.deep_dive_retrieval?.signals_added,
      };
    }

    const { data: existingBriefing, error: existingBriefingErr } = await supabase
      .from("company_briefings")
      .select("id,status,delivery_status")
      .eq("company_profile_id", rawProfile.id)
      .eq("briefing_date", scanDate)
      .maybeSingle();
    if (existingBriefingErr) {
      throw new Error(
        `Failed to check existing company_briefings row: ${existingBriefingErr.message}`,
      );
    }

    const alreadyDelivered =
      existingBriefing?.status === "delivered" ||
      existingBriefing?.delivery_status === "sent";
    if (alreadyDelivered) {
      log(
        `  Existing ${scanDate} briefing already delivered for ${rawProfile.company_name}; preserving sent row and skipping rewrite`,
      );
      return {
        company_name: rawProfile.company_name,
        company_profile_id: rawProfile.id,
        signals_considered: profileSignals.length,
        signals_selected: package8.selected_count,
        signal_level: signalLevel,
        briefing_id: existingBriefing.id,
        content_version: "company_scanner_report_v1",
        status: "already_delivered",
        reason: "preserved_sent_daily_briefing",
        qa_status: qaReportForPersistence?.status,
        qa_blocking_failures: blockingFailures,
        dry_run_would_have_status: package8.dry_run_metadata?.would_have_status,
        retrieval_mode: retrievalSummary.mode,
        retrieval_intent: retrievalSummary.intent,
        retrieval_queries: retrievalSummary.queries,
        retrieval_signals_loaded: retrievalSummary.signals_loaded,
        deep_dive_signals_added: package8.deep_dive_retrieval?.signals_added,
      };
    }

    // Persist reviewable briefing artifacts even when QA says hold. QA should
    // block delivery, not erase the evidence we need to inspect and improve.
    // Rows with blockers stay status='pending', so the delivery endpoint will
    // not pick them up even if email delivery is later enabled.
    const briefingStatus = blockingFailures > 0 ? "pending" : "generated";

    const { data: briefingRow, error: briefingErr } = await supabase
      .from("company_briefings")
      .upsert(
        {
          company_profile_id: rawProfile.id,
          briefing_date: scanDate,
          status: briefingStatus,
          delivery_status: "pending",
          stories_considered: profileSignals.length,
          stories_selected: package8.selected_count,
          briefing_content: {
            ...package8.briefing_content,
            evidence_document: package8.evidence_document,
            retrieval_summary: retrievalSummary,
            deep_dive_retrieval: package8.deep_dive_retrieval,
            dedupe_summary: package8.dedupe_summary,
            qa_report: qaReportForPersistence,
            review_status: blockingFailures > 0
              ? "hold"
              : dailySendGuarantee && originalBlockingFailures.length > 0
                ? "daily_send_guarantee_override"
                : "ready_for_delivery_review",
          },
          generated_at: new Date().toISOString(),
        },
        { onConflict: "company_profile_id,briefing_date" },
      )
      .select("id")
      .single();
    if (briefingErr || !briefingRow) {
      throw new Error(
        `Failed to upsert Package 8 company_briefings: ${briefingErr?.message || "no row"}`,
      );
    }

    const researchPersistence = await persistResearchedUnderstandingLayer(
      supabase,
      package8.briefing_content.understanding?.researched_understanding_v1,
      briefingRow.id,
    );
    if (researchPersistence.enabled) {
      log(
        `✅ Persisted researched understanding for ${rawProfile.company_name}: ` +
          `${researchPersistence.clusters} cluster(s), ${researchPersistence.sources} source(s), ` +
          `${researchPersistence.notes} note(s), ${researchPersistence.findings} finding(s)`,
      );
    }

    const selectedHeadlines = new Set(selected.map((story) => story.headline));
    const selectedSignalIds = profileSignals
      .filter((signal) => selectedHeadlines.has(signal.headline))
      .map((signal) => signal.id);
    const evidenceRows = await upsertCompanyProfilePgiEvidence(supabase, {
      evidenceDate: scanDate,
      companyProfileId: rawProfile.id,
      signals: profileSignals,
      selectedSignalIds,
      companyScanRunId: options.companyScanRunId,
    });
    log(`✅ Upserted ${evidenceRows} PGI evidence row(s) for ${rawProfile.company_name}`);

    return {
      company_name: rawProfile.company_name,
      company_profile_id: rawProfile.id,
      signals_considered: profileSignals.length,
      signals_selected: package8.selected_count,
      signal_level: signalLevel,
      briefing_id: briefingRow.id,
      content_version: "company_scanner_report_v1",
      qa_status: qaReportForPersistence?.status,
      qa_blocking_failures: blockingFailures,
      dry_run_would_have_status: package8.dry_run_metadata?.would_have_status,
      retrieval_mode: retrievalSummary.mode,
      retrieval_intent: retrievalSummary.intent,
      retrieval_queries: retrievalSummary.queries,
      retrieval_signals_loaded: retrievalSummary.signals_loaded,
      deep_dive_signals_added: package8.deep_dive_retrieval?.signals_added,
    };
  }

  if (!allowLegacyCompanyPipeline()) {
    return {
      company_name: rawProfile.company_name,
      company_profile_id: rawProfile.id,
      signals_considered: profileSignals.length,
      signals_selected: selected.length,
      signal_level: signalLevel,
      status: dryRun ? "dry_run" : "skipped",
      reason: "legacy_company_pipeline_disabled_package10c_required",
      content_version: "company_scanner_report_v1",
      retrieval_mode: retrievalSummary.mode,
      retrieval_intent: retrievalSummary.intent,
      retrieval_queries: retrievalSummary.queries,
      retrieval_signals_loaded: retrievalSummary.signals_loaded,
    };
  }

  warn(
    "⚠️ ALLOW_LEGACY_COMPANY_PIPELINE=1 is set; using retired what_changed/what_to_watch path. " +
      "This is emergency compatibility only and is not deliverable.",
  );

  const remaining = new Set(signals.map((s) => s.id));
  const signalsByHeadline = new Map<string, Signal[]>();
  for (const s of signals) {
    const list = signalsByHeadline.get(s.headline) || [];
    list.push(s);
    signalsByHeadline.set(s.headline, list);
  }

  if (dryRun) {
    log(
      `  (dry-run) would write ${scored.length} company_signal_matches rows (${selected.length} selected)`,
    );
    return {
      company_name: rawProfile.company_name,
      company_profile_id: rawProfile.id,
      signals_considered: signals.length,
      signals_selected: selected.length,
      signal_level: signalLevel,
      status: "dry_run",
    };
  }

  const matchRows: Array<{
    company_profile_id: string;
    signal_id: string;
    relevance_score: number;
    match_reasons: unknown;
    selected_for_briefing: boolean;
  }> = [];

  for (const s of scored) {
    const list = signalsByHeadline.get(s.headline) || [];
    const sig = list.find((x) => remaining.has(x.id));
    if (!sig) continue;
    remaining.delete(sig.id);
    matchRows.push({
      company_profile_id: rawProfile.id,
      signal_id: sig.id,
      relevance_score: s.relevance_score,
      match_reasons: s.match_reasons,
      selected_for_briefing: s.selected_for_briefing,
    });
  }

  if (matchRows.length > 0) {
    const { error: upsertErr } = await supabase
      .from("company_signal_matches")
      .upsert(matchRows, { onConflict: "company_profile_id,signal_id" });
    if (upsertErr) {
      throw new Error(
        `Failed to upsert company_signal_matches: ${upsertErr.message}`,
      );
    }
  }
  log(
    `✅ Wrote ${matchRows.length} company_signal_matches rows (${selected.length} selected)`,
  );

  const runs = unique(signals.map((signal) => signal.company_scan_run_id).filter(Boolean));
  if (runs.length === 1) {
    const evidenceRows = await upsertCompanySignalPgiEvidence(supabase, {
      run: { id: runs[0], run_date: scanDate },
      signals,
    });
    log(`✅ Upserted ${evidenceRows} PGI evidence row(s) for ${rawProfile.company_name}`);
  }

  const briefingContent: BriefingContent = buildBriefingContent(
    rawProfile,
    scanDate,
    signalLevel,
    selected,
  );

  const { data: existingBriefing, error: existingBriefingErr } = await supabase
    .from("company_briefings")
    .select("id,status,delivery_status")
    .eq("company_profile_id", rawProfile.id)
    .eq("briefing_date", scanDate)
    .maybeSingle();
  if (existingBriefingErr) {
    throw new Error(
      `Failed to check existing company_briefings row: ${existingBriefingErr.message}`,
    );
  }
  if (
    existingBriefing?.status === "delivered" ||
    existingBriefing?.delivery_status === "sent"
  ) {
    log(
      `✅ Existing ${scanDate} briefing already delivered for ${rawProfile.company_name}; preserving sent row`,
    );
    return {
      company_name: rawProfile.company_name,
      company_profile_id: rawProfile.id,
      signals_considered: signals.length,
      signals_selected: selected.length,
      signal_level: signalLevel,
      briefing_id: existingBriefing.id,
      status: "already_delivered",
      reason: "preserved_sent_daily_briefing",
      content_version: "legacy_what_changed",
    };
  }

  const { data: briefingRow, error: briefingErr } = await supabase
    .from("company_briefings")
    .upsert(
      {
        company_profile_id: rawProfile.id,
        briefing_date: scanDate,
        status: "generated",
        delivery_status: "pending",
        stories_considered: signals.length,
        stories_selected: selected.length,
        briefing_content: briefingContent,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "company_profile_id,briefing_date" },
    )
    .select("id")
    .single();
  if (briefingErr || !briefingRow) {
    throw new Error(
      `Failed to upsert company_briefings: ${briefingErr?.message || "no row"}`,
    );
  }
  log(
    `✅ Upserted company_briefings row ${briefingRow.id} (generated, delivery remains Package 8/v2 gated)`,
  );

  const selectedSignalIds = matchRows
    .filter((m) => m.selected_for_briefing)
    .map((m) => m.signal_id);
  if (selectedSignalIds.length > 0) {
    const { error: stampErr } = await supabase
      .from("company_signal_matches")
      .update({ briefing_id: briefingRow.id })
      .eq("company_profile_id", rawProfile.id)
      .in("signal_id", selectedSignalIds);
    if (stampErr) {
      warn(
        `⚠️ failed to stamp briefing_id on signal matches: ${stampErr.message}`,
      );
    }
  }

  try {
    const coverage = await buildCoverageSummary(
      supabase,
      rawProfile,
      scored,
      adapted,
      scanDate,
      { signals },
    );
    const { error: coverageErr } = await supabase
      .from("company_coverage_summaries")
      .upsert(
        {
          company_profile_id: rawProfile.id,
          coverage_date: scanDate,
          tracked_items_checked: coverage.tracked_items_checked,
          sources_inspected: coverage.sources_inspected,
          early_signals: coverage.early_signals,
          silent_items: coverage.silent_items,
          summary_text: coverage.summary_text,
        },
        { onConflict: "company_profile_id,coverage_date" },
      );
    if (coverageErr) throw new Error(coverageErr.message);
    log(
      `✅ Wrote coverage summary (${coverage.tracked_items_checked.length} tracked, ` +
        `${coverage.silent_items.length} silent, ${coverage.early_signals.length} early)`,
    );
  } catch (err) {
    warn(
      `⚠️ coverage summary failed (non-fatal): ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  return {
    company_name: rawProfile.company_name,
    company_profile_id: rawProfile.id,
    signals_considered: signals.length,
    signals_selected: selected.length,
    signal_level: signalLevel,
    briefing_id: briefingRow.id,
  };
}

// Re-export the existing window-loader so the preview helper can share it
// without duplicating the date-window arithmetic.
export { loadSignalsForWindow };
