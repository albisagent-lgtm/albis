import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const INGEST_KEY = process.env.SCAN_INGEST_KEY;
const FROM_ADDRESS = "Albis <harry@albis.news>";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.albis.news";

interface TrialProfile {
  id: string;
  email: string | null;
  name: string | null;
  subscription_status: string | null;
  subscription_tier: string | null;
  trial_end_at: string | null;
  is_test_account: boolean | null;
  briefing_preferences: Record<string, unknown> | null;
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");
  return new Resend(apiKey);
}

function esc(value: string | null | undefined): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hasFollowupBeenSent(profile: TrialProfile): boolean {
  return Boolean(
    profile.briefing_preferences?.company_trial_end_followup_sent_at,
  );
}

function buildTrialEndedEmail(profile: TrialProfile) {
  const firstName = profile.name?.split(/\s+/)[0] || "there";
  const pricingUrl = `${SITE.replace(/\/$/, "")}/pricing`;
  const dashboardUrl = `${SITE.replace(/\/$/, "")}/dashboard`;
  const subject = "Your Albis Company Daily Scan trial has ended";
  const html = `
  <div style="margin:0;padding:0;background:#f8f7f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1f2937;">
    <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
      <div style="background:#ffffff;border:1px solid #eadfcb;border-radius:18px;padding:28px;box-shadow:0 8px 28px rgba(15,23,42,0.06);">
        <div style="font-family:Georgia,serif;font-size:26px;font-weight:600;color:#111827;margin-bottom:18px;">Albis</div>
        <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Hi ${esc(firstName)},</p>
        <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Your 3-day Company Daily Scan trial has ended, so new company briefings are now paused.</p>
        <p style="font-size:16px;line-height:1.6;margin:0 0 18px;">Your dashboard and past scans remain available. If the daily external-risk briefing was useful, you can choose a plan to keep receiving your company scan automatically.</p>
        <div style="margin:26px 0;">
          <a href="${pricingUrl}" style="display:inline-block;background:#c8922a;color:#ffffff;text-decoration:none;border-radius:999px;padding:12px 20px;font-weight:700;font-size:14px;">Choose a plan</a>
          <a href="${dashboardUrl}" style="display:inline-block;color:#8a6018;text-decoration:none;margin-left:14px;font-weight:600;font-size:14px;">View dashboard</a>
        </div>
        <p style="font-size:14px;line-height:1.6;color:#6b7280;margin:0;">If you have questions or want help tuning your company profile, just reply to this email.</p>
      </div>
    </div>
  </div>`;
  return { subject, html };
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!INGEST_KEY || token !== INGEST_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;
    const limit = Math.max(1, Math.min(Number(body.limit || 100), 500));
    const now = new Date().toISOString();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, email, name, subscription_status, subscription_tier, trial_end_at, is_test_account, briefing_preferences",
      )
      .eq("subscription_status", "trialing")
      .lt("trial_end_at", now)
      .limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const profiles = ((data || []) as TrialProfile[]).filter(
      (profile) => !profile.is_test_account && !hasFollowupBeenSent(profile),
    );

    const details: Array<{
      id: string;
      email: string | null;
      status: string;
      error?: string;
    }> = [];

    let resend: Resend | null = null;
    let emailsSent = 0;
    let profilesUpdated = 0;

    for (const profile of profiles) {
      if (!profile.email) {
        details.push({ id: profile.id, email: null, status: "skipped_no_email" });
        continue;
      }

      if (dryRun) {
        details.push({ id: profile.id, email: profile.email, status: "would_send_and_end_trial" });
        continue;
      }

      try {
        resend ||= getResendClient();
        const { subject, html } = buildTrialEndedEmail(profile);
        const { error: sendErr } = await resend.emails.send({
          from: FROM_ADDRESS,
          to: profile.email,
          subject,
          html,
        });
        if (sendErr) throw new Error(sendErr.message);

        const nextPrefs = {
          ...(profile.briefing_preferences || {}),
          company_trial_end_followup_sent_at: now,
        };
        const { error: updateErr } = await supabase
          .from("profiles")
          .update({
            subscription_status: "trial_ended",
            briefing_preferences: nextPrefs,
          })
          .eq("id", profile.id);
        if (updateErr) throw new Error(updateErr.message);

        emailsSent++;
        profilesUpdated++;
        details.push({ id: profile.id, email: profile.email, status: "sent" });
      } catch (err) {
        details.push({
          id: profile.id,
          email: profile.email,
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({
      ok: true,
      dry_run: dryRun,
      expired_trials_found: data?.length || 0,
      eligible_followups: profiles.length,
      emails_sent: emailsSent,
      profiles_updated: profilesUpdated,
      details,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("trial-ended followup failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
