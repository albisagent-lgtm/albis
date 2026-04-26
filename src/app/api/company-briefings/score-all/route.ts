import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  scoreStoriesForCompany,
  getSelectedStories,
  determineSignalLevel,
} from "@/lib/relevance-engine";
import { loadScanItems } from "@/lib/scan-loader";
import { shouldGenerateBriefing } from "@/lib/tier-enforcement";
import { loadCanonicalIndexForProfile, emptyCanonicalIndex } from "@/lib/canonical-index";
import type { CompanyProfile } from "@/lib/company-profile";

const INGEST_KEY = process.env.SCAN_INGEST_KEY;

/**
 * POST /api/company-briefings/score-all
 *
 * Scores today's scan items against ALL active company profiles.
 * Returns a summary of results plus the full payload for each company
 * that OpenClaw needs to generate briefings.
 *
 * Auth: Bearer token (SCAN_INGEST_KEY)
 *
 * Body:
 *   { scan_date?: string }  — optional, defaults to today (NZST)
 *
 * Response:
 *   {
 *     scan_date, stories_in_scan,
 *     companies: [{
 *       company_profile_id, company_name, briefing_id, signal_level,
 *       stories_selected, selected_stories, profile_summary
 *     }]
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

    // Determine scan date
    const now = new Date();
    const nzDate = new Date(now.getTime() + 13 * 60 * 60 * 1000);
    const scanDate = body.scan_date || nzDate.toISOString().split("T")[0];

    // 1. Fetch today's scan items (JSONB items + scan_items fallback)
    const allItems = await loadScanItems(supabase, scanDate);

    if (allItems.length === 0) {
      return NextResponse.json(
        { error: `No scan items found for date ${scanDate}` },
        { status: 404 }
      );
    }

    // 2. Fetch all active company profiles
    const { data: profiles, error: profileErr } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("onboarding_completed", true);

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json(
        { scan_date: scanDate, stories_in_scan: allItems.length, companies: [] }
      );
    }

    // Batch-fetch owner subscription status for all profiles
    const ownerIds = [...new Set(profiles.map((p) => p.owner_id))];
    const { data: ownerProfiles } = await supabase
      .from("profiles")
      .select("id, subscription_status, subscription_tier, subscription_period_end, is_test_account, trial_end_at")
      .in("id", ownerIds);

    const ownerMap = new Map(
      (ownerProfiles || []).map((o) => [o.id, o])
    );

    // 3. Score for each company (skipping those without active subscriptions)
    const results = [];
    const skipped: Array<{ company_profile_id: string; company_name: string; reason: string }> = [];
    for (const profile of profiles) {
      const owner = ownerMap.get(profile.owner_id);
      if (!owner || !shouldGenerateBriefing(owner)) {
        skipped.push({
          company_profile_id: profile.id,
          company_name: profile.company_name,
          reason: "subscription_inactive",
        });
        continue;
      }
      let canonicalIndex;
      try {
        canonicalIndex = await loadCanonicalIndexForProfile(supabase, profile.id);
      } catch (err) {
        console.warn(`Canonical index load failed for ${profile.id}, using raw fallback:`, err);
        canonicalIndex = emptyCanonicalIndex();
      }
      const scored = scoreStoriesForCompany(allItems, profile as CompanyProfile, canonicalIndex);
      const selected = getSelectedStories(scored);
      const signalLevel = determineSignalLevel(selected);

      // Store scores (delete existing first for idempotency)
      await supabase
        .from("company_story_scores")
        .delete()
        .eq("company_profile_id", profile.id)
        .eq("scan_date", scanDate);

      const scoreRows = scored.map(s => ({
        company_profile_id: profile.id,
        scan_date: scanDate,
        story_headline: s.headline,
        story_category: s.category,
        story_regions: s.regions,
        story_tags: s.tags,
        story_significance: s.significance,
        story_connection: s.connection,
        geography_score: s.geography_score,
        sector_score: s.sector_score,
        theme_score: s.theme_score,
        entity_score: s.entity_score,
        supply_chain_score: s.supply_chain_score,
        risk_score: s.risk_score,
        urgency_score: s.urgency_score,
        significance_score: s.significance_score,
        relevance_score: s.relevance_score,
        match_reasons: s.match_reasons,
        selected_for_briefing: s.selected_for_briefing,
      }));

      if (scoreRows.length > 0) {
        await supabase.from("company_story_scores").insert(scoreRows);
      }

      // Create briefing row
      const { data: briefing } = await supabase
        .from("company_briefings")
        .upsert(
          {
            company_profile_id: profile.id,
            briefing_date: scanDate,
            status: "scoring_complete",
            stories_considered: allItems.length,
            stories_selected: selected.length,
          },
          { onConflict: "company_profile_id,briefing_date" }
        )
        .select("id")
        .single();

      const selectedStories = selected.map(s => ({
        headline: s.headline,
        summary: s.connection,
        category: s.category,
        regions: s.regions,
        tags: s.tags,
        significance: s.significance,
        relevance_score: Math.round(s.relevance_score * 1000) / 1000,
        match_reasons: s.match_reasons,
      }));

      results.push({
        company_profile_id: profile.id,
        company_name: profile.company_name,
        briefing_id: briefing?.id || null,
        signal_level: signalLevel,
        stories_selected: selected.length,
        selected_stories: selectedStories,
        profile_summary: {
          company_name: profile.company_name,
          sector: profile.sector,
          sub_sector: profile.sub_sector,
          regions: profile.regions,
          countries: profile.countries,
          tracked_themes: profile.tracked_themes,
          risk_priorities: profile.risk_priorities,
          watchlist_entities: profile.watchlist_entities,
          supply_chain_exposure: profile.supply_chain_exposure,
          preferred_briefing_depth: profile.preferred_briefing_depth,
        },
      });
    }

    return NextResponse.json({
      scan_date: scanDate,
      stories_in_scan: allItems.length,
      companies_scored: results.length,
      companies_skipped: skipped.length,
      companies: results,
      skipped,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Score-all error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
