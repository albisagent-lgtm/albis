#!/usr/bin/env tsx
import path from 'path';
import dotenv from 'dotenv';
import { Resend } from 'resend';
import { createAdminClient } from '../src/lib/supabase/admin';
import { getSubscriberEmails } from '../src/lib/email';
import { loadVerifiedScanItems, requireBriefingRow, requireStoryScores } from '../src/lib/pipeline-db';
import { buildDailyBriefingPackage, type DailyBriefingSectionItem, type PublicIndexScoreInputs } from '../src/lib/public-daily-briefing';
import type { PublicEditionArticleEntry, PublicEditionScorecard } from '../src/lib/public-edition-scorecard';
import {
  buildPublicEditionRunReport,
  formatPublicEditionRunReportLine,
  writePublicEditionRunReport,
} from '../src/lib/public-edition-run-report';
import { applyPublicBriefingEditorialWriter } from '../src/lib/public-briefing-editorial-writer';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_ADDRESS = 'Albis Daily <harry@albis.news>';

function fail(message: string): never {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function getNzDate() {
  const now = new Date();
  const nz = new Date(now.getTime() + 13 * 60 * 60 * 1000);
  return nz.toISOString().split('T')[0];
}

function parseArgs() {
  const explicitDate = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : undefined;
  const onlyEmailIndex = process.argv.indexOf('--only-email');
  const onlyEmail = onlyEmailIndex !== -1 && process.argv[onlyEmailIndex + 1]
    ? process.argv[onlyEmailIndex + 1]
    : undefined;
  return {
    briefingDate: explicitDate || getNzDate(),
    forceDeliver: process.argv.includes('--force-deliver'),
    dryRun: process.argv.includes('--dry-run'),
    onlyEmail,
  };
}

function esc(value: string | null | undefined) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function titleCase(value: string | null | undefined) {
  return String(value || 'global')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function categoryLabel(value: string | null | undefined) {
  return String(value || 'current-events').replace(/-/g, ' ');
}

function renderAnalysis(value: string | null | undefined) {
  const lines = String(value || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return '';
  return `<div style="margin-top:12px;padding:12px 14px;background:#f8f7f4;border-left:3px solid #c8922a;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
    ${lines.map((line) => {
      const cleaned = line.replace(/^-\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1');
      return `<p style="font-size:14px;line-height:1.65;color:#374151;margin:0 0 8px;">${esc(cleaned)}</p>`;
    }).join('')}
  </div>`;
}

function renderSectionItem(item: DailyBriefingSectionItem) {
  const metaParts = [categoryLabel(item.category), titleCase(item.region), item.score ? `PGI ${Number(item.score).toFixed(1)}${item.tier ? ` — ${item.tier}` : ''}` : item.laneLabel || item.lane || 'signal'];
  return `<div style="margin:0 0 18px;">
    <p style="font-size:16px;line-height:1.55;color:#1a1a2e;margin:0 0 6px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">${esc(item.headline)}</p>
    <p style="font-size:12px;line-height:1.5;color:#6b7280;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.08em;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">${esc(metaParts.filter(Boolean).join(' · '))}</p>
    <p style="font-size:15px;line-height:1.7;color:#374151;margin:0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">${esc(item.summary)}</p>
    ${item.slot === 'perception-gap' ? renderAnalysis(item.analysis) : ''}
  </div>`;
}

function sectionBlock(label: string, body: string) {
  if (!body) return '';
  return `<div style="margin-top:30px;">
    <div style="font-size:11px;color:#c8922a;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.18em;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">${esc(label)}</div>
    ${body}
  </div>`;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

function needsPackageRefresh(briefing: any, draft: any) {
  if (!briefing?.content_md || !String(briefing.content_md).includes('## Lead thesis')) return true;
  if (!Array.isArray(briefing?.top_stories) || briefing.top_stories.length === 0) return true;
  if (!briefing?.edition_scorecard?.metrics?.length) return true;
  return (
    String(briefing.content_md || '') !== String(draft.content_md || '') ||
    stableJson(briefing.top_stories) !== stableJson(draft.top_stories) ||
    stableJson(briefing.edition_scorecard) !== stableJson(draft.edition_scorecard)
  );
}

async function buildBriefingFromScan(briefingDate: string, items: any[], articleEntries: PublicEditionArticleEntry[] = [], indexScores: PublicIndexScoreInputs = {}) {
  const pkg = buildDailyBriefingPackage(briefingDate, items, articleEntries, indexScores);
  const draft = {
    date: briefingDate,
    title: pkg.title,
    content_md: pkg.contentMd,
    mood: null,
    pgi_score: null,
    story_count: items.length,
    top_stories: pkg.topStories,
    edition_scorecard: pkg.scorecard,
  };
  const edited = await applyPublicBriefingEditorialWriter(draft);
  if (edited.blocked && process.env.ALBIS_REQUIRE_PUBLIC_BRIEFING_EDITORIAL_WRITER === 'true') {
    fail(`Public briefing editorial writer blocked: ${edited.blocked_reason || 'unknown'}`);
  }
  if (edited.edited) {
    console.log(`✅ Public briefing editorial writer applied (${edited.research.length} researched story packet(s))`);
  } else if (edited.enabled) {
    console.log(`⚠️ Public briefing editorial writer did not edit: ${edited.blocked_reason || 'not configured'}`);
  }
  return edited.briefing;
}

function generateSimpleDigestHtml(briefing: any, briefingDate: string): string {
  const title = briefing?.title || `Albis Daily — ${briefingDate}`;
  const topStories = Array.isArray(briefing?.top_stories) ? briefing.top_stories : [];
  const leadThesis = String(briefing?.content_md || '').match(/## Lead thesis\n([\s\S]*?)\n\n## Must-know signals/);
  const doctrineLine = String(briefing?.content_md || '').match(/- Lane mix: (.*)/);
  const thesisText = leadThesis?.[1]?.trim() || 'No briefing content available.';
  const doctrineText = doctrineLine?.[1]?.trim() || '';
  const mustKnow = topStories.filter((item: DailyBriefingSectionItem) => item?.slot === 'must-know');
  const underseen = topStories.find((item: DailyBriefingSectionItem) => item?.slot === 'underseen');
  const perceptionGap = topStories.find((item: DailyBriefingSectionItem) => item?.slot === 'perception-gap');
  const watchpoint = Array.isArray(briefing?.top_stories) ? briefing.top_stories.find((item: DailyBriefingSectionItem) => item?.slot === 'watchpoint') : null;
  const scorecard = briefing?.edition_scorecard;
  const scorecardHtml = scorecard?.metrics?.length
    ? sectionBlock(
        'Edition scorecard',
        `<div style="font-size:14px;line-height:1.7;color:#374151;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
          <p style="margin:0 0 10px;"><strong>${esc(scorecard.summary || '')}</strong></p>
          ${(scorecard.metrics || []).map((metric: any) => `<p style="margin:0 0 8px;"><strong>${esc(metric.label)}:</strong> ${esc(metric.summary)} <span style="color:#6b7280;">(${esc(metric.status)})</span></p>`).join('')}
        </div>`
      )
    : '';

  const mustKnowHtml = mustKnow.map((item: DailyBriefingSectionItem) => renderSectionItem(item)).join('');
  const underseenHtml = underseen ? renderSectionItem(underseen) : '';
  const perceptionGapHtml = perceptionGap ? renderSectionItem(perceptionGap) : '';
  const watchpointHtml = watchpoint
    ? `<div style="margin:0;">
        <p style="font-size:16px;line-height:1.55;color:#1a1a2e;margin:0 0 6px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">${esc(watchpoint.headline)}</p>
        <p style="font-size:15px;line-height:1.7;color:#374151;margin:0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">${esc(watchpoint.why || watchpoint.summary)}</p>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;color:#111827;">
  <table cellpadding="0" cellspacing="0" style="width:100%;max-width:680px;margin:0 auto;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
    <tr><td>
      <div style="font-size:32px;font-weight:800;letter-spacing:2px;color:#1a1a2e;margin-bottom:8px;">ALBIS</div>
      <div style="font-size:13px;color:#6b7280;margin-bottom:24px;">Daily Briefing · ${esc(briefingDate)}</div>
      <h1 style="font-size:28px;line-height:1.25;color:#1a1a2e;margin:0 0 18px;">${esc(title)}</h1>
      ${sectionBlock('Lead thesis', `<p style="font-size:16px;line-height:1.8;color:#374151;margin:0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">${esc(thesisText)}</p>`) }
      ${doctrineText ? sectionBlock('Lane mix', `<p style="font-size:14px;line-height:1.7;color:#6b7280;margin:0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">${esc(doctrineText)}</p>`) : ''}
      ${sectionBlock('Must-know signals', mustKnowHtml)}
      ${sectionBlock('Underseen signal', underseenHtml)}
      ${sectionBlock('Perception gap', perceptionGapHtml)}
      ${sectionBlock('Watchpoint', watchpointHtml)}
      ${scorecardHtml}
      <div style="margin-top:32px;font-size:13px;color:#6b7280;">See clearly. — Albis</div>
    </td></tr>
  </table>
</body>
</html>`;
}

async function loadEditionArticles(supabase: ReturnType<typeof createAdminClient>, briefingDate: string): Promise<PublicEditionArticleEntry[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('title,frontmatter,date')
    .eq('date', briefingDate);
  if (error) throw new Error(`Failed to load public articles for scorecard: ${error.message}`);
  return (data || []).map((row: any) => ({
    headline: row?.title || row?.frontmatter?.title || '',
    doctrineLane: row?.frontmatter?.public_doctrine_lane || null,
    articleForm: row?.frontmatter?.article_form || null,
  }));
}

async function loadPublicIndexScores(supabase: ReturnType<typeof createAdminClient>, briefingDate: string): Promise<PublicIndexScoreInputs> {
  const [pgiResult, gaiResult] = await Promise.all([
    supabase
      .from('pgi_story_scores')
      .select('story_slug,story_headline,category,regions_covered,region_count,story_pgi,d1_factual,d2_causal,d3_framing,d4_emotional,d5_actor_context,d6_cui_bono,significance,scoring_rationale')
      .eq('scan_date', briefingDate)
      .order('story_pgi', { ascending: false })
      .limit(80),
    supabase
      .from('gai_story_scores')
      .select('story_slug,story_headline,category,regions_found,regions_absent,story_gai,coverage_breadth,d1_coverage_breadth,d2_prominence_disparity,d3_population_exposure,d4_significance_severity,significance,scoring_rationale')
      .eq('scan_date', briefingDate)
      .order('story_gai', { ascending: false })
      .limit(80),
  ]);
  if (pgiResult.error) throw new Error(`Failed to load PGI scores: ${pgiResult.error.message}`);
  if (gaiResult.error) throw new Error(`Failed to load GAI scores: ${gaiResult.error.message}`);
  return { pgi: pgiResult.data || [], gai: gaiResult.data || [] };
}

async function loadOrCreateBriefingPayload(supabase: ReturnType<typeof createAdminClient>, briefingDate: string, options: { dryRun: boolean }) {
  let { data: briefing, error } = await supabase
    .from('briefings')
    .select('*')
    .eq('date', briefingDate)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to load briefing row: ${error.message}`);

  const items = await loadVerifiedScanItems(supabase, briefingDate);
  if (!items.length) {
    return { briefing: null, html: null, subject: null, noScan: true, createdOrUpdated: false };
  }
  const articleEntries = await loadEditionArticles(supabase, briefingDate);
  const indexScores = await loadPublicIndexScores(supabase, briefingDate);
  const draft = await buildBriefingFromScan(briefingDate, items, articleEntries, indexScores);

  if (!briefing) {
    if (options.dryRun) {
      console.log('DRY RUN: would create briefing row with regenerated Phase 5-8 package fields');
      briefing = { ...draft, id: 'dry-run-briefing' };
    } else {
      const upsert = await supabase
        .from('briefings')
        .upsert(draft, { onConflict: 'date' })
        .select('*')
        .single();
      if (upsert.error || !upsert.data) throw new Error(`Failed to create briefing row: ${upsert.error?.message || 'missing row'}`);
      briefing = upsert.data;
    }
  } else if (needsPackageRefresh(briefing, draft)) {
    const patch = {
      title: draft.title,
      content_md: draft.content_md,
      story_count: draft.story_count,
      top_stories: draft.top_stories,
      edition_scorecard: draft.edition_scorecard,
    };
    if (options.dryRun) {
      console.log(`DRY RUN: would refresh briefing ${briefing.id} Phase 5-8 package fields`);
      briefing = { ...briefing, ...patch };
    } else {
      const update = await supabase
        .from('briefings')
        .update(patch)
        .eq('id', briefing.id)
        .select('*')
        .single();
      if (update.error || !update.data) throw new Error(`Failed to refresh briefing package fields: ${update.error?.message || 'missing row'}`);
      briefing = update.data;
      console.log(`↻ Refreshed briefing ${briefing.id} Phase 5-8 package fields`);
    }
  }

  const html = generateSimpleDigestHtml(briefing, briefingDate);

  const subject = `ALBIS DAILY — ${briefingDate}`;
  return { briefing, html, subject, noScan: false, createdOrUpdated: true };
}

async function alreadyDeliveredDate(supabase: ReturnType<typeof createAdminClient>, briefingDate: string) {
  const { data, error } = await supabase
    .from('briefings')
    .select('delivery_status, delivered_at')
    .eq('date', briefingDate)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Failed to inspect briefing delivery status: ${error.message}`);
  return data?.delivery_status === 'sent';
}

async function markBriefingStatus(supabase: ReturnType<typeof createAdminClient>, briefingId: string, status: string) {
  const patch: any = { delivery_status: status };
  if (status === 'sent') patch.delivered_at = new Date().toISOString();
  const result = await supabase.from('briefings').update(patch).eq('id', briefingId).select('id,date,delivery_status,delivered_at');
  if (result.error) throw new Error(`Failed to update briefing status: ${result.error.message}`);
}

async function loadSentEmailsForDate(supabase: ReturnType<typeof createAdminClient>, briefingDate: string) {
  const { data, error } = await supabase
    .from('briefing_deliveries')
    .select('subscriber_email,status')
    .eq('briefing_date', briefingDate)
    .eq('status', 'sent');
  if (error) throw new Error(`Failed to load delivery history: ${error.message}`);
  return new Set((data || []).map((row: any) => row.subscriber_email.toLowerCase()));
}

async function recordDelivery(supabase: ReturnType<typeof createAdminClient>, row: {
  briefing_date: string;
  briefing_id: string;
  subscriber_email: string;
  status: string;
  sent_at?: string | null;
  error?: string | null;
  run_id?: string;
}) {
  const result = await supabase.from('briefing_deliveries').upsert(row, {
    onConflict: 'briefing_date,subscriber_email',
  }).select('*');
  if (result.error) throw new Error(`Failed to record delivery for ${row.subscriber_email}: ${result.error.message}`);
}

async function sendOne(resend: Resend, to: string, subject: string, html: string) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.albis.news';
  const unsubscribeUrl = `${site}/api/unsubscribe?email=${encodeURIComponent(to)}`;
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html: html.replaceAll('{{EMAIL}}', encodeURIComponent(to)),
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });
  if (error) throw new Error(error.message);
}

async function recordDailyEditionReport(input: {
  supabase: ReturnType<typeof createAdminClient>;
  briefingDate: string;
  briefing: any;
  verifiedItems: any[];
  runId: string;
}) {
  try {
    const articleEntries = await loadEditionArticles(input.supabase, input.briefingDate);
    const scorecard: PublicEditionScorecard = input.briefing?.edition_scorecard || buildDailyBriefingPackage(
      input.briefingDate,
      input.verifiedItems,
      articleEntries,
    ).scorecard;
    const report = buildPublicEditionRunReport({
      date: input.briefingDate,
      source: 'daily-briefing',
      scorecard,
      articleEntries,
      runId: input.runId,
    });
    const files = await writePublicEditionRunReport(report);
    console.log(`📊 ${formatPublicEditionRunReportLine(report)}`);
    for (const warning of report.warnings) console.log(`   ⚠️ ${warning}`);
    console.log(`🧾 Edition QA report: ${path.relative(process.cwd(), files.dateLatestFile)}`);
  } catch (err) {
    console.warn(`⚠️ Edition QA report skipped: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function main() {
  const { briefingDate, forceDeliver, dryRun, onlyEmail } = parseArgs();
  const supabase = createAdminClient();
  const runId = `briefing-${briefingDate}-${Date.now()}`;

  if (!process.env.RESEND_API_KEY && !dryRun) fail('Missing RESEND_API_KEY');

  console.log(`🚀 Running daily briefing pipeline for ${briefingDate} ${dryRun ? '(dry-run)' : ''}${onlyEmail ? ` [only ${onlyEmail}]` : ''}`);

  const verifiedItems = await loadVerifiedScanItems(supabase, briefingDate);
  const scoreStatus = await requireStoryScores(supabase, briefingDate);
  console.log(`✅ Verified ${verifiedItems.length} scan items from DB truth`);
  console.log(`✅ Verified PGI/GAI rows (${scoreStatus.pgiCount} PGI, ${scoreStatus.gaiCount} GAI)`);

  const payload = await loadOrCreateBriefingPayload(supabase, briefingDate, { dryRun });
  if (payload.noScan) {
    console.log(`No scan data for ${briefingDate} yet, would generate and send when scan runs.`);
    return;
  }
  const { briefing, html, subject } = payload;
  if (dryRun && briefing?.id === 'dry-run-briefing') {
    console.log('DRY RUN: briefing row not created; skipping Supabase row verification');
  } else {
    await requireBriefingRow(supabase, briefingDate);
    console.log('✅ Verified briefing row in Supabase');
  }
  await recordDailyEditionReport({ supabase, briefingDate, briefing, verifiedItems, runId });

  const dateAlreadySent = await alreadyDeliveredDate(supabase, briefingDate);
  if (dateAlreadySent && !forceDeliver) {
    console.log(`↷ Briefing ${briefingDate} already marked sent; skipping full delivery`);
    return;
  }

  let subscribers = await getSubscriberEmails();
  if (onlyEmail) {
    subscribers = subscribers.filter((email) => email.toLowerCase() === onlyEmail.toLowerCase());
  }
  const sentEmails = await loadSentEmailsForDate(supabase, briefingDate);

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const email of subscribers) {
    const normalized = email.toLowerCase();
    if (sentEmails.has(normalized) && !forceDeliver) {
      skipped += 1;
      continue;
    }

    if (dryRun) {
      console.log(`DRY RUN: would send to ${email}`);
      continue;
    }

    try {
      await sendOne(resend, email, subject, html);
      await recordDelivery(supabase, {
        briefing_date: briefingDate,
        briefing_id: briefing.id,
        subscriber_email: email,
        status: 'sent',
        sent_at: new Date().toISOString(),
        run_id: runId,
      });
      sent += 1;
    } catch (err) {
      failed += 1;
      await recordDelivery(supabase, {
        briefing_date: briefingDate,
        briefing_id: briefing.id,
        subscriber_email: email,
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
        run_id: runId,
      });
    }
  }

  if (!dryRun) {
    await markBriefingStatus(supabase, briefing.id, failed > 0 ? 'partial' : 'sent');
  }

  console.log(JSON.stringify({
    briefing_date: briefingDate,
    dryRun,
    forceDeliver,
    onlyEmail: onlyEmail || null,
    subscribers_checked: subscribers.length,
    sent,
    skipped,
    failed,
  }, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack || err.message : err);
  process.exit(1);
});
