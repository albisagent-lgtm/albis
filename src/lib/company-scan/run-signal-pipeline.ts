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
//   2. If zero signals: return early without touching company_briefings —
//      the legacy public-pool pipeline keeps responsibility for the day.
//   3. For every onboarded company_profile:
//      - load canonical index
//      - score adapted signals via the existing relevance engine
//      - upsert company_signal_matches (with match_reasons)
//      - upsert company_briefings (status='generated', delivery deferred)
//      - stamp briefing_id back onto selected matches
//      - persist coverage summary (signals-aware, by_language / by_region
//        populated from real signal source metadata when present)
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

type OwnerProfile = {
  id: string;
  subscription_status: string | null;
  subscription_tier: string | null;
  subscription_period_end: string | null;
};

export interface RunSignalPipelineOptions {
  scanDate: string;
  lookbackHours?: number;
  dryRun?: boolean;
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
  status?: "skipped" | "dry_run";
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
  lookbackHours: number
): Promise<Signal[]> {
  const endTs = new Date(`${scanDate}T23:59:59Z`).toISOString();
  const startTs = new Date(
    new Date(`${scanDate}T00:00:00Z`).getTime() - lookbackHours * 60 * 60 * 1000
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

export async function runCompanySignalPipeline(
  supabase: SupabaseClient,
  options: RunSignalPipelineOptions
): Promise<SignalPipelineSummary> {
  const { scanDate } = options;
  const lookbackHours = options.lookbackHours ?? 24;
  const dryRun = options.dryRun ?? false;
  const log = options.log || (() => undefined);
  const warn = options.warn || ((m: string) => console.warn(m));

  log(
    `🚀 Running company SIGNAL pipeline for ${scanDate}` +
      ` (lookback=${lookbackHours}h${dryRun ? ", dry-run" : ""})`
  );

  const signals = await loadSignalsForWindow(supabase, scanDate, lookbackHours);
  log(`  ↳ loaded ${signals.length} signals`);

  if (signals.length === 0) {
    log(
      "↷ No signals in window — Package 6 will populate. " +
        "Skipping briefing generation; legacy pipeline retains responsibility for today."
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
  if (profileErr) throw new Error(`Failed to load company profiles: ${profileErr.message}`);
  if (!profiles || profiles.length === 0) {
    throw new Error("No onboarding-complete company profiles found");
  }
  log(`✅ Loaded ${profiles.length} company profiles`);

  const ownerIds = unique(profiles.map((p) => p.owner_id));
  const { data: ownerProfiles, error: ownerErr } = await supabase
    .from("profiles")
    .select("id, subscription_status, subscription_tier, subscription_period_end, is_test_account, trial_end_at")
    .in("id", ownerIds);
  if (ownerErr) throw new Error(`Failed to load owner profiles: ${ownerErr.message}`);
  const ownerMap = new Map(
    (ownerProfiles || []).map((o: OwnerProfile) => [o.id, o])
  );

  const results: SignalPipelineProfileResult[] = [];

  for (const rawProfile of profiles as CompanyProfile[]) {
    const owner = ownerMap.get(rawProfile.owner_id);
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
      { dryRun, log, warn }
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
  log?: (msg: string) => void;
  warn?: (msg: string) => void;
}

export async function processProfileSignals(
  supabase: SupabaseClient,
  rawProfile: CompanyProfile,
  signals: Signal[],
  scanDate: string,
  options: ProcessProfileSignalsOptions = {}
): Promise<SignalPipelineProfileResult> {
  const dryRun = options.dryRun ?? false;
  const log = options.log || (() => undefined);
  const warn = options.warn || ((m: string) => console.warn(m));

  log(`\n▶ Processing ${rawProfile.company_name}`);

  let canonicalIndex;
  try {
    canonicalIndex = await loadCanonicalIndexForProfile(supabase, rawProfile.id);
  } catch (err) {
    warn(
      `⚠️ canonical index load failed (using raw fallback): ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    canonicalIndex = emptyCanonicalIndex();
  }

  const adapted = signals.map((s) => adaptSignalToScoringInput(s));
  const scored = scoreStoriesForCompany(adapted, rawProfile, canonicalIndex);
  const selected = getSelectedStories(scored);
  const signalLevel = determineSignalLevel(selected);

  const remaining = new Set(signals.map((s) => s.id));
  const signalsByHeadline = new Map<string, Signal[]>();
  for (const s of signals) {
    const list = signalsByHeadline.get(s.headline) || [];
    list.push(s);
    signalsByHeadline.set(s.headline, list);
  }

  if (dryRun) {
    log(
      `  (dry-run) would write ${scored.length} company_signal_matches rows (${selected.length} selected)`
    );
    return {
      company_name: rawProfile.company_name,
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
      throw new Error(`Failed to upsert company_signal_matches: ${upsertErr.message}`);
    }
  }
  log(
    `✅ Wrote ${matchRows.length} company_signal_matches rows (${selected.length} selected)`
  );

  const briefingContent: BriefingContent = buildBriefingContent(
    rawProfile,
    scanDate,
    signalLevel,
    selected
  );

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
      { onConflict: "company_profile_id,briefing_date" }
    )
    .select("id")
    .single();
  if (briefingErr || !briefingRow) {
    throw new Error(
      `Failed to upsert company_briefings: ${briefingErr?.message || "no row"}`
    );
  }
  log(
    `✅ Upserted company_briefings row ${briefingRow.id} (generated, delivery deferred to legacy)`
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
      warn(`⚠️ failed to stamp briefing_id on signal matches: ${stampErr.message}`);
    }
  }

  try {
    const coverage = await buildCoverageSummary(
      supabase,
      rawProfile,
      scored,
      adapted,
      scanDate,
      { signals }
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
        { onConflict: "company_profile_id,coverage_date" }
      );
    if (coverageErr) throw new Error(coverageErr.message);
    log(
      `✅ Wrote coverage summary (${coverage.tracked_items_checked.length} tracked, ` +
        `${coverage.silent_items.length} silent, ${coverage.early_signals.length} early)`
    );
  } catch (err) {
    warn(
      `⚠️ coverage summary failed (non-fatal): ${
        err instanceof Error ? err.message : String(err)
      }`
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
