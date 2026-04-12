import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const INGEST_KEY = process.env.SCAN_INGEST_KEY;

/**
 * POST /api/company-briefings/submit
 *
 * Accepts a generated briefing from OpenClaw and stores it in the database.
 * This is the endpoint OpenClaw calls after generating briefing text from
 * the scored stories returned by /api/company-briefings/score.
 *
 * Auth: Bearer token (SCAN_INGEST_KEY)
 *
 * Body:
 *   {
 *     briefing_id?: string,           // UUID from the score response (preferred)
 *     company_profile_id?: string,     // alternative: identify by profile + date
 *     briefing_date?: string,          // required if using company_profile_id
 *     briefing_content: {
 *       header: {
 *         company_name: string,
 *         date: string,
 *         scan_focus: string,
 *         signal_level: "low" | "moderate" | "elevated" | "high"
 *       },
 *       what_changed: [{
 *         headline: string,
 *         summary: string,
 *         relevance_tags: string[]
 *       }],
 *       why_it_matters: string,
 *       what_to_watch: [{
 *         monitor_point: string,
 *         timeframe: string
 *       }],
 *       regional_framing?: string
 *     }
 *   }
 *
 * Response:
 *   { ok: true, briefing_id: string }
 */
export async function POST(req: NextRequest) {
  // Auth
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!INGEST_KEY || token !== INGEST_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { briefing_id, company_profile_id, briefing_date, briefing_content } = body;

    // Validate briefing content
    if (!briefing_content) {
      return NextResponse.json({ error: "briefing_content required" }, { status: 400 });
    }

    if (!briefing_content.what_changed || !briefing_content.why_it_matters) {
      return NextResponse.json(
        { error: "briefing_content must include what_changed and why_it_matters" },
        { status: 400 }
      );
    }

    // Must identify the briefing by either briefing_id or company_profile_id+date
    if (!briefing_id && (!company_profile_id || !briefing_date)) {
      return NextResponse.json(
        { error: "Provide either briefing_id or both company_profile_id and briefing_date" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    if (briefing_id) {
      // Update existing briefing row by ID
      const { data, error } = await supabase
        .from("company_briefings")
        .update({
          briefing_content,
          status: "generated",
          generated_at: new Date().toISOString(),
        })
        .eq("id", briefing_id)
        .select("id")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!data) {
        return NextResponse.json({ error: "Briefing not found" }, { status: 404 });
      }

      return NextResponse.json({ ok: true, briefing_id: data.id });
    } else {
      // Upsert by company_profile_id + briefing_date
      const { data, error } = await supabase
        .from("company_briefings")
        .upsert(
          {
            company_profile_id,
            briefing_date,
            briefing_content,
            status: "generated",
            generated_at: new Date().toISOString(),
          },
          { onConflict: "company_profile_id,briefing_date" }
        )
        .select("id")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, briefing_id: data.id });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Submit error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/company-briefings/submit
 *
 * Returns the expected briefing_content schema for documentation purposes.
 */
export async function GET() {
  return NextResponse.json({
    description: "Submit a generated company briefing. POST with Bearer auth.",
    expected_body: {
      briefing_id: "UUID (from score response, preferred)",
      company_profile_id: "UUID (alternative, with briefing_date)",
      briefing_date: "YYYY-MM-DD (required if using company_profile_id)",
      briefing_content: {
        header: {
          company_name: "string",
          date: "YYYY-MM-DD",
          scan_focus: "top theme label",
          signal_level: "low | moderate | elevated | high",
        },
        what_changed: [
          {
            headline: "string",
            summary: "2-3 sentences",
            relevance_tags: ["geography match", "tracked theme"],
          },
        ],
        why_it_matters: "2-4 sentences connecting developments to this company",
        what_to_watch: [
          {
            monitor_point: "string",
            timeframe: "this week | next 30 days",
          },
        ],
        regional_framing: "optional 1-2 sentences",
      },
    },
  });
}
