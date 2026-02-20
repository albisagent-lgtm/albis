import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBulkEmail } from "@/lib/email";
import { generateWeeklyReviewHtml } from "@/lib/email-templates/weekly-review";
import type { ParsedScan } from "@/lib/scan-types";

function authorize(request: Request): boolean {
  const auth = request.headers.get("authorization");
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!auth || !expected) return false;
  return auth === `Bearer ${expected}`;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const fromDate = weekAgo.toISOString().split("T")[0];
    const toDate = now.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("scans")
      .select("parsed_data")
      .gte("scan_date", fromDate)
      .lte("scan_date", toDate)
      .order("scan_date", { ascending: true });

    if (error) throw new Error(`Supabase error: ${error.message}`);
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "No scans found for this week" }, { status: 404 });
    }

    const scans: ParsedScan[] = data.map((d: any) => d.parsed_data);
    const html = generateWeeklyReviewHtml(scans);

    const first = scans[0].displayDate;
    const last = scans[scans.length - 1].displayDate;
    const subject = `Your Albis Weekly — ${first} to ${last}`;

    const count = await sendBulkEmail({ subject, html });

    return NextResponse.json({ success: true, sent: count, scansIncluded: scans.length });
  } catch (err: any) {
    console.error("Weekly digest error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
