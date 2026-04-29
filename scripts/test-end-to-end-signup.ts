#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// End-to-end signup smoke test — Package 7 CP6.
//
// Walks the full new-customer path on the live (or local) Supabase project:
//   1. create test auth user
//   2. verify profile auto-created by handle_new_user trigger
//   3. insert company_profile (onboarding_completed=false) with sample data
//   4. mark onboarding_completed=true
//   5. assignFreeTrial — verify subscription_status='trialing', trial_end_at ≈ now + 3d
//   6. generatePreviewBriefing — verify briefing exists in company_briefings
//      (or accept skipped_no_signals as a valid outcome on idle DBs)
//   7. runCompanySignalPipeline (dry-run) against most recent signal_date —
//      verify our profile is processed, not skipped for entitlement
//   8. verify shouldGenerateBriefing returns true for the owner
//
// Cleanup runs in finally, always. Idempotent: deleting the company_profile
// cascades to all *_matches / *_scores / *_summaries / *_mappings child
// tables and to company_briefings (all FKs are ON DELETE CASCADE). The
// profiles → auth.users FK has NO cascade, so we delete the profiles row
// before calling auth.admin.deleteUser.
//
//   npx tsx scripts/test-end-to-end-signup.ts
//
// Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.
// ---------------------------------------------------------------------------
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { assignFreeTrial } from "../src/lib/billing/trial";
import { generatePreviewBriefing } from "../src/lib/company-scan/generate-preview-briefing";
import { runCompanySignalPipeline } from "../src/lib/company-scan/run-signal-pipeline";
import { shouldGenerateBriefing } from "../src/lib/tier-enforcement";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const ts = Date.now();
const email = `e2e-test-${ts}@example.com`;
const password = `e2e-${ts}-aB1!`;

let userId: string | null = null;
let companyProfileId: string | null = null;

function log(msg: string) {
  console.log(msg);
}

async function preflight() {
  // Probe the profiles table for the Pkg 7 columns. If they're missing the
  // user has not yet applied 20260426_add_test_account_and_trial.sql against
  // the live DB — fail fast with an actionable message before we create
  // anything that needs cleaning up.
  const { error } = await supabase
    .from("profiles")
    .select("id, is_test_account, trial_end_at")
    .limit(1);
  if (error) {
    if (
      error.message.includes("is_test_account") ||
      error.message.includes("trial_end_at")
    ) {
      throw new Error(
        "Pkg 7 migration not applied. Run 20260426_add_test_account_and_trial.sql " +
          "against the live DB, then re-run this test.",
      );
    }
    throw new Error(`preflight profile probe: ${error.message}`);
  }
}

async function main() {
  await preflight();

  log(`[1/8] creating test user: ${email}`);
  const { data: created, error: createErr } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
  if (createErr || !created?.user) {
    throw new Error(`createUser failed: ${createErr?.message ?? "no user"}`);
  }
  userId = created.user.id;
  log(`     ✓ user created: ${userId}`);

  log(`[2/8] verifying profile auto-created by handle_new_user trigger`);
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select(
      "id, email, subscription_status, subscription_tier, is_test_account",
    )
    .eq("id", userId)
    .maybeSingle();
  if (pErr) throw new Error(`profile lookup: ${pErr.message}`);
  if (!profile) {
    throw new Error(
      "profile row not auto-created — handle_new_user trigger missing or broken",
    );
  }
  if (profile.subscription_status !== null) {
    throw new Error(
      `expected fresh profile.subscription_status=null, got ${profile.subscription_status}`,
    );
  }
  log(`     ✓ profile exists, subscription_status=null (fresh)`);

  log(`[3/8] creating company_profile (onboarding_completed=false)`);
  const { data: cp, error: cpErr } = await supabase
    .from("company_profiles")
    .insert({
      owner_id: userId,
      company_name: `E2E Test Co ${ts}`,
      onboarding_completed: false,
      sector: "energy",
      sub_sector: "oil-gas",
      countries: ["US", "GB"],
      regions: ["north-america", "europe"],
      tracked_themes: ["energy-transition", "oil-prices"],
      watchlist_entities: ["BP", "Shell"],
      risk_priorities: ["commodity-price-volatility", "geopolitical-conflict"],
      supply_chain_exposure: ["crude-oil"],
      preferred_briefing_depth: "standard",
      preferred_delivery_time: "07:00",
      timezone: "Europe/London",
      email_enabled: true,
      email_recipients: [email],
      dashboard_enabled: true,
    })
    .select("id")
    .single();
  if (cpErr || !cp) {
    throw new Error(
      `company_profile insert failed: ${cpErr?.message ?? "no row"}`,
    );
  }
  companyProfileId = cp.id;
  log(`     ✓ company_profile created: ${companyProfileId}`);

  log(`[4/8] marking onboarding_completed=true`);
  const { error: ucErr } = await supabase
    .from("company_profiles")
    .update({ onboarding_completed: true })
    .eq("id", companyProfileId);
  if (ucErr) throw new Error(`onboarding flip failed: ${ucErr.message}`);
  log(`     ✓ onboarding completed`);

  log(`[5/8] calling assignFreeTrial`);
  const trial = await assignFreeTrial(supabase, userId);
  if (trial.error) throw new Error(`assignFreeTrial: ${trial.error}`);
  if (!trial.assigned) {
    throw new Error(
      `assignFreeTrial returned assigned=false (unexpected for fresh user)`,
    );
  }
  const { data: postTrial, error: ptErr } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_tier, trial_end_at")
    .eq("id", userId)
    .single();
  if (ptErr || !postTrial)
    throw new Error(`post-trial read: ${ptErr?.message}`);
  if (postTrial.subscription_status !== "trialing") {
    throw new Error(
      `expected subscription_status='trialing', got ${postTrial.subscription_status}`,
    );
  }
  if (!postTrial.trial_end_at) {
    throw new Error("trial_end_at not set");
  }
  const trialEndMs = new Date(postTrial.trial_end_at).getTime();
  const threeDaysMs = 3 * 24 * 3600 * 1000;
  const driftMs = Math.abs(trialEndMs - (Date.now() + threeDaysMs));
  if (driftMs > 5 * 60_000) {
    throw new Error(
      `trial_end_at not ~3 days out (drift=${Math.round(driftMs / 1000)}s): ${postTrial.trial_end_at}`,
    );
  }
  log(
    `     ✓ trialing, tier=${postTrial.subscription_tier}, ends ${postTrial.trial_end_at}`,
  );

  log(`[6/8] calling generatePreviewBriefing`);
  const preview = await generatePreviewBriefing(supabase, companyProfileId);
  log(`     status=${preview.status}`);
  if (preview.status === "generated") {
    if (!preview.briefing_id) {
      throw new Error("preview reported generated but briefing_id is null");
    }
    const { data: brief, error: bfErr } = await supabase
      .from("company_briefings")
      .select("id, status, briefing_date, company_profile_id")
      .eq("id", preview.briefing_id)
      .single();
    if (bfErr || !brief) {
      throw new Error(
        `preview returned id ${preview.briefing_id} but row not found: ${bfErr?.message}`,
      );
    }
    if (brief.company_profile_id !== companyProfileId) {
      throw new Error(`preview briefing belongs to wrong company_profile`);
    }
    log(
      `     ✓ briefing ${brief.id} (${brief.status}) for ${brief.briefing_date}, ` +
        `signals_considered=${preview.signals_considered}, signals_selected=${preview.signals_selected}`,
    );
  } else if (preview.status === "skipped_no_signals") {
    log(
      `     ↷ no signals in last 24h — preview deferred (acceptable on idle DB)`,
    );
  } else {
    throw new Error(`unexpected preview status: ${preview.status}`);
  }

  log(`[7/8] running signal pipeline against most recent scan (dry-run)`);
  const { data: latestSignals, error: lsErr } = await supabase
    .from("signals")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1);
  if (lsErr) throw new Error(`signals lookup: ${lsErr.message}`);
  if (!latestSignals || latestSignals.length === 0) {
    log(`     ↷ no signals in DB — skipping pipeline run`);
  } else {
    const scanDate = (latestSignals[0].created_at as string).split("T")[0];
    log(`     using scan_date=${scanDate}`);
    const summary = await runCompanySignalPipeline(supabase, {
      scanDate,
      lookbackHours: 72,
      dryRun: true,
    });
    log(`     pipeline loaded ${summary.signals_loaded} signals`);
    const ours = summary.results.find(
      (r) => r.company_profile_id === companyProfileId,
    );
    if (summary.signals_loaded === 0) {
      log(`     ↷ window had 0 signals — accepted`);
    } else if (!ours) {
      throw new Error(
        `our profile ${companyProfileId} not present in pipeline results`,
      );
    } else if (ours.status === "skipped") {
      throw new Error(`pipeline skipped our profile: ${ours.reason}`);
    } else {
      log(
        `     ✓ profile processed: signals_selected=${ours.signals_selected}, signal_level=${ours.signal_level}`,
      );
    }
  }

  log(`[8/8] verifying shouldGenerateBriefing returns true`);
  const { data: ownerNow, error: onErr } = await supabase
    .from("profiles")
    .select(
      "id, subscription_status, subscription_tier, subscription_period_end, is_test_account, trial_end_at",
    )
    .eq("id", userId)
    .single();
  if (onErr || !ownerNow) {
    throw new Error(`final profile read: ${onErr?.message}`);
  }
  const ent = shouldGenerateBriefing(ownerNow);
  if (!ent) {
    throw new Error(
      `shouldGenerateBriefing returned false unexpectedly: ${JSON.stringify(ownerNow)}`,
    );
  }
  log(`     ✓ shouldGenerateBriefing = true`);

  log(`\n✅ end-to-end test passed.`);
}

async function cleanup() {
  if (!userId) return;
  log(`\n🧹 cleanup`);
  try {
    // company_profile delete cascades through ON DELETE CASCADE to:
    //   company_briefings, company_signal_matches, company_story_scores,
    //   company_coverage_summaries, company_canonical_mappings
    if (companyProfileId) {
      const { error } = await supabase
        .from("company_profiles")
        .delete()
        .eq("id", companyProfileId);
      if (error) log(`  ⚠ company_profiles delete: ${error.message}`);
      else log(`  ✓ company_profile + cascaded children deleted`);
    } else {
      const { error } = await supabase
        .from("company_profiles")
        .delete()
        .eq("owner_id", userId);
      if (error)
        log(`  ⚠ company_profiles by owner_id delete: ${error.message}`);
    }

    // profiles → auth.users FK has no ON DELETE rule; delete explicitly so
    // auth.admin.deleteUser doesn't trip on a referencing row.
    const { error: pErr } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);
    if (pErr) log(`  ⚠ profiles delete: ${pErr.message}`);

    const { error: uErr } = await supabase.auth.admin.deleteUser(userId);
    if (uErr) log(`  ⚠ auth.admin.deleteUser: ${uErr.message}`);
    else log(`  ✓ auth user deleted: ${userId}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`  ⚠ cleanup threw: ${msg}`);
  }
}

main()
  .catch((err) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ end-to-end test FAILED: ${msg}`);
    process.exitCode = 1;
  })
  .finally(() => cleanup());
