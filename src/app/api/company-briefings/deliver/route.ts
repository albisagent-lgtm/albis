import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import {
  generateCompanyBriefingHtml,
  generateBriefingSubject,
  type BriefingContent,
} from "@/lib/email-templates/company-briefing";

const INGEST_KEY = process.env.SCAN_INGEST_KEY;
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_ADDRESS = "Albis Briefing <briefing@albis.news>";

/**
 * POST /api/company-briefings/deliver
 *
 * Sends generated briefing emails to companies whose preferred delivery time
 * matches the current hour. Called hourly by the OpenClaw delivery cron.
 *
 * Auth: Bearer token (SCAN_INGEST_KEY)
 *
 * Body (optional):
 *   {
 *     briefing_date?: string,    // YYYY-MM-DD, defaults to today NZST
 *     force_all?: boolean        // Send to all companies regardless of time (for testing)
 *   }
 *
 * Response:
 *   {
 *     briefing_date: string,
 *     companies_checked: number,
 *     emails_sent: number,
 *     emails_failed: number,
 *     details: [{ company_name, status, recipients?, error? }]
 *   }
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!INGEST_KEY || token !== INGEST_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const supabase = createAdminClient();

    // Determine date
    const now = new Date();
    const nzDate = new Date(now.getTime() + 13 * 60 * 60 * 1000);
    const briefingDate =
      body.briefing_date || nzDate.toISOString().split("T")[0];
    const forceAll = body.force_all === true;

    // 1. Fetch all generated briefings for today that haven't been delivered
    const { data: briefings, error: bErr } = await supabase
      .from("company_briefings")
      .select(
        "id, company_profile_id, briefing_content, briefing_date, delivery_status"
      )
      .eq("briefing_date", briefingDate)
      .eq("status", "generated")
      .in("delivery_status", ["pending"]);

    if (bErr) {
      return NextResponse.json({ error: bErr.message }, { status: 500 });
    }

    if (!briefings || briefings.length === 0) {
      return NextResponse.json({
        briefing_date: briefingDate,
        companies_checked: 0,
        emails_sent: 0,
        emails_failed: 0,
        details: [],
        message: "No pending briefings to deliver",
      });
    }

    // 2. Fetch company profiles for these briefings
    const profileIds = briefings.map((b) => b.company_profile_id);
    const { data: profiles, error: pErr } = await supabase
      .from("company_profiles")
      .select(
        "id, company_name, email_enabled, email_recipients, preferred_delivery_time, timezone"
      )
      .in("id", profileIds);

    if (pErr) {
      return NextResponse.json({ error: pErr.message }, { status: 500 });
    }

    const profileMap = new Map(
      (profiles || []).map((p) => [p.id, p])
    );

    // 3. For each briefing, check if it's time to deliver
    let emailsSent = 0;
    let emailsFailed = 0;
    const details: Array<{
      company_name: string;
      status: string;
      recipients?: string[];
      error?: string;
    }> = [];

    for (const briefing of briefings) {
      const profile = profileMap.get(briefing.company_profile_id);
      if (!profile) {
        details.push({
          company_name: "Unknown",
          status: "skipped",
          error: "Profile not found",
        });
        continue;
      }

      // Check email enabled
      if (!profile.email_enabled) {
        details.push({
          company_name: profile.company_name,
          status: "skipped",
          error: "Email delivery disabled",
        });
        continue;
      }

      // Check if recipients exist
      const recipients: string[] = profile.email_recipients || [];
      if (recipients.length === 0) {
        details.push({
          company_name: profile.company_name,
          status: "skipped",
          error: "No email recipients configured",
        });
        continue;
      }

      // Check delivery time unless force_all
      if (!forceAll) {
        const tz = profile.timezone || "UTC";
        const preferredTime = profile.preferred_delivery_time || "07:00";
        const preferredHour = parseInt(preferredTime.split(":")[0], 10);

        let currentLocalHour: number;
        try {
          currentLocalHour = parseInt(
            new Intl.DateTimeFormat("en-US", {
              hour: "numeric",
              hour12: false,
              timeZone: tz,
            }).format(now)
          );
        } catch {
          // Invalid timezone, default to UTC
          currentLocalHour = now.getUTCHours();
        }

        if (currentLocalHour !== preferredHour) {
          details.push({
            company_name: profile.company_name,
            status: "waiting",
            error: `Not yet delivery time (current: ${currentLocalHour}:00, preferred: ${preferredHour}:00 ${tz})`,
          });
          continue;
        }
      }

      // 4. Generate email HTML
      const content = briefing.briefing_content as BriefingContent;
      if (!content || !content.header || !content.what_changed) {
        details.push({
          company_name: profile.company_name,
          status: "failed",
          error: "Invalid briefing content",
        });

        await supabase
          .from("company_briefings")
          .update({
            delivery_status: "failed",
            delivery_error: "Invalid briefing content",
          })
          .eq("id", briefing.id);

        emailsFailed++;
        continue;
      }

      const html = generateCompanyBriefingHtml(content);
      const subject = generateBriefingSubject(
        content.header.company_name,
        content.header.date
      );

      // 5. Send to all recipients
      try {
        const batch = recipients.map((to) => ({
          from: FROM_ADDRESS,
          to,
          subject,
          html,
        }));

        if (batch.length <= 100) {
          const { error: sendErr } = await resend.batch.send(batch);
          if (sendErr) throw new Error(sendErr.message);
        } else {
          // Send in batches of 100
          for (let i = 0; i < batch.length; i += 100) {
            const chunk = batch.slice(i, i + 100);
            const { error: sendErr } = await resend.batch.send(chunk);
            if (sendErr) throw new Error(sendErr.message);
          }
        }

        // Mark as delivered
        await supabase
          .from("company_briefings")
          .update({
            status: "delivered",
            delivery_status: "sent",
            delivered_at: new Date().toISOString(),
          })
          .eq("id", briefing.id);

        emailsSent++;
        details.push({
          company_name: profile.company_name,
          status: "sent",
          recipients,
        });
      } catch (sendError: unknown) {
        const errMsg =
          sendError instanceof Error ? sendError.message : "Unknown send error";

        // Mark as failed
        await supabase
          .from("company_briefings")
          .update({
            delivery_status: "failed",
            delivery_error: errMsg,
          })
          .eq("id", briefing.id);

        emailsFailed++;
        details.push({
          company_name: profile.company_name,
          status: "failed",
          recipients,
          error: errMsg,
        });
      }
    }

    return NextResponse.json({
      briefing_date: briefingDate,
      companies_checked: briefings.length,
      emails_sent: emailsSent,
      emails_failed: emailsFailed,
      details,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Deliver error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
