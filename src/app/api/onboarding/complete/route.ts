// ---------------------------------------------------------------------------
// POST /api/onboarding/complete — Package 7.
//
// Called by the company-onboarding client immediately after it upserts the
// company_profile with onboarding_completed=true. Server-side responsibilities:
//
//   1. Auto-assign the 7-day free trial (idempotent).
//   2. (Package 7 CP4) Generate the preview-on-signup briefing.
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

interface CompleteResponse {
  trial: {
    assigned: boolean;
    trial_end_at: string | null;
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

  const response: CompleteResponse = {
    trial: {
      assigned: trial.assigned,
      trial_end_at: trial.trialEndAt,
      error: trial.error,
    },
  };

  return NextResponse.json(response);
}
