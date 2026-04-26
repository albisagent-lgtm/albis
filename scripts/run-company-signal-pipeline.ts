#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// Company signal pipeline — Package 5.
//
// New equivalent of run-company-briefing-pipeline.ts that reads from the
// typed signals layer (signals + company_scan_runs) instead of the public
// scan_items pool. Per the brief:
//
//   - Both pipelines exist side-by-side until Package 6 wires real
//     retrieval and signals start flowing.
//   - This script does NOT deliver email; it only produces briefings.
//     Delivery stays with run-company-briefing-pipeline.ts for now.
//   - If no signals exist for the requested window, this script exits
//     without touching company_briefings — the legacy pipeline keeps
//     producing briefings until cutover.
// ---------------------------------------------------------------------------
import path from 'path';
import dotenv from 'dotenv';
import { createAdminClient } from '../src/lib/supabase/admin';
import { requireCompanyBriefingRows } from '../src/lib/pipeline-db';
import {
  scoreStoriesForCompany,
  getSelectedStories,
  determineSignalLevel,
} from '../src/lib/relevance-engine';
import { adaptSignalToScoringInput } from '../src/lib/scoring-adapters';
import { shouldGenerateBriefing } from '../src/lib/tier-enforcement';
import type { CompanyProfile } from '../src/lib/company-profile';
import type { BriefingContent } from '../src/lib/email-templates/company-briefing';
import { buildCoverageSummary } from '../src/lib/coverage-builder';
import { loadCanonicalIndexForProfile, emptyCanonicalIndex } from '../src/lib/canonical-index';
import { buildBriefingContent } from '../src/lib/company-briefing-templating';
import type { Signal } from '../src/lib/company-scan/types';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

type OwnerProfile = {
  id: string;
  subscription_status: string | null;
  subscription_tier: string | null;
  subscription_period_end: string | null;
};

function fail(message: string): never {
  console.error(`❌ ${message}`);
  process.exit(1);
}

interface ParsedArgs {
  scanDate: string;
  lookbackHours: number;
  dryRun: boolean;
}

function parseArgs(): ParsedArgs {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const explicitDate = argv.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
  const lookbackArg = argv.find((a) => a.startsWith('--lookback-hours='));
  const lookbackHours = lookbackArg
    ? parseInt(lookbackArg.split('=')[1], 10) || 24
    : 24;
  const scanDate = explicitDate || (() => {
    const now = new Date();
    const nzDate = new Date(now.getTime() + 13 * 60 * 60 * 1000);
    return nzDate.toISOString().split('T')[0];
  })();
  return { scanDate, lookbackHours, dryRun };
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

async function loadSignalsForWindow(
  supabase: ReturnType<typeof createAdminClient>,
  scanDate: string,
  lookbackHours: number
): Promise<Signal[]> {
  // Window: from (scanDate - lookbackHours) to end of scanDate. Inclusive
  // of any earlier signals that might still be relevant for today's
  // briefing — mirrors how the public scan pool feeds late-breaking
  // overnight stories into the next-day briefing.
  const endTs = new Date(`${scanDate}T23:59:59Z`).toISOString();
  const startTs = new Date(
    new Date(`${scanDate}T00:00:00Z`).getTime() - lookbackHours * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from('signals')
    .select('*')
    .gte('created_at', startTs)
    .lte('created_at', endTs)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`failed to load signals: ${error.message}`);
  return (data || []) as Signal[];
}

async function main() {
  const { scanDate, lookbackHours, dryRun } = parseArgs();
  const supabase = createAdminClient();

  console.log(
    `🚀 Running company SIGNAL pipeline for ${scanDate}` +
      ` (lookback=${lookbackHours}h${dryRun ? ', dry-run' : ''})`
  );

  const signals = await loadSignalsForWindow(supabase, scanDate, lookbackHours);
  console.log(`  ↳ loaded ${signals.length} signals`);

  if (signals.length === 0) {
    console.log(
      '↷ No signals in window — Package 6 will populate. ' +
        'Skipping briefing generation; legacy pipeline retains responsibility for today.'
    );
    return;
  }

  const { data: profiles, error: profileErr } = await supabase
    .from('company_profiles')
    .select('*')
    .eq('onboarding_completed', true);
  if (profileErr) fail(`Failed to load company profiles: ${profileErr.message}`);
  if (!profiles || profiles.length === 0) fail('No onboarding-complete company profiles found');
  console.log(`✅ Loaded ${profiles.length} company profiles`);

  const ownerIds = unique(profiles.map((p) => p.owner_id));
  const { data: ownerProfiles, error: ownerErr } = await supabase
    .from('profiles')
    .select('id, subscription_status, subscription_tier, subscription_period_end')
    .in('id', ownerIds);
  if (ownerErr) fail(`Failed to load owner profiles: ${ownerErr.message}`);
  const ownerMap = new Map((ownerProfiles || []).map((o: OwnerProfile) => [o.id, o]));

  const results: Array<Record<string, unknown>> = [];

  for (const rawProfile of profiles as CompanyProfile[]) {
    const owner = ownerMap.get(rawProfile.owner_id);
    if (!owner || !shouldGenerateBriefing(owner)) {
      console.log(`↷ Skipping ${rawProfile.company_name}: subscription inactive`);
      results.push({ company_name: rawProfile.company_name, status: 'skipped', reason: 'subscription_inactive' });
      continue;
    }

    console.log(`\n▶ Processing ${rawProfile.company_name}`);

    let canonicalIndex;
    try {
      canonicalIndex = await loadCanonicalIndexForProfile(supabase, rawProfile.id);
    } catch (err) {
      console.warn(`⚠️ canonical index load failed (using raw fallback): ${err instanceof Error ? err.message : String(err)}`);
      canonicalIndex = emptyCanonicalIndex();
    }

    const adapted = signals.map((s) => adaptSignalToScoringInput(s));
    const scored = scoreStoriesForCompany(adapted, rawProfile, canonicalIndex);
    const selected = getSelectedStories(scored);
    const signalLevel = determineSignalLevel(selected);

    // Map ScoredStory back to its source Signal row. Headlines should be
    // unique within a single batch (scan-engine dedupes by source_url),
    // but if duplicates exist we match on first-unused order so each
    // ScoredStory consumes a distinct Signal id.
    const remaining = new Set(signals.map((s) => s.id));
    const signalsByHeadline = new Map<string, Signal[]>();
    for (const s of signals) {
      const list = signalsByHeadline.get(s.headline) || [];
      list.push(s);
      signalsByHeadline.set(s.headline, list);
    }

    if (dryRun) {
      console.log(`  (dry-run) would write ${scored.length} company_signal_matches rows (${selected.length} selected)`);
      results.push({
        company_name: rawProfile.company_name,
        signals_considered: signals.length,
        signals_selected: selected.length,
        signal_level: signalLevel,
        status: 'dry_run',
      });
      continue;
    }

    // Wipe prior matches for this profile against the current signal set.
    // signal_id is FK so we can delete by company + signal_id list, but
    // per (company, signal) there's a unique constraint anyway — upsert
    // is sufficient. We use upsert below.
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
        .from('company_signal_matches')
        .upsert(matchRows, { onConflict: 'company_profile_id,signal_id' });
      if (upsertErr) fail(`Failed to upsert company_signal_matches: ${upsertErr.message}`);
    }
    console.log(`✅ Wrote ${matchRows.length} company_signal_matches rows (${selected.length} selected)`);

    const briefingContent: BriefingContent = buildBriefingContent(
      rawProfile,
      scanDate,
      signalLevel,
      selected
    );

    const { data: briefingRow, error: briefingErr } = await supabase
      .from('company_briefings')
      .upsert(
        {
          company_profile_id: rawProfile.id,
          briefing_date: scanDate,
          status: 'generated',
          delivery_status: 'pending',
          stories_considered: signals.length,
          stories_selected: selected.length,
          briefing_content: briefingContent,
          generated_at: new Date().toISOString(),
        },
        { onConflict: 'company_profile_id,briefing_date' }
      )
      .select('id')
      .single();
    if (briefingErr || !briefingRow) {
      fail(`Failed to upsert company_briefings: ${briefingErr?.message || 'no row'}`);
    }
    console.log(`✅ Upserted company_briefings row ${briefingRow.id} (generated, delivery deferred to legacy)`);

    // Stamp briefing_id onto the selected matches so they trace back to
    // the briefing they fed into.
    if (briefingRow) {
      const selectedSignalIds = matchRows
        .filter((m) => m.selected_for_briefing)
        .map((m) => m.signal_id);
      if (selectedSignalIds.length > 0) {
        const { error: stampErr } = await supabase
          .from('company_signal_matches')
          .update({ briefing_id: briefingRow.id })
          .eq('company_profile_id', rawProfile.id)
          .in('signal_id', selectedSignalIds);
        if (stampErr) {
          console.warn(`⚠️ failed to stamp briefing_id on signal matches: ${stampErr.message}`);
        }
      }
    }

    try {
      // Pass the raw signals[] alongside adapted ScanItemInput[] so
      // coverage-builder populates by_language / by_region from real
      // signal source metadata. The adapted[] arg stays for legacy
      // compatibility but is unused on this code path.
      const coverage = await buildCoverageSummary(
        supabase,
        rawProfile,
        scored,
        adapted,
        scanDate,
        { signals }
      );
      const { error: coverageErr } = await supabase
        .from('company_coverage_summaries')
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
          { onConflict: 'company_profile_id,coverage_date' }
        );
      if (coverageErr) throw new Error(coverageErr.message);
      console.log(
        `✅ Wrote coverage summary (${coverage.tracked_items_checked.length} tracked, ` +
          `${coverage.silent_items.length} silent, ${coverage.early_signals.length} early)`
      );
    } catch (err) {
      console.warn(`⚠️ coverage summary failed (non-fatal): ${err instanceof Error ? err.message : String(err)}`);
    }

    results.push({
      company_name: rawProfile.company_name,
      company_profile_id: rawProfile.id,
      signals_considered: signals.length,
      signals_selected: selected.length,
      signal_level: signalLevel,
      briefing_id: briefingRow?.id || null,
    });
  }

  if (!dryRun) {
    const briefingRows = await requireCompanyBriefingRows(supabase, scanDate);
    console.log(`✅ Verified ${briefingRows.length} company_briefings row(s) for ${scanDate}`);
  }

  console.log('\n🎉 Company signal pipeline complete');
  console.log(JSON.stringify({ scan_date: scanDate, lookback_hours: lookbackHours, dry_run: dryRun, results }, null, 2));
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
