import { NextResponse } from "next/server";
import { allowLegacyCompanyPipeline } from "@/lib/company-briefing-content-version";

/**
 * Legacy endpoint: POST /api/company-briefings/score-all
 *
 * Retired during the Package 8/company-pipeline cleanup. This route looped
 * over all company profiles using the old public-scan-pool scoring flow and
 * was also called by the old Phase 4 cron prompts. Leaving it active would
 * risk generating stale `what_changed` / `what_to_watch` briefings.
 */
export async function POST() {
  if (!allowLegacyCompanyPipeline()) {
    return NextResponse.json(
      {
        error: "legacy_company_score_all_disabled",
        message:
          "The legacy company score-all endpoint is retired. Use the Package 8 company scan/evidence pipeline instead.",
      },
      { status: 410 }
    );
  }

  return NextResponse.json(
    {
      error: "legacy_company_score_all_archived",
      message:
        "ALLOW_LEGACY_COMPANY_PIPELINE is set, but this endpoint has been archived in code. Restore from git history only for emergency forensic use.",
    },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      status: "retired",
      endpoint: "/api/company-briefings/score-all",
      replacement: "Package 8 company scan/evidence pipeline",
    },
    { status: 410 }
  );
}
