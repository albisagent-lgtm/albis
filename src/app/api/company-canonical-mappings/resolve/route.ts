import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapProfileToCanonicals } from "@/lib/canonical-resolver";

/**
 * POST /api/company-canonical-mappings/resolve
 *
 * Resolves the authenticated user's own company profile values to the
 * canonical registry. Called by the profile editor after every successful
 * save so newly-typed values silently get mapped (or auto-create new
 * canonicals when nothing matches). Idempotent.
 *
 * Auth: Supabase session cookie. The route looks up the company_profile
 * by owner_id = auth.uid(), so the request body needs no profile id.
 *
 * Behavior is fire-and-forget from the editor's perspective — failures are
 * non-fatal to the underlying profile save.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileErr } = await supabase
    .from("company_profiles")
    .select(
      "id, tracked_themes, watchlist_entities, regions, sector, sub_sector, risk_priorities, supply_chain_exposure"
    )
    .eq("owner_id", user.id)
    .single();
  if (profileErr || !profile) {
    return NextResponse.json({ error: "No company profile" }, { status: 404 });
  }

  // mapProfileToCanonicals writes to canonical_topics + canonical_topic_aliases
  // + company_canonical_mappings, all of which require service-role for
  // INSERT under the RLS policies from the Package 4 migration.
  const admin = createAdminClient();
  try {
    const summary = await mapProfileToCanonicals(admin, profile as never);
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
