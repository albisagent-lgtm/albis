#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// Private Company Intelligence Wiki dry-run.
//
// Runs the existing Package 8/Pass 2 path for one company/date, then prints the
// profile/page/change-log updates that would be written. This performs DB reads
// only and never writes, regardless of local env settings.
// ---------------------------------------------------------------------------

import path from "path";
import dotenv from "dotenv";
import { createAdminClient } from "../src/lib/supabase/admin";
import { runCompanyPackage8PipelineForProfile } from "../src/lib/company-scan/company-package8-pipeline";
import { retrieveCompanySpecificSignals } from "../src/lib/company-scan/company-specific-retrieval";
import type { Signal } from "../src/lib/company-scan/types";
import {
  buildCompanyIntelligenceDryRunReport,
  buildCompanyIntelligenceWikiUpdatePlan,
  loadCompanyIntelligenceWikiProfile,
} from "../src/lib/company-scan/company-intelligence-wiki";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

process.env.COMPANY_INTELLIGENCE_WIKI_ENABLED = "1";
process.env.COMPANY_INTELLIGENCE_WIKI_WRITE_ENABLED = "0";
process.env.COMPANY_PASS2_LEARNING_ENABLED = "1";

type Args = {
  date: string;
  lookbackHours: number;
  companyName?: string;
  companyProfileId?: string;
  briefingId?: string;
  companySpecificRetrieval: boolean;
  deepDiveRetrieval: boolean;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const dateArg = argv.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
  const today = new Date().toISOString().slice(0, 10);
  return {
    date: dateArg || today,
    lookbackHours: Number(argv.find((a) => a.startsWith("--lookback-hours="))?.split("=")[1] || 24),
    companyName: argv.find((a) => a.startsWith("--company="))?.split("=").slice(1).join("=") || undefined,
    companyProfileId: argv.find((a) => a.startsWith("--company-profile-id="))?.split("=")[1] || undefined,
    briefingId: argv.find((a) => a.startsWith("--briefing-id="))?.split("=")[1] || undefined,
    companySpecificRetrieval: argv.includes("--company-specific-retrieval"),
    deepDiveRetrieval: argv.includes("--deep-dive-retrieval"),
  };
}

async function main() {
  const args = parseArgs();
  const supabase = createAdminClient();

  let query = supabase.from("company_profiles").select("*");
  if (args.companyProfileId) query = query.eq("id", args.companyProfileId);
  else query = query.eq("company_name", args.companyName || "Test Company");
  const { data: profile, error: profileErr } = await query.single();
  if (profileErr || !profile) throw new Error(`Failed to load company profile: ${profileErr?.message || "missing"}`);

  const endTs = new Date(`${args.date}T23:59:59Z`).toISOString();
  const startTs = new Date(new Date(`${args.date}T00:00:00Z`).getTime() - args.lookbackHours * 60 * 60 * 1000).toISOString();
  let signals: Signal[] = [];

  if (args.companySpecificRetrieval) {
    const retrieval = await retrieveCompanySpecificSignals(supabase, profile, {
      signalDate: args.date,
      log: (message) => console.log(message),
    });
    signals = retrieval.signals;
  } else {
    const { data, error } = await supabase
      .from("signals")
      .select("*")
      .gte("created_at", startTs)
      .lte("created_at", endTs)
      .order("created_at", { ascending: false });
    if (error) throw new Error(`Failed to load signals: ${error.message}`);
    signals = data || [];
  }

  const artifact = await runCompanyPackage8PipelineForProfile(supabase, profile, signals, {
    scanDate: args.date,
    lookbackHours: args.lookbackHours,
    dryRun: true,
    enableDeepDiveRetrieval: args.deepDiveRetrieval,
    log: (message) => console.log(message),
  });

  if (!artifact.pass2_learning) throw new Error("Package 8 did not produce Pass 2 learning");
  const existing = await loadCompanyIntelligenceWikiProfile(supabase, profile.id);
  const plan = buildCompanyIntelligenceWikiUpdatePlan(artifact.pass2_learning, existing);

  console.log(buildCompanyIntelligenceDryRunReport(plan));
  console.log(JSON.stringify({
    company_profile_id: profile.id,
    company_name: profile.company_name,
    scan_date: args.date,
    briefing_id: args.briefingId || artifact.run_id,
    write_performed: false,
    pages: plan.pages.map((p) => ({ page_type: p.page_type, confidence: p.confidence, keys: Object.keys(p.page_payload) })),
    changes: plan.change_log,
  }, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack || err.message : err);
  process.exit(1);
});
