#!/usr/bin/env tsx
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env.credentials') });

const WORKSPACE_DIR = path.resolve(process.cwd(), '..');
const GROWTH_MEMORY_DIR = path.join(WORKSPACE_DIR, 'memory', 'growth-desk');
const REPORT_DIR = GROWTH_MEMORY_DIR;
const LOG_DIR = path.join(process.cwd(), 'logs', 'growth-desk');

function getNzDate(offsetDays = 0) {
  const now = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Pacific/Auckland',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function parseArgs() {
  const arg = (name: string) => {
    const index = process.argv.indexOf(name);
    return index === -1 ? undefined : process.argv[index + 1];
  };
  return {
    date: arg('--date') || getNzDate(),
    dryRun: process.argv.includes('--dry-run'),
    emailIgnatius: process.argv.includes('--email-ignatius'),
  };
}

async function exists(file: string) {
  try { await fs.access(file); return true; } catch { return false; }
}

async function readIfExists(file: string, fallback = '') {
  return (await exists(file)) ? fs.readFile(file, 'utf8') : fallback;
}

async function listRecent(dir: string, includes: string, limit = 8) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(entries
      .filter((entry) => entry.isFile() && entry.name.includes(includes))
      .map(async (entry) => {
        const full = path.join(dir, entry.name);
        const stat = await fs.stat(full);
        return { name: entry.name, mtime: stat.mtimeMs, size: stat.size };
      }));
    return files.sort((a, b) => b.mtime - a.mtime).slice(0, limit);
  } catch {
    return [];
  }
}

function esc(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function buildReport(date: string) {
  const socialMdPath = path.join(GROWTH_MEMORY_DIR, `${date}-social-day.md`);
  const socialJsonPath = path.join(GROWTH_MEMORY_DIR, `${date}-social-day.json`);
  const preparedPostsPath = path.join(GROWTH_MEMORY_DIR, `${date}-prepared-posts.json`);
  const xResponsePath = path.join(GROWTH_MEMORY_DIR, `${date}-x-post-response.json`);
  const socialMd = await readIfExists(socialMdPath, 'No Social Day pack found yet.');
  const socialJsonRaw = await readIfExists(socialJsonPath, '{}');
  const preparedPostsRaw = await readIfExists(preparedPostsPath, '[]');
  const xResponseRaw = await readIfExists(xResponsePath, 'No X posting attempt recorded.');
  const recentLogs = await listRecent(LOG_DIR, 'cycle-', 8);

  let summary = {
    mainAngle: 'unknown',
    qa: 'unknown',
    linkOk: 'unknown',
    subscribers: 'unknown',
    companyProfiles: 'unknown',
  };
  try {
    const parsed = JSON.parse(socialJsonRaw);
    summary = {
      mainAngle: parsed.mainAngle?.title || 'none',
      qa: parsed.qa?.status || 'unknown',
      linkOk: String(Boolean(parsed.linkVerification?.ok)),
      subscribers: String(parsed.metrics?.subscribers ?? 'unknown'),
      companyProfiles: String(parsed.metrics?.companyProfiles ?? 'unknown'),
    };
  } catch {}

  let preparedCount = 0;
  try { preparedCount = JSON.parse(preparedPostsRaw).length || 0; } catch {}

  return `# Albis Growth Desk — 24-hour report — ${date}\n\n## Executive summary\n\n- Main angle: ${summary.mainAngle}\n- QA status: ${summary.qa}\n- Link verified: ${summary.linkOk}\n- Prepared channel drafts: ${preparedCount}\n- Subscribers snapshot: ${summary.subscribers}\n- Company profiles snapshot: ${summary.companyProfiles}\n\n## What the Growth Desk produced\n\n- Social Day pack: ${socialMdPath}\n- Structured pack: ${socialJsonPath}\n- Prepared posts: ${preparedPostsPath}\n\n## Distribution status\n\n- Internal report/pack generation is active.\n- X/Postiz status: ${xResponseRaw.slice(0, 500).replace(/\s+/g, ' ').trim()}\n\n## Recent cycle logs\n\n${recentLogs.map((log) => `- ${log.name} (${log.size} bytes)`).join('\n') || '- No cycle logs found.'}\n\n## Full current Social Day pack\n\n${socialMd}\n\n## Next 24-hour priorities\n\n1. Build non-social growth surfaces: sample-scan page, Mispriced Attention Index, What Am I Missing tool, and agency pilot route.\n2. Improve posting infrastructure or alternative distribution path because Postiz returned an auth/subscription blocker.\n3. Start targeted, non-mass revenue motion around approved/existing leads and sample-scan offers.\n4. Keep Growth Desk running every 2 hours and preserve QA/brand trust.\n`;
}

async function sendEmail(date: string, report: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('Missing RESEND_API_KEY');
  const resend = new Resend(key);
  const to = process.env.GROWTH_DESK_EMAIL_TO || 'hazzagazza6743@gmail.com';
  const { data, error } = await resend.emails.send({
    from: 'Albis <harry@albis.news>',
    to,
    subject: `ALBIS GROWTH DESK — 24-hour report — ${date}`,
    html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:820px;margin:0 auto;color:#111827;"><pre style="white-space:pre-wrap;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.55;background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:18px;">${esc(report)}</pre></div>`,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
}

async function main() {
  const args = parseArgs();
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const report = await buildReport(args.date);
  const reportPath = path.join(REPORT_DIR, `${args.date}-24h-report.md`);
  await fs.writeFile(reportPath, report);
  let emailed = false;
  if (args.emailIgnatius && !args.dryRun) {
    await sendEmail(args.date, report);
    emailed = true;
  }
  console.log(JSON.stringify({ ok: true, date: args.date, reportPath, emailed }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
