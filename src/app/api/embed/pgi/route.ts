import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 1800; // 30 min cache

export async function GET() {
  let pgi = 5.0;
  let date = new Date().toISOString().split("T")[0];

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("pgi_daily")
      .select("date, daily_pgi")
      .order("date", { ascending: false })
      .limit(1);

    pgi = data?.[0]?.daily_pgi ?? pgi;
    date = data?.[0]?.date ?? date;
  } catch (error) {
    console.warn(
      "[api/embed/pgi] using fallback PGI because Supabase is unavailable:",
      error instanceof Error ? error.message : error
    );
  }

  function getTier(p: number) {
    if (p <= 2) return { name: "Global Consensus", color: "#22c55e" };
    if (p <= 4) return { name: "Different Lenses", color: "#eab308" };
    if (p <= 6) return { name: "Diverging Narratives", color: "#f97316" };
    if (p <= 8) return { name: "Competing Realities", color: "#ef4444" };
    return { name: "Parallel Universes", color: "#1f2937" };
  }

  const tier = getTier(Number(pgi));

  return NextResponse.json({
    pgi: Number(pgi).toFixed(1),
    date,
    tier: tier.name,
    color: tier.color,
    url: "https://www.albis.news/indexes/pgi",
    methodology: "https://www.albis.news/perception-gap/about",
  }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, s-maxage=1800",
    },
  });
}
