#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// One-shot backfill: map every existing company_profile's raw-string fields
// onto the canonical registry. Wraps the shared resolver in
// src/lib/canonical-resolver.ts.
//
// Behavior, ambiguity handling, and idempotency live in the shared resolver
// — this script just walks profiles and prints a summary.
//
// Usage: npx tsx scripts/migrate-company-profiles-to-canonical.ts
//        npx tsx scripts/migrate-company-profiles-to-canonical.ts --dry-run
// ---------------------------------------------------------------------------
import path from 'path';
import dotenv from 'dotenv';
import { createAdminClient } from '../src/lib/supabase/admin';
import { mapProfileToCanonicals } from '../src/lib/canonical-resolver';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const supabase = createAdminClient();

  const { data: profiles, error: profileErr } = await supabase
    .from('company_profiles')
    .select(
      'id, company_name, tracked_themes, watchlist_entities, regions, sector, sub_sector, risk_priorities, supply_chain_exposure'
    );
  if (profileErr) {
    console.error('❌ failed to load profiles:', profileErr.message);
    process.exit(1);
  }
  if (!profiles || profiles.length === 0) {
    console.log('No company_profiles rows to process.');
    return;
  }

  console.log(`🚀 mapping ${profiles.length} company profiles${dryRun ? ' (dry-run)' : ''}`);

  let totalMappedExisting = 0;
  let totalCreatedNew = 0;
  let totalAmbiguous = 0;
  let totalMappingsInserted = 0;
  let totalMappingsSkipped = 0;
  const allAmbiguities: Array<{ company_name: string; field: string; value: string }> = [];

  for (const profile of profiles) {
    const summary = await mapProfileToCanonicals(supabase, profile as never, { dryRun });
    totalMappedExisting += summary.mapped_existing;
    totalCreatedNew += summary.created_new;
    totalAmbiguous += summary.ambiguous;
    totalMappingsInserted += summary.mappings_inserted;
    totalMappingsSkipped += summary.mappings_skipped;
    for (const a of summary.ambiguity_log) {
      allAmbiguities.push({
        company_name: profile.company_name || profile.id,
        field: a.field,
        value: a.value,
      });
      console.warn(
        `   ⚠ ambiguous: "${a.value}" on profile ${profile.company_name || profile.id} (${a.field}) — multiple canonicals matched, skipping`
      );
    }
  }

  console.log('\n✨ company profile → canonical mapping complete');
  console.log(`   profiles processed: ${profiles.length}`);
  console.log(`   raw values mapped to existing canonicals: ${totalMappedExisting}`);
  console.log(`   new canonicals created from raw values: ${totalCreatedNew}`);
  console.log(`   ambiguous values flagged (skipped): ${totalAmbiguous}`);
  if (!dryRun) {
    console.log(
      `   company_canonical_mappings: ${totalMappingsInserted} inserted, ${totalMappingsSkipped} already present`
    );
  }
  if (allAmbiguities.length > 0) {
    console.log('\n⚠ ambiguity log (review manually):');
    for (const a of allAmbiguities) {
      console.log(`   - "${a.value}"  [profile=${a.company_name} field=${a.field}]`);
    }
  }
}

main().catch((err) => {
  console.error('❌ migration failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
