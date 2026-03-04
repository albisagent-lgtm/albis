import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

let cachedResult: { count: number; ts: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET() {
  try {
    if (cachedResult && Date.now() - cachedResult.ts < CACHE_TTL) {
      return NextResponse.json(formatResponse(cachedResult.count));
    }

    const supabase = createAdminClient();

    const [{ count: subCount }, { count: profileCount }] = await Promise.all([
      supabase.from("subscribers").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]);

    const total = (subCount ?? 0) + (profileCount ?? 0);
    cachedResult = { count: total, ts: Date.now() };

    return NextResponse.json(formatResponse(total));
  } catch (e) {
    console.error("Subscriber count error:", e);
    return NextResponse.json({ count: null, message: "Join our growing community" });
  }
}

function formatResponse(count: number) {
  if (count < 10) {
    return { count: null, message: "Join our growing community" };
  }
  return { count, message: `Join ${count.toLocaleString()} readers` };
}
