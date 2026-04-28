#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// Company signal pipeline — Package 5/6.
//
// CLI wrapper around src/lib/company-scan/run-signal-pipeline.ts. The
// real work lives in the lib so the cron HTTP handler can call it
// directly without spawning a script.
//
// Reads from the typed signals layer instead of the public scan_items
// pool. Skips delivery; Package 8/v2 delivery remains separately gated.
// If zero signals exist for the
// window, exits cleanly without touching company_briefings.
// ---------------------------------------------------------------------------
import path from 'path';
import dotenv from 'dotenv';
import { createAdminClient } from '../src/lib/supabase/admin';
import { runCompanySignalPipeline } from '../src/lib/company-scan/run-signal-pipeline';
import { requireCompanyBriefingRows } from '../src/lib/pipeline-db';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

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

async function main() {
  const { scanDate, lookbackHours, dryRun } = parseArgs();
  const supabase = createAdminClient();

  const summary = await runCompanySignalPipeline(supabase, {
    scanDate,
    lookbackHours,
    dryRun,
    log: (m) => console.log(m),
    warn: (m) => console.warn(m),
  });

  if (!dryRun && !summary.skipped_no_signals) {
    const briefingRows = await requireCompanyBriefingRows(supabase, scanDate);
    console.log(`✅ Verified ${briefingRows.length} company_briefings row(s) for ${scanDate}`);
  }

  console.log('\n🎉 Company signal pipeline complete');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(`❌ ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
