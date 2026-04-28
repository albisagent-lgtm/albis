// ---------------------------------------------------------------------------
// Company scan engine — Package 5.
//
// runCompanyScan is the new equivalent of the public scan runner, but
// scoped entirely to the company-side typed signals layer. Zero
// cross-reads with the public scan_items pool. Reads scan_targets, calls
// retrieval (stubbed in pkg 5, real in pkg 6), parses each article into
// a SignalDraft, resolves canonicals, dedupes, inserts into signals, and
// updates the company_scan_runs row.
//
// At pkg 5 scan_targets is empty → the engine completes cleanly with
// zero signals. The data flow path is exercised end-to-end so pkg 6 can
// drop in real retrieval without further engine changes.
// ---------------------------------------------------------------------------
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadCanonicalAliasIndex, type CanonicalAliasIndex } from "./canonical-alias-index";
import { parseSignalFromArticle } from "./signal-parser";
import { resolveSignalToCanonicals } from "./signal-resolver";
import { retrieveForTarget } from "./retrieval-brave";
import type {
  CompanyScanRun,
  ScanRunStatus,
  ScanRunWindow,
  ScanTarget,
  Signal,
  SignalDraft,
} from "./types";

export interface ScanRunSummary {
  scan_run_id: string;
  run_date: string;
  run_window: ScanRunWindow;
  status: ScanRunStatus;
  targets_inspected: number;
  signals_extracted: number;
  sources_consulted: number;
  error_summary: string | null;
}

interface ScanOptions {
  /** Inject an alias index for testing; otherwise loaded from Supabase. */
  aliasIndex?: CanonicalAliasIndex;
  /** Test seam — replace retrieval. Stubbed by default. */
  retrieve?: typeof retrieveForTarget;
}

/**
 * Insert (or upsert) a company_scan_runs row in 'running' state and
 * return the persisted row so the engine has the run id.
 */
async function startRunRow(
  supabase: SupabaseClient,
  runDate: string,
  runWindow: ScanRunWindow
): Promise<CompanyScanRun> {
  const { data, error } = await supabase
    .from("company_scan_runs")
    .upsert(
      {
        run_date: runDate,
        run_window: runWindow,
        status: "running",
        started_at: new Date().toISOString(),
        completed_at: null,
        targets_inspected: 0,
        signals_extracted: 0,
        sources_consulted: 0,
        error_summary: null,
      },
      { onConflict: "run_date,run_window" }
    )
    .select("*")
    .single();
  if (error || !data) throw new Error(`failed to start scan run: ${error?.message || "no row"}`);
  return data as CompanyScanRun;
}

async function finishRunRow(
  supabase: SupabaseClient,
  runId: string,
  patch: {
    status: ScanRunStatus;
    targets_inspected: number;
    signals_extracted: number;
    sources_consulted: number;
    error_summary: string | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from("company_scan_runs")
    .update({
      ...patch,
      completed_at: new Date().toISOString(),
    })
    .eq("id", runId);
  if (error) throw new Error(`failed to finalize scan run: ${error.message}`);
}

async function loadActiveScanTargets(supabase: SupabaseClient): Promise<ScanTarget[]> {
  const { data, error } = await supabase
    .from("scan_targets")
    .select("*")
    .eq("is_active", true);
  if (error) throw new Error(`failed to load scan_targets: ${error.message}`);
  return (data || []) as ScanTarget[];
}

/**
 * Normalise a URL for cross-target dedupe inside a single scan run.
 * Strips query strings, fragments, and trailing slashes. Lowercases
 * the host. Different retrieval providers (or the same provider via
 * different queries) often surface the same article URL with extra
 * tracking params — normalising prevents one article from becoming
 * two signals within the same run.
 */
function normaliseUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    u.search = "";
    u.hash = "";
    let pathname = u.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    return `${u.protocol}//${u.host.toLowerCase()}${pathname}`;
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

/**
 * Dedupe key for a SignalDraft. Prefers normalised source_url; falls
 * back to a stable headline+date composite. Aggregate dedupe across
 * scan runs is intentionally NOT done here — that's Package 8 work.
 */
function dedupeKey(draft: SignalDraft): string {
  if (draft.source_url) return `url::${normaliseUrl(draft.source_url)}`;
  return `hl::${draft.signal_date}::${draft.headline.toLowerCase()}`;
}

async function insertSignals(
  supabase: SupabaseClient,
  runId: string,
  drafts: SignalDraft[]
): Promise<Signal[]> {
  if (drafts.length === 0) return [];
  const rows = drafts.map((d) => ({ ...d, company_scan_run_id: runId }));
  const { data, error } = await supabase.from("signals").insert(rows).select("*");
  if (error) throw new Error(`failed to insert signals: ${error.message}`);
  return (data || []) as Signal[];
}

/**
 * Run a single company scan window. Idempotent at the (run_date,
 * run_window) level via upsert: re-running the same window resets it.
 *
 * At Package 5, scan_targets is empty. The engine logs that fact and
 * completes with status='completed' and zero signals. Once Package 6
 * populates scan_targets, the same code path produces real signals.
 */
export async function runCompanyScan(
  supabase: SupabaseClient,
  runDate: string,
  runWindow: ScanRunWindow,
  options: ScanOptions = {}
): Promise<ScanRunSummary> {
  const run = await startRunRow(supabase, runDate, runWindow);

  let status: ScanRunStatus = "running";
  let errorSummary: string | null = null;
  let targetsInspected = 0;
  let signalsExtracted = 0;
  let sourcesConsulted = 0;

  try {
    const targets = await loadActiveScanTargets(supabase);
    if (targets.length === 0) {
      console.log(
        "[scan-engine] No active scan targets — Package 6 will populate. " +
          "Completing run with zero signals."
      );
      status = "completed";
    } else {
      const aliasIndex = options.aliasIndex || (await loadCanonicalAliasIndex(supabase));
      const retrieve = options.retrieve || retrieveForTarget;
      const collected = new Map<string, SignalDraft>();
      let perTargetFailures = 0;

      for (const target of targets) {
        targetsInspected += 1;
        try {
          const result = await retrieve(target);
          sourcesConsulted += result.sources_consulted;
          for (const article of result.articles) {
            const draft = parseSignalFromArticle(article, aliasIndex);
            if (!draft) continue;
            // resolveSignalToCanonicals is a no-op when the parser
            // already populated canonical ids, but is correct for any
            // future article source that arrives raw.
            const resolved = resolveSignalToCanonicals(draft, aliasIndex);
            const key = dedupeKey(resolved);
            if (!collected.has(key)) collected.set(key, resolved);
          }
        } catch (err) {
          perTargetFailures += 1;
          console.warn(
            `[scan-engine] target ${target.id} (${target.target_type}/${target.target_value}) failed: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        }
      }

      const inserted = await insertSignals(supabase, run.id, [...collected.values()]);
      signalsExtracted = inserted.length;

      if (perTargetFailures === 0) status = "completed";
      else if (signalsExtracted > 0) {
        status = "partial_failure";
        errorSummary = `${perTargetFailures} of ${targetsInspected} targets failed retrieval`;
      } else {
        status = "failed";
        errorSummary = `all ${targetsInspected} targets failed retrieval`;
      }
    }
  } catch (err) {
    status = "failed";
    errorSummary = err instanceof Error ? err.message : String(err);
    console.error(`[scan-engine] fatal: ${errorSummary}`);
  }

  await finishRunRow(supabase, run.id, {
    status,
    targets_inspected: targetsInspected,
    signals_extracted: signalsExtracted,
    sources_consulted: sourcesConsulted,
    error_summary: errorSummary,
  });

  return {
    scan_run_id: run.id,
    run_date: run.run_date,
    run_window: run.run_window,
    status,
    targets_inspected: targetsInspected,
    signals_extracted: signalsExtracted,
    sources_consulted: sourcesConsulted,
    error_summary: errorSummary,
  };
}
