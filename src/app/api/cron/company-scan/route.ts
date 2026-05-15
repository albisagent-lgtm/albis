// ---------------------------------------------------------------------------
// Legacy HTTP cron entry point for the company scan cycle.
//
// IMPORTANT ARCHITECTURE BOUNDARY:
// Heavy Company Daily Scan generation belongs in the pipeline/job layer
// (`scripts/run-company-scan-cycle.sh`), then writes completed/QA'd rows to
// Supabase. The Cloudflare/OpenNext app should read, display, and gated-deliver
// completed briefings; it should not be the default heavy scan/retrieval/editor
// runner.
//
// This endpoint remains only as an emergency/manual compatibility path and is
// fail-closed unless ALBIS_ALLOW_WORKER_COMPANY_SCAN_GENERATION=1 is explicitly
// set. Do not activate Cloudflare scheduled triggers for this route by default.
// See docs/company-scan-cron-setup.md.
// ---------------------------------------------------------------------------
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildUnionWatchGraph } from "@/lib/company-scan/watch-graph-builder";
import { runCompanyScan } from "@/lib/company-scan/scan-engine";
import { runCompanySignalPipeline } from "@/lib/company-scan/run-signal-pipeline";
import { editorialModelConfiguredHint } from "@/lib/editorial-model-client";
import type { ScanRunWindow } from "@/lib/company-scan/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_WINDOWS: ScanRunWindow[] = ["07-00", "13-00", "19-00"];

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function windowFromUtcHour(hour: number): ScanRunWindow | null {
  if (hour === 5 || hour === 6 || hour === 11) return "07-00";
  if (hour === 12 || hour === 17) return "13-00";
  if (hour === 18 || hour === 23) return "19-00";
  return null;
}

function checkAuth(req: NextRequest): boolean {
  const expected = process.env.COMPANY_SCAN_CRON_KEY;
  if (!expected) return false;
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  return token === expected;
}

function companyEditorialWriterConfigured(): boolean {
  return process.env.ALBIS_ENABLE_COMPANY_EDITORIAL_WRITER === "true";
}

async function runDeliveryStep(req: NextRequest, briefingDate: string) {
  const key = process.env.SCAN_INGEST_KEY;
  if (!key) {
    return {
      ok: false,
      skipped: true,
      reason: "SCAN_INGEST_KEY_missing_for_delivery_endpoint",
    };
  }

  const url = new URL("/api/company-briefings/deliver", req.url);
  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ briefing_date: briefingDate }),
  });
  const json = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, ...json };
}

async function handle(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.ALBIS_ALLOW_WORKER_COMPANY_SCAN_GENERATION !== "1") {
    return NextResponse.json(
      {
        error: "worker_company_scan_generation_disabled",
        message:
          "Company Daily Scan generation runs in the pipeline job. Cloudflare app routes only display/deliver completed Supabase briefings by default.",
      },
      { status: 410 },
    );
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
  const deliverBriefings =
    process.env.COMPANY_SCAN_CRON_DELIVERY_ENABLED === "1" &&
    searchParams.get("deliver") === "1";

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
        hint: "fire only at mapped company scan hours, or pass ?window=07-00|13-00|19-00",
      },
      { status: 422 },
    );
  }

  const runDate = overrideDate || now.toISOString().slice(0, 10);

  if (writeBriefings && !companyEditorialWriterConfigured()) {
    return NextResponse.json(
      {
        error: "company_editorial_writer_not_configured",
        message:
          `Company Daily Scan V1 write/send cron requires ALBIS_ENABLE_COMPANY_EDITORIAL_WRITER=true and an editorial model provider (${editorialModelConfiguredHint()}). This prevents deterministic assembled summaries from becoming customer emails.`,
      },
      { status: 423 },
    );
  }

  try {
    const supabase = getAdminClient();

    const watchGraph = await buildUnionWatchGraph(supabase);
    if (watchGraph.eligible_company_profiles === 0) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "no_active_company_scan_demand",
        message:
          "No real paid/trialing company profiles need scanning; skipped live retrieval, briefing generation, and delivery to avoid search spend.",
        run_date: runDate,
        run_window: window,
        watch_graph: watchGraph,
      });
    }
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
    const delivery =
      writeBriefings && deliverBriefings
        ? await runDeliveryStep(req, runDate)
        : {
            skipped: true,
            reason: writeBriefings
              ? "COMPANY_SCAN_CRON_DELIVERY_ENABLED_not_set_or_deliver_query_missing"
              : "write_briefings_not_enabled",
          };

    return NextResponse.json({
      ok: true,
      run_date: runDate,
      run_window: window,
      watch_graph: watchGraph,
      scan,
      pipeline,
      delivery,
      production_preview: {
        package8_preview: true,
        company_specific_retrieval: useCompanySpecificRetrieval,
        deep_dive_retrieval: enableDeepDiveRetrieval,
        write_briefings: writeBriefings,
        deliver_briefings: deliverBriefings,
        gold_standard_editorial_writer: companyEditorialWriterConfigured(),
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
