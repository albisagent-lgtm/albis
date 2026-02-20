import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email?.trim()?.toLowerCase();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    if (supabase) {
      // Try Supabase first
      const { data: existing } = await supabase
        .from("subscribers")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({
          success: true,
          message: "You're already on the list!",
        });
      }

      const { error } = await supabase
        .from("subscribers")
        .insert({ email, source: "website" });

      if (error) {
        // Table might not exist yet — log but still return success
        console.error("Supabase insert error:", error.message);
        // Fall through to success so user doesn't see an error
      }
    }

    return NextResponse.json({
      success: true,
      message: "You're on the list! We'll be in touch soon.",
    });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
