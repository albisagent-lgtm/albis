import { NextResponse } from "next/server";
import { allowLegacyCompanyPipeline } from "@/lib/company-briefing-content-version";

/**
 * Legacy endpoint: POST /api/company-briefings/score
 *
 * Retired during the Package 8/company-pipeline cleanup. This route used the
 * old public-scan-pool scoring path that fed the legacy `what_changed` /
 * `what_to_watch` briefing shape. The intended company path is now the
 * Package 8 evidence/QA/v2 flow under `src/lib/company-scan/**`.
 *
 * Keep the route present so old callers fail clearly instead of falling into
 * stale generation. Do not re-enable for production.
 */
export async function POST() {
  if (!allowLegacyCompanyPipeline()) {
    return NextResponse.json(
      {
        error: "legacy_company_scoring_disabled",
        message:
          "The legacy company scoring endpoint is retired. Use the Package 8 company scan/evidence pipeline instead.",
      },
      { status: 410 }
    );
  }

  return NextResponse.json(
    {
      error: "legacy_company_scoring_archived",
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
      endpoint: "/api/company-briefings/score",
      replacement: "Package 8 company scan/evidence pipeline",
    },
    { status: 410 }
  );
}
