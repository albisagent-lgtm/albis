import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SOURCE_TRAIL_PATH = "/source-trail/";

function hardNotFound() {
  return new NextResponse("Not found", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashCompanyShareToken(token: string): Promise<string> {
  const secret = process.env.COMPANY_SHARE_LINK_TOKEN_SECRET;
  const encoder = new TextEncoder();

  if (secret) {
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(token)));
  }

  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(token)));
}

async function validateSourceTrailToken(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith(SOURCE_TRAIL_PATH)) return null;

  const token = decodeURIComponent(
    request.nextUrl.pathname.slice(SOURCE_TRAIL_PATH.length),
  );
  if (!token || !/^[A-Za-z0-9_-]{32,}$/.test(token)) return hardNotFound();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const shareSecret = process.env.COMPANY_SHARE_LINK_TOKEN_SECRET;

  // If runtime env is incomplete, fall through to the page-level validator rather
  // than risking false negatives for legitimate emailed source-trail links.
  if (!url || !serviceKey || !shareSecret) return null;

  const tokenHash = await hashCompanyShareToken(token);
  const endpoint = new URL("/rest/v1/company_briefing_share_links", url);
  endpoint.searchParams.set("select", "id,expires_at,revoked_at");
  endpoint.searchParams.set("token_hash", `eq.${tokenHash}`);
  endpoint.searchParams.set("purpose", "eq.source_trail");
  endpoint.searchParams.set("limit", "1");

  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: serviceKey,
        authorization: `Bearer ${serviceKey}`,
      },
    });
    if (!response.ok) return null;
    const rows = (await response.json()) as Array<{
      expires_at: string | null;
      revoked_at: string | null;
    }>;
    const link = rows[0];
    if (!link || link.revoked_at) return hardNotFound();
    if (link.expires_at && new Date(link.expires_at).getTime() <= Date.now()) {
      return hardNotFound();
    }
  } catch {
    return null;
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const sourceTrailResponse = await validateSourceTrailToken(request);
  if (sourceTrailResponse) return sourceTrailResponse;

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
    "/source-trail/:token*",
  ],
};
