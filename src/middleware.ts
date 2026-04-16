import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Skip auth refresh if Supabase isn't configured
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return supabaseResponse;

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — important for Server Components
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  // Narrowed to auth-protected paths only — per docs/Cloudflare_Execution_Plan.md
  // § C1.7 and § F.3. Public pages no longer trigger supabase.auth.getUser()
  // per request, which is the single biggest cache-busting issue on Cloudflare.
  // :path* matches zero or more segments, so `/dashboard/:path*` covers both
  // `/dashboard` and `/dashboard/foo/bar`.
  matcher: [
    "/dashboard/:path*",
    "/account/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/api/stripe/portal",
    "/api/company-briefings/submit",
    "/auth/callback",
  ],
};
