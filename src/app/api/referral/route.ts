import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const REWARD_TIERS = [
  { count: 3, label: "1 month Premium free" },
  { count: 10, label: "3 months Premium free" },
  { count: 25, label: "Lifetime Premium" },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim()?.toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { success: false, message: "Service unavailable." },
        { status: 503 }
      );
    }

    // Get subscriber
    const { data: subscriber, error: fetchError } = await supabase
      .from("subscribers")
      .select("id, email, referral_code")
      .eq("email", email)
      .maybeSingle();

    if (fetchError || !subscriber) {
      return NextResponse.json(
        { success: false, message: "Subscriber not found." },
        { status: 404 }
      );
    }

    // Generate referral code if missing
    let referralCode = subscriber.referral_code;
    if (!referralCode) {
      referralCode = subscriber.id.replace(/-/g, "").substring(0, 8);
      await supabase
        .from("subscribers")
        .update({ referral_code: referralCode })
        .eq("id", subscriber.id);
    }

    // Count referrals
    const { count } = await supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("referred_by", referralCode);

    const referralCount = count || 0;

    // Determine current tier
    let currentTier: (typeof REWARD_TIERS)[number] | null = null;
    let nextTier: (typeof REWARD_TIERS)[number] | null = REWARD_TIERS[0];
    for (const tier of REWARD_TIERS) {
      if (referralCount >= tier.count) {
        currentTier = tier;
      } else {
        nextTier = tier;
        break;
      }
    }
    if (referralCount >= REWARD_TIERS[REWARD_TIERS.length - 1].count) {
      nextTier = null;
    }

    return NextResponse.json({
      success: true,
      referralCode,
      referralCount,
      currentTier,
      nextTier,
      tiers: REWARD_TIERS,
    });
  } catch (err) {
    console.error("Referral API error:", err);
    return NextResponse.json(
      { success: false, message: "Something went wrong." },
      { status: 500 }
    );
  }
}
