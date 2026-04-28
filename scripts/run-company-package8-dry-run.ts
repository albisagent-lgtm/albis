#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// Real company Package 8 dry-run verifier.
//
// Loads real company_profiles/signals from Supabase, runs the Package 8
// preview pipeline, and writes local artifacts only. No email is sent and no
// company_briefings row is written by this script.
// ---------------------------------------------------------------------------

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createAdminClient } from "../src/lib/supabase/admin";
import { runCompanyPackage8PipelineForProfile } from "../src/lib/company-scan/company-package8-pipeline";
import { retrieveCompanySpecificSignals } from "../src/lib/company-scan/company-specific-retrieval";
import { renderEvidenceDocumentMarkdown } from "../src/lib/company-scan/intelligence-depth";
import { generateCompanyEvidenceDashboardHtml } from "../src/lib/company-scan/company-briefing-evidence-dashboard";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

type Args = {
  date: string;
  lookbackHours: number;
  companyName: string;
  outDir: string;
  companySpecificRetrieval: boolean;
  deepDiveRetrieval: boolean;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const dateArg = argv.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
  const now = new Date();
  const nzDate = new Date(now.getTime() + 13 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return {
    date: dateArg || nzDate,
    lookbackHours: Number(argv.find((a) => a.startsWith("--lookback-hours="))?.split("=")[1] || 24),
    companyName: argv.find((a) => a.startsWith("--company="))?.split("=")[1] || "Test Company",
    outDir: argv.find((a) => a.startsWith("--out-dir="))?.split("=")[1] || "reports/company-package8-real-dry-run",
    companySpecificRetrieval: argv.includes("--company-specific-retrieval"),
    deepDiveRetrieval: argv.includes("--deep-dive-retrieval"),
  };
}

function slugify(s: string): string {
  return String(s || "item").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "item";
}

async function main() {
  const args = parseArgs();
  const supabase = createAdminClient();
  const endTs = new Date(`${args.date}T23:59:59Z`).toISOString();
  const startTs = new Date(new Date(`${args.date}T00:00:00Z`).getTime() - args.lookbackHours * 60 * 60 * 1000).toISOString();

  const { data: profile, error: profileErr } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("company_name", args.companyName)
    .single();
  if (profileErr || !profile) throw new Error(`Failed to load company profile: ${profileErr?.message || "missing"}`);

  let retrievalMetadata: any = null;
  let signals: any[] = [];

  if (args.companySpecificRetrieval) {
    const retrieval = await retrieveCompanySpecificSignals(supabase, profile, {
      signalDate: args.date,
      log: (message) => console.log(message),
    });
    retrievalMetadata = {
      mode: "company_specific_retrieval",
      intent: retrieval.intent,
      queries: retrieval.queries,
      articles_retrieved: retrieval.articles_retrieved,
      sources_consulted: retrieval.sources_consulted,
    };
    signals = retrieval.signals;
  } else {
    const { data, error: signalsErr } = await supabase
      .from("signals")
      .select("*")
      .gte("created_at", startTs)
      .lte("created_at", endTs)
      .order("created_at", { ascending: false });
    if (signalsErr) throw new Error(`Failed to load signals: ${signalsErr.message}`);
    signals = data || [];
    retrievalMetadata = { mode: "shared_signal_pool", start_ts: startTs, end_ts: endTs };
  }

  const artifact = await runCompanyPackage8PipelineForProfile(supabase, profile, signals, {
    scanDate: args.date,
    lookbackHours: args.lookbackHours,
    dryRun: true,
    enableDeepDiveRetrieval: args.deepDiveRetrieval,
    log: (message) => console.log(message),
  });

  const outDir = path.resolve(process.cwd(), args.outDir);
  fs.mkdirSync(outDir, { recursive: true });
  const base = `${slugify(profile.company_name)}-${args.date}`;
  const jsonPath = path.join(outDir, `${base}.json`);
  const htmlPath = path.join(outDir, `${base}.html`);
  const evidenceJsonPath = path.join(outDir, `${base}-evidence.json`);
  const evidenceMarkdownPath = path.join(outDir, `${base}-evidence.md`);
  const evidenceDashboardPath = path.join(outDir, `${base}-evidence-dashboard.html`);
  fs.writeFileSync(htmlPath, artifact.email.html);
  if (artifact.evidence_document) {
    fs.writeFileSync(evidenceJsonPath, JSON.stringify(artifact.evidence_document, null, 2));
    fs.writeFileSync(evidenceMarkdownPath, renderEvidenceDocumentMarkdown(artifact.evidence_document));
    fs.writeFileSync(evidenceDashboardPath, generateCompanyEvidenceDashboardHtml(artifact.evidence_document));
  }
  fs.writeFileSync(jsonPath, JSON.stringify({
    ...artifact,
    retrieval_metadata: retrievalMetadata,
    deep_dive_retrieval: artifact.deep_dive_retrieval,
    email: { ...artifact.email, html_path: htmlPath },
    evidence_document_paths: artifact.evidence_document ? { json_path: evidenceJsonPath, markdown_path: evidenceMarkdownPath, dashboard_html_path: evidenceDashboardPath } : null,
  }, null, 2));

  console.log(JSON.stringify({
    run_id: artifact.run_id,
    company: profile.company_name,
    scan_date: args.date,
    retrieval_mode: retrievalMetadata?.mode,
    retrieval_intent: retrievalMetadata?.intent,
    retrieval_queries: retrievalMetadata?.queries?.length,
    deep_dive_enabled: args.deepDiveRetrieval,
    deep_dive_signals_added: artifact.deep_dive_retrieval?.signals_added,
    signals_loaded: artifact.signals_loaded,
    selected_count: artifact.selected_count,
    package8_generation_wired_for_dry_run: artifact.package8_generation_wired_for_dry_run,
    package8_llm_enrichment_wired: artifact.package8_llm_enrichment_wired,
    qa_status: artifact.qa_report.status,
    qa_final_decision: artifact.qa_report.final_decision,
    dry_run_would_have_status: artifact.dry_run_metadata?.would_have_status,
    json_path: jsonPath,
    html_path: htmlPath,
    evidence_json_path: artifact.evidence_document ? evidenceJsonPath : null,
    evidence_markdown_path: artifact.evidence_document ? evidenceMarkdownPath : null,
    evidence_dashboard_path: artifact.evidence_document ? evidenceDashboardPath : null,
    subject: artifact.email.subject,
  }, null, 2));
}

main().catch((err) => {
  console.error(`❌ ${err instanceof Error ? err.stack || err.message : String(err)}`);
  process.exit(1);
});
