import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createClient("https://wguydvzpxwsgrhvojpnk.supabase.co", serviceKey);
}

// POST /api/quiz/submit — log quiz results for analytics
export async function POST(request: Request) {
  try {
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ ok: true, stored: false });
    const body = await request.json();
    const {
      score,          // number 0-5
      total,          // number (5)
      answers,        // array of { question_id, guessed_region, correct_region, correct: boolean }
      time_seconds,   // how long they took
      referrer,       // where they came from
      shared,         // boolean - did they click share?
      share_platform, // "x" | "copy" | "image" | null
    } = body;

    const { error } = await supabase.from("quiz_results").insert({
      score,
      total: total || 5,
      answers: JSON.stringify(answers),
      time_seconds,
      referrer: referrer || null,
      shared: shared || false,
      share_platform: share_platform || null,
      created_at: new Date().toISOString(),
      user_agent: request.headers.get("user-agent") || null,
    });

    if (error) {
      // Table might not exist yet — log but don't fail the user experience
      console.error("Quiz submit error:", error.message);
      return NextResponse.json({ ok: true, stored: false });
    }

    return NextResponse.json({ ok: true, stored: true });
  } catch {
    return NextResponse.json({ ok: true, stored: false });
  }
}

// GET /api/quiz/stats — aggregate quiz stats (public)
export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({
      total_attempts: 0,
      average_score: 0,
      share_rate: 0,
      message: "Quiz stats unavailable",
    });
  }

  const { data, error } = await supabase
    .from("quiz_results")
    .select("score, total, shared, share_platform, created_at");

  if (error || !data || data.length === 0) {
    return NextResponse.json({
      total_attempts: 0,
      average_score: 0,
      share_rate: 0,
      message: "No quiz data yet",
    });
  }

  const totalAttempts = data.length;
  const avgScore = data.reduce((sum, r) => sum + (r.score || 0), 0) / totalAttempts;
  const shareRate = data.filter(r => r.shared).length / totalAttempts;
  const scoreDistribution = [0, 0, 0, 0, 0, 0]; // 0-5
  data.forEach(r => {
    if (r.score >= 0 && r.score <= 5) scoreDistribution[r.score]++;
  });

  return NextResponse.json({
    total_attempts: totalAttempts,
    average_score: Math.round(avgScore * 10) / 10,
    share_rate: Math.round(shareRate * 100),
    score_distribution: scoreDistribution,
    most_common_score: scoreDistribution.indexOf(Math.max(...scoreDistribution)),
  });
}
