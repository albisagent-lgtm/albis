import { NextResponse } from "next/server";
import { headers } from "next/headers";

// Debug endpoint for verifying Smart Placement convergence.
// Hit https://www.albis.news/api/debug/placement and check:
//   - cf-ray          — colo handling the request (e.g. LHR, IAD, AKL)
//   - cf-placement    — "remote-<COLO>" once placement has converged, empty
//                       or missing before then
//   - cf-worker-colo  — the colo the isolate itself is running in
// If cf-placement is stable near Supabase's region (AKL), smart placement
// is working. If it keeps flipping or is absent after ~100 requests, it
// hasn't converged yet.
//
// Subrequest timing gives a live read on Supabase RTT from the Worker.
export const dynamic = "force-dynamic";

export async function GET() {
  const h = await headers();
  const start = Date.now();
  let supabaseMs: number | null = null;
  let supabaseOk = false;

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      const res = await fetch(`${url}/rest/v1/site_snapshot?id=eq.1&select=id`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      supabaseMs = Date.now() - start;
      supabaseOk = res.ok;
    }
  } catch {
    supabaseMs = Date.now() - start;
  }

  return NextResponse.json(
    {
      cfRay: h.get("cf-ray"),
      cfPlacement: h.get("cf-placement"),
      cfWorkerColo: h.get("cf-worker") ?? h.get("cf-colo"),
      cfConnectingIp: h.get("cf-connecting-ip"),
      cfIpCountry: h.get("cf-ipcountry"),
      supabaseRoundtripMs: supabaseMs,
      supabaseOk,
      timestamp: new Date().toISOString(),
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}
