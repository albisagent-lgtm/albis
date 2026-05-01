#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// Build local researched-understanding artifacts from the company scan pipeline.
//
// This is intentionally review-gated and side-effect light:
// - no company_briefings writes
// - no email sends
// - no customer delivery
// - no live deep-dive retrieval unless --deep-dive-retrieval is explicitly set
//
// It exists so product/writing iterations can inspect the new research dossier
// layer before DB persistence or delivery wiring.
// ---------------------------------------------------------------------------

import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import { createAdminClient } from "../src/lib/supabase/admin";
import { loadSignalsForWindow } from "../src/lib/company-scan/run-signal-pipeline";
import { runCompanyPackage8PipelineForProfile } from "../src/lib/company-scan/company-package8-pipeline";
import type { CompanyProfile } from "../src/lib/company-profile";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

type Args = {
  scanDate: string;
  lookbackHours: number;
  companyName?: string;
  companyProfileId?: string;
  deepDiveRetrieval: boolean;
  outDir: string;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const explicitDate = argv.find((arg) => /^\d{4}-\d{2}-\d{2}$/.test(arg));
  const lookbackArg = argv.find((arg) => arg.startsWith("--lookback-hours="));
  const companyName = argv.find((arg) => arg.startsWith("--company="))?.split("=")[1];
  const companyProfileId = argv.find((arg) => arg.startsWith("--company-profile-id="))?.split("=")[1];
  const outDir =
    argv.find((arg) => arg.startsWith("--out-dir="))?.split("=")[1] ||
    path.resolve(process.cwd(), ".artifacts/researched-understanding");
  const scanDate = explicitDate || new Date().toISOString().slice(0, 10);
  return {
    scanDate,
    lookbackHours: lookbackArg ? parseInt(lookbackArg.split("=")[1], 10) || 24 : 24,
    companyName,
    companyProfileId,
    deepDiveRetrieval: argv.includes("--deep-dive-retrieval"),
    outDir,
  };
}

function slugify(value: string): string {
  return (
    String(value || "company")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "company"
  );
}

async function main() {
  const args = parseArgs();
  const supabase = createAdminClient();
  const signals = await loadSignalsForWindow(supabase, args.scanDate, args.lookbackHours);

  const { data: profiles, error } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("onboarding_completed", true);
  if (error) throw new Error(`Failed to load company profiles: ${error.message}`);

  const filtered = ((profiles || []) as CompanyProfile[]).filter((profile) => {
    if (args.companyProfileId && profile.id !== args.companyProfileId) return false;
    if (args.companyName && profile.company_name !== args.companyName) return false;
    return true;
  });
  if (filtered.length === 0) throw new Error("No company profiles matched the requested filter");

  const dateDir = path.join(args.outDir, args.scanDate);
  await fs.mkdir(dateDir, { recursive: true });

  for (const profile of filtered) {
    const result = await runCompanyPackage8PipelineForProfile(supabase, profile, signals, {
      scanDate: args.scanDate,
      lookbackHours: args.lookbackHours,
      dryRun: true,
      enableDeepDiveRetrieval: args.deepDiveRetrieval,
      log: (message) => console.log(message),
    });
    const layer = result.briefing_content?.understanding?.researched_understanding_v1;
    if (!layer) throw new Error(`No researched understanding layer generated for ${profile.company_name}`);
    const artifact = {
      generated_at: new Date().toISOString(),
      no_delivery: true,
      no_db_write: true,
      company_name: profile.company_name,
      scan_date: args.scanDate,
      summary: {
        clusters: layer.clusters.length,
        findings: layer.findings.length,
        research_sources: layer.source_trail_summary.research_sources,
        evidence_sources: layer.source_trail_summary.evidence_sources,
        email_sources: layer.source_trail_summary.email_sources,
        qa: layer.qa,
      },
      researched_understanding: layer,
      evidence_document: result.evidence_document,
    };
    const file = path.join(dateDir, `${slugify(profile.company_name)}.json`);
    await fs.writeFile(file, JSON.stringify(artifact, null, 2));
    console.log(`✅ Wrote ${file}`);
  }
}

main().catch((err) => {
  console.error(`❌ ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
