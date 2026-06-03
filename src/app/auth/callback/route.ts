import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const fullUrl = request.url;
  const { searchParams, origin, hash } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash") || searchParams.get("token");
  const type = searchParams.get("type") as "signup" | "recovery" | "email" | "magiclink" | undefined;
  const next = searchParams.get("next") ?? "/archive";

  // DEBUG: Log everything about the incoming request
  console.log("[AUTH CALLBACK] ===== INCOMING REQUEST =====");
  console.log("[AUTH CALLBACK] Full URL:", fullUrl);
  console.log("[AUTH CALLBACK] Origin:", origin);
  console.log("[AUTH CALLBACK] All params:", Object.fromEntries(searchParams.entries()));
  console.log("[AUTH CALLBACK] code:", code ? `${code.substring(0, 10)}...` : null);
  console.log("[AUTH CALLBACK] token_hash:", token_hash ? `${token_hash.substring(0, 10)}...` : null);
  console.log("[AUTH CALLBACK] type:", type);
  console.log("[AUTH CALLBACK] next:", next);
  console.log("[AUTH CALLBACK] hash:", hash);

  const supabase = await createClient();

  // Handle token-based flow (email confirmation, recovery, etc.)
  if (token_hash && type) {
    console.log("[AUTH CALLBACK] → Entering TOKEN-BASED flow (token_hash + type)");
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    console.log("[AUTH CALLBACK] verifyOtp result — error:", error?.message || "none");
    if (!error) {
      if (type === "recovery") {
        console.log("[AUTH CALLBACK] → type=recovery, redirecting to /reset-password/confirm");
        return NextResponse.redirect(`${origin}/reset-password/confirm`);
      }
      // After signup verification, accounts now belong to the public Albis feed.
      // Company Daily Scan onboarding is legacy and should not intercept normal users.
      if (type === "signup" || type === "email") {
        const accountNext = next && next !== "/onboarding/company" && next !== "/dashboard" ? next : "/account";
        console.log("[AUTH CALLBACK] → signup verified, redirecting to:", accountNext);
        return NextResponse.redirect(`${origin}${accountNext}`);
      }
      console.log("[AUTH CALLBACK] → type=", type, ", redirecting to:", next);
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.log("[AUTH CALLBACK] → verifyOtp FAILED, falling through");
  }

  // Handle code-based flow (OAuth, PKCE)
  if (code) {
    console.log("[AUTH CALLBACK] → Entering CODE-BASED flow (PKCE)");
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    console.log("[AUTH CALLBACK] exchangeCodeForSession — error:", error?.message || "none");
    console.log("[AUTH CALLBACK] session user:", data?.session?.user?.email || "none");
    if (!error) {
      if (next === "/reset-password/confirm") {
        console.log("[AUTH CALLBACK] → next param is /reset-password/confirm, redirecting");
        return NextResponse.redirect(`${origin}/reset-password/confirm`);
      }
      const { data: { user } } = await supabase.auth.getUser();
      console.log("[AUTH CALLBACK] user.recovery_sent_at:", user?.recovery_sent_at);
      if (user?.recovery_sent_at) {
        const recoverySentAt = new Date(user.recovery_sent_at).getTime();
        const now = Date.now();
        const diffMs = now - recoverySentAt;
        console.log("[AUTH CALLBACK] recovery age:", Math.round(diffMs / 1000), "seconds");
        if (diffMs < 10 * 60 * 1000) {
          console.log("[AUTH CALLBACK] → Recent recovery detected, redirecting to /reset-password/confirm");
          return NextResponse.redirect(`${origin}/reset-password/confirm`);
        }
      }
      console.log("[AUTH CALLBACK] → Default redirect to:", next);
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.log("[AUTH CALLBACK] → exchangeCodeForSession FAILED, falling through");
  }

  // No code and no token — might be a hash-based redirect from Supabase
  // Supabase sometimes sends tokens in the URL fragment (#access_token=...&type=recovery)
  // which the server cannot see. In that case, we need client-side handling.
  if (!code && !token_hash) {
    console.log("[AUTH CALLBACK] → No code or token_hash found. Supabase may be using fragment-based redirect (#access_token=...)");
    console.log("[AUTH CALLBACK] → Serving client-side handler page");
  }

  // Auth failed — redirect to login
  console.log("[AUTH CALLBACK] → Falling through to login error redirect");
  return NextResponse.redirect(`${origin}/login?error=Auth+failed`);
}
