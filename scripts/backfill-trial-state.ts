#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// One-off backfill: assign 3-day trials to existing onboarded users who have
// no subscription_status yet — Package 7.
//
// Run AFTER the 20260426_add_test_account_and_trial.sql migration has been
// applied to the live DB.
//
//   npx tsx scripts/backfill-trial-state.ts            # dry-run
//   npx tsx scripts/backfill-trial-state.ts --apply    # write
//
// Selection:
//   - has an onboarded company_profile (onboarding_completed = true)
//   - profiles.subscription_status IS NULL
//   - profiles.is_test_account = false
//
// Trial dates restart from now() — we deliberately do NOT pretend the user
// signed up in the past.
// ---------------------------------------------------------------------------
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { assignFreeTrial, TRIAL_DURATION_DAYS } from "../src/lib/billing/trial";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const apply = process.argv.includes("--apply");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  console.log(
    `🔍 Backfill trial state — ${apply ? "APPLY mode" : "dry-run"} ` +
      `(trial duration: ${TRIAL_DURATION_DAYS} days)\n`,
  );

  // Eligible owners: have an onboarded company profile.
  const { data: companies, error: cErr } = await supabase
    .from("company_profiles")
    .select("owner_id, company_name")
    .eq("onboarding_completed", true);
  if (cErr) {
    console.error(`failed to load company_profiles: ${cErr.message}`);
    process.exit(1);
  }
  if (!companies || companies.length === 0) {
    console.log("No onboarded company profiles. Nothing to backfill.");
    return;
  }

  const ownerIds = [...new Set(companies.map((c) => c.owner_id))];
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, email, subscription_status, is_test_account, trial_end_at")
    .in("id", ownerIds);
  if (pErr) {
    console.error(`failed to load profiles: ${pErr.message}`);
    process.exit(1);
  }

  const ownerToCompanies = new Map<string, string[]>();
  for (const c of companies) {
    const list = ownerToCompanies.get(c.owner_id) || [];
    list.push(c.company_name);
    ownerToCompanies.set(c.owner_id, list);
  }

  const eligible = (profiles || []).filter(
    (p) => p.subscription_status === null && !p.is_test_account,
  );
  const skipped = (profiles || []).filter(
    (p) => p.subscription_status !== null || p.is_test_account,
  );

  console.log(`Found ${profiles?.length ?? 0} onboarded owner profiles:`);
  console.log(`  • ${eligible.length} eligible for trial backfill`);
  console.log(
    `  • ${skipped.length} skipped (already-statused or test-acct)\n`,
  );

  if (skipped.length > 0) {
    console.log("Skipped:");
    for (const p of skipped) {
      const reason = p.is_test_account
        ? "is_test_account"
        : `status=${p.subscription_status}`;
      console.log(
        `  - ${p.email ?? p.id} → ${reason} ` +
          `[${(ownerToCompanies.get(p.id) || []).join(", ")}]`,
      );
    }
    console.log();
  }

  if (eligible.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  console.log(`Eligible:`);
  for (const p of eligible) {
    console.log(
      `  + ${p.email ?? p.id} ` +
        `[${(ownerToCompanies.get(p.id) || []).join(", ")}]`,
    );
  }
  console.log();

  if (!apply) {
    console.log("🟡 Dry-run only. Re-run with --apply to write trials.");
    return;
  }

  let assigned = 0;
  let noop = 0;
  for (const p of eligible) {
    const result = await assignFreeTrial(supabase, p.id);
    if (result.error) {
      console.error(`  ✗ ${p.email ?? p.id} — ${result.error}`);
      continue;
    }
    if (result.assigned) {
      assigned++;
      console.log(`  ✓ ${p.email ?? p.id} — trial ends ${result.trialEndAt}`);
    } else {
      noop++;
      console.log(
        `  · ${p.email ?? p.id} — no-op (status changed since dry-run)`,
      );
    }
  }

  console.log(
    `\n✅ Assigned trials to ${assigned} profile(s) (${noop} no-op).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
