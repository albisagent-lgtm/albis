#!/usr/bin/env tsx
import path from 'path';
import dotenv from 'dotenv';
import { Resend } from 'resend';
import { createAdminClient } from '../src/lib/supabase/admin';
import { loadScanItems } from '../src/lib/scan-loader';
import { requireCompanyBriefingRows, requireStoryScores } from '../src/lib/pipeline-db';
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
  delivered_at?: string | null;
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
  const concreteTags = unique(
    stories
      .flatMap((s) => s.tags)
      .filter((tag) => !['oil', 'shipping', 'sanctions', 'markets', 'trade', 'policy', 'energy'].includes(tag.toLowerCase()))
  ).slice(0, 3);
  if (concreteTags.length > 0) return concreteTags.join(', ');
  const topCategories = unique(stories.map((s) => s.category)).slice(0, 2);
  return topCategories.join(', ') || 'Cross-regional change';
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
  const connection = String(dominant.connection || '').trim();
  const practicalLens = dominant.human_score > 0.28
    ? 'staffing, customer conditions, and real-world operating stress'
    : dominant.concreteness_score > 0.45
      ? 'specific routes, facilities, contracts, or regulatory steps'
      : 'timing, exposure, and decision quality over the next few days';
  return `${dominant.headline} is the clearest signal for ${profile.company_name} because it touches ${sector}${regions ? ` across ${regions}` : ''}. ${connection || 'The key question is whether this change stays contained or starts forcing second-order moves.'} For your team, the useful lens is ${practicalLens}, not abstract macro mood.`;
}

function buildRegionalFraming(stories: ReturnType<typeof getSelectedStories>): string | undefined {
  const story = stories.find((s) => s.regions.length > 1);
  if (!story) return undefined;
  const lane = story.human_score > 0.25 ? 'human consequence' : story.broad_war_economy_penalty > 0.3 ? 'systems spillover' : 'live operational change';
  return `Coverage is spread across ${story.regions.slice(0, 4).join(', ')}, but the useful read is where the emphasis lands: some outlets are treating it as ${lane}, while quieter regions may still be underplaying the direct consequence described in the scan.`;
}

function naturalHeadlineLead(headline: string): string {
  const text = String(headline || '').trim();
  if (!text) return 'this story';
  return text;
}

function buildWhatToWatch(profile: CompanyProfile, stories: ReturnType<typeof getSelectedStories>) {
  const watch = stories.slice(0, 3).map((story) => {
    const hook = String(story.connection || '').trim();
    const lead = naturalHeadlineLead(story.headline);
    const monitorPoint = hook
      ? `Watch whether ${lead} moves from headline to proof point: ${hook}`
      : `Watch whether ${lead} produces a visible follow-through in policy, access, staffing, routing, or cost.`;
    return {
      monitor_point: monitorPoint,
      timeframe: story.urgency_score > 0.5 ? 'next 24-48 hours' : 'next 24-72 hours',
    };
  });

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
      summary: String(story.connection || '').trim() || `${story.headline} is now showing up as a concrete signal in ${story.regions.slice(0, 2).join(', ') || 'the scan'}.`,
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
  forceAll = false,
  forceDeliver = false,
  dryRun = false
) {
  if (!profile.email_enabled) return { status: 'skipped', reason: 'email_disabled' };
  const recipients = profile.email_recipients || [];
  if (recipients.length === 0) return { status: 'skipped', reason: 'no_recipients' };

  if (briefing.delivery_status === 'sent' && !forceDeliver) {
    return { status: 'already_delivered', recipients, delivered_at: briefing.delivered_at || null };
  }

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

  if (dryRun) {
    return { status: 'dry_run', recipients, subject, html_length: html.length };
  }

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

  return { status: 'sent', recipients, delivered_at: deliveredAt };
}

async function main() {
  const scanDate = parseArgs();
  const supabase = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);
  if (!process.env.RESEND_API_KEY) fail('Missing RESEND_API_KEY');

  const forceDeliver = process.argv.includes('--force-deliver');
  const forceAll = process.argv.includes('--force-all');
  const dryRun = process.argv.includes('--dry-run');

  console.log(`🚀 Running company briefing pipeline for ${scanDate}${dryRun ? ' (dry-run)' : ''}`);

  const allItems = await loadScanItems(supabase, scanDate);
  if (allItems.length === 0) fail(`No scan items found for ${scanDate}`);
  const scoreStatus = await requireStoryScores(supabase, scanDate);
  console.log(`✅ Loaded ${allItems.length} verified scan items from DB truth`);
  console.log(`✅ Verified PGI/GAI rows (${scoreStatus.pgiCount} PGI, ${scoreStatus.gaiCount} GAI)`);

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
      .select('id, company_profile_id, briefing_date, status, delivery_status, briefing_content, delivered_at')
      .single();
    if (upsertErr || !scoringBriefing) fail(`Failed to upsert company_briefings row: ${upsertErr?.message || 'missing row'}`);
    console.log(`✅ Upserted company_briefings row ${scoringBriefing.id} (scoring_complete)`);

    const briefingContent = buildBriefingContent(rawProfile, scanDate, signalLevel, selected);
    const { data: generatedBriefing, error: generatedErr } = await supabase
      .from('company_briefings')
      .update({
        briefing_content: briefingContent,
        status: 'generated',
        delivery_status: scoringBriefing.delivery_status === 'sent' ? 'sent' : 'pending',
        generated_at: new Date().toISOString(),
      })
      .eq('id', scoringBriefing.id)
      .select('id, company_profile_id, briefing_date, status, delivery_status, briefing_content, delivered_at')
      .single();
    if (generatedErr || !generatedBriefing) fail(`Failed to mark briefing generated: ${generatedErr?.message || 'missing row'}`);
    console.log(`✅ Generated briefing content (${briefingContent.what_changed.length} what_changed items)`);

    const delivery = await deliverBriefing(supabase, resend, rawProfile, generatedBriefing as CompanyBriefingRow, briefingContent, forceAll, forceDeliver, dryRun);
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

  const briefingRows = await requireCompanyBriefingRows(supabase, scanDate);
  console.log(`✅ Verified ${briefingRows.length} company_briefings row(s)`);

  console.log('\n🎉 Company briefing pipeline complete');
  console.log(JSON.stringify({ scan_date: scanDate, forceDeliver, forceAll, dryRun, results }, null, 2));
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
