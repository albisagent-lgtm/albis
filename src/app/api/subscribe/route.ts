import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { sendEmail } from "@/lib/email";
import { generateWelcomeEmail } from "@/lib/email-templates/welcome";

// --- Rate Limiting (in-memory, per Worker isolate) ---
//
// Lazy cleanup per request, no module-scope timers. On Cloudflare Workers,
// setInterval at module scope runs per-isolate and offers no reliable prune
// guarantee; see docs/Cloudflare_Execution_Plan.md § F.5. Each request prunes
// stale entries before the rate check — O(n) in the number of active IPs,
// which is bounded by the 60s window and fine at this endpoint's volume.
//
// State resets when an isolate is recycled; this is a softer guarantee than
// a single-process Node server, but matches the Workers model.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 60 seconds
const RATE_LIMIT_MAX = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // Lazy prune of expired entries before the check.
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

// --- Disposable Email Blocklist ---
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "tempmail.com", "throwaway.email", "guerrillamail.com",
  "10minutemail.com", "yopmail.com", "trashmail.com", "fakeinbox.com",
  "sharklasers.com", "guerrillamailblock.com", "grr.la", "dispostable.com",
  "maildrop.cc", "temp-mail.org",
]);

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

const FAKE_SUCCESS = NextResponse.json({
  success: true,
  message: "You're on the list! We'll be in touch soon.",
});

export async function POST(request: Request) {
  try {
    // Rate limiting
    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Please try again in a minute." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Honeypot check — stealth reject
    if (body.website) {
      return FAKE_SUCCESS;
    }

    // Timing check — stealth reject if submitted < 2s after mount
    const mountTime = body._t;
    if (mountTime && Date.now() - mountTime < 2000) {
      return FAKE_SUCCESS;
    }

    const email = body.email?.trim()?.toLowerCase();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Disposable email check
    const domain = email.split("@")[1];
    if (DISPOSABLE_DOMAINS.has(domain)) {
      return NextResponse.json(
        { success: false, message: "Please use a permanent email address." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    if (supabase) {
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

      const clientSource = body.source?.trim();
      const source = clientSource && typeof clientSource === "string" && clientSource.length <= 64 ? clientSource : "website";
      const insertData: Record<string, string> = { email, source };
      const ref = body.ref?.trim();
      if (ref && typeof ref === "string" && ref.length <= 32) {
        insertData.referred_by = ref;
      }
      // Capture timezone from client
      const tz = body.timezone?.trim();
      if (tz && typeof tz === "string" && tz.length <= 64) {
        insertData.timezone = tz;
      }

      const { error } = await supabase
        .from("subscribers")
        .insert(insertData);

      if (error) {
        console.error("Supabase insert error:", error.message);
      } else {
        // Fire welcome email. Failures must not block the subscription.
        try {
          const { subject, html } = generateWelcomeEmail(email);
          await sendEmail({ to: email, subject, html });
        } catch (sendErr) {
          console.error("Welcome email send failed:", sendErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "You're in. Your first briefing arrives tomorrow morning.",
    });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
