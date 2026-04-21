#!/usr/bin/env tsx
import path from 'path';

process.on('unhandledRejection', (err) => { console.error('UNHANDLED:', err); process.exit(1); });
import dotenv from 'dotenv';
import { Resend } from 'resend';
import { createAdminClient } from '../src/lib/supabase/admin';
import { generateDailyDigestHtml } from '../src/lib/email-templates/daily-digest';
import { getSubscriberEmails } from '../src/lib/email';

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

async function loadScanItems(supabase: ReturnType<typeof createAdminClient>, briefingDate: string) {
  const { data, error } = await supabase
    .from('scans')
    .select('items, scan_time')
    .eq('scan_date', briefingDate)
    .order('scan_time', { ascending: false });
  if (error) throw new Error(`Failed to load scan rows: ${error.message}`);
  const items: any[] = [];
  for (const row of data || []) {
    if (Array.isArray(row.items)) items.push(...row.items);
  }
  const seen = new Set();
  return items.filter((item) => {
    const key = String(item.headline || '').toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildBriefingFromScan(briefingDate: string, items: any[]) {
  const sigOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  const sorted = [...items].sort((a, b) => (sigOrder[b.significance] || 0) - (sigOrder[a.significance] || 0));
  const top = sorted.slice(0, 6);
  const title = top[0]?.connection || top[0]?.headline || `Albis Daily — ${briefingDate}`;
  const contentMd = top.map((item: any) => `- ${item.headline} — ${item.connection || ''}`.trim()).join('\n');
  const topStories = top.slice(0, 4).map((item: any) => ({ region: (item.regions || [])[0] || 'global', headline: item.headline }));
  return {
    date: briefingDate,
    title,
    content_md: contentMd,
    mood: null,
    pgi_score: null,
    story_count: sorted.length,
    top_stories: topStories,
  };
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
    const items = await loadScanItems(supabase, briefingDate);
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

  const html = generateDailyDigestHtml({
    date: briefing.date,
    title: briefing.title,
    openingLine: briefing.title,
    mood: briefing.mood,
    content: briefing.content_md || '',
    pgiScore: briefing.pgi_score || null,
    storyCount: briefing.story_count || 0,
    topStories: briefing.top_stories || [],
  } as any);

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
  const { error } = await supabase.from('briefings').update(patch).eq('id', briefingId);
  if (error) throw new Error(`Failed to update briefing status: ${error.message}`);
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
  const { error } = await supabase.from('briefing_deliveries').upsert(row, {
    onConflict: 'briefing_date,subscriber_email',
  });
  if (error) throw new Error(`Failed to record delivery for ${row.subscriber_email}: ${error.message}`);
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

  const payload = await loadOrCreateBriefingPayload(supabase, briefingDate);
  if (payload.noScan) {
    console.log(`No scan data for ${briefingDate} yet, would generate and send when scan runs.`);
    return;
  }
  const { briefing, html, subject } = payload;

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
  console.error(err);
  process.exit(1);
});
