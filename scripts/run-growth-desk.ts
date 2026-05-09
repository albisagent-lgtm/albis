#!/usr/bin/env tsx
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { Resend } from 'resend';
import { buildSocialDayPack } from '../src/lib/growth-desk/build-pack';
import { loadGrowthDeskInputs } from '../src/lib/growth-desk/load-inputs';
import { renderSocialDayEmailHtml, renderSocialDayMarkdown } from '../src/lib/growth-desk/render-email';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env.credentials') });

const WORKSPACE_DIR = path.resolve(process.cwd(), '..');
const MEMORY_GROWTH_DIR = path.join(WORKSPACE_DIR, 'memory', 'growth-desk');
const LOG_DIR = path.join(process.cwd(), 'logs', 'growth-desk');

function getNzDate() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
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
    preparePosts: process.argv.includes('--prepare-posts'),
  };
}

async function writeOutputs(date: string, markdown: string, json: unknown) {
  await fs.mkdir(MEMORY_GROWTH_DIR, { recursive: true });
  await fs.mkdir(LOG_DIR, { recursive: true });
  const jsonText = JSON.stringify(json, null, 2);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  await fs.writeFile(path.join(MEMORY_GROWTH_DIR, `${date}-social-day.md`), markdown);
  await fs.writeFile(path.join(MEMORY_GROWTH_DIR, `${date}-social-day.json`), jsonText);
  await fs.writeFile(path.join(LOG_DIR, `${stamp}.log`), `${markdown}\n\n--- JSON ---\n${jsonText}\n`);
}

async function sendInternalEmail(date: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Missing RESEND_API_KEY');
  const resend = new Resend(apiKey);
  const to = process.env.GROWTH_DESK_EMAIL_TO || 'hazzagazza6743@gmail.com';
  const { data, error } = await resend.emails.send({
    from: 'Albis <harry@albis.news>',
    to,
    subject: `Albis Social Day — ${date}`,
    html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
}

async function main() {
  const args = parseArgs();
  const inputs = await loadGrowthDeskInputs(args.date);
  const pack = await buildSocialDayPack(inputs);
  const markdown = renderSocialDayMarkdown(pack);
  const html = renderSocialDayEmailHtml(pack);
  await writeOutputs(args.date, markdown, pack);
  let emailResult: unknown = null;
  if (args.emailIgnatius && !args.dryRun) {
    emailResult = await sendInternalEmail(args.date, html);
  }
  if (args.preparePosts) {
    await fs.writeFile(path.join(MEMORY_GROWTH_DIR, `${args.date}-prepared-posts.json`), JSON.stringify(pack.drafts, null, 2));
  }
  console.log(JSON.stringify({
    ok: true,
    date: args.date,
    qa: pack.qa.status,
    mainAngle: pack.mainAngle?.title || null,
    linkOk: pack.linkVerification?.ok || false,
    outputs: {
      markdown: path.join(MEMORY_GROWTH_DIR, `${args.date}-social-day.md`),
      json: path.join(MEMORY_GROWTH_DIR, `${args.date}-social-day.json`),
    },
    emailed: Boolean(emailResult),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
