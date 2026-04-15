import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  scoreStoriesForCompany,
  getSelectedStories,
  determineSignalLevel,
} from "@/lib/relevance-engine";
import { loadScanItems } from "@/lib/scan-loader";
import { shouldGenerateBriefing } from "@/lib/tier-enforcement";
import type { CompanyProfile } from "@/lib/company-profile";

const INGEST_KEY = process.env.SCAN_INGEST_KEY;

/**
 * POST /api/company-briefings/score
 *
 * Scores today's scan items against a company profile and stores results.
 * Returns the top stories with company profile context — ready for OpenClaw
 * to generate a briefing.
 *
 * Auth: Bearer token (SCAN_INGEST_KEY)
 *
 * Body:
 *   { company_profile_id: string, scan_date?: string }
 *   - company_profile_id: UUID of the company profile to score for
 *   - scan_date: optional, defaults to today (NZST)
 *
 * Response:
 *   {
 *     company_profile_id, company_name, scan_date, signal_level,
 *     stories_considered, stories_selected,
 *     selected_stories: [{ headline, summary, category, regions, relevance_score, relevance_tags }],
 *     profile_summary: { sector, regions, tracked_themes, risk_priorities, ... },
 *     briefing_id
 *   }
 */
export async function POST(req: NextRequest) {
  // Auth
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!INGEST_KEY || token !== INGEST_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { company_profile_id, scan_date: requestedDate } = body;

    if (!company_profile_id) {
      return NextResponse.json({ error: "company_profile_id required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Determine scan date (default: today in NZST)
    const now = new Date();
    const nzDate = new Date(now.getTime() + 13 * 60 * 60 * 1000);
    const scanDate = requestedDate || nzDate.toISOString().split("T")[0];

    // 1. Fetch the company profile
    const { data: profile, error: profileErr } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("id", company_profile_id)
      .eq("onboarding_completed", true)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json(
        { error: "Company profile not found or onboarding not complete" },
        { status: 404 }
      );
    }

    // Gate: only score for active/trialing subscriptions
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("subscription_status, subscription_tier, subscription_period_end")
      .eq("id", profile.owner_id)
      .single();

    if (!ownerProfile || !shouldGenerateBriefing(ownerProfile)) {
      return NextResponse.json(
        {
          skipped: true,
          reason: "subscription_inactive",
          company_profile_id,
          company_name: profile.company_name,
        },
        { status: 200 }
      );
    }

    // 2. Fetch today's scan items (JSONB items + scan_items fallback)
    const allItems = await loadScanItems(supabase, scanDate);

    if (allItems.length === 0) {
      return NextResponse.json(
        { error: `No scan items found for date ${scanDate}` },
        { status: 404 }
      );
    }

    // 3. Score all stories against this company profile
    const scored = scoreStoriesForCompany(allItems, profile as CompanyProfile);
    const selected = getSelectedStories(scored);
    const signalLevel = determineSignalLevel(selected);

    // 4. Store scores in company_story_scores (upsert)
    // Delete existing scores for this company+date first (idempotent)
    await supabase
      .from("company_story_scores")
      .delete()
      .eq("company_profile_id", company_profile_id)
      .eq("scan_date", scanDate);

    const scoreRows = scored.map(s => ({
      company_profile_id,
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
      selected_for_briefing: s.selected_for_briefing,
    }));

    if (scoreRows.length > 0) {
      const { error: insertErr } = await supabase
        .from("company_story_scores")
        .insert(scoreRows);

      if (insertErr) {
        console.error("Failed to store scores:", insertErr);
        // Non-fatal — continue to return results
      }
    }

    // 5. Create or update the company_briefings row with status 'scoring_complete'
    const { data: briefing, error: briefingErr } = await supabase
      .from("company_briefings")
      .upsert(
        {
          company_profile_id,
          briefing_date: scanDate,
          status: "scoring_complete",
          stories_considered: allItems.length,
          stories_selected: selected.length,
        },
        { onConflict: "company_profile_id,briefing_date" }
      )
      .select("id")
      .single();

    if (briefingErr) {
      console.error("Failed to create briefing row:", briefingErr);
    }

    // 6. Return the data OpenClaw needs to generate the briefing
    return NextResponse.json({
      company_profile_id,
      company_name: profile.company_name,
      briefing_id: briefing?.id || null,
      scan_date: scanDate,
      signal_level: signalLevel,
      stories_considered: allItems.length,
      stories_selected: selected.length,

      // Selected stories for briefing generation
      selected_stories: selected.map(s => ({
        headline: s.headline,
        summary: s.connection,
        category: s.category,
        regions: s.regions,
        tags: s.tags,
        significance: s.significance,
        relevance_score: Math.round(s.relevance_score * 1000) / 1000,
        relevance_tags: buildRelevanceTags(s, profile as CompanyProfile),
      })),

      // Company profile context for the LLM prompt
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Score error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Build human-readable relevance tags explaining why a story was selected.
 * Used in the briefing and for Phase 7 explainability.
 */
function buildRelevanceTags(
  story: { geography_score: number; sector_score: number; theme_score: number; entity_score: number; supply_chain_score: number; risk_score: number },
  profile: CompanyProfile
): string[] {
  const tags: string[] = [];

  if (story.geography_score > 0.3 && profile.regions.length > 0) {
    tags.push("geography match");
  }
  if (story.sector_score > 0.3 && profile.sector) {
    tags.push("sector match");
  }
  if (story.theme_score > 0.3 && profile.tracked_themes.length > 0) {
    tags.push("tracked theme");
  }
  if (story.entity_score > 0.3 && profile.watchlist_entities.length > 0) {
    tags.push("watchlist entity");
  }
  if (story.supply_chain_score > 0.3 && profile.supply_chain_exposure.length > 0) {
    tags.push("supply chain");
  }
  if (story.risk_score > 0.3 && profile.risk_priorities.length > 0) {
    tags.push("risk priority");
  }

  return tags;
}
