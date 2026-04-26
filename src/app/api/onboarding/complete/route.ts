// ---------------------------------------------------------------------------
// POST /api/onboarding/complete — Package 7.
//
// Called by the company-onboarding client immediately after it upserts the
// company_profile with onboarding_completed=true. Server-side responsibilities:
//
//   1. Auto-assign the 7-day free trial (idempotent).
//   2. Generate the preview-on-signup briefing from the most recent 24h
//      of pooled signals (CP4).
//
// Both steps run with the service-role admin client so the user can't game
// either via direct browser calls. Failures here MUST NOT block the
// onboarding success path — we always return 200 with whatever state we
// reached, and log warnings for the steps that failed.
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assignFreeTrial } from "@/lib/billing/trial";
import { generatePreviewBriefing } from "@/lib/company-scan/generate-preview-briefing";

interface CompleteResponse {
  trial: {
    assigned: boolean;
    trial_end_at: string | null;
    error: string | null;
  };
  preview_briefing: {
    status: string;
    briefing_id: string | null;
    error: string | null;
  };
}

export async function POST() {
  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createAdminClient();

  const trial = await assignFreeTrial(admin, user.id);
  if (trial.error) {
    console.warn(
      `[onboarding-complete] assignFreeTrial failed for ${user.id}: ${trial.error}`
    );
  }

  const previewResult: CompleteResponse["preview_briefing"] = {
    status: "skipped",
    briefing_id: null,
    error: null,
  };

  try {
    const { data: companyProfile } = await admin
      .from("company_profiles")
      .select("id")
      .eq("owner_id", user.id)
      .eq("onboarding_completed", true)
      .single();

    if (companyProfile?.id) {
      const result = await generatePreviewBriefing(admin, companyProfile.id);
      previewResult.status = result.status;
      previewResult.briefing_id = result.briefing_id ?? null;
    } else {
      previewResult.status = "skipped_no_company_profile";
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `[onboarding-complete] preview briefing failed for ${user.id}: ${message}`
    );
    previewResult.status = "failed";
    previewResult.error = message;
  }

  const response: CompleteResponse = {
    trial: {
      assigned: trial.assigned,
      trial_end_at: trial.trialEndAt,
      error: trial.error,
    },
    preview_briefing: previewResult,
  };

  return NextResponse.json(response);
}
