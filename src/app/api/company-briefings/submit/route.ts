import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  allowLegacyCompanyPipeline,
  getCompanyBriefingContentVersion,
  isCompanyScannerReportContent,
} from "@/lib/company-briefing-content-version";

const INGEST_KEY = process.env.SCAN_INGEST_KEY;

/**
 * POST /api/company-briefings/submit
 *
 * Stores generated company briefing content. After the Package 10C cleanup,
 * this endpoint accepts only the scanner-report output by default. The old
 * compressed v2 shape and the older `what_changed` / `what_to_watch` shape are
 * rejected unless the explicit emergency flag ALLOW_LEGACY_COMPANY_PIPELINE=1
 * is set for legacy history repair.
 *
 * This endpoint stores content only. It does not send email.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!INGEST_KEY || token !== INGEST_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { briefing_id, company_profile_id, briefing_date, briefing_content } = body;

    if (!briefing_content) {
      return NextResponse.json({ error: "briefing_content required" }, { status: 400 });
    }

    const contentVersion = getCompanyBriefingContentVersion(briefing_content);
    if (!isCompanyScannerReportContent(briefing_content)) {
      if (contentVersion === "legacy_what_changed" && allowLegacyCompanyPipeline()) {
        // Emergency compatibility only. Normal production generation must not
        // rely on this branch.
      } else {
        return NextResponse.json(
          {
            error: "unsupported_company_briefing_content_version",
            content_version: contentVersion,
            message:
              "Company briefing submit now expects Package 10C scanner-report content. Legacy what_changed/what_to_watch and compressed v2 mini-briefing content are not accepted by default.",
          },
          { status: 422 }
        );
      }
    }

    if (!briefing_id && (!company_profile_id || !briefing_date)) {
      return NextResponse.json(
        { error: "Provide either briefing_id or both company_profile_id and briefing_date" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const payload = {
      briefing_content,
      status: "generated",
      delivery_status: "pending",
      generated_at: new Date().toISOString(),
    };

    if (briefing_id) {
      const { data, error } = await supabase
        .from("company_briefings")
        .update(payload)
        .eq("id", briefing_id)
        .select("id")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!data) return NextResponse.json({ error: "Briefing not found" }, { status: 404 });

      return NextResponse.json({ ok: true, briefing_id: data.id, content_version: contentVersion });
    }

    const { data, error } = await supabase
      .from("company_briefings")
      .upsert(
        {
          company_profile_id,
          briefing_date,
          ...payload,
        },
        { onConflict: "company_profile_id,briefing_date" }
      )
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, briefing_id: data.id, content_version: contentVersion });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Submit error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    description: "Submit a Package 10C scanner-report company briefing. POST with Bearer auth.",
    accepted_content_version: "company_scanner_report_v1",
    legacy_content: "Legacy and compressed mini-briefing content is rejected unless ALLOW_LEGACY_COMPANY_PIPELINE=1 is set for emergency compatibility.",
    sends_email: false,
  });
}
