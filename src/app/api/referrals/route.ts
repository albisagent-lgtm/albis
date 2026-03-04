import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Generate a deterministic referral code from email
// This means we don't need a new column — the code is derived from the email
function emailToCode(email: string): string {
  let hash = 0;
  const str = email.toLowerCase().trim();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to base36 and take 8 chars
  const code = Math.abs(hash).toString(36).padStart(8, "0").slice(0, 8);
  return code;
}

function getTier(count: number) {
  if (count >= 25) return { name: "Founding Member", next: null, nextAt: null };
  if (count >= 10) return { name: "Ambassador", next: "Founding Member", nextAt: 25 };
  if (count >= 3) return { name: "Insider", next: "Ambassador", nextAt: 10 };
  return { name: "Reader", next: "Insider", nextAt: 3 };
}

// GET: Get referral stats for an email
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Find subscriber
  const { data: subscriber, error } = await supabase
    .from("subscribers")
    .select("id, email")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (error || !subscriber) {
    return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
  }

  const referralCode = emailToCode(subscriber.email);

  // Count referrals — look for subscribers whose referred_by matches this code
  const { count } = await supabase
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .eq("referred_by", referralCode);

  const referralCount = count || 0;
  const tier = getTier(referralCount);

  return NextResponse.json({
    referralCode,
    referralUrl: `https://www.albis.news/r/${referralCode}`,
    referralCount,
    tier: tier.name,
    nextTier: tier.next,
    nextTierAt: tier.nextAt,
    progress: tier.nextAt ? referralCount / tier.nextAt : 1,
  });
}
