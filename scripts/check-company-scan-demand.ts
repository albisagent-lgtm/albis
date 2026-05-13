#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// Scheduled company-scan spend guard.
//
// Exits 0 only when at least one real (non-test) onboarded company is either
// paid/active or inside an unexpired trial. Exits 78 when there is no billable
// demand, so shell runners can skip live retrieval without treating it as a
// failure.
// ---------------------------------------------------------------------------
import path from "path";
import dotenv from "dotenv";
import { createAdminClient } from "../src/lib/supabase/admin";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

interface CompanyProfileRow {
  id: string;
  company_name: string;
  owner_id: string;
}

interface OwnerProfileRow {
  id: string;
  email: string | null;
  subscription_status: string | null;
  trial_end_at: string | null;
  is_test_account: boolean | null;
}

function hasBillableCompanyScanAccess(owner: OwnerProfileRow | undefined): boolean {
  if (!owner) return false;
  if (owner.is_test_account === true) return false;
  if (owner.subscription_status === "active") return true;
  if (owner.subscription_status !== "trialing") return false;
  if (!owner.trial_end_at) return false;
  return new Date(owner.trial_end_at).getTime() > Date.now();
}

async function main() {
  const supabase = createAdminClient();
  const [{ data: companyProfiles, error: companyErr }, { data: owners, error: ownerErr }] =
    await Promise.all([
      supabase
        .from("company_profiles")
        .select("id, company_name, owner_id")
        .eq("onboarding_completed", true),
      supabase
        .from("profiles")
        .select("id, email, subscription_status, trial_end_at, is_test_account"),
    ]);

  if (companyErr) throw new Error(`company_profiles load failed: ${companyErr.message}`);
  if (ownerErr) throw new Error(`profiles load failed: ${ownerErr.message}`);

  const ownersById = new Map(((owners || []) as OwnerProfileRow[]).map((owner) => [owner.id, owner]));
  const eligible = ((companyProfiles || []) as CompanyProfileRow[]).filter((profile) =>
    hasBillableCompanyScanAccess(ownersById.get(profile.owner_id)),
  );

  const summary = {
    eligible_company_profiles: eligible.length,
    eligible_companies: eligible.map((profile) => profile.company_name),
  };
  console.log(JSON.stringify(summary, null, 2));

  if (eligible.length === 0) {
    console.log("NO_ACTIVE_COMPANY_SCAN_DEMAND: skipping live company scanner to avoid search spend.");
    process.exit(78);
  }
}

main().catch((err) => {
  console.error(`❌ ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
