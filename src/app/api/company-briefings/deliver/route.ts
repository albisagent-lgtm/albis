import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import {
  generateCompanyBriefingHtmlV2,
  generateBriefingSubjectV2,
} from "@/lib/email-templates/company-briefing-v2";
import {
  getCompanyBriefingContentVersion,
  isCompanyScannerReportContent,
} from "@/lib/company-briefing-content-version";
import { validateCompanyBriefingForDelivery } from "@/lib/company-scan/company-briefing-delivery-safety";
import { ensureCompanySourceTrailShareLink } from "@/lib/company-scan/company-briefing-share-links";
import type { CompanyBriefingGenerationOutput } from "@/lib/company-scan/types";
import { shouldGenerateBriefing } from "@/lib/tier-enforcement";

const INGEST_KEY = process.env.SCAN_INGEST_KEY;
const FROM_ADDRESS = "Albis Briefing <briefing@albis.news>";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }
  return new Resend(apiKey);
}

function profileApprovedForDelivery(profileId: string): boolean {
  if (process.env.COMPANY_EMAIL_DELIVERY_APPROVE_ALL === "1") return true;
  const approvedIds = String(
    process.env.COMPANY_EMAIL_DELIVERY_APPROVED_PROFILE_IDS || "",
  )
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return approvedIds.includes(profileId);
}

function companyEvidenceDashboardLink(profileId: string, date: string): string {
  return `https://www.albis.news/dashboard/company/${profileId}/briefings/${date}/evidence`;
}

type CompanyBriefingContentWithLinks = CompanyBriefingGenerationOutput & {
  scanner_report?: { evidence_dashboard_link?: string };
};

function withCompanyEvidenceDashboardLink(
  content: CompanyBriefingContentWithLinks,
  profileId: string,
  date: string,
): CompanyBriefingContentWithLinks {
  const dashboardLink = companyEvidenceDashboardLink(profileId, date);
  return {
    ...content,
    source_notes: {
      ...content.source_notes,
      dashboard_link: content.source_notes?.dashboard_link || dashboardLink,
    },
    scanner_report: content.scanner_report
      ? {
          ...content.scanner_report,
          evidence_dashboard_link:
            content.scanner_report.evidence_dashboard_link || dashboardLink,
        }
      : content.scanner_report,
  };
}

/**
 * POST /api/company-briefings/deliver
 *
 * Sends Package 10C scanner-report company briefings only. Legacy
 * `what_changed` / `what_to_watch` content and compressed v2 mini-briefings are
 * deliberately not deliverable after the cleanup: they can remain readable for
 * history, but they must not leave the system as customer email.
 *
 * Body (optional):
 *   {
 *     briefing_date?: string,
 *     briefing_id?: string,
 *     company_profile_id?: string,
 *     force_all?: boolean,
 *     dry_run?: boolean,
 *     test_delivery?: boolean,
 *     override_recipients?: string[]
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

    const now = new Date();
    const nzDate = new Date(now.getTime() + 13 * 60 * 60 * 1000);
    const briefingDate =
      body.briefing_date || nzDate.toISOString().split("T")[0];
    const briefingId = typeof body.briefing_id === "string" ? body.briefing_id : null;
    const companyProfileId =
      typeof body.company_profile_id === "string" ? body.company_profile_id : null;
    const forceAll = body.force_all === true;
    const dryRun = body.dry_run === true;
    const testDelivery = body.test_delivery === true;
    const overrideRecipients = Array.isArray(body.override_recipients)
      ? body.override_recipients
          .map((recipient: unknown) =>
            typeof recipient === "string" ? recipient.trim().toLowerCase() : "",
          )
          .filter(Boolean)
      : [];

    if (testDelivery) {
      const allowedTestRecipients = String(
        process.env.COMPANY_EMAIL_TEST_RECIPIENTS || "",
      )
        .split(",")
        .map((recipient) => recipient.trim().toLowerCase())
        .filter(Boolean);

      const invalidRecipients = overrideRecipients.filter(
        (recipient: string) => !allowedTestRecipients.includes(recipient),
      );

      if (!dryRun && process.env.COMPANY_EMAIL_TEST_DELIVERY_ENABLED !== "1") {
        return NextResponse.json(
          {
            error: "company_email_test_delivery_disabled",
            message:
              "Controlled company test delivery is disabled. Set COMPANY_EMAIL_TEST_DELIVERY_ENABLED=1 only for allowlisted tests.",
          },
          { status: 423 },
        );
      }

      if (!briefingId && !companyProfileId) {
        return NextResponse.json(
          {
            error: "test_delivery_requires_exact_filter",
            message:
              "Controlled test delivery requires briefing_id or company_profile_id so unrelated queued briefings cannot fire.",
          },
          { status: 400 },
        );
      }

      if (overrideRecipients.length === 0 || invalidRecipients.length > 0) {
        return NextResponse.json(
          {
            error: "test_delivery_recipient_not_allowlisted",
            invalid_recipients: invalidRecipients,
            message:
              "Controlled test delivery requires override_recipients and every recipient must be present in COMPANY_EMAIL_TEST_RECIPIENTS.",
          },
          { status: 400 },
        );
      }
    }

    if (
      !dryRun &&
      !testDelivery &&
      process.env.COMPANY_EMAIL_DELIVERY_ENABLED !== "1"
    ) {
      return NextResponse.json(
        {
          error: "company_email_delivery_disabled",
          message:
            "Company email delivery is disabled. Set COMPANY_EMAIL_DELIVERY_ENABLED=1 only after Package 8 QA and launch approval.",
        },
        { status: 423 },
      );
    }

    let briefingQuery = supabase
      .from("company_briefings")
      .select(
        "id, company_profile_id, briefing_content, briefing_date, delivery_status",
      )
      .eq("briefing_date", briefingDate)
      .eq("status", "generated")
      .in("delivery_status", ["pending"]);

    if (briefingId) briefingQuery = briefingQuery.eq("id", briefingId);
    if (companyProfileId) {
      briefingQuery = briefingQuery.eq("company_profile_id", companyProfileId);
    }

    const { data: briefings, error: bErr } = await briefingQuery;

    if (bErr)
      return NextResponse.json({ error: bErr.message }, { status: 500 });

    if (!briefings || briefings.length === 0) {
      return NextResponse.json({
        briefing_date: briefingDate,
        dry_run: dryRun,
        companies_checked: 0,
        emails_sent: 0,
        emails_failed: 0,
        details: [],
        message: "No pending briefings to deliver",
      });
    }

    const profileIds = briefings.map((b) => b.company_profile_id);
    const { data: profiles, error: pErr } = await supabase
      .from("company_profiles")
      .select(
        "id, owner_id, company_name, email_enabled, email_recipients, preferred_delivery_time, timezone",
      )
      .in("id", profileIds);

    if (pErr)
      return NextResponse.json({ error: pErr.message }, { status: 500 });

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    const ownerIds = [
      ...new Set((profiles || []).map((p) => p.owner_id).filter(Boolean)),
    ];
    const { data: ownerProfiles } = ownerIds.length
      ? await supabase
          .from("profiles")
          .select(
            "id, subscription_status, subscription_tier, subscription_period_end, is_test_account, trial_end_at",
          )
          .in("id", ownerIds)
      : {
          data: [] as Array<{
            id: string;
            subscription_status: string | null;
            subscription_tier: string | null;
            subscription_period_end: string | null;
            is_test_account: boolean | null;
            trial_end_at: string | null;
          }>,
        };

    const ownerMap = new Map((ownerProfiles || []).map((o) => [o.id, o]));

    let emailsSent = 0;
    let emailsFailed = 0;
    const details: Array<{
      briefing_id?: string;
      company_name: string;
      status: string;
      final_status?: string;
      final_delivery_status?: string;
      recipients?: string[];
      error?: string;
      content_version?: string;
      warnings?: string[];
      source_trail_url?: string;
      source_trail_link_created?: boolean;
      source_trail_link_reused?: boolean;
    }> = [];

    let resend: Resend | null = null;

    for (const briefing of briefings) {
      const profile = profileMap.get(briefing.company_profile_id);
      if (!profile) {
        console.error(
          JSON.stringify({
            event: "company_briefing_send_attempt",
            briefing_id: briefing.id,
            company_profile_id: briefing.company_profile_id,
            recipient: null,
            final_status: "skipped",
            final_delivery_status: briefing.delivery_status,
            error: "Profile not found",
          }),
        );
        details.push({
          briefing_id: briefing.id,
          company_name: "Unknown",
          status: "skipped",
          final_status: "skipped",
          final_delivery_status: briefing.delivery_status,
          error: "Profile not found",
        });
        continue;
      }

      const contentVersion = getCompanyBriefingContentVersion(
        briefing.briefing_content,
      );
      if (!isCompanyScannerReportContent(briefing.briefing_content)) {
        const errMsg =
          contentVersion === "legacy_what_changed"
            ? "legacy_content_not_deliverable"
            : contentVersion === "company_briefing_v2"
              ? "compressed_v2_content_not_deliverable"
              : "invalid_company_briefing_content";

        details.push({
          briefing_id: briefing.id,
          company_name: profile.company_name,
          status: "blocked",
          final_status: "failed",
          final_delivery_status: dryRun ? briefing.delivery_status : "failed",
          error: errMsg,
          content_version: contentVersion,
        });

        if (!dryRun) {
          await supabase
            .from("company_briefings")
            .update({ delivery_status: "failed", delivery_error: errMsg })
            .eq("id", briefing.id);
        }
        console.error(
          JSON.stringify({
            event: "company_briefing_send_attempt",
            briefing_id: briefing.id,
            company_profile_id: profile.id,
            company_name: profile.company_name,
            recipient: null,
            final_status: dryRun ? "blocked_dry_run" : "failed",
            final_delivery_status: dryRun ? briefing.delivery_status : "failed",
            error: errMsg,
          }),
        );
        emailsFailed++;
        continue;
      }

      const safety = validateCompanyBriefingForDelivery(
        briefing.briefing_content,
      );
      if (!safety.ok) {
        const errMsg = `delivery_safety_blocked:${safety.errors.slice(0, 3).join("|")}`;
        details.push({
          briefing_id: briefing.id,
          company_name: profile.company_name,
          status: "blocked",
          final_status: "failed",
          final_delivery_status: dryRun ? briefing.delivery_status : "failed",
          error: errMsg,
          content_version: contentVersion,
        });

        if (!dryRun) {
          await supabase
            .from("company_briefings")
            .update({ delivery_status: "failed", delivery_error: errMsg })
            .eq("id", briefing.id);
        }
        console.error(
          JSON.stringify({
            event: "company_briefing_send_attempt",
            briefing_id: briefing.id,
            company_profile_id: profile.id,
            company_name: profile.company_name,
            recipient: null,
            final_status: dryRun ? "blocked_dry_run" : "failed",
            final_delivery_status: dryRun ? briefing.delivery_status : "failed",
            error: errMsg,
          }),
        );
        emailsFailed++;
        continue;
      }

      const owner = ownerMap.get(profile.owner_id);
      if (!owner || (!shouldGenerateBriefing(owner) && !testDelivery)) {
        details.push({
          briefing_id: briefing.id,
          company_name: profile.company_name,
          status: "skipped",
          final_status: "skipped",
          final_delivery_status: briefing.delivery_status,
          error: "subscription_inactive",
          content_version: contentVersion,
        });
        continue;
      }

      if (!profile.email_enabled) {
        details.push({
          briefing_id: briefing.id,
          company_name: profile.company_name,
          status: "skipped",
          final_status: "skipped",
          final_delivery_status: briefing.delivery_status,
          error: "Email delivery disabled",
          content_version: contentVersion,
        });
        continue;
      }

      if (!testDelivery && !profileApprovedForDelivery(profile.id)) {
        details.push({
          briefing_id: briefing.id,
          company_name: profile.company_name,
          status: "skipped",
          final_status: "skipped",
          final_delivery_status: briefing.delivery_status,
          error:
            "Email delivery awaiting explicit profile approval. Add the profile id to COMPANY_EMAIL_DELIVERY_APPROVED_PROFILE_IDS, or set COMPANY_EMAIL_DELIVERY_APPROVE_ALL=1 after launch approval.",
          content_version: contentVersion,
        });
        continue;
      }

      const recipients: string[] = testDelivery
        ? overrideRecipients
        : profile.email_recipients || [];
      if (recipients.length === 0) {
        details.push({
          briefing_id: briefing.id,
          company_name: profile.company_name,
          status: "skipped",
          final_status: "skipped",
          final_delivery_status: briefing.delivery_status,
          error: "No email recipients configured",
          content_version: contentVersion,
        });
        continue;
      }

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
            }).format(now),
          );
        } catch {
          currentLocalHour = now.getUTCHours();
        }

        // Hourly delivery should be a lower bound, not an exact one-hour-only
        // gate. If generation finishes late, paid companies must still receive
        // that day's briefing instead of waiting forever in `pending`.
        if (currentLocalHour < preferredHour) {
          details.push({
            briefing_id: briefing.id,
            company_name: profile.company_name,
            status: "waiting",
            final_status: "waiting",
            final_delivery_status: briefing.delivery_status,
            error: `Not yet delivery time (current: ${currentLocalHour}:00, preferred: ${preferredHour}:00 ${tz})`,
            content_version: contentVersion,
          });
          continue;
        }
      }

      if (dryRun) {
        const contentForEmail = withCompanyEvidenceDashboardLink(
          briefing.briefing_content as CompanyBriefingContentWithLinks,
          profile.id,
          briefing.briefing_date,
        );
        details.push({
          briefing_id: briefing.id,
          company_name: profile.company_name,
          status: "would_send",
          final_status: "would_send",
          final_delivery_status: briefing.delivery_status,
          recipients,
          content_version: contentVersion,
          warnings: safety.warnings,
          source_trail_url: contentForEmail.source_notes?.dashboard_link,
        });
        continue;
      }

      const { data: claimedBriefing, error: claimErr } = await supabase
        .from("company_briefings")
        .update({
          status: "generating",
          delivery_error: null,
        })
        .eq("id", briefing.id)
        .eq("delivery_status", "pending")
        .select("id")
        .maybeSingle();

      if (claimErr || !claimedBriefing) {
        details.push({
          briefing_id: briefing.id,
          company_name: profile.company_name,
          status: "skipped",
          final_status: "skipped",
          final_delivery_status: briefing.delivery_status,
          error: claimErr
            ? `delivery_claim_failed:${claimErr.message}`
            : "delivery_already_claimed_or_sent",
          content_version: contentVersion,
        });
        continue;
      }

      try {
        let shareLink: Awaited<ReturnType<typeof ensureCompanySourceTrailShareLink>> | null = null;
        let sourceTrailWarning: string | undefined;
        try {
          shareLink = await ensureCompanySourceTrailShareLink(supabase, {
            id: briefing.id,
            company_profile_id: briefing.company_profile_id,
            briefing_date: briefing.briefing_date,
            briefing_content: briefing.briefing_content,
          });
        } catch (shareError: unknown) {
          sourceTrailWarning =
            shareError instanceof Error ? shareError.message : "source_trail_share_link_unavailable";
          console.error(
            JSON.stringify({
              event: "company_source_trail_share_link_failed",
              briefing_id: briefing.id,
              company_profile_id: briefing.company_profile_id,
              error: sourceTrailWarning,
            }),
          );
        }
        const contentForEmail = shareLink
          ? (shareLink.content as unknown as CompanyBriefingContentWithLinks)
          : withCompanyEvidenceDashboardLink(
              briefing.briefing_content as CompanyBriefingContentWithLinks,
              profile.id,
              briefing.briefing_date,
            );
        const html = generateCompanyBriefingHtmlV2(
          contentForEmail,
          profile.company_name,
          briefing.briefing_date,
        );
        const subject = generateBriefingSubjectV2(
          profile.company_name,
          briefing.briefing_date,
          contentForEmail.today_brief.top_line.text,
        );
        resend ||= getResendClient();
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
          for (let i = 0; i < batch.length; i += 100) {
            const chunk = batch.slice(i, i + 100);
            const { error: sendErr } = await resend.batch.send(chunk);
            if (sendErr) throw new Error(sendErr.message);
          }
        }

        await supabase
          .from("company_briefings")
          .update({
            status: "delivered",
            delivery_status: "sent",
            delivered_at: new Date().toISOString(),
          })
          .eq("id", briefing.id);

        emailsSent++;
        for (const recipient of recipients) {
          console.log(
            JSON.stringify({
              event: "company_briefing_send_attempt",
              briefing_id: briefing.id,
              company_profile_id: profile.id,
              company_name: profile.company_name,
              recipient,
              test_delivery: testDelivery,
              final_status: "delivered",
              final_delivery_status: "sent",
              error: null,
            }),
          );
        }
        details.push({
          briefing_id: briefing.id,
          company_name: profile.company_name,
          status: "sent",
          final_status: "delivered",
          final_delivery_status: "sent",
          recipients,
          content_version: contentVersion,
          warnings: sourceTrailWarning
            ? [...safety.warnings, sourceTrailWarning]
            : safety.warnings,
          source_trail_url: shareLink?.url || contentForEmail.source_notes?.dashboard_link,
          source_trail_link_created: shareLink?.created,
          source_trail_link_reused: shareLink?.reused,
        });
      } catch (sendError: unknown) {
        const errMsg =
          sendError instanceof Error ? sendError.message : "Unknown send error";
        await supabase
          .from("company_briefings")
          .update({
            status: "failed",
            delivery_status: "failed",
            delivery_error: errMsg,
          })
          .eq("id", briefing.id)
          .eq("status", "generating");

        emailsFailed++;
        for (const recipient of recipients) {
          console.error(
            JSON.stringify({
              event: "company_briefing_send_attempt",
              briefing_id: briefing.id,
              company_profile_id: profile.id,
              company_name: profile.company_name,
              recipient,
              test_delivery: testDelivery,
              final_status: "failed",
              final_delivery_status: "failed",
              error: errMsg,
            }),
          );
        }
        details.push({
          briefing_id: briefing.id,
          company_name: profile.company_name,
          status: "failed",
          final_status: "failed",
          final_delivery_status: "failed",
          recipients,
          error: errMsg,
          content_version: contentVersion,
        });
      }
    }

    return NextResponse.json({
      briefing_date: briefingDate,
      dry_run: dryRun,
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
