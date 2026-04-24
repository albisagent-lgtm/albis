#!/usr/bin/env tsx
import path from 'path';
import dotenv from 'dotenv';
import { Resend } from 'resend';
import { createAdminClient } from '../src/lib/supabase/admin';
import { getSubscriberEmails } from '../src/lib/email';
import { loadVerifiedScanItems, requireBriefingRow, requireStoryScores } from '../src/lib/pipeline-db';
import { normalisePublicCategory, selectPublicStories } from '../src/lib/public-story-selection';

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

function formatBriefingLine(item: any) {
  const category = normalisePublicCategory(item.category || 'current-events').replace(/-/g, ' ');
  const region = (item.regions || [])[0] || 'global';
  const connection = String(item.connection || '').trim();
  const trimmed = connection.length > 150 ? `${connection.slice(0, 147).trimEnd()}...` : connection;
  return `- ${item.headline} (${category}${region ? ` · ${region}` : ''}) — ${trimmed || 'Worth watching for what changes next.'}`;
}

function buildBriefingTitle(top: any[], briefingDate: string) {
  if (!top.length) return `Albis Daily — ${briefingDate}`;
  const lead = top[0];
  const second = top[1];
  if (!second) return lead.connection || lead.headline || `Albis Daily — ${briefingDate}`;
  const firstHook = lead.connection || lead.headline;
  const secondHook = second.headline;
  const joined = `${firstHook}; ${secondHook}`;
  return joined.length <= 140 ? joined : (lead.connection || lead.headline || `Albis Daily — ${briefingDate}`);
}

function buildBriefingFromScan(briefingDate: string, items: any[]) {
  const top = selectPublicStories(items, 4, 6).map((entry) => entry.item);
  const title = buildBriefingTitle(top, briefingDate);
  const contentMd = top.map((item: any) => formatBriefingLine(item)).join('\n');
  const topStories = top.slice(0, 4).map((item: any) => ({
    region: (item.regions || [])[0] || 'global',
    headline: item.headline,
    category: normalisePublicCategory(item.category || 'current-events'),
  }));
  return {
    date: briefingDate,
    title,
    content_md: contentMd,
    mood: null,
    pgi_score: null,
    story_count: items.length,
    top_stories: topStories,
  };
}

function generateSimpleDigestHtml(briefing: any, briefingDate: string): string {
  const title = briefing?.title || `Albis Daily — ${briefingDate}`;
  const content = String(briefing?.content_md || '').trim();
  const topStories = Array.isArray(briefing?.top_stories) ? briefing.top_stories : [];
  const topStoriesHtml = topStories.length
    ? `<ul style="padding-left:20px;margin:16px 0;">${topStories.map((story: any) => `<li style="margin-bottom:8px;"><strong>${story?.headline || 'Untitled story'}</strong>${story?.region ? ` — ${story.region}` : ''}</li>`).join('')}</ul>`
    : '';
  const contentHtml = content
    ? content.split('\n').filter(Boolean).map((line) => `<p style="font-size:15px;line-height:1.7;color:#374151;margin:0 0 14px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">${line.replace(/^[-*]\s*/, '')}</p>`).join('')
    : '<p style="font-size:15px;line-height:1.7;color:#374151;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">No briefing content available.</p>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;color:#111827;">
  <table cellpadding="0" cellspacing="0" style="width:100%;max-width:680px;margin:0 auto;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
    <tr><td>
      <div style="font-size:32px;font-weight:800;letter-spacing:2px;color:#1a1a2e;margin-bottom:8px;">ALBIS</div>
      <div style="font-size:13px;color:#6b7280;margin-bottom:24px;">Daily Briefing · ${briefingDate}</div>
      <h1 style="font-size:28px;line-height:1.25;color:#1a1a2e;margin:0 0 20px;">${title}</h1>
      ${contentHtml}
      ${topStoriesHtml ? `<h2 style="font-size:18px;color:#1a1a2e;margin:28px 0 12px;">Top stories</h2>${topStoriesHtml}` : ''}
      <div style="margin-top:32px;font-size:13px;color:#6b7280;">See clearly. — Albis</div>
    </td></tr>
  </table>
</body>
</html>`;
}

async function loadOrCreateBriefingPayload(supabase: ReturnType<typeof createAdminClient>, briefingDate: string) {
  let { data: briefing, error } = await supabase
    .from('briefings')
    .select('*')
    .eq('date', briefingDate)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to load briefing row: ${error.message}`);

  if (!briefing) {
    const items = await loadVerifiedScanItems(supabase, briefingDate);
    if (!items.length) {
      return { briefing: null, html: null, subject: null, noScan: true };
    }
    const draft = buildBriefingFromScan(briefingDate, items);
    const upsert = await supabase
      .from('briefings')
      .upsert(draft, { onConflict: 'date' })
      .select('*')
      .single();
    if (upsert.error || !upsert.data) throw new Error(`Failed to create briefing row: ${upsert.error?.message || 'missing row'}`);
    briefing = upsert.data;
  }

  const html = generateSimpleDigestHtml(briefing, briefingDate);

  const subject = `ALBIS DAILY — ${briefingDate}`;
  return { briefing, html, subject, noScan: false };
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
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  });
  if (error) throw new Error(error.message);
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

  const payload = await loadOrCreateBriefingPayload(supabase, briefingDate);
  if (payload.noScan) {
    console.log(`No scan data for ${briefingDate} yet, would generate and send when scan runs.`);
    return;
  }
  const { briefing, html, subject } = payload;
  await requireBriefingRow(supabase, briefingDate);
  console.log('✅ Verified briefing row in Supabase');

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
