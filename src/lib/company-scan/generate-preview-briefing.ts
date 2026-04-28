// ---------------------------------------------------------------------------
// Preview-on-signup briefing — Package 7 CP4.
//
// Called from /api/onboarding/complete immediately after the company_profile
// is upserted. Generates a single briefing for that company using the most
// recent 24h of signals already in the pool — no fresh scan triggered.
//
// Package 10C note: preview generation must use the scanner-report path. It
// must not fall back to the retired templated `what_changed` / `what_to_watch`
// mini-briefing shape.
//
// Entitlement gate is intentionally skipped here: a brand-new user might
// land on this code path before the trial-state write has propagated, and
// the preview's whole point is showing value pre-subscription. The hard
// gate continues to live in runCompanySignalPipeline for the daily run.
// ---------------------------------------------------------------------------
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  processProfileSignals,
  loadSignalsForWindow,
} from "./run-signal-pipeline";
import type { CompanyProfile } from "../company-profile";

export interface PreviewBriefingResult {
  status: "generated" | "skipped_no_signals" | "skipped_no_profile" | "skipped_write_gated" | "skipped_qa_blocked";
  briefing_id?: string | null;
  signals_considered?: number;
  signals_selected?: number;
  reason?: string;
}

const PREVIEW_LOOKBACK_HOURS = 24;

function todayUtcDate(): string {
  return new Date().toISOString().split("T")[0];
}

export async function generatePreviewBriefing(
  supabase: SupabaseClient,
  companyProfileId: string
): Promise<PreviewBriefingResult> {
  const { data: profile, error: profileErr } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("id", companyProfileId)
    .single();

  if (profileErr || !profile) {
    return {
      status: "skipped_no_profile",
      reason: profileErr?.message || "company_profile not found",
    };
  }

  const scanDate = todayUtcDate();
  const signals = await loadSignalsForWindow(
    supabase,
    scanDate,
    PREVIEW_LOOKBACK_HOURS
  );

  if (signals.length === 0) {
    return {
      status: "skipped_no_signals",
      reason: "no signals in last 24h — preview deferred to next scan",
    };
  }

  const result = await processProfileSignals(
    supabase,
    profile as CompanyProfile,
    signals,
    scanDate,
    {
      usePackage8Preview: true,
      writeBriefingRows: true,
      useCompanySpecificRetrieval: process.env.COMPANY_SPECIFIC_RETRIEVAL_ENABLED === "1",
      enableDeepDiveRetrieval: process.env.COMPANY_DEEP_DIVE_RETRIEVAL_ENABLED === "1",
      lookbackHours: PREVIEW_LOOKBACK_HOURS,
    }
  );

  if (!result.briefing_id) {
    return {
      status: result.reason === "package8_qa_blocked" ? "skipped_qa_blocked" : "skipped_write_gated",
      briefing_id: null,
      signals_considered: result.signals_considered,
      signals_selected: result.signals_selected,
      reason: result.reason || "scanner report preview did not write a briefing row",
    };
  }

  return {
    status: "generated",
    briefing_id: result.briefing_id,
    signals_considered: result.signals_considered,
    signals_selected: result.signals_selected,
  };
}
