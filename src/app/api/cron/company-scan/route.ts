// ---------------------------------------------------------------------------
// Cron entry point for the company scan cycle — Package 6.
//
// Single HTTP endpoint that runs the full company-side cycle:
//   1. buildUnionWatchGraph(supabase)
//   2. runCompanyScan(supabase, runDate, runWindow) [Brave retrieval]
//   3. runCompanySignalPipeline equivalent — score signals, write
//      company_signal_matches, generate briefings, persist coverage
//
// Auth: Bearer token from Authorization header, must equal env
// COMPANY_SCAN_CRON_KEY. Mirrors the SCAN_INGEST_KEY pattern in
// /api/scans/ingest. The endpoint returns 401 with no further detail
// when the token is missing or wrong.
//
// run_window is determined from the current UTC hour:
//   11 UTC → '07-00'  (7am US Eastern in EDT, 6am EST)
//   23 UTC → '19-00'  (7pm US Eastern in EDT, 6pm EST)
// Anything else returns 422 — the caller should only fire at the two
// scheduled hours. Manual override available via ?window=07-00 query.
//
// NOT activated by wrangler.jsonc cron triggers in this commit. Both
// the Cloudflare scheduled-event path and the openclaw-side curl path
// can hit this same endpoint — see docs/company-scan-cron-setup.md.
// ---------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildUnionWatchGraph } from "@/lib/company-scan/watch-graph-builder";
import { runCompanyScan } from "@/lib/company-scan/scan-engine";
import { runCompanySignalPipeline } from "@/lib/company-scan/run-signal-pipeline";
import type { ScanRunWindow } from "@/lib/company-scan/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_WINDOWS: ScanRunWindow[] = ["07-00", "19-00"];

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function windowFromUtcHour(hour: number): ScanRunWindow | null {
  if (hour === 11) return "07-00";
  if (hour === 23) return "19-00";
  return null;
}

function checkAuth(req: NextRequest): boolean {
  const expected = process.env.COMPANY_SCAN_CRON_KEY;
  if (!expected) return false;
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  return token === expected;
}

async function handle(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const overrideWindow = searchParams.get("window") as ScanRunWindow | null;
  const overrideDate = searchParams.get("date");
  const companyProfileId = searchParams.get("company_profile_id") || undefined;
  const companyName = searchParams.get("company_name") || undefined;
  const useCompanySpecificRetrieval =
    process.env.COMPANY_SPECIFIC_RETRIEVAL_ENABLED === "1" ||
    searchParams.get("company_specific_retrieval") === "1";
  const enableDeepDiveRetrieval =
    process.env.COMPANY_DEEP_DIVE_RETRIEVAL_ENABLED === "1" ||
    searchParams.get("deep_dive_retrieval") === "1";
  const writeBriefings =
    process.env.COMPANY_BRIEFINGS_WRITE_ENABLED === "1" &&
    searchParams.get("write_briefings") === "1";

  const now = new Date();
  const utcHour = now.getUTCHours();
  const window =
    overrideWindow && VALID_WINDOWS.includes(overrideWindow)
      ? overrideWindow
      : windowFromUtcHour(utcHour);

  if (!window) {
    return NextResponse.json(
      {
        error: "no_window_for_hour",
        utc_hour: utcHour,
        hint: "fire only at 11/23 UTC, or pass ?window=07-00|19-00",
      },
      { status: 422 },
    );
  }

  const runDate = overrideDate || now.toISOString().slice(0, 10);

  try {
    const supabase = getAdminClient();

    const watchGraph = await buildUnionWatchGraph(supabase);
    const scan = await runCompanyScan(supabase, runDate, window);
    const pipeline = await runCompanySignalPipeline(supabase, {
      scanDate: runDate,
      lookbackHours: 24,
      // Company cron should use the Package 8/v2 path only. It remains
      // preview/no-write by default; writing rows requires both the env gate
      // above and an explicit query flag.
      usePackage8Preview: true,
      writeBriefingRows: writeBriefings,
      companyProfileId,
      companyName,
      useCompanySpecificRetrieval,
      enableDeepDiveRetrieval,
    });

    return NextResponse.json({
      ok: true,
      run_date: runDate,
      run_window: window,
      watch_graph: watchGraph,
      scan,
      pipeline,
      production_preview: {
        package8_preview: true,
        company_specific_retrieval: useCompanySpecificRetrieval,
        deep_dive_retrieval: enableDeepDiveRetrieval,
        write_briefings: writeBriefings,
        email_delivery_enabled:
          process.env.COMPANY_EMAIL_DELIVERY_ENABLED === "1",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/company-scan] failed:", message);
    return NextResponse.json({ error: "failed", message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  // GET allowed so curl + simple cron-from-anywhere pings work without a
  // body. Same auth, same behavior.
  return handle(req);
}
