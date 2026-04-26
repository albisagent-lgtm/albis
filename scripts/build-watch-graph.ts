#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// Build the union watch graph — Package 6 manual runner.
//
// Reads aggregate company demand and refreshes retrieval_clusters +
// scan_targets. Idempotent. Run before each scan cycle (or wire into the
// cron handler so it runs automatically).
// ---------------------------------------------------------------------------
import path from 'path';
import dotenv from 'dotenv';
import { createAdminClient } from '../src/lib/supabase/admin';
import { buildUnionWatchGraph } from '../src/lib/company-scan/watch-graph-builder';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const supabase = createAdminClient();
  console.log('🔧 Building union watch graph');
  const summary = await buildUnionWatchGraph(supabase);
  console.log('✅ Done');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(`❌ ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
