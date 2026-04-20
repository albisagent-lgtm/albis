#!/usr/bin/env tsx
import path from 'path';
import dotenv from 'dotenv';
import { Resend } from 'resend';
import { createAdminClient } from '../src/lib/supabase/admin';
import { loadScanItems } from '../src/lib/scan-loader';
import {
  scoreStoriesForCompany,
  getSelectedStories,
  determineSignalLevel,
} from '../src/lib/relevance-engine';
import { shouldGenerateBriefing } from '../src/lib/tier-enforcement';
import type { CompanyProfile } from '../src/lib/company-profile';
import {
  generateCompanyBriefingHtml,
  generateBriefingSubject,
  type BriefingContent,
} from '../src/lib/email-templates/company-briefing';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

type OwnerProfile = {
  id: string;
  subscription_status: string | null;
  subscription_tier: string | null;
  subscription_period_end: string | null;
};

type CompanyBriefingRow = {
  id: string;
  company_profile_id: string;
  briefing_date: string;
  status: string;
  delivery_status: string | null;
  briefing_content: BriefingContent | null;
};

const FROM_ADDRESS = 'Albis Briefing <briefing@albis.news>';

function fail(message: string): never {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function parseArgs() {
  const explicitDate = process.argv[2];
  if (explicitDate) return explicitDate;
  const now = new Date();
  const nzDate = new Date(now.getTime() + 13 * 60 * 60 * 1000);
  return nzDate.toISOString().split('T')[0];
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function buildScanFocus(stories: ReturnType<typeof getSelectedStories>): string {
  if (!stories.length) return 'No material change';
  const topTags = unique(stories.flatMap((s) => s.tags)).slice(0, 3);
  if (topTags.length > 0) return topTags.join(', ');
  const topCategories = unique(stories.map((s) => s.category)).slice(0, 2);
  return topCategories.join(', ') || 'Global risk movement';
}

function buildRelevanceTags(story: {
  geography_score: number;
  sector_score: number;
  theme_score: number;
  entity_score: number;
  supply_chain_score: number;
  risk_score: number;
}, profile: CompanyProfile): string[] {
  const tags: string[] = [];
  if (story.geography_score > 0.3 && profile.regions.length > 0) tags.push('geography match');
  if (story.sector_score > 0.3 && profile.sector) tags.push('sector match');
  if (story.theme_score > 0.3 && profile.tracked_themes.length > 0) tags.push('tracked theme');
  if (story.entity_score > 0.3 && profile.watchlist_entities.length > 0) tags.push('watchlist entity');
  if (story.supply_chain_score > 0.3 && profile.supply_chain_exposure.length > 0) tags.push('supply chain');
  if (story.risk_score > 0.3 && profile.risk_priorities.length > 0) tags.push('risk priority');
  return tags;
}

function buildWhyItMatters(profile: CompanyProfile, stories: ReturnType<typeof getSelectedStories>): string {
  const sector = profile.sector?.replace(/-/g, ' ') || 'operations';
  const regions = profile.regions.slice(0, 3).join(', ');
  const dominant = stories[0];
  if (!dominant) {
    return `Nothing in today's scan crossed Albis's relevance threshold strongly enough to justify a custom alert for ${profile.company_name}, but the system remains active and watching for changes that affect ${sector}.`;
  }
  return `${dominant.headline} is the clearest signal for ${profile.company_name} because it touches ${sector}${regions ? ` across ${regions}` : ''}. The main implication is not just the event itself, but the knock-on effect on supply continuity, cost pressure, and strategic planning over the next few days.`;
}

function buildRegionalFraming(stories: ReturnType<typeof getSelectedStories>): string | undefined {
  const story = stories.find((s) => s.regions.length > 1);
  if (!story) return undefined;
  return `Coverage is spread across ${story.regions.slice(0, 4).join(', ')}, which suggests this is being treated as a cross-regional systems story rather than a narrow local event.`;
}

function buildWhatToWatch(profile: CompanyProfile, stories: ReturnType<typeof getSelectedStories>) {
  const watch = stories.slice(0, 3).map((story) => ({
    monitor_point: `Watch whether ${story.headline.charAt(0).toLowerCase() + story.headline.slice(1)} produces a second-order move in pricing, routing, policy, or availability.`,
    timeframe: 'next 24-72 hours',
  }));

  if (watch.length === 0) {
    watch.push({
      monitor_point: `Watch for fresh stories affecting ${profile.company_name}'s tracked themes: ${profile.tracked_themes.slice(0, 3).join(', ') || 'core operations'}.`,
      timeframe: 'this week',
    });
  }

  return watch;
}

function buildBriefingContent(
  profile: CompanyProfile,
  scanDate: string,
  signalLevel: ReturnType<typeof determineSignalLevel>,
  stories: ReturnType<typeof getSelectedStories>
): BriefingContent {
  return {
    header: {
      company_name: profile.company_name,
      date: scanDate,
      scan_focus: buildScanFocus(stories),
      signal_level: signalLevel,
    },
    what_changed: stories.slice(0, 8).map((story) => ({
      headline: story.headline,
      summary: story.connection,
      relevance_tags: buildRelevanceTags(story, profile),
    })),
    why_it_matters: buildWhyItMatters(profile, stories),
    what_to_watch: buildWhatToWatch(profile, stories),
    regional_framing: buildRegionalFraming(stories),
  };
}

async function deliverBriefing(
  supabase: ReturnType<typeof createAdminClient>,
  resend: Resend,
  profile: CompanyProfile,
  briefing: CompanyBriefingRow,
  content: BriefingContent,
  forceAll = true
) {
  if (!profile.email_enabled) return { status: 'skipped', reason: 'email_disabled' };
  const recipients = profile.email_recipients || [];
  if (recipients.length === 0) return { status: 'skipped', reason: 'no_recipients' };

  if (!forceAll) {
    const now = new Date();
    const tz = profile.timezone || 'UTC';
    const preferredTime = profile.preferred_delivery_time || '07:00';
    const preferredHour = parseInt(preferredTime.split(':')[0], 10);
    const currentLocalHour = parseInt(
      new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hour12: false,
        timeZone: tz,
      }).format(now)
    );
    if (currentLocalHour !== preferredHour) {
      return { status: 'waiting', reason: `current=${currentLocalHour} preferred=${preferredHour}` };
    }
  }

  const html = generateCompanyBriefingHtml(content);
  const subject = generateBriefingSubject(content.header.company_name, content.header.date);
  const batch = recipients.map((to) => ({ from: FROM_ADDRESS, to, subject, html }));

  if (batch.length <= 100) {
    const { error } = await resend.batch.send(batch);
    if (error) throw new Error(error.message);
  } else {
    for (let i = 0; i < batch.length; i += 100) {
      const chunk = batch.slice(i, i + 100);
      const { error } = await resend.batch.send(chunk);
      if (error) throw new Error(error.message);
    }
  }

  const deliveredAt = new Date().toISOString();
  const { error: updateErr } = await supabase
    .from('company_briefings')
    .update({
      status: 'delivered',
      delivery_status: 'sent',
      delivered_at: deliveredAt,
    })
    .eq('id', briefing.id);

  if (updateErr) throw new Error(updateErr.message);

  return { status: 'sent', recipients };
}

async function main() {
  const scanDate = parseArgs();
  const supabase = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);
  if (!process.env.RESEND_API_KEY) fail('Missing RESEND_API_KEY');

  console.log(`🚀 Running company briefing pipeline for ${scanDate}`);

  const allItems = await loadScanItems(supabase, scanDate);
  if (allItems.length === 0) fail(`No scan items found for ${scanDate}`);
  console.log(`✅ Loaded ${allItems.length} scan items`);

  const { data: profiles, error: profileErr } = await supabase
    .from('company_profiles')
    .select('*')
    .eq('onboarding_completed', true);
  if (profileErr) fail(`Failed to load company profiles: ${profileErr.message}`);
  if (!profiles || profiles.length === 0) fail('No onboarding-complete company profiles found');
  console.log(`✅ Loaded ${profiles.length} company profiles`);

  const ownerIds = unique(profiles.map((p) => p.owner_id));
  const { data: ownerProfiles, error: ownerErr } = await supabase
    .from('profiles')
    .select('id, subscription_status, subscription_tier, subscription_period_end')
    .in('id', ownerIds);
  if (ownerErr) fail(`Failed to load owner profiles: ${ownerErr.message}`);

  const ownerMap = new Map((ownerProfiles || []).map((o: OwnerProfile) => [o.id, o]));

  const results: Array<Record<string, unknown>> = [];

  for (const rawProfile of profiles as CompanyProfile[]) {
    const owner = ownerMap.get(rawProfile.owner_id);
    if (!owner || !shouldGenerateBriefing(owner)) {
      console.log(`↷ Skipping ${rawProfile.company_name}: subscription inactive`);
      results.push({ company_name: rawProfile.company_name, status: 'skipped', reason: 'subscription_inactive' });
      continue;
    }

    console.log(`\n▶ Processing ${rawProfile.company_name}`);
    const scored = scoreStoriesForCompany(allItems, rawProfile);
    const selected = getSelectedStories(scored);
    const signalLevel = determineSignalLevel(selected);

    await supabase
      .from('company_story_scores')
      .delete()
      .eq('company_profile_id', rawProfile.id)
      .eq('scan_date', scanDate);

    const scoreRows = scored.map((s) => ({
      company_profile_id: rawProfile.id,
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
      const { error: scoreInsertErr } = await supabase.from('company_story_scores').insert(scoreRows);
      if (scoreInsertErr) fail(`Failed to insert company_story_scores: ${scoreInsertErr.message}`);
    }
    console.log(`✅ Wrote ${scoreRows.length} company_story_scores rows (${selected.length} selected)`);

    const { data: scoringBriefing, error: upsertErr } = await supabase
      .from('company_briefings')
      .upsert(
        {
          company_profile_id: rawProfile.id,
          briefing_date: scanDate,
          status: 'scoring_complete',
          delivery_status: 'pending',
          stories_considered: allItems.length,
          stories_selected: selected.length,
        },
        { onConflict: 'company_profile_id,briefing_date' }
      )
      .select('id, company_profile_id, briefing_date, status, delivery_status, briefing_content')
      .single();
    if (upsertErr || !scoringBriefing) fail(`Failed to upsert company_briefings row: ${upsertErr?.message || 'missing row'}`);
    console.log(`✅ Upserted company_briefings row ${scoringBriefing.id} (scoring_complete)`);

    const briefingContent = buildBriefingContent(rawProfile, scanDate, signalLevel, selected);
    const { data: generatedBriefing, error: generatedErr } = await supabase
      .from('company_briefings')
      .update({
        briefing_content: briefingContent,
        status: 'generated',
        delivery_status: 'pending',
        generated_at: new Date().toISOString(),
      })
      .eq('id', scoringBriefing.id)
      .select('id, company_profile_id, briefing_date, status, delivery_status, briefing_content')
      .single();
    if (generatedErr || !generatedBriefing) fail(`Failed to mark briefing generated: ${generatedErr?.message || 'missing row'}`);
    console.log(`✅ Generated briefing content (${briefingContent.what_changed.length} what_changed items)`);

    const delivery = await deliverBriefing(supabase, resend, rawProfile, generatedBriefing as CompanyBriefingRow, briefingContent, true);
    console.log(`✅ Delivery status: ${JSON.stringify(delivery)}`);

    results.push({
      company_name: rawProfile.company_name,
      company_profile_id: rawProfile.id,
      stories_considered: allItems.length,
      stories_selected: selected.length,
      signal_level: signalLevel,
      delivery,
    });
  }

  console.log('\n🎉 Company briefing pipeline complete');
  console.log(JSON.stringify({ scan_date: scanDate, results }, null, 2));
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
