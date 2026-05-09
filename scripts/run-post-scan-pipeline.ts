#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { loadVerifiedScanItems, requireIndexDailyRows, requireScanRows, requireScanItemsAvailability, requireSnapshotForDate, requireStoryScores } from '../src/lib/pipeline-db';
import { normalisePublicCategory, selectPublicStories, suggestPublicArticleCount, type ArticleForm, type ArticleSignals, type PublicStorySelection } from '../src/lib/public-story-selection';
import { PUBLIC_EDITORIAL_DOCTRINE_VERSION, getPublicDoctrineLaneSpec, type PublicDoctrineLane } from '../src/lib/public-editorial-doctrine';
import { buildStoryPlan, type OpeningMode, type StoryPlan } from '../src/lib/public-story-planner';
import { buildDailyBriefingPackage } from '../src/lib/public-daily-briefing';
import { buildPublicArticleResearchPacket, type PublicArticleResearchPacket } from '../src/lib/public-article-research';
import { runPublicArticleEditorialWriter } from '../src/lib/public-article-editorial-writer';
import type { PublicEditionArticleEntry } from '../src/lib/public-edition-scorecard';
import {
  buildPublicEditionRunReport,
  formatPublicEditionRunReportLine,
  writePublicEditionRunReport,
} from '../src/lib/public-edition-run-report';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

type Period = 'am' | 'midday' | 'pm';
type ScanItem = {
  headline: string;
  category: string;
  regions: string[];
  regions_found?: string[];
  regions_absent?: string[];
  tags: string[];
  patterns: string[];
  significance: string;
  connection: string;
  perception_gap?: number;
  coverage_breadth?: number;
};

type BuiltArticle = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  image: string;
  excerpt: string;
  author: string;
  content: string;
  markdown: string;
  reading_time: string;
  frontmatter: Record<string, unknown>;
  wordCount: number;
  opening: string;
  research?: PublicArticleResearchPacket;
};

type StoryPacket = {
  item: ScanItem;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  regions: string[];
  regionsFound: string[];
  regionsAbsent: string[];
  patterns: string[];
  connection: string;
  significance: string;
  perceptionGap: number | null;
  coverageBreadth: number | null;
  primaryRegion: string;
  tagText: string;
  lane: string | null;
  doctrineLane: PublicDoctrineLane | null;
  articleSignals: ArticleSignals | null;
  articleForm: ArticleForm | null;
  articleOpportunity: string | null;
};

type LedeParts = {
  actor: string;
  action: string;
  object: string;
  location: string;
  consequence: string;
  colour?: string;
};

const OPENING_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'after', 'amid', 'as', 'at', 'by', 'from',
  'is', 'are', 'be', 'into', 'over', 'under', 'new', 'latest', 'says', 'say', 'warns', 'report', 'reports', 'could',
  'may', 'more', 'less', 'still', 'again', 'deal', 'plan', 'move', 'moves', 'talks', 'policy', 'global', 'world',
  'officials', 'minister', 'ministers', 'government', 'governments', 'state', 'states', 'pressure', 'rises', 'rise',
  'news', 'update', 'battle', 'crisis', 'ceasefire', 'extension', 'extended'
]);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const MIN_WORD_COUNT = 420;
const TARGET_WORD_COUNT = 480;
const MIN_ARTICLE_COUNT = 7;
const MAX_ARTICLE_COUNT = 10;
const CANDIDATE_LIMIT = 45;
const RECENT_IMAGE_WINDOW = 100;
const BANNED_PHRASES = [
  'this is more than',
  'for albis',
  'the point is not just',
  'the story matters because it changes the system around it',
  'this kind of story',
  'the deeper signal',
  'marks a specific change in the story',
  'a recycled update',
  'the shift matters because',
  'alters what other actors now have to price in',
  'the latest move at the center of',
  'officials and civilians alike are now dealing with',
  'a framing-map piece',
  'a numbers-watch piece',
  'the article should',
  'belongs in the published set',
  'gives the scan',
  'item editorial weight',
  'stronger live signal in the scan',
  'live signal in the scan',
  'the scan flags',
  'patterns in the scan',
  'framing pattern in the scan',
  'reporting attention is clustered',
  'coverage is clustering',
  'broader scan',
  'published set',
  'writeability',
  'draft quality',
  'the scan does not support',
];

function fail(msg: string): never {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

function run(command: string, args: string[], cwd = process.cwd()) {
  console.log(`\n▶ ${command} ${args.join(' ')}`);
  const res = spawnSync(command, args, { cwd, env: process.env, encoding: 'utf8' });
  if (res.stdout) process.stdout.write(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);
  if (res.status !== 0) fail(`${command} failed with exit code ${res.status}`);
}

function runAllowAlreadyRunning(command: string, args: string[], cwd = process.cwd()) {
  console.log(`\n▶ ${command} ${args.join(' ')}`);
  const res = spawnSync(command, args, { cwd, env: process.env, encoding: 'utf8' });
  const stdout = res.stdout || '';
  const stderr = res.stderr || '';
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
  if (res.status === 0) return;
  const combined = `${stdout}\n${stderr}`;
  if (combined.includes('"reason": "already-running"') || combined.includes('"reason":"already-running"')) {
    console.log('⚠️ Daily briefing cron already running; continuing without failing article publication');
    return;
  }
  fail(`${command} failed with exit code ${res.status}`);
}

function runOptional(command: string, args: string[], cwd = process.cwd(), label?: string) {
  console.log(`\n▶ ${command} ${args.join(' ')}`);
  const res = spawnSync(command, args, { cwd, env: process.env, encoding: 'utf8' });
  const stdout = res.stdout || '';
  const stderr = res.stderr || '';
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
  if (res.status === 0) return true;
  console.log(`⚠️ Optional step failed${label ? ` (${label})` : ''}; continuing article publication`);
  return false;
}

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-');
}

function inferCategory(cat: string) {
  const c = normalisePublicCategory(cat || 'world');
  if (c.includes('economic')) return 'economic-flows';
  if (c.includes('energy')) return 'energy';
  if (c.includes('diplomacy')) return 'diplomacy';
  if (c.includes('sanction')) return 'sanctions';
  if (c.includes('conflict')) return 'conflict';
  if (c.includes('governance')) return 'governance';
  if (c.includes('health')) return 'health';
  return c || 'world';
}

function parseArgs() {
  const date = process.argv[2];
  const period = process.argv[3] as Period | undefined;
  if (!date || !period || !['am', 'midday', 'pm'].includes(period)) {
    fail('Usage: npx tsx scripts/run-post-scan-pipeline.ts YYYY-MM-DD <am|midday|pm>');
  }
  return {
    date,
    period,
    skipBriefing: process.argv.includes('--skip-briefing'),
  } as { date: string; period: Period; skipBriefing: boolean };
}

function readScanFile(scanPath: string) {
  if (!fs.existsSync(scanPath)) fail(`Scan file not found: ${scanPath}`);
  const md = fs.readFileSync(scanPath, 'utf8');
  if (!/```json\s*[\r\n]/.test(md)) fail('Scan file missing fenced JSON block');
  return md;
}

function availableDatePeriods(date: string): Period[] {
  const ordered: Period[] = ['am', 'midday', 'pm'];
  return ordered.filter((candidate) => fs.existsSync(path.resolve(process.cwd(), `../memory/scans/${date}-${candidate}.md`)));
}

function runScoreForPeriod(date: string, period: Period) {
  const tsScorer = path.resolve(process.cwd(), `scripts/score-pgi-gai-${date}-${period}.ts`);
  const jsScorer = path.resolve(process.cwd(), `scripts/score-pgi-gai-${date}-${period}.js`);
  const dbScorer = path.resolve(process.cwd(), 'scripts/score-verified-scan.ts');
  if (fs.existsSync(tsScorer)) {
    run('npx', ['tsx', tsScorer]);
  } else if (fs.existsSync(jsScorer)) {
    run('node', [jsScorer]);
  } else if (fs.existsSync(dbScorer)) {
    console.log(`ℹ️ No date-specific scorer found for ${date} ${period}; using DB-truth scorer`);
    run('npx', ['tsx', 'scripts/score-verified-scan.ts', date, period]);
  } else {
    fail(`No scorer script found for ${date} ${period}`);
  }
}

function extractItems(md: string): ScanItem[] {
  const matches = [...md.matchAll(/```json\s*\n([\s\S]*?)```/g)];
  for (const m of matches) {
    try {
      const parsed = JSON.parse(m[1]);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {}
  }
  fail('Could not extract structured JSON items from scan markdown');
}


function titleFromHeadline(headline: string) {
  return headline
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(^\w)|([.!?]\s+\w)/g, (m) => m.toUpperCase());
}

function normaliseImageIdentity(image: string | null | undefined): string | null {
  if (!image) return null;
  try {
    const u = new URL(image);
    const parts = u.pathname.split('/').filter(Boolean);
    if (u.hostname.includes('pexels.com')) {
      const photoPart = parts.find((p) => p.startsWith('photo-'));
      return photoPart || u.pathname;
    }
    return `${u.hostname}${u.pathname}`;
  } catch {
    return image.split('?')[0];
  }
}

async function getRecentImageIdentities() {
  const { data, error } = await supabase
    .from('articles')
    .select('image, published_at')
    .order('published_at', { ascending: false })
    .limit(RECENT_IMAGE_WINDOW);
  if (error) fail(`Recent image lookup failed: ${error.message}`);
  return new Set((data || []).map((row: any) => normaliseImageIdentity(row.image)).filter(Boolean) as string[]);
}

async function searchPexelsCandidates(query: string) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [] as string[];
  try {
    const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&size=large`, {
      headers: { Authorization: apiKey },
    });
    if (!res.ok) return [] as string[];
    const data = await res.json();
    return (data.photos || [])
      .map((photo: any) => photo?.src?.large2x || photo?.src?.large || photo?.src?.original)
      .filter(Boolean);
  } catch {
    return [] as string[];
  }
}

function buildImageQueries(item: ScanItem, category: string) {
  const tags = (item.tags || []).slice(0, 3).map((t) => String(t).replace(/-/g, ' '));
  const region = (item.regions || [])[0] || '';
  const queries = [
    `${item.headline}`,
    `${tags.join(' ')} ${category}`.trim(),
    `${region} ${category}`.trim(),
    category,
  ].filter(Boolean);
  return [...new Set(queries)];
}

async function chooseUniqueImage(item: ScanItem, slug: string, category: string, usedImages: Set<string>) {
  const queries = buildImageQueries(item, category);
  for (const query of queries) {
    const candidates = await searchPexelsCandidates(query);
    for (const candidate of candidates) {
      const identity = normaliseImageIdentity(candidate);
      if (!identity) continue;
      if (usedImages.has(identity)) continue;
      usedImages.add(identity);
      return candidate;
    }
  }
  const fallback = `https://picsum.photos/seed/${slug}/1200/630`;
  const identity = normaliseImageIdentity(fallback);
  if (identity) usedImages.add(identity);
  return fallback;
}

function buildStoryPacket(item: ScanItem, selection?: Pick<PublicStorySelection, 'lane' | 'doctrineLane' | 'articleSignals' | 'articleForm' | 'articleOpportunity'>): StoryPacket {
  const title = titleFromHeadline(item.headline);
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const regions = Array.isArray(item.regions) ? item.regions : [];
  return {
    item,
    title,
    slug: `${slugify(item.headline)}-2026`,
    category: inferCategory(item.category || 'world'),
    tags,
    regions,
    regionsFound: Array.isArray(item.regions_found) ? item.regions_found : [],
    regionsAbsent: Array.isArray(item.regions_absent) ? item.regions_absent : [],
    patterns: Array.isArray(item.patterns) ? item.patterns : [],
    connection: item.connection || '',
    significance: (item.significance || 'medium').toLowerCase(),
    perceptionGap: typeof item.perception_gap === 'number' ? item.perception_gap : null,
    coverageBreadth: typeof item.coverage_breadth === 'number' ? item.coverage_breadth : null,
    primaryRegion: selection?.articleSignals?.primaryLocation || regions[0] || 'the wider region',
    tagText: tags.slice(0, 5).map((t) => t.replace(/-/g, ' ')).join(', '),
    lane: selection?.lane || null,
    doctrineLane: selection?.doctrineLane || null,
    articleSignals: selection?.articleSignals || null,
    articleForm: selection?.articleForm || null,
    articleOpportunity: selection?.articleOpportunity || null,
  };
}

function sentenceCase(value: string) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text[0].toUpperCase() + text.slice(1);
}

function cleanPhrase(value: string) {
  return String(value || '').replace(/^[-–—:;,\s]+|[-–—:;,\s]+$/g, '').replace(/\s+/g, ' ').trim();
}

function stripTrailingHeadlineNoise(value: string) {
  return cleanPhrase(String(value || '').replace(/^(?:that|which|who)\s+/i, '').replace(/\b(?:amid|after|as)\b[\s\S]*$/i, ''));
}

function chooseLeadActor(packet: StoryPacket, fallback?: string) {
  const candidates = packet.articleSignals?.mainActors || [];
  const cleaned = candidates
    .map((actor) => cleanPhrase(actor).replace(/^(?:the|a|an)\s+/i, ''))
    .filter(Boolean)
    .filter((actor) => !/^(?:woman|women|man|men|public|only|officials?|authorities|government|governments|state|states|people)$/i.test(actor));
  return cleaned[0] || fallback || '';
}

function factualAnchorSentence(packet: StoryPacket, parts?: LedeParts) {
  const base = parts || extractLedeParts(packet);
  const actor = chooseLeadActor(packet, base.actor) || base.actor;
  const object = stripTrailingHeadlineNoise(base.object);
  return [actor, base.action, object].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim() + '.';
}

function titleTokens(value: string) {
  return String(value || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token && token.length > 2 && !OPENING_STOPWORDS.has(token));
}

function pickFreshDetail(packet: StoryPacket) {
  if (packet.articleSignals?.keyNumber) return packet.articleSignals.keyNumber;
  if (packet.articleSignals?.mainActors?.length) return packet.articleSignals.mainActors[0];
  const tags = packet.tags
    .map((tag) => tag.replace(/-/g, ' '))
    .filter((tag) => tag.length > 3)
    .filter((tag) => !['global', 'markets', 'policy', 'trade', 'energy', 'conflict', 'shipping', 'sanctions'].includes(tag.toLowerCase()));
  if (tags.length) return tags[0];
  const regions = [...packet.regionsFound, ...packet.regions].filter(Boolean);
  if (regions.length) return regions[0];
  return packet.category.replace(/-/g, ' ');
}

function buildGenericLedeParts(packet: StoryPacket): LedeParts {
  const headline = cleanPhrase(packet.title);
  const lower = headline.toLowerCase();
  const location = packet.primaryRegion !== 'the wider region' ? packet.primaryRegion : (packet.regionsFound[0] || packet.primaryRegion);
  const consequence = sentenceCase(packet.connection || 'That shift is now starting to change how other actors price risk, access, or timing around the story.');

  const subjectMatch = headline.match(/^(.+?)\s+(extends?|approves?|advances?|launches?|investigates?|receives?|considers?|reports?|says|warns|unveils?|signs?|boosts?|revives?|hits?|moves?|agrees?|denounces?|promotes?|rises?|falls?|kills?|delivers?)\b/i);
  if (subjectMatch) {
    const actor = cleanPhrase(subjectMatch[1]);
    const action = cleanPhrase(subjectMatch[2]);
    const rest = cleanPhrase(headline.slice(subjectMatch[0].length));
    return { actor, action, object: rest, location, consequence, colour: pickFreshDetail(packet) };
  }

  if (lower.includes('ceasefire')) {
    return { actor: 'The ceasefire window', action: 'held a little longer', object: '', location, consequence, colour: pickFreshDetail(packet) };
  }
  if (lower.includes('sanctions')) {
    return { actor: 'A sanctions move', action: 'hardened the operating climate', object: '', location, consequence, colour: pickFreshDetail(packet) };
  }
  if (lower.includes('vaccine') || lower.includes('measles') || lower.includes('meningitis')) {
    return { actor: 'Health officials', action: 'are dealing with a sharper public-health signal', object: '', location, consequence, colour: pickFreshDetail(packet) };
  }
  if (lower.includes('solar') || lower.includes('energy') || lower.includes('oil')) {
    return { actor: 'Energy markets', action: 'shifted again', object: '', location, consequence, colour: pickFreshDetail(packet) };
  }

  return {
    actor: headline,
    action: 'is forcing a fresh read of the situation',
    object: '',
    location,
    consequence,
    colour: pickFreshDetail(packet),
  };
}

function extractLedeParts(packet: StoryPacket): LedeParts {
  const title = packet.title;
  const lower = title.toLowerCase();
  const connection = packet.connection || '';
  const location = packet.primaryRegion !== 'the wider region' ? packet.primaryRegion : (packet.regionsFound[0] || packet.primaryRegion);

  if (lower.includes('strait of hormuz') || packet.tags.includes('hormuz')) {
    return {
      actor: 'Fast boats and fresh vessel seizures around the Strait of Hormuz',
      action: 'kept the route unsettled',
      object: '',
      location,
      consequence: sentenceCase(connection || 'The renewed instability is keeping a core global energy route under pressure.'),
      colour: 'shipping insurance',
    };
  }

  if (lower.includes('drc') || packet.tags.includes('drc') || packet.tags.includes('m23')) {
    return {
      actor: 'DRC government negotiators and rebel representatives',
      action: 'moved toward a new protocol',
      object: 'on aid access, ceasefire oversight, and prisoner releases',
      location: 'eastern DRC',
      consequence: sentenceCase(connection || 'The move could improve conditions for civilians if it holds in practice.'),
      colour: 'aid access',
    };
  }

  if (lower.includes('waiver') || packet.tags.includes('sanctions-waiver')) {
    return {
      actor: 'The US Treasury',
      action: 'renewed a narrow waiver',
      object: 'allowing some at-sea purchases of sanctioned Russian oil',
      location,
      consequence: sentenceCase(connection || 'The exception softens one part of the sanctions regime at a moment of wider energy strain.'),
      colour: 'at-sea purchases',
    };
  }

  if (lower.includes('imf and world bank') && lower.includes('venezuela')) {
    return {
      actor: 'The IMF and World Bank',
      action: 'resumed dealings with Venezuela',
      object: 'after a years-long pause',
      location: 'Venezuela',
      consequence: sentenceCase(connection || 'The shift changes Caracas’s financial and diplomatic room to maneuver.'),
      colour: 'financial breathing room',
    };
  }

  if (lower.includes('imf')) {
    return {
      actor: 'The IMF',
      action: 'updated its public outlook',
      object: '',
      location: 'global markets',
      consequence: sentenceCase(connection || 'The revision gives formal weight to economic pressures already building beneath the headline cycle.'),
      colour: 'growth outlook',
    };
  }

  if (lower.includes('druzhba') || lower.includes('pipeline flows will resume') || lower.includes('pipeline')) {
    return {
      actor: 'Ukraine',
      action: 'said Druzhba oil pipeline flows would resume',
      object: 'after repairs',
      location: 'central Europe',
      consequence: sentenceCase(connection || 'That restoration matters for regional energy security, refinery planning, and transit leverage.'),
      colour: 'pipeline flows',
    };
  }

  if (lower.includes('disinformation') && lower.includes('russian')) {
    return {
      actor: 'The European Union',
      action: 'sanctioned two Russian entities',
      object: 'over alleged disinformation links',
      location: 'Europe',
      consequence: sentenceCase(connection || 'The move expands sanctions pressure into information infrastructure as well as finance and trade.'),
      colour: 'information infrastructure',
    };
  }

  if (lower.includes('cargo') || lower.includes('ship') || lower.includes('vessel')) {
    return {
      actor: 'A maritime interception',
      action: 'added another live risk signal',
      object: '',
      location,
      consequence: sentenceCase(connection || 'The move raises the risk that a fragile pause could break down further.'),
      colour: 'boarded vessels',
    };
  }

  if (lower.includes('kenya')) {
    return {
      actor: 'Kenya',
      action: 'sought emergency World Bank support',
      object: '',
      location: 'Nairobi',
      consequence: sentenceCase(connection || 'The request shows the war shock is spilling into sovereign financial stress for import-dependent economies.'),
      colour: 'emergency support',
    };
  }

  if (lower.includes('bangladesh')) {
    return {
      actor: 'Bangladesh',
      action: 'raised fuel prices',
      object: '',
      location: 'Dhaka',
      consequence: sentenceCase(connection || 'Higher freight insurance and import costs are now feeding directly into domestic energy pressure.'),
      colour: 'fuel prices',
    };
  }

  return buildGenericLedeParts(packet);
}

function buildActorActionLede(packet: StoryPacket) {
  const parts = extractLedeParts(packet);
  const firstSentence = factualAnchorSentence(packet, parts);
  const colourSentence = parts.colour ? `The immediate pressure point is ${parts.colour}, because that is where the event starts producing visible consequences.` : '';
  const secondSentence = `${parts.consequence} ${parts.location && parts.location !== 'the wider region' ? `The pressure point sits in ${parts.location}.` : ''} ${colourSentence}`.replace(/\s+/g, ' ').trim();
  return `${firstSentence} ${secondSentence}`.trim();
}

function buildFormLabel(packet: StoryPacket) {
  switch (packet.articleForm) {
    case 'framing-map': return 'framing map';
    case 'human-ground': return 'human-ground story';
    case 'numbers-watch': return 'numbers watch';
    case 'system-shift': return 'system-shift story';
    case 'offbeat-signal': return 'offbeat signal';
    case 'turning-point':
    default: return 'turning-point story';
  }
}

function buildWhatChangedParagraph(packet: StoryPacket) {
  const detail = pickFreshDetail(packet);
  const places = [...packet.regionsFound, ...packet.regions].filter(Boolean).slice(0, 2).join(' and ');
  const coreFact = sentenceCase(packet.articleSignals?.coreFact || packet.connection || 'The headline already points to a concrete shift on the ground.');
  return `${coreFact} The next test is whether that shift stays contained or starts changing choices around ${detail}${places ? ` in ${places}` : ''}—from ministries and ports to clinics, courtrooms, warehouses, classrooms, and family budgets.`.replace(/\s+/g, ' ').trim();
}

function storyText(packet: StoryPacket) {
  return `${packet.title} ${packet.connection || ''} ${packet.tags.join(' ')}`.toLowerCase();
}

function picksStoryKeywords(packet: StoryPacket, words: string[]) {
  const text = storyText(packet);
  return words.some((word) => text.includes(word));
}

function buildStorySpecificCascade(packet: StoryPacket) {
  if (picksStoryKeywords(packet, ['ship', 'shipping', 'port', 'corridor', 'freight', 'route', 'pipeline', 'canal', 'vessel', 'hormuz', 'oil', 'fuel', 'lng', 'diesel'])) {
    return 'The chain usually runs through routing, insurance, delivery timing, and then price—well before consumers see a neat explanation at the pump or on the invoice.';
  }
  if (picksStoryKeywords(packet, ['sanction', 'tariff', 'waiver', 'ban', 'export', 'license', 'court', 'rule', 'legal'])) {
    return 'The first effects tend to show up in contracts, compliance decisions, and delayed shipments, because companies move faster than ministries rewrite their public language.';
  }
  if (picksStoryKeywords(packet, ['measles', 'meningitis', 'vaccine', 'hospital', 'clinic', 'outbreak', 'health'])) {
    return 'The chain is usually painfully concrete: missed prevention becomes more cases, more cases strain clinics and staffing, and that strain spills into schools, transport, and family risk.';
  }
  if (picksStoryKeywords(packet, ['migration', 'asylum', 'refugee', 'border', 'detention', 'displacement'])) {
    return 'The pressure moves through paperwork first, then beds, buses, shelters, court calendars, and city budgets once the policy signal hits the ground.';
  }
  if (picksStoryKeywords(packet, ['ai', 'chip', 'semiconductor', 'server', 'compute', 'grid', 'data', 'battery', 'solar', 'energy'])) {
    return 'The constraint usually appears first in capacity: who gets power, hardware, permits, financing, or bandwidth soon enough to keep promises from slipping.';
  }
  return 'The first visible change is rarely the last one. Once operators adjust behaviour, the story starts travelling through pricing, staffing, routing, access, or enforcement.';
}

function buildStorySpecificStakes(packet: StoryPacket) {
  if (picksStoryKeywords(packet, ['ship', 'shipping', 'port', 'corridor', 'freight', 'route', 'pipeline', 'canal', 'vessel', 'hormuz', 'oil', 'fuel', 'lng', 'diesel'])) {
    return 'That is why a route story rarely stays a route story: it becomes a costs story, a supply story, and eventually a household or industrial planning story.';
  }
  if (picksStoryKeywords(packet, ['sanction', 'tariff', 'waiver', 'ban', 'export', 'license', 'court', 'rule', 'legal'])) {
    return 'What looks like a policy adjustment on paper can quickly decide who keeps trading, who freezes decisions, and who has to absorb the new friction.';
  }
  if (picksStoryKeywords(packet, ['measles', 'meningitis', 'vaccine', 'hospital', 'clinic', 'outbreak', 'health'])) {
    return 'In health stories, the real test is whether a controllable signal is turning into avoidable overload for clinics, schools, and families.';
  }
  if (picksStoryKeywords(packet, ['migration', 'asylum', 'refugee', 'border', 'detention', 'displacement'])) {
    return 'For people inside the system, the difference between rhetoric and reality is measured in waiting time, legal status, shelter capacity, and whether movement becomes more dangerous.';
  }
  if (picksStoryKeywords(packet, ['ai', 'chip', 'semiconductor', 'server', 'compute', 'grid', 'data', 'battery', 'solar', 'energy'])) {
    return 'What matters is who can still scale, ship, or keep operating on schedule once the bottleneck stops being theoretical.';
  }
  return 'That is the point where the story stops being a headline and starts becoming a condition other people have to work around.';
}

function buildMechanismParagraph(packet: StoryPacket) {
  const lower = packet.title.toLowerCase();
  const mechanism = packet.articleSignals?.mechanism && packet.articleSignals.mechanism !== 'state change with second-order effects'
    ? sentenceCase(packet.articleSignals.mechanism)
    : '';
  const framing = packet.articleSignals?.framingTension ? sentenceCase(packet.articleSignals.framingTension) : '';
  const connection = sentenceCase(packet.connection || '');
  const cascade = buildStorySpecificCascade(packet);

  if (mechanism) {
    return `${mechanism} is what turns this from a single update into a moving story. ${connection ? `${connection} ` : ''}${cascade}${framing ? ` ${framing}.` : ''}`.replace(/\s+/g, ' ').trim();
  }
  if (lower.includes('measles') || lower.includes('meningitis') || lower.includes('vaccine') || packet.category === 'health') {
    return `Health stories escalate through accumulation, not announcement. One missed safeguard in a crowded camp or under-supplied district can become school disruption, clinic overload, delayed immunisation, and avoidable deaths within days. The question is not only how bad today looks, but what starts failing next.`;
  }
  if (lower.includes('migration') || lower.includes('asylum') || lower.includes('refugee') || packet.category.includes('migration')) {
    return `Migration stories turn when paperwork becomes movement. A court ruling, funding cut, or border operation can quickly reshape detention capacity, asylum routes, municipal strain, and diplomatic bargaining long before the next speech catches up to reality.`;
  }
  if (lower.includes('ai') || lower.includes('data') || lower.includes('quantum') || packet.category.includes('tech')) {
    return `Technology stories become consequential when the bottleneck comes into view. Power access, data rules, chip supply, server capacity, and standards battles decide who can scale, who stalls, and who suddenly has to explain why promised speed is no longer possible.`;
  }
  return `The causal chain matters more than the slogan. ${cascade}`.replace(/\s+/g, ' ').trim();
}

function buildRegionalDetailParagraph(packet: StoryPacket) {
  const found = packet.regionsFound.length ? packet.regionsFound.slice(0, 4).join(', ') : packet.regions.slice(0, 4).join(', ');
  const absent = packet.regionsAbsent.length ? packet.regionsAbsent.slice(0, 3).join(', ') : '';
  const patternText = packet.patterns.length ? `Across that spread, coverage keeps pulling toward ${packet.patterns.join(', ')}, so readers are not just seeing different tone; they are often being handed a different main plot.` : 'Across that spread, readers are already getting different practical readings of the same event.';
  const gapText = packet.perceptionGap && packet.perceptionGap >= 7 ? 'The perception gap is wide enough that two audiences could walk away thinking the story is about different problems.' : '';
  const breadthText = packet.coverageBreadth && packet.coverageBreadth >= 7 ? 'The footprint is broad, which usually means downstream effects will travel beyond the country that triggered the headline.' : '';

  return `${found ? `Coverage is clustering in ${found}.` : `The reporting footprint already crosses several regions.`} ${absent ? `Coverage is thinner in ${absent}, so the lagging consequences may still be under-described.` : ''} ${patternText} ${gapText} ${breadthText}`.replace(/\s+/g, ' ').trim();
}

function buildWhyItMattersParagraph(packet: StoryPacket) {
  const lower = packet.title.toLowerCase();
  const connection = sentenceCase(packet.connection || '');
  const stakes = buildStorySpecificStakes(packet);
  if (packet.articleSignals?.humanStake) {
    return `${sentenceCase(packet.articleSignals.humanStake)} is where the story becomes tangible. ${connection ? `${connection} ` : ''}${stakes}${packet.articleSignals.novelty ? ` What stands out is that it ${packet.articleSignals.novelty}.` : ''}`.replace(/\s+/g, ' ').trim();
  }
  if (lower.includes('solar') || lower.includes('climate') || lower.includes('deforestation')) {
    return `This reaches further than a climate headline. ${connection ? `${connection} ` : ''}It presses on financing, household hedging, commodity rules, and industrial strategy at the same time.`.replace(/\s+/g, ' ').trim();
  }
  const detail = pickFreshDetail(packet);
  return `${connection ? `${connection} ` : ''}${stakes} In practice, that means watching whether pressure around ${detail} stays local or starts showing up in budgets, supply, access, or political room to manoeuvre.`.replace(/\s+/g, ' ').trim();
}

function buildContextParagraph(packet: StoryPacket) {
  const detail = pickFreshDetail(packet);
  const connection = sentenceCase(packet.connection || 'The development changes the immediate context around the story.');
  return `${connection} The next test is practical: whether ${detail} changes decisions, routes, budgets, access, legal exposure, or public pressure in ways that outlast the first headline.`.replace(/\s+/g, ' ').trim();
}

function buildReaderUsefulnessParagraph(packet: StoryPacket) {
  const texture = packet.articleSignals?.sourceTexture?.length ? `Current reporting points to ${packet.articleSignals.sourceTexture.join(', ')}.` : '';
  const pairWith = packet.articleSignals?.pairWith?.length ? `The story may also connect to ${packet.articleSignals.pairWith.join(' or ')} as it develops.` : '';
  const detail = pickFreshDetail(packet);
  return `The useful question now is where the consequences become visible first. For this story, that may be ${detail}, access decisions, pricing moves, staffing pressure, or the fine print around the next official step. ${texture} ${pairWith}`.replace(/\s+/g, ' ').trim();
}

function buildWhatToWatchParagraph(packet: StoryPacket) {
  const detail = pickFreshDetail(packet);
  return `The immediate question is whether ${detail} changes on the ground, whether neighbouring actors copy or resist the move, and whether the issue begins appearing in places that were initially quiet.`;
}

function buildClosingParagraph(packet: StoryPacket) {
  const detail = pickFreshDetail(packet);
  return `For now, ${detail} is the place to keep watching. If the consequences spread beyond the first announcement, the story will stop looking like a single update and start looking like a new baseline.`;
}

function buildFramingMapLede(packet: StoryPacket) {
  const parts = extractLedeParts(packet);
  const tension = sentenceCase(packet.articleSignals?.framingTension || 'the loudest version of the story is not the only one in circulation');
  const actors = packet.articleSignals?.mainActors?.slice(0, 2).join(' and ');
  const anchor = factualAnchorSentence(packet, parts);
  return `${anchor} ${tension}${actors ? ` ${actors} sit near the centre of that divide.` : ''}`.replace(/\s+/g, ' ').trim();
}

function buildHumanGroundLede(packet: StoryPacket) {
  const parts = extractLedeParts(packet);
  const place = packet.articleSignals?.primaryLocation || packet.regionsFound[0] || packet.regions[0] || parts.location || 'one pressure point';
  const stake = packet.articleSignals?.humanStake || 'direct lived consequences';
  const anchor = factualAnchorSentence(packet, parts);
  return `${anchor} In ${place}, ${stake} is no longer theoretical.`.replace(/\s+/g, ' ').trim();
}

function buildNumbersWatchLede(packet: StoryPacket) {
  const number = packet.articleSignals?.keyNumber || pickFreshDetail(packet);
  const parts = extractLedeParts(packet);
  const anchor = factualAnchorSentence(packet, parts);
  const novelty = packet.articleSignals?.novelty ? sentenceCase(packet.articleSignals.novelty) : 'It marks a real shift, not background noise';
  return `${anchor} ${number} is the operative number because it shows where the pressure is becoming measurable. ${novelty}.`.replace(/\s+/g, ' ').trim();
}

function buildSystemShiftLede(packet: StoryPacket) {
  const mechanism = packet.articleSignals?.mechanism || 'a bottleneck';
  const detail = pickFreshDetail(packet);
  const parts = extractLedeParts(packet);
  const anchor = factualAnchorSentence(packet, parts);
  return `${anchor} ${sentenceCase(mechanism)} is now remapping behaviour underneath the headline. Watch ${detail}: that is where a reroute, waiver, shortage, or rule change starts altering decisions.`.replace(/\s+/g, ' ').trim();
}

function buildOffbeatSignalLede(packet: StoryPacket) {
  const parts = extractLedeParts(packet);
  const detail = pickFreshDetail(packet);
  const novelty = packet.articleSignals?.novelty || 'reveals a surprising edge-case with broader meaning';
  const anchor = factualAnchorSentence(packet, parts);
  return `${anchor} ${sentenceCase(detail)} is the odd detail worth watching because it ${novelty}.`.replace(/\s+/g, ' ').trim();
}

function buildFramingMapParagraph(packet: StoryPacket) {
  const tension = sentenceCase(packet.articleSignals?.framingTension || 'the surface frame and the underlying mechanism do not point readers to the same conclusion');
  const pairWith = packet.articleSignals?.pairWith?.length ? `It also connects cleanly to ${packet.articleSignals.pairWith.join(' or ')} follow-up coverage.` : '';
  return `${tension}. In practice, one audience may be reading a sanctions story while another is reading a prices story, or one may hear diplomacy while another never looks away from enforcement, displacement, or fallout. ${pairWith}`.replace(/\s+/g, ' ').trim();
}

function buildSystemRippleParagraph(packet: StoryPacket) {
  const actors = packet.articleSignals?.mainActors?.length ? packet.articleSignals.mainActors.join(', ') : 'officials, traders, operators, and households';
  const detail = pickFreshDetail(packet);
  return `Once the shift is underway, the ripple rarely stays in one lane. ${actors} start changing timing, sourcing, staffing, pricing, or public language around ${detail} before any neat political consensus forms. That is why these stories often matter earlier than their headline temperature suggests.`.replace(/\s+/g, ' ').trim();
}

function buildNumberMeaningParagraph(packet: StoryPacket) {
  const number = packet.articleSignals?.keyNumber || pickFreshDetail(packet);
  const coreFact = sentenceCase(packet.articleSignals?.coreFact || packet.connection || 'The number is attached to a concrete change in the operating environment.');
  return `${coreFact} ${number} matters only if it redraws the situation on the ground: a higher floor for costs, a lower margin for safety, a faster rate of spread, a deeper funding hole, or a new baseline that other actors now have to plan around.`.replace(/\s+/g, ' ').trim();
}

function buildOffbeatBridgeParagraph(packet: StoryPacket) {
  const mechanism = packet.articleSignals?.mechanism || 'a wider mechanism';
  return `The oddity matters because it lights up ${mechanism} from the side. A strange local detail can expose stress, adaptation, workaround behaviour, or institutional denial faster than a polished policy statement ever will.`;
}

function buildTurningPointBody(packet: StoryPacket) {
  const lede = buildActorActionLede(packet);
  const paragraphs = [
    lede,
    buildWhatChangedParagraph(packet),
    buildMechanismParagraph(packet),
    buildWhyItMattersParagraph(packet),
    buildRegionalDetailParagraph(packet),
    buildContextParagraph(packet),
    buildWhatToWatchParagraph(packet),
    buildClosingParagraph(packet),
  ];
  return { lede, body: paragraphs.join('\n\n') };
}

function buildFramingMapBody(packet: StoryPacket) {
  const lede = buildFramingMapLede(packet);
  const paragraphs = [
    lede,
    buildFramingMapParagraph(packet),
    buildMechanismParagraph(packet),
    buildRegionalDetailParagraph(packet),
    buildWhyItMattersParagraph(packet),
    buildReaderUsefulnessParagraph(packet),
    buildWhatToWatchParagraph(packet),
    buildClosingParagraph(packet),
  ];
  return { lede, body: paragraphs.join('\n\n') };
}

function buildHumanGroundBody(packet: StoryPacket) {
  const lede = buildHumanGroundLede(packet);
  const paragraphs = [
    lede,
    buildWhyItMattersParagraph(packet),
    buildWhatChangedParagraph(packet),
    buildRegionalDetailParagraph(packet),
    buildMechanismParagraph(packet),
    buildContextParagraph(packet),
    buildWhatToWatchParagraph(packet),
    buildClosingParagraph(packet),
  ];
  return { lede, body: paragraphs.join('\n\n') };
}

function buildNumbersWatchBody(packet: StoryPacket) {
  const lede = buildNumbersWatchLede(packet);
  const paragraphs = [
    lede,
    buildNumberMeaningParagraph(packet),
    buildWhatChangedParagraph(packet),
    buildMechanismParagraph(packet),
    buildRegionalDetailParagraph(packet),
    buildContextParagraph(packet),
    buildWhatToWatchParagraph(packet),
    buildClosingParagraph(packet),
  ];
  return { lede, body: paragraphs.join('\n\n') };
}

function buildSystemShiftBody(packet: StoryPacket) {
  const lede = buildSystemShiftLede(packet);
  const paragraphs = [
    lede,
    buildMechanismParagraph(packet),
    buildSystemRippleParagraph(packet),
    buildWhatChangedParagraph(packet),
    buildRegionalDetailParagraph(packet),
    buildReaderUsefulnessParagraph(packet),
    buildWhatToWatchParagraph(packet),
    buildClosingParagraph(packet),
  ];
  return { lede, body: paragraphs.join('\n\n') };
}

function buildOffbeatSignalBody(packet: StoryPacket) {
  const lede = buildOffbeatSignalLede(packet);
  const paragraphs = [
    lede,
    buildOffbeatBridgeParagraph(packet),
    buildWhatChangedParagraph(packet),
    buildMechanismParagraph(packet),
    buildRegionalDetailParagraph(packet),
    buildWhyItMattersParagraph(packet),
    buildWhatToWatchParagraph(packet),
    buildClosingParagraph(packet),
  ];
  return { lede, body: paragraphs.join('\n\n') };
}

function buildLegacyArticleBody(packet: StoryPacket) {
  switch (packet.articleForm) {
    case 'framing-map':
      return buildFramingMapBody(packet);
    case 'human-ground':
      return buildHumanGroundBody(packet);
    case 'numbers-watch':
      return buildNumbersWatchBody(packet);
    case 'system-shift':
      return buildSystemShiftBody(packet);
    case 'offbeat-signal':
      return buildOffbeatSignalBody(packet);
    case 'turning-point':
    default:
      return buildTurningPointBody(packet);
  }
}

function planStory(packet: StoryPacket): StoryPlan {
  return buildStoryPlan({
    title: packet.title,
    category: packet.category,
    connection: packet.connection,
    significance: packet.significance,
    lane: packet.lane,
    articleForm: packet.articleForm,
    articleOpportunity: packet.articleOpportunity,
    articleSignals: packet.articleSignals,
    primaryRegion: packet.primaryRegion,
    regions: packet.regions,
    tags: packet.tags,
  });
}

type DraftPath = 'legacy' | 'plan-driven-v1';

type BuiltStoryDraft = {
  lede: string;
  body: string;
  plan: StoryPlan;
  draftPath: DraftPath;
  draftForm: StoryPlan['storyKind'] | 'legacy';
};

function joinSentences(...parts: Array<string | null | undefined>) {
  return parts
    .map((part) => String(part || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function ensurePeriod(text: string) {
  const value = String(text || '').trim();
  if (!value) return '';
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

function buildPlanDrivenNutGraf(packet: StoryPacket, plan: StoryPlan) {
  const fact = sentenceCase(packet.articleSignals?.coreFact || packet.connection || packet.title);
  const promise = ensurePeriod(plan.nutGrafPromise);
  const tension = ensurePeriod(plan.mainTension);
  return joinSentences(fact, promise, tension);
}

function buildPlanDrivenTurningPointConsequence(packet: StoryPacket) {
  const connection = ensurePeriod(sentenceCase(packet.connection || 'The state of play has changed enough that other actors now have to make decisions against a different backdrop.'));
  const detail = pickFreshDetail(packet);
  const stake = packet.articleSignals?.humanStake ? `${sentenceCase(packet.articleSignals.humanStake)} is one of the first places that shift becomes visible.` : '';
  return joinSentences(
    connection,
    `The practical test now is whether the move around ${detail} stays narrow or forces a wider reset in timing, pricing, routing, access, or political room to manoeuvre.`,
    stake,
  );
}

function buildPlanDrivenTurningPointWatch(packet: StoryPacket, plan: StoryPlan) {
  const location = packet.articleSignals?.primaryLocation || packet.primaryRegion;
  const actors = packet.articleSignals?.mainActors?.slice(0, 2).join(' and ');
  return joinSentences(
    `In ${location}, the test is whether the announcement changes what happens next, not just what gets said next.`,
    actors ? `${actors} will show through their next moves whether this becomes a durable shift or a short interruption.` : 'The next choices on the ground will show whether this becomes a durable shift or a short interruption.',
    ensurePeriod(plan.walkaway),
  );
}

function buildPlanDrivenHumanBridge(packet: StoryPacket, plan: StoryPlan) {
  const stake = packet.articleSignals?.humanStake || 'lived consequences';
  const place = packet.articleSignals?.primaryLocation || packet.primaryRegion;
  const connection = ensurePeriod(sentenceCase(packet.connection || 'The local pressure point is carrying a wider system signal.'));
  return joinSentences(
    `That is the point of entry: in ${place}, ${stake} is already concrete enough to read as operating reality rather than future risk.`,
    connection,
    ensurePeriod(plan.nutGrafPromise),
  );
}

function buildPlanDrivenHumanMechanism(packet: StoryPacket) {
  const mechanism = packet.articleSignals?.mechanism && packet.articleSignals.mechanism !== 'state change with second-order effects'
    ? sentenceCase(packet.articleSignals.mechanism)
    : 'The wider mechanism is now visible in everyday pressure';
  return joinSentences(
    `${mechanism} is what connects the local strain to the larger story.`,
    buildStorySpecificCascade(packet),
    buildStorySpecificStakes(packet),
  );
}

function buildPlanDrivenHumanReturn(packet: StoryPacket) {
  const stake = packet.articleSignals?.humanStake || 'that pressure';
  const number = packet.articleSignals?.keyNumber ? `${packet.articleSignals.keyNumber} is one clue that the burden is becoming measurable.` : '';
  return joinSentences(
    `${sentenceCase(stake)} matters because it tells readers where the abstract shift starts landing in ordinary life.`,
    number,
    `If the signal keeps building, the consequences will show up not just in headlines but in access, waiting time, household budgets, and institutional capacity.`,
  );
}

function buildPlanDrivenFramingContrast(packet: StoryPacket, plan: StoryPlan) {
  const framing = sentenceCase(packet.articleSignals?.framingTension || plan.mainTension);
  const pairWith = packet.articleSignals?.pairWith?.length ? `That split also opens into ${packet.articleSignals.pairWith.join(' or ')} as the next layer of coverage.` : '';
  return joinSentences(
    `${framing} That matters because audiences can leave the same event with different ideas about what the story is actually about.`,
    pairWith,
  );
}

function buildPlanDrivenFramingMechanism(packet: StoryPacket) {
  const mechanism = packet.articleSignals?.mechanism && packet.articleSignals.mechanism !== 'state change with second-order effects'
    ? sentenceCase(packet.articleSignals.mechanism)
    : 'The underlying mechanism is doing more work than the loudest frame admits';
  const connection = ensurePeriod(sentenceCase(packet.connection || 'The gap between frame and operating reality is part of the story.'));
  return joinSentences(
    `${mechanism} is the hinge.`,
    connection,
    `Once that hinge comes into view, the difference between rhetoric, emphasis, and downstream consequence becomes easier to read.`,
  );
}

function buildPlanDrivenFramingWhy(packet: StoryPacket, plan: StoryPlan) {
  const found = packet.regionsFound.length ? packet.regionsFound.slice(0, 3).join(', ') : packet.regions.slice(0, 3).join(', ');
  const gapText = packet.perceptionGap && packet.perceptionGap >= 7
    ? 'The perception gap is already wide enough that readers in different places may think they are tracking different central facts.'
    : 'Even a narrower gap can still change what readers notice first and what they ignore.';
  return joinSentences(
    found ? `That split is visible across coverage clustered in ${found}.` : 'That split is already visible across the reporting footprint.',
    gapText,
    ensurePeriod(plan.walkaway),
  );
}

function buildPlanDrivenNumbersBridge(packet: StoryPacket, plan: StoryPlan) {
  const number = packet.articleSignals?.keyNumber || pickFreshDetail(packet);
  const novelty = packet.articleSignals?.novelty ? `${sentenceCase(packet.articleSignals.novelty)}.` : '';
  return joinSentences(
    `${number} is the hinge in this story because it tells readers where the pressure stops sounding ambient and starts becoming measurable.`,
    ensurePeriod(plan.nutGrafPromise),
    novelty,
  );
}

function buildPlanDrivenNumbersMeaning(packet: StoryPacket) {
  const number = packet.articleSignals?.keyNumber || 'The operative metric';
  return joinSentences(
    `${number} matters only if it redraws what other actors now have to plan around.`,
    buildNumberMeaningParagraph(packet),
    buildStorySpecificStakes(packet),
  );
}

function buildPlanDrivenNumbersWatch(packet: StoryPacket, plan: StoryPlan) {
  const detail = pickFreshDetail(packet);
  return joinSentences(
    `The useful test now is whether ${detail} keeps moving in the same direction or forces officials, operators, or households to accept a different baseline.`,
    ensurePeriod(plan.walkaway),
  );
}

function buildPlanDrivenSystemBridge(packet: StoryPacket, plan: StoryPlan) {
  const mechanism = packet.articleSignals?.mechanism || 'the operative bottleneck';
  return joinSentences(
    `${sentenceCase(mechanism)} is the engine here, not a side note.`,
    ensurePeriod(plan.nutGrafPromise),
    ensurePeriod(plan.mainTension),
  );
}

function buildPlanDrivenSystemCascade(packet: StoryPacket) {
  return joinSentences(
    buildMechanismParagraph(packet),
    buildSystemRippleParagraph(packet),
    buildStorySpecificCascade(packet),
  );
}

function buildPlanDrivenSystemWhy(packet: StoryPacket, plan: StoryPlan) {
  const detail = pickFreshDetail(packet);
  return joinSentences(
    `That is why ${detail} matters more than the headline temperature: it is one of the first places the reroute, shortage, waiver, or constraint starts altering real decisions.`,
    buildStorySpecificStakes(packet),
    ensurePeriod(plan.walkaway),
  );
}

function buildPlanDrivenOffbeatBridge(packet: StoryPacket, plan: StoryPlan) {
  const detail = pickFreshDetail(packet);
  return joinSentences(
    `${sentenceCase(detail)} is not just colour; it is the cleanest route into the larger pattern.`,
    ensurePeriod(plan.nutGrafPromise),
    buildOffbeatBridgeParagraph(packet),
  );
}

function buildPlanDrivenOffbeatWhy(packet: StoryPacket, plan: StoryPlan) {
  const novelty = packet.articleSignals?.novelty ? `${sentenceCase(packet.articleSignals.novelty)}.` : '';
  return joinSentences(
    buildWhyItMattersParagraph(packet),
    novelty,
    ensurePeriod(plan.walkaway),
  );
}

function buildPlanDrivenDraft(packet: StoryPacket, plan: StoryPlan): BuiltStoryDraft | null {
  const regional = buildRegionalDetailParagraph(packet);
  const watch = buildWhatToWatchParagraph(packet);
  const closing = buildClosingParagraph(packet);

  switch (plan.storyKind) {
    case 'turning-point': {
      const lede = buildActorActionLede(packet);
      const paragraphs = [
        lede,
        buildPlanDrivenNutGraf(packet, plan),
        buildPlanDrivenTurningPointConsequence(packet, plan),
        buildMechanismParagraph(packet),
        regional,
        buildContextParagraph(packet),
        buildPlanDrivenTurningPointWatch(packet, plan),
        watch,
        closing,
      ];
      return { lede, body: paragraphs.join('\n\n'), plan, draftPath: 'plan-driven-v1', draftForm: plan.storyKind };
    }
    case 'human-fallout': {
      const lede = buildHumanGroundLede(packet);
      const paragraphs = [
        lede,
        buildPlanDrivenHumanBridge(packet, plan),
        buildWhatChangedParagraph(packet),
        buildPlanDrivenHumanMechanism(packet, plan),
        regional,
        buildPlanDrivenHumanReturn(packet, plan),
        watch,
        closing,
      ];
      return { lede, body: paragraphs.join('\n\n'), plan, draftPath: 'plan-driven-v1', draftForm: plan.storyKind };
    }
    case 'framing-battle': {
      const lede = buildFramingMapLede(packet);
      const paragraphs = [
        lede,
        buildPlanDrivenNutGraf(packet, plan),
        buildPlanDrivenFramingContrast(packet, plan),
        buildPlanDrivenFramingMechanism(packet, plan),
        regional,
        buildPlanDrivenFramingWhy(packet, plan),
        watch,
        closing,
      ];
      return { lede, body: paragraphs.join('\n\n'), plan, draftPath: 'plan-driven-v1', draftForm: plan.storyKind };
    }
    case 'numbers-reset': {
      const lede = buildNumbersWatchLede(packet);
      const paragraphs = [
        lede,
        buildPlanDrivenNumbersBridge(packet, plan),
        buildPlanDrivenNumbersMeaning(packet, plan),
        buildWhatChangedParagraph(packet),
        buildMechanismParagraph(packet),
        regional,
        buildPlanDrivenNumbersWatch(packet, plan),
        watch,
        closing,
      ];
      return { lede, body: paragraphs.join('\n\n'), plan, draftPath: 'plan-driven-v1', draftForm: plan.storyKind };
    }
    case 'system-ripple': {
      const lede = buildSystemShiftLede(packet);
      const paragraphs = [
        lede,
        buildPlanDrivenSystemBridge(packet, plan),
        buildPlanDrivenSystemCascade(packet, plan),
        buildWhatChangedParagraph(packet),
        regional,
        buildPlanDrivenSystemWhy(packet, plan),
        watch,
        closing,
      ];
      return { lede, body: paragraphs.join('\n\n'), plan, draftPath: 'plan-driven-v1', draftForm: plan.storyKind };
    }
    case 'offbeat-window': {
      const lede = buildOffbeatSignalLede(packet);
      const paragraphs = [
        lede,
        buildPlanDrivenOffbeatBridge(packet, plan),
        buildWhatChangedParagraph(packet),
        buildMechanismParagraph(packet),
        regional,
        buildPlanDrivenOffbeatWhy(packet, plan),
        watch,
        closing,
      ];
      return { lede, body: paragraphs.join('\n\n'), plan, draftPath: 'plan-driven-v1', draftForm: plan.storyKind };
    }
    default:
      return null;
  }
}

function selectLegacyBodyFromPlan(packet: StoryPacket, plan: StoryPlan) {
  switch (plan.openingMode as OpeningMode) {
    case 'contrast':
      return buildFramingMapBody(packet);
    case 'human-proximity':
      return buildHumanGroundBody(packet);
    case 'number':
      return buildNumbersWatchBody(packet);
    case 'odd-detail':
      return buildOffbeatSignalBody(packet);
    case 'pressure-point':
      return packet.articleForm === 'turning-point' ? buildTurningPointBody(packet) : buildSystemShiftBody(packet);
    case 'direct-factual':
    default:
      return packet.articleForm === 'system-shift' ? buildSystemShiftBody(packet) : buildTurningPointBody(packet);
  }
}

function buildPlannedArticleBody(packet: StoryPacket) {
  const plan = planStory(packet);
  const planned = buildPlanDrivenDraft(packet, plan);
  if (planned) return planned;
  const built = selectLegacyBodyFromPlan(packet, plan);
  return { ...built, plan, draftPath: 'legacy' as const, draftForm: 'legacy' as const };
}

function containsBannedPhrases(text: string) {
  const lower = text.toLowerCase();
  return BANNED_PHRASES.filter((phrase) => lower.includes(phrase));
}

function hasConcreteOpening(text: string) {
  const firstParagraph = text.split(/\n\n/)[0] || '';
  const lower = firstParagraph.toLowerCase();
  const concreteSignals = ['reopens', 'reimposed', 'seizes', 'cuts', 'extends', 'ceasefire', 'corridor', 'waiver', 'imf', 'route', 'port', 'talks', 'aid', 'growth', 'oil', 'ship', 'downgrade', 'seizure', 'treasury', 'negotiators', 'rebels', 'court', 'loan', 'funding', 'vaccine', 'measles', 'meningitis', 'dataset', 'solar', 'canal', 'carrier', 'chip', 'investigates', 'advances', 'exports', 'manufacturers', 'review', 'migrants', 'border', 'asylum', 'sanctions', 'insurance', 'tariff', 'pipeline', 'crossing', 'refinery', 'military', 'cargo', 'miners', 'grain'];
  const hasSignalWord = concreteSignals.some((signal) => lower.includes(signal));
  const hasNumber = /\b\d+(?:\.\d+)?(?:bn|m|%| million| billion)?\b/.test(lower);
  const hasPlaceOrProperNoun = /\b(?:eu|uk|us|iran|china|india|bangladesh|paraguay|panama|sudan|chad|nokia|openai|cisco|who|imf|africa|europe|gaza|israel|lebanon|haiti|russia|ukraine|japan|philippines|ghana)\b/.test(lower);
  const hasQuotedActor = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/.test(firstParagraph);
  return hasSignalWord || (hasNumber && hasPlaceOrProperNoun) || (hasPlaceOrProperNoun && hasQuotedActor);
}

function openingOverlapsHeadline(title: string, opening: string) {
  const titleSet = new Set(titleTokens(title));
  const openingSet = new Set(titleTokens(opening));
  const overlap = [...openingSet].filter((token) => titleSet.has(token)).length;
  const ratio = overlap / Math.max(1, titleSet.size);
  const freshDetailCount = [...openingSet].filter((token) => !titleSet.has(token)).length;
  return ratio > 0.82 && freshDetailCount < 3;
}

function ledeMatchesStory(packet: StoryPacket, opening: string) {
  const lower = opening.toLowerCase();
  const expected = new Set<string>([
    ...titleTokens(packet.title).slice(0, 8),
    ...packet.tags.map((tag) => tag.toLowerCase().replace(/-/g, ' ')).flatMap((tag) => tag.split(/[^a-z0-9]+/)).filter((token) => token.length > 2),
    ...packet.regions.map((region) => region.toLowerCase().split(/[^a-z0-9]+/)).flat(),
    ...titleTokens(packet.connection || '').slice(0, 6),
    ...((packet.articleSignals?.mainActors || []).flatMap((actor) => actor.toLowerCase().split(/[^a-z0-9]+/))),
  ].filter((token) => token && token.length > 2 && !OPENING_STOPWORDS.has(token)));
  const matches = [...expected].filter((token) => lower.includes(token)).length;
  if (packet.title.toLowerCase().includes('strait of hormuz')) return lower.includes('hormuz');
  return matches >= 1;
}

function splitBodyParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function countConcreteAnchors(text: string) {
  let score = 0;
  if (/\b\d+(?:\.\d+)?(?:bn|m|%| million| billion)?\b/i.test(text)) score += 1;
  if (/\b(?:port|clinic|hospital|school|camp|court|factory|mine|dam|bridge|airport|pipeline|district|province|town|village|route|corridor|border)\b/i.test(text)) score += 1;
  if (/\b(?:imf|who|eu|uk|us|china|india|iran|sudan|chad|israel|gaza|taiwan|africa|europe)\b/i.test(text)) score += 1;
  if (/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/.test(text)) score += 1;
  return score;
}

function firstMeaningfulTokens(text: string, max = 14): string[] {
  return titleTokens(text).filter((token) => !OPENING_STOPWORDS.has(token)).slice(0, max);
}

function distinctOpeningScore(packet: StoryPacket, opening: string) {
  const titleSet = new Set(firstMeaningfulTokens(packet.title, 12));
  const openingTokens = firstMeaningfulTokens(opening, 18);
  const fresh = openingTokens.filter((token) => !titleSet.has(token));
  let score = fresh.length;
  if (packet.articleSignals?.keyNumber && opening.toLowerCase().includes(packet.articleSignals.keyNumber.toLowerCase())) score += 2;
  if (packet.articleSignals?.primaryLocation && opening.toLowerCase().includes(packet.articleSignals.primaryLocation.toLowerCase())) score += 1.5;
  if (packet.articleSignals?.mainActors?.some((actor) => actor && opening.includes(actor))) score += 1.5;
  return score;
}

function expectedParagraphRange(form: StoryPacket['articleForm']) {
  switch (form) {
    case 'numbers-watch':
    case 'system-shift':
    case 'turning-point':
    case 'offbeat-signal':
      return { min: 6, max: 9, idealMin: 7, idealMax: 8 };
    case 'human-ground':
    case 'framing-map':
      return { min: 5, max: 9, idealMin: 6, idealMax: 8 };
    default:
      return { min: 5, max: 9, idealMin: 6, idealMax: 8 };
  }
}

function salvageDraft(packet: StoryPacket, body: string, diagnostics?: { wordCount: number; paragraphs: number; avgParagraphWords: number }) {
  let paragraphs = splitBodyParagraphs(body);

  if (diagnostics?.wordCount !== undefined && diagnostics.wordCount < TARGET_WORD_COUNT) {
    const addContext = buildContextParagraph(packet);
    const addWatch = buildWhatToWatchParagraph(packet);
    if (!paragraphs.some((paragraph) => paragraph === addContext)) {
      const insertAt = Math.max(2, paragraphs.length - 1);
      paragraphs.splice(insertAt, 0, addContext);
    }
    if (!paragraphs.some((paragraph) => paragraph === addWatch)) {
      paragraphs.splice(Math.max(3, paragraphs.length - 1), 0, addWatch);
    }
  }

  if (paragraphs.length > 0 && paragraphs[0].split(/\s+/).filter(Boolean).length < 18) {
    const second = paragraphs[1];
    if (second) {
      paragraphs[0] = `${paragraphs[0]} ${second}`.replace(/\s+/g, ' ').trim();
      paragraphs.splice(1, 1);
    }
  }

  if (paragraphs.length >= 2) {
    const last = paragraphs[paragraphs.length - 1];
    const prev = paragraphs[paragraphs.length - 2];
    if (last.split(/\s+/).filter(Boolean).length < 18 && prev.split(/\s+/).filter(Boolean).length < 95) {
      paragraphs[paragraphs.length - 2] = `${prev} ${last}`.replace(/\s+/g, ' ').trim();
      paragraphs.pop();
    }
  }

  return paragraphs.join('\n\n');
}

function assessArticleQuality(packet: StoryPacket, body: string) {
  const opening = (splitBodyParagraphs(body)[0] || '').trim();
  const paragraphs = splitBodyParagraphs(body);
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  const banned = containsBannedPhrases(body);
  const range = expectedParagraphRange(packet.articleForm);
  const avgParagraphWords = paragraphs.length
    ? paragraphs.reduce((sum, paragraph) => sum + paragraph.split(/\s+/).filter(Boolean).length, 0) / paragraphs.length
    : 0;
  const oversizedParagraphs = paragraphs.filter((paragraph) => paragraph.split(/\s+/).filter(Boolean).length > 125).length;
  const weakParagraphs = paragraphs.filter((paragraph) => paragraph.split(/\s+/).filter(Boolean).length < 16).length;
  const earlyWindow = paragraphs.slice(0, 2).join(' ');
  const distinctOpening = distinctOpeningScore(packet, opening);
  const earlyConcreteAnchors = countConcreteAnchors(earlyWindow);
  const bodyConcreteAnchors = countConcreteAnchors(body);
  const mentionsMechanism = packet.articleSignals?.mechanism && packet.articleSignals.mechanism !== 'state change with second-order effects'
    ? body.toLowerCase().includes(packet.articleSignals.mechanism.toLowerCase().split(' ')[0] || '')
    : true;
  const concreteOpening = hasConcreteOpening(body);
  const openingTooClose = openingOverlapsHeadline(packet.title, opening);
  const storyMatch = ledeMatchesStory(packet, opening);

  if (banned.length) return { ok: false, reason: `Draft contains banned phrases: ${banned.join(', ')}` };
  if (wordCount < MIN_WORD_COUNT) return { ok: false, reason: `Draft below minimum word count (${wordCount} < ${MIN_WORD_COUNT})` };
  if (paragraphs.length < range.min) return { ok: false, reason: `Draft too thin for ${packet.articleForm} (${paragraphs.length} paragraphs < ${range.min})` };
  if (paragraphs.length > range.max) return { ok: false, reason: `Draft too sprawling for ${packet.articleForm} (${paragraphs.length} paragraphs > ${range.max})` };
  if (bodyConcreteAnchors < 2) return { ok: false, reason: 'Draft lacks enough concrete anchors to sustain the article' };
  if (oversizedParagraphs > 2) return { ok: false, reason: 'Draft paragraphs are too dense for clean reading' };
  if (weakParagraphs > 2) return { ok: false, reason: 'Draft structure feels too chopped-up to read cleanly' };
  if (avgParagraphWords < 28 || avgParagraphWords > 105) return { ok: false, reason: 'Draft paragraph sizing is off for the intended article form' };
  if (!mentionsMechanism && wordCount < TARGET_WORD_COUNT) return { ok: false, reason: 'Draft never clearly explains the mechanism driving the story' };
  if (!storyMatch && bodyConcreteAnchors < 3) return { ok: false, reason: 'Draft lede does not match its own story' };
  if (openingTooClose && distinctOpening < 2) return { ok: false, reason: 'Draft opening overlaps too closely with headline' };
  if (!concreteOpening && earlyConcreteAnchors < 2) return { ok: false, reason: 'Draft opening is not concrete enough' };

  let gateScore = 0;
  if (concreteOpening) gateScore += 2;
  else if (earlyConcreteAnchors >= 2) gateScore += 1;
  if (storyMatch) gateScore += 2;
  if (!openingTooClose) gateScore += 1;
  if (distinctOpening >= 3) gateScore += 2;
  else if (distinctOpening >= 2) gateScore += 1;
  if (earlyConcreteAnchors >= 2) gateScore += 2;
  else if (earlyConcreteAnchors >= 1) gateScore += 1;
  if (bodyConcreteAnchors >= 4) gateScore += 2;
  else if (bodyConcreteAnchors >= 3) gateScore += 1;
  if (wordCount >= TARGET_WORD_COUNT) gateScore += 2;
  else if (wordCount >= 440) gateScore += 1;
  if (paragraphs.length >= range.idealMin && paragraphs.length <= range.idealMax) gateScore += 1;
  if (avgParagraphWords >= 32 && avgParagraphWords <= 95) gateScore += 1;
  if (mentionsMechanism) gateScore += 1;

  if (gateScore < 7) return { ok: false, reason: `Draft quality score too low (${gateScore})` };

  return {
    ok: true,
    diagnostics: {
      wordCount,
      paragraphs: paragraphs.length,
      avgParagraphWords: Number(avgParagraphWords.toFixed(1)),
      distinctOpening,
      earlyConcreteAnchors,
      bodyConcreteAnchors,
      gateScore,
    },
  };
}

async function buildArticle(selection: PublicStorySelection, date: string, usedImages: Set<string>): Promise<BuiltArticle> {
  const item = selection.item as ScanItem;
  const packet = buildStoryPacket(item, selection);
  const built = buildPlannedArticleBody(packet);
  let opening = built.lede.trim();
  let body = built.body;
  const research = await buildPublicArticleResearchPacket({
    title: packet.title,
    category: packet.category,
    connection: packet.connection,
    tags: packet.tags,
    regions: packet.regions,
  });
  const requireResearch = process.env.ALBIS_REQUIRE_PUBLIC_RESEARCHED_ARTICLES === 'true' && research.priority_section;
  if (requireResearch && !research.source_depth_valid) {
    throw new Error(`Public article research too thin (${research.distinct_url_count} distinct URL(s), ${research.distinct_domain_count} distinct domain(s)); refusing title/snippet-only article`);
  }
  const editorial = await runPublicArticleEditorialWriter({
    packet: { ...packet, storyPlan: built.plan },
    currentDraft: body,
    research,
  });
  if (editorial.blocked && process.env.ALBIS_REQUIRE_PUBLIC_ARTICLE_EDITORIAL_WRITER === 'true') {
    throw new Error(`Public article editorial writer blocked: ${editorial.blocked_reason || 'unknown'}`);
  }
  if (editorial.edited && editorial.body) {
    body = editorial.body;
    opening = (splitBodyParagraphs(body)[0] || opening).trim();
    if (editorial.title) packet.title = editorial.title;
    if (editorial.description) packet.connection = editorial.description;
  }
  let quality = assessArticleQuality(packet, body);
  if (!quality.ok) {
    body = salvageDraft(packet, body, {
      wordCount: body.trim().split(/\s+/).filter(Boolean).length,
      paragraphs: splitBodyParagraphs(body).length,
      avgParagraphWords: (() => {
        const paragraphs = splitBodyParagraphs(body);
        return paragraphs.length
          ? paragraphs.reduce((sum, paragraph) => sum + paragraph.split(/\s+/).filter(Boolean).length, 0) / paragraphs.length
          : 0;
      })(),
    });
    quality = assessArticleQuality(packet, body);
  }
  if (!quality.ok) throw new Error(quality.reason);
  const wordCount = quality.diagnostics.wordCount;
  const image = await chooseUniqueImage(item, packet.slug, packet.category, usedImages);
  const excerpt = packet.connection || packet.title;
  const doctrine = packet.doctrineLane ? getPublicDoctrineLaneSpec(packet.doctrineLane) : null;
  const frontmatter = {
    title: packet.title,
    description: excerpt,
    date: `${date}T21:59:00+12:00`,
    category: packet.category,
    tags: packet.tags,
    image,
    excerpt,
    author: 'Albis',
    article_form: packet.articleForm,
    public_doctrine_version: PUBLIC_EDITORIAL_DOCTRINE_VERSION,
    public_doctrine_lane: packet.doctrineLane,
    public_doctrine_label: doctrine?.label || null,
    public_doctrine_behavior: doctrine?.articleBehavior || null,
    article_opportunity: packet.articleOpportunity,
    article_signals: packet.articleSignals,
    story_plan: built.plan,
    story_draft_path: built.draftPath,
    story_draft_form: built.draftForm,
    researched_article_layer: {
      enabled: research.enabled,
      query: research.query,
      source_count: research.sources.length,
      fetched_source_count: research.sources.filter((source) => source.fetched).length,
      distinct_url_count: research.distinct_url_count,
      distinct_domain_count: research.distinct_domain_count,
      source_depth_valid: research.source_depth_valid,
      priority_section: research.priority_section,
      sources: research.sources.map((source) => ({ title: source.title, url: source.url, domain: source.domain, fetched: source.fetched })),
      warnings: research.warnings,
    },
    public_editorial_writer: {
      enabled: editorial.enabled,
      edited: editorial.edited,
      blocked: editorial.blocked,
      blocked_reason: editorial.blocked_reason || null,
      model_used: editorial.model_used || null,
      warnings: editorial.warnings,
    },
    source_note: editorial.source_note || null,
  };
  const markdown = matter.stringify(body, frontmatter);
  return {
    slug: packet.slug,
    title: packet.title,
    description: excerpt,
    date,
    category: packet.category,
    tags: packet.tags,
    image,
    excerpt,
    author: 'Albis',
    content: body,
    markdown,
    reading_time: `${Math.ceil(readingTime(body).minutes)} min read`,
    frontmatter,
    wordCount,
    opening,
    research,
  };
}

async function buildArticles(items: ScanItem[], date: string) {
  const targetArticleCount = suggestPublicArticleCount(items, MIN_ARTICLE_COUNT, MAX_ARTICLE_COUNT);
  const candidates = selectPublicStories(items, targetArticleCount, CANDIDATE_LIMIT);
  const usedImages = await getRecentImageIdentities();
  const selected: BuiltArticle[] = [];
  const seenSlugs = new Set<string>();

  console.log(`ℹ️ Public selector requested ${targetArticleCount} article slot(s) from ${candidates.length} shortlisted candidate(s)`);
  for (const candidate of candidates) {
    if (selected.length >= targetArticleCount) break;
    const item = candidate.item;
    const slug = `${slugify(item.headline)}-2026`;
    if (seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);
    try {
      const article = await buildArticle(candidate, date, usedImages);
      selected.push(article);
      console.log(`✅ Built article ${article.slug} (${article.wordCount} words) [${candidate.categoryKey} | ${candidate.doctrineLane} | ${candidate.articleForm} | writeability ${candidate.writeabilityScore.toFixed(2)} | draft ${(article.frontmatter.story_draft_path as string) || 'legacy'} | ${candidate.why.join(', ')}]`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`↷ Skipped ${slug}: ${message}`);
    }
  }

  if (selected.length === 0) fail('No article candidates passed the quality gate');
  if (selected.length < MIN_ARTICLE_COUNT) {
    console.log(`⚠️ Only ${selected.length} article(s) passed the quality gate; selector targeted ${targetArticleCount}, but drafting quality blocked the rest`);
  } else if (selected.length < targetArticleCount) {
    console.log(`⚠️ Published ${selected.length} article(s) instead of ${targetArticleCount} after quality checks; keeping quality over filler`);
  }
  return selected;
}

function writeArticlesLocally(articles: BuiltArticle[]) {
  const blogDir = path.resolve(process.cwd(), 'content/blog');
  for (const article of articles) {
    const fullPath = path.join(blogDir, `${article.slug}.md`);
    fs.writeFileSync(fullPath, article.markdown);
    console.log(`✅ Wrote backup article ${path.basename(fullPath)}`);
  }
}

async function ingestArticles(articles: BuiltArticle[]) {
  for (const article of articles) {
    const row = {
      slug: article.slug,
      title: article.title,
      description: article.description ?? null,
      date: article.date,
      category: article.category,
      tags: article.tags,
      keywords: article.tags,
      image: article.image ?? null,
      excerpt: article.excerpt ?? null,
      author: article.author ?? null,
      content: article.content,
      reading_time: (() => {
        const match = String(article.reading_time || '').match(/\d+/);
        return match ? parseInt(match[0], 10) : null;
      })(),
      published_at: new Date().toISOString(),
      frontmatter: article.frontmatter || {},
    };

    const { error } = await supabase
      .from('articles')
      .upsert(row, { onConflict: 'slug' });

    if (error) fail(`Article ingest failed for ${article.slug}: ${error.message}`);
    console.log(`✅ Ingested article ${article.slug} directly into Supabase`);
  }
}

async function verifyArticles(articles: BuiltArticle[]) {
  const slugs = articles.map((a) => a.slug);
  const { data, error } = await supabase.from('articles').select('slug,title,image,content').in('slug', slugs);
  if (error) fail(`Article verify failed: ${error.message}`);
  if (!data || data.length !== slugs.length) fail(`Expected ${slugs.length} articles in Supabase, found ${data?.length || 0}`);
  for (const row of data as any[]) {
    const content = String(row.content || '');
    const opening = (content.split(/\n\n/)[0] || '').trim();
    const packet = {
      title: String(row.title || ''),
      articleForm: 'turning-point',
      tags: [],
      regions: [],
      articleSignals: { mechanism: 'state change with second-order effects', keyNumber: null, mainActors: [], primaryLocation: null },
    } as StoryPacket;
    const quality = assessArticleQuality(packet, content);
    if (!quality.ok) fail(`Verified article ${row.slug} failed quality gate: ${quality.reason}`);
  }
  console.log(`✅ Verified ${data.length} article row(s) in Supabase for distinct openings, concrete specificity, readable structure, and minimum length`);
}


function toEditionArticleEntry(article: BuiltArticle): PublicEditionArticleEntry {
  return {
    headline: article.title,
    doctrineLane: (article.frontmatter.public_doctrine_lane as PublicDoctrineLane | null) || null,
    articleForm: (article.frontmatter.article_form as ArticleForm | null) || null,
  };
}

function logCodeChangeStatus() {
  const status = spawnSync('git', ['status', '--porcelain'], { cwd: process.cwd(), env: process.env, encoding: 'utf8' });
  const changed = (status.stdout || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !l.includes('content/blog/'));
  if (!changed.length) {
    console.log('ℹ️ No code changes pending');
    return;
  }
  console.log('ℹ️ Code changes detected locally but will not be auto-committed by the article pipeline:');
  for (const line of changed) console.log(`   ${line}`);
}

async function requireSnapshotBriefingForDate(date: string) {
  const { data, error } = await supabase
    .from('site_snapshot')
    .select('briefing_date, briefing_title, briefing_top_stories')
    .eq('id', 1)
    .single();
  if (error) fail(`Snapshot briefing verify failed: ${error.message}`);
  if (!data || data.briefing_date !== date) fail(`Snapshot briefing_date not updated to ${date}`);
  if (!data.briefing_title) fail(`Snapshot briefing_title missing for ${date}`);
  if (!Array.isArray(data.briefing_top_stories) || data.briefing_top_stories.length === 0) {
    fail(`Snapshot briefing_top_stories missing for ${date}`);
  }
}

async function main() {
  const { date, period, skipBriefing } = parseArgs();
  console.log('Implementation checklist:');
  console.log('1. Build story packet from scan JSON');
  console.log('2. Extract actor, action, object, location, consequence');
  console.log('3. Generate factual actor-action-detail lede from that article only');
  console.log('4. Use flexible paragraph order driven by the content');
  console.log('5. Enforce banned phrase filter and concrete opening check');
  console.log('6. Enforce low headline-overlap in the opening sentence');
  console.log('7. Reject any lede that does not match its own story');
  console.log(`8. Enforce minimum article length of ${MIN_WORD_COUNT} words (target ${TARGET_WORD_COUNT}+ when possible)`);
  console.log(`9. Inspect top ${CANDIDATE_LIMIT} scan candidates to fill a dynamic ${MIN_ARTICLE_COUNT}-${MAX_ARTICLE_COUNT} public-article window`);
  console.log('10. Keep unique image selection with recent-archive dedupe and Picsum fallback');

  const scanPath = path.resolve(process.cwd(), `../memory/scans/${date}-${period}.md`);
  console.log(`🚀 Starting post-scan pipeline for ${date} ${period}`);
  const md = readScanFile(scanPath);
  const fileItems = extractItems(md);
  console.log(`✅ File check passed for ${path.basename(scanPath)} with ${fileItems.length} extracted items`);

  for (const candidatePeriod of availableDatePeriods(date)) {
    run('node', ['scripts/push-scan-to-supabase.js', `${date}-${candidatePeriod}`]);
  }
  const scanRows = await requireScanRows(supabase, date, period);
  const mirroredCount = await requireScanItemsAvailability(supabase, scanRows);
  console.log(`✅ Verified scans row and ${mirroredCount} mirrored scan_items rows for ${date} ${period}`);

  for (const candidatePeriod of availableDatePeriods(date)) {
    runScoreForPeriod(date, candidatePeriod);
  }
  const scoreStatus = await requireStoryScores(supabase, date, period);
  console.log(`✅ Verified PGI/GAI rows for ${date} ${period} (${scoreStatus.pgiCount} PGI, ${scoreStatus.gaiCount} GAI)`);

  run('npx', ['tsx', 'scripts/aggregate-index-dailies.ts', date]);
  const dailyStatus = await requireIndexDailyRows(supabase, date);
  console.log(`✅ Verified pgi_daily=${dailyStatus.pgi.daily_pgi} and gai_daily=${dailyStatus.gai.daily_gai} for ${date}`);

  const shouldRunLiveBriefing = period === 'am' && !skipBriefing;

  if (shouldRunLiveBriefing) {
    console.log('ℹ️ AM pipeline owns the subscriber daily briefing send after DB verification.');
  } else {
    runOptional('npx', ['tsx', 'scripts/run-daily-briefing-pipeline.ts', date, '--dry-run'], process.cwd(), 'daily briefing preflight');
  }

  const items = await loadVerifiedScanItems(supabase, date, period);
  console.log(`✅ Loaded ${items.length} verified scan items from DB truth for article generation`);

  const articles = await buildArticles(items, date);
  console.log(`✅ ${articles.length} candidate(s) passed the gate`);

  const articleEntries = articles.map((article) => toEditionArticleEntry(article));
  const editionScorecard = buildDailyBriefingPackage(
    date,
    items,
    articleEntries,
  ).scorecard;
  const editionReport = buildPublicEditionRunReport({
    date,
    source: 'post-scan',
    scorecard: editionScorecard,
    articleEntries,
    runId: `post-scan-${date}-${period}-${Date.now()}`,
  });
  for (const article of articles) {
    article.frontmatter.public_edition_scorecard_version = editionScorecard.version;
    article.frontmatter.public_edition_scorecard_summary = editionScorecard.summary;
    article.frontmatter.public_edition_scorecard = editionScorecard;
    article.frontmatter.public_edition_run_report_version = editionReport.version;
    article.frontmatter.public_edition_run_report_status = editionReport.status;
    article.frontmatter.public_edition_run_report = editionReport;
  }
  console.log(`📊 ${formatPublicEditionRunReportLine(editionReport)}`);
  for (const metric of editionScorecard.metrics) {
    console.log(`   - ${metric.label}: ${metric.summary} [${metric.status}]`);
  }
  for (const warning of editionReport.warnings) console.log(`   ⚠️ ${warning}`);
  try {
    const files = await writePublicEditionRunReport(editionReport);
    console.log(`🧾 Edition QA report: ${path.relative(process.cwd(), files.dateLatestFile)}`);
  } catch (err) {
    console.warn(`⚠️ Edition QA report artifact skipped: ${err instanceof Error ? err.message : String(err)}`);
  }

  writeArticlesLocally(articles);
  await ingestArticles(articles);
  await verifyArticles(articles);

  if (shouldRunLiveBriefing) {
    run('npx', ['tsx', 'scripts/run-daily-briefing-pipeline.ts', date]);
    console.log(`✅ Verified daily briefing pipeline completed under AM owner flow for ${date}`);
  }

  // Keep this AFTER the AM briefing job. The homepage reads the precomputed
  // site_snapshot singleton; if we snapshot before the briefing row exists or
  // refreshes, the public site can show scan/articles while the briefing taster
  // disappears until a manual snapshot repair.
  run('npx', ['tsx', 'scripts/write-site-snapshot.ts', date]);
  await requireSnapshotForDate(supabase, date);
  if (shouldRunLiveBriefing) await requireSnapshotBriefingForDate(date);
  console.log(`✅ Verified site_snapshot updated for scan_date=${date}`);

  console.log('Published articles summary:');
  for (const article of articles) {
    console.log(`- ${article.slug} | ${article.wordCount} words | ${article.image}`);
    console.log(`  Opening: ${article.opening}`);
  }

  logCodeChangeStatus();
  console.log('🎉 Post-scan pipeline completed successfully');
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
