#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// Package 8E — QA gate and style lint tests.
//
// Uses the Package 8D dry-run artifacts as a valid fixture, then mutates the
// generated briefing to confirm that pre-send QA blocks unsupported claims,
// duplicate events, non-evidence-bound Perception Gap notes, and AI-slop style.
//
// This script does NOT send email, call Supabase, or require an OpenAI API key.
// ---------------------------------------------------------------------------

import * as fs from "fs";
import * as path from "path";
import { runQAGates } from "../src/lib/company-scan/company-briefing-qa";
import { lintBriefingStyle } from "../src/lib/company-scan/company-briefing-style-lint";
import { generateCompanyBriefingHtmlV2 } from "../src/lib/email-templates/company-briefing-v2";
import type {
  CompanyBriefingEvidencePacket,
  CompanyBriefingGenerationOutput,
  CompanyBriefingQAReport,
} from "../src/lib/company-scan/types";

const ROOT = path.resolve(__dirname, "..");
const REPORTS = path.join(ROOT, "reports");

function loadJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(REPORTS, file), "utf8")) as T;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
  console.log(`  ✅ ${message}`);
}

function runCase(
  name: string,
  packet: CompanyBriefingEvidencePacket,
  output: CompanyBriefingGenerationOutput,
): CompanyBriefingQAReport {
  console.log(`\nCase: ${name}`);
  const result = runQAGates(packet, output, { dryRun: true });
  console.log(`  Status: ${result.report.status}`);
  console.log(`  Blockers: ${result.report.blocking_failures.length}`);
  console.log(`  Warnings: ${result.report.warnings.length}`);
  return result.report;
}

function hasBlock(report: CompanyBriefingQAReport, code: string): boolean {
  return report.blocking_failures.some((f) => f.code === code);
}

console.log("=== Package 8E: Company Briefing QA Gate Tests ===");

const packet = loadJson<CompanyBriefingEvidencePacket>("pkg-8d-evidence-packet.json");
const output = loadJson<CompanyBriefingGenerationOutput>("pkg-8d-generation-output.json");

// 1. Valid fixture — may warn, but must not block. Dry-run must suppress delivery.
const validReport = runCase("valid evidence fixture", packet, output);
assert(validReport.blocking_failures.length === 0, "valid fixture has no blocking failures");
assert(validReport.status === "dry_run_only", "valid fixture remains dry-run only");

// 2. Unsupported claim — claim map references a missing packet claim.
const unsupportedOutput = clone(output);
unsupportedOutput.main_briefing.sections[0].items[0].body.text += " This also creates a new unsupported market-share claim.";
unsupportedOutput.main_briefing.sections[0].items[0].claim_map.push({
  generated_text_path: "main_briefing.sections[0].items[0].body unsupported sentence",
  text: "This also creates a new unsupported market-share claim.",
  claim_ids: ["missing_claim_8e_test"],
  support_refs: [{ type: "claim_id", id: "missing_claim_8e_test" }],
});
const unsupportedReport = runCase("unsupported claim blocks send", packet, unsupportedOutput);
assert(hasBlock(unsupportedReport, "UNSUPPORTED_CLAIM"), "unsupported claim is blocked");

// 2b. Unmapped unsupported sentence — body text changes but claim_map does not.
const unmappedOutput = clone(output);
unmappedOutput.main_briefing.sections[0].items[0].body.text += " This extra sentence has no claim map support.";
const unmappedReport = runCase("unmapped body sentence blocks send", packet, unmappedOutput);
assert(hasBlock(unmappedReport, "UNSUPPORTED_CLAIM"), "unmapped body sentence is blocked");

// 2c. Required uncertainty removed — proposed/developing items must keep uncertainty.
const missingUncertaintyOutput = clone(output);
missingUncertaintyOutput.main_briefing.sections[0].items[0].uncertainty_line = undefined;
const missingUncertaintyReport = runCase("missing uncertainty blocks send", packet, missingUncertaintyOutput);
assert(hasBlock(missingUncertaintyReport, "MISSING_UNCERTAINTY"), "missing required uncertainty is blocked");

// 2d. Empty generated item — no silent blank briefing rows.
const emptyBodyOutput = clone(output);
emptyBodyOutput.main_briefing.sections[0].items[0].body.text = "";
emptyBodyOutput.main_briefing.sections[0].items[0].claim_map = [];
const emptyBodyReport = runCase("empty generated body blocks send", packet, emptyBodyOutput);
assert(hasBlock(emptyBodyReport, "UNSUPPORTED_CLAIM"), "empty generated body is blocked");

// 3. Duplicate event — same cluster appears twice in email output.
const duplicateOutput = clone(output);
const duplicatedItem = clone(duplicateOutput.main_briefing.sections[0].items[0]);
duplicatedItem.generated_item_id = `${duplicatedItem.generated_item_id}_duplicate`;
duplicateOutput.main_briefing.sections[0].items.push(duplicatedItem);
const duplicateReport = runCase("duplicate event blocks send", packet, duplicateOutput);
assert(hasBlock(duplicateReport, "DUPLICATE_EVENT"), "duplicate event is blocked");

// 4. AI-slop phrase — style lint blocks banned wording.
const slopOutput = clone(output);
slopOutput.today_brief.top_line.text = "In today’s rapidly evolving landscape, stakeholders should monitor this complex interplay.";
const slopLint = lintBriefingStyle(slopOutput);
assert(slopLint.result === "block", "style lint blocks banned AI-slop phrases");
const slopReport = runCase("AI-slop style blocks send", packet, slopOutput);
assert(hasBlock(slopReport, "BANNED_PHRASE"), "AI-slop phrase becomes a blocking QA failure");

// 5. Perception Gap without eligible evidence — must block.
const pgOutput = clone(output);
if (pgOutput.perception_gap.notes.length === 0) {
  pgOutput.perception_gap.notes.push({
    note_id: "pg_missing_evidence_test",
    packet_item_id: "missing_packet_item",
    cluster_id: "missing_cluster",
    note: { text: "Different regions framed this differently.", supported_by: [] },
  });
} else {
  pgOutput.perception_gap.notes[0].packet_item_id = "missing_packet_item";
}
const pgReport = runCase("Perception Gap without packet evidence blocks send", packet, pgOutput);
assert(hasBlock(pgReport, "PG_NOT_ELIGIBLE"), "Perception Gap without packet evidence is blocked");

// 6. Quiet day / no useful findings — no email items, dashboard-only would-have status.
const quietOutput = clone(output);
quietOutput.main_briefing.sections = [];
quietOutput.perception_gap.notes = [];
quietOutput.useful_observations.observations = [];
quietOutput.trace.email_item_ids_used = [];
quietOutput.trace.cluster_ids_used = [];
const quietResult = runQAGates(packet, quietOutput, { dryRun: true });
console.log("\nCase: quiet day behavior");
console.log(`  Would-have status: ${quietResult.dryRunMetadata?.would_have_status}`);
assert(quietResult.dryRunMetadata?.would_have_status === "dashboard_only", "quiet day resolves to dashboard-only in dry-run");

// 7. Render smoke test — clean headings, no legacy labels.
const html = generateCompanyBriefingHtmlV2(output, packet.company.display_name, output.generated_at);
assert(!/What Changed/i.test(html), "email render does not include 'What Changed'");
assert(!/What to Watch Next/i.test(html), "email render does not include 'What to Watch Next'");
assert(/Today/i.test(html) && /Main Briefing/i.test(html), "email render includes new briefing hierarchy");

fs.mkdirSync(REPORTS, { recursive: true });
fs.writeFileSync(path.join(REPORTS, "pkg-8e-qa-valid-report.json"), JSON.stringify(validReport, null, 2));
fs.writeFileSync(path.join(REPORTS, "pkg-8e-qa-unsupported-claim-report.json"), JSON.stringify(unsupportedReport, null, 2));
fs.writeFileSync(path.join(REPORTS, "pkg-8e-qa-unmapped-claim-report.json"), JSON.stringify(unmappedReport, null, 2));
fs.writeFileSync(path.join(REPORTS, "pkg-8e-qa-missing-uncertainty-report.json"), JSON.stringify(missingUncertaintyReport, null, 2));
fs.writeFileSync(path.join(REPORTS, "pkg-8e-qa-empty-body-report.json"), JSON.stringify(emptyBodyReport, null, 2));
fs.writeFileSync(path.join(REPORTS, "pkg-8e-qa-duplicate-report.json"), JSON.stringify(duplicateReport, null, 2));
fs.writeFileSync(path.join(REPORTS, "pkg-8e-qa-style-report.json"), JSON.stringify(slopReport, null, 2));
fs.writeFileSync(path.join(REPORTS, "pkg-8e-qa-pg-report.json"), JSON.stringify(pgReport, null, 2));
fs.writeFileSync(path.join(REPORTS, "pkg-8e-email-preview.html"), html);

console.log("\nArtifacts written:");
console.log(`  ${path.join(REPORTS, "pkg-8e-qa-valid-report.json")}`);
console.log(`  ${path.join(REPORTS, "pkg-8e-qa-unsupported-claim-report.json")}`);
console.log(`  ${path.join(REPORTS, "pkg-8e-qa-unmapped-claim-report.json")}`);
console.log(`  ${path.join(REPORTS, "pkg-8e-qa-missing-uncertainty-report.json")}`);
console.log(`  ${path.join(REPORTS, "pkg-8e-qa-empty-body-report.json")}`);
console.log(`  ${path.join(REPORTS, "pkg-8e-qa-duplicate-report.json")}`);
console.log(`  ${path.join(REPORTS, "pkg-8e-qa-style-report.json")}`);
console.log(`  ${path.join(REPORTS, "pkg-8e-qa-pg-report.json")}`);
console.log(`  ${path.join(REPORTS, "pkg-8e-email-preview.html")}`);

console.log("\n✓ Package 8E QA gate tests completed successfully.");
