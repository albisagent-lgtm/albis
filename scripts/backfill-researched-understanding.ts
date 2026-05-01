#!/usr/bin/env tsx
// Backfill researched-understanding DB tables from existing company_briefings.
// Safe by default: requires RESEARCHED_UNDERSTANDING_WRITE_ENABLED=1 and only
// persists data already present in briefing_content. No emails/delivery.

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: "../.env.credentials" });

import { createAdminClient } from "../src/lib/supabase/admin";
import { persistResearchedUnderstandingLayer } from "../src/lib/company-scan/researched-understanding-persistence";
import type { CompanyBriefingGenerationOutput } from "../src/lib/company-scan/types";

interface Args {
  date?: string;
  company?: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (const arg of argv) {
    if (arg.startsWith("--date=")) args.date = arg.slice("--date=".length);
    if (arg.startsWith("--company=")) args.company = arg.slice("--company=".length);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (process.env.RESEARCHED_UNDERSTANDING_WRITE_ENABLED !== "1") {
    throw new Error(
      "Refusing to write. Set RESEARCHED_UNDERSTANDING_WRITE_ENABLED=1 to persist researched understanding.",
    );
  }

  const supabase = createAdminClient();
  let query = supabase
    .from("company_briefings")
    .select("id, company_profile_id, briefing_date, briefing_content, company_profiles(company_name)")
    .not("briefing_content->understanding->researched_understanding_v1", "is", null)
    .order("briefing_date", { ascending: false });

  if (args.date) query = query.eq("briefing_date", args.date);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data || []).filter((row: any) => {
    const companyName = row.company_profiles?.company_name || "";
    return !args.company || companyName.toLowerCase().includes(args.company.toLowerCase());
  });

  if (rows.length === 0) {
    console.log("No researched-understanding briefings found for filters.");
    return;
  }

  let totalClusters = 0;
  let totalSources = 0;
  let totalNotes = 0;
  let totalFindings = 0;

  for (const row of rows as any[]) {
    const content = row.briefing_content as CompanyBriefingGenerationOutput;
    const layer = content.understanding?.researched_understanding_v1;
    const result = await persistResearchedUnderstandingLayer(supabase, layer, row.id);
    totalClusters += result.clusters;
    totalSources += result.sources;
    totalNotes += result.notes;
    totalFindings += result.findings;
    console.log(
      `✅ ${row.company_profiles?.company_name || row.company_profile_id} ${row.briefing_date}: ` +
        `${result.clusters} clusters, ${result.sources} sources, ${result.notes} notes, ${result.findings} findings`,
    );
  }

  console.log(
    `Done: ${rows.length} briefing(s), ${totalClusters} clusters, ${totalSources} sources, ${totalNotes} notes, ${totalFindings} findings`,
  );
}

main().catch((error) => {
  console.error(`❌ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
