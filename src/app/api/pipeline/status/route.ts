import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const INGEST_KEY = process.env.SCAN_INGEST_KEY;

/**
 * GET /api/pipeline/status?date=YYYY-MM-DD
 *
 * Returns the pipeline run status for a given date.
 * If no date provided, returns today's (NZST).
 *
 * Auth: Bearer token (SCAN_INGEST_KEY)
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!INGEST_KEY || token !== INGEST_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");

    // Default to today NZST
    const now = new Date();
    const nzDate = new Date(now.getTime() + 13 * 60 * 60 * 1000);
    const runDate = dateParam || nzDate.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("pipeline_runs")
      .select("*")
      .eq("run_date", runDate)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({
        run_date: runDate,
        status: "not_started",
        message: "No pipeline run found for this date",
      });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Pipeline status error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
