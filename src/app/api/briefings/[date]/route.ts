import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const supabase = getAnonClient();

    const { data, error } = await supabase
      .from("briefings")
      .select("*")
      .eq("date", date)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Briefing not found" },
          { status: 404 }
        );
      }
      console.error("Briefing fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Briefing GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
