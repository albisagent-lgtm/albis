import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  try {
    const sb = getSupabase();
    
    // Get the most recent scan
    const { data: scans, error: scanError } = await sb
      .from("scans")
      .select("scan_date, scan_time, items")
      .order("scan_date", { ascending: false })
      .order("scan_time", { ascending: false })
      .limit(1);

    if (scanError || !scans || scans.length === 0) {
      return NextResponse.json({ topStory: null }, { status: 200 });
    }

    const latestScan = scans[0];
    const items = latestScan.items || [];

    // Find the highest-significance item
    // Priority: high > medium > low
    const significanceOrder = { high: 3, medium: 2, low: 1 };
    
    let topStory = null;
    let maxSig = 0;

    for (const item of items) {
      const sig = significanceOrder[item.significance as keyof typeof significanceOrder] || 0;
      if (sig > maxSig) {
        maxSig = sig;
        topStory = item;
      }
    }

    if (!topStory) {
      return NextResponse.json({ topStory: null }, { status: 200 });
    }

    // Return the top story with scan metadata
    return NextResponse.json(
      {
        topStory: {
          headline: topStory.headline,
          summary: topStory.connection || "",
          significance: topStory.significance,
          category: topStory.category,
          regions: topStory.regions || [],
          tags: topStory.tags || [],
          scan_date: latestScan.scan_date,
          scan_time: latestScan.scan_time,
          // Check if there's a corresponding article (we'll link to /lens for now)
          url: "/lens",
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (e: any) {
    console.error("Top story fetch error:", e);
    return NextResponse.json({ topStory: null }, { status: 200 });
  }
}
