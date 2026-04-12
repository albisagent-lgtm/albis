import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const INGEST_KEY = process.env.SCAN_INGEST_KEY;

/**
 * POST /api/pipeline/update
 *
 * Updates a pipeline_runs row with timestamps and counts from each stage.
 * Called by OpenClaw cron jobs at each pipeline step.
 *
 * Auth: Bearer token (SCAN_INGEST_KEY)
 *
 * Body:
 *   {
 *     run_date: string,             // YYYY-MM-DD (required)
 *     scan_completed_at?: string,
 *     tagging_started_at?: string,
 *     tagging_completed_at?: string,
 *     tagging_stories_count?: number,
 *     generation_started_at?: string,
 *     generation_completed_at?: string,
 *     generation_companies_count?: number,
 *     generation_failures?: number,
 *     delivery_started_at?: string,
 *     delivery_completed_at?: string,
 *     delivery_sent_count?: number,
 *     delivery_failures?: number,
 *     status?: string
 *   }
 *
 * Response:
 *   { ok: true, pipeline_run_id: string }
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!INGEST_KEY || token !== INGEST_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { run_date, ...updates } = body;

    if (!run_date) {
      return NextResponse.json(
        { error: "run_date required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Upsert the pipeline run row
    const { data, error } = await supabase
      .from("pipeline_runs")
      .upsert(
        { run_date, ...updates },
        { onConflict: "run_date" }
      )
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, pipeline_run_id: data.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Pipeline update error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
