import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

// --- Rate Limiting (in-memory) ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 3;

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 60_000);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

export async function POST(request: Request) {
  try {
    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, message: "Too many submissions. Please try again in a minute." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { story_description, region_noticed, source_url, submitter_email } = body;

    // Validate required fields
    if (!story_description || typeof story_description !== "string" || story_description.trim().length < 20) {
      return NextResponse.json(
        { success: false, message: "Please describe the story in at least 20 characters." },
        { status: 400 }
      );
    }

    if (!region_noticed || typeof region_noticed !== "string" || region_noticed.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "Please specify which region(s) you noticed this in." },
        { status: 400 }
      );
    }

    // Sanitize optional fields
    const cleanSourceUrl = source_url && typeof source_url === "string" ? source_url.trim().slice(0, 2000) : null;
    const cleanEmail = submitter_email && typeof submitter_email === "string" ? submitter_email.trim().toLowerCase().slice(0, 320) : null;

    // Basic email format check if provided
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Basic URL format check if provided
    if (cleanSourceUrl && !/^https?:\/\/.+/i.test(cleanSourceUrl)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid URL starting with http:// or https://." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { error } = await supabase.from("framing_lab_submissions").insert({
      story_description: story_description.trim().slice(0, 5000),
      region_noticed: region_noticed.trim().slice(0, 500),
      source_url: cleanSourceUrl,
      submitter_email: cleanEmail,
    });

    if (error) {
      console.error("Framing Lab insert error:", error.message);
      return NextResponse.json(
        { success: false, message: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Thank you — our team will investigate.",
    });
  } catch (err) {
    console.error("Framing Lab error:", err);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
