import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBulkEmail } from "@/lib/email";
import { generateDailyDigestHtml } from "@/lib/email-templates/daily-digest";
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
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("scans")
      .select("parsed_data")
      .eq("scan_date", today)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`Supabase error: ${error.message}`);
    if (!data?.parsed_data) {
      return NextResponse.json({ error: "No scan found for today" }, { status: 404 });
    }

    const scan: ParsedScan = data.parsed_data;
    const html = generateDailyDigestHtml(scan);
    const subject = `Albis Daily — ${scan.displayDate}`;

    const count = await sendBulkEmail({ subject, html });

    return NextResponse.json({ success: true, sent: count });
  } catch (err: any) {
    console.error("Daily digest error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
