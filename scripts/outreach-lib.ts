#!/usr/bin/env tsx
// @ts-nocheck
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Resend } from 'resend';

export type Bucket = 'uk-eu' | 'us-east' | 'us-west-global';
export type Group = 'pending' | 'sent' | 'do-not-contact';
export type Status = 'intake' | 'verified' | 'pending' | 'sent' | 'blocked' | 'rejected';

export type Contact = {
  email: string;
  name: string;
  segment: string;
  region: string;
  dateSent: string;
  followUp: string;
  response: string;
  notes: string;
  sourceUrl: string;
  dateAdded: string;
  status: Status;
  provenance: string;
  attempts: number;
  lastAttemptAt: string;
  lastError: string;
  failureReason: string;
  group: Group;
  batchLabel: string;
  order: number;
};

export type TrackerState = {
  contacts: Contact[];
  sourcePath: string;
};

export type MetaState = Record<string, Partial<Contact>>;

export type SendResult = {
  email: string;
  name: string;
  ok: boolean;
  resendId?: string | null;
  error?: string | null;
};

export type ValidationResult = {
  ok: boolean;
  reasons: string[];
  reasonCodes: string[];
  warnings: string[];
  structuredFields: Record<string, boolean>;
  qualitySignals: {
    hasAnglePrefix: boolean;
    notesLength: number;
    hasUrl: boolean;
    hasMeaningfulAngleText: boolean;
    hasDateAdded: boolean;
    hasSourceUrlField: boolean;
    hasProvenance: boolean;
  };
};

export type DailyPlan = {
  date: string;
  targetFloor: number;
  targetCeiling: number;
  targetPerBucket: number;
  selected: Contact[];
  selectedByBucket: Record<Bucket, Contact[]>;
  rawPendingByBucket: Record<Bucket, number>;
  eligibleByBucket: Record<Bucket, number>;
  bucketShortagesToTarget: Record<Bucket, number>;
  overflowUsedByBucket: Record<Bucket, number>;
  rejected: Array<{ contact: Contact; validation: ValidationResult; bucket: Bucket }>;
  blockedByBucket: Record<Bucket, number>;
  totals: {
    rawPending: number;
    qualityEligible: number;
    selected: number;
    rejected: number;
    blocked: number;
    metFloor: boolean;
    hitCeiling: boolean;
    shortageToFloor: number;
    headroomToCeiling: number;
  };
  notes: string[];
};

export const WORKSPACE_ROOT = path.resolve(process.cwd(), '..');
export const MEMORY_DIR = path.join(WORKSPACE_ROOT, 'memory');
export const CONTACTS_PATH = path.join(MEMORY_DIR, 'outreach-contacts.md');
export const SENT_ARCHIVE_PATH = path.join(MEMORY_DIR, 'outreach-contacts-sent.md');
export const META_PATH = path.join(MEMORY_DIR, 'outreach-contacts-meta.json');
export const LOG_PATH = path.join(MEMORY_DIR, 'outreach-log.md');
export const REPORT_DIR = path.join(MEMORY_DIR, 'outreach-reports');
export const FROM_ADDRESS = 'Harry <harry@albis.news>';
export const DAILY_FLOOR = 100;
export const DAILY_CEILING = 150;
export const DEFAULT_BUCKET_TARGET = 50;

export const BUCKETS: Record<Bucket, { quota: number; title: string }> = {
  'uk-eu': { quota: DEFAULT_BUCKET_TARGET, title: 'UK/Europe' },
  'us-east': { quota: DEFAULT_BUCKET_TARGET, title: 'US East' },
  'us-west-global': { quota: DEFAULT_BUCKET_TARGET, title: 'US West/Global' },
};

export function ensureEnvLoaded() {
  const envCandidates = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '../.env.credentials'),
    path.resolve(process.cwd(), '../../.env.credentials'),
    path.resolve(process.env.HOME || '', '.openclaw/workspace/.env.credentials'),
  ];
  for (const candidate of envCandidates) {
    if (candidate && fs.existsSync(candidate)) {
      dotenv.config({ path: candidate, override: false });
    }
  }
}

export function ensureDirs() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

export function getDateArg() {
  const explicit = process.argv.find((arg) => /^\d{4}-\d{2}-\d{2}$/.test(arg));
  if (explicit) return explicit;
  const viaFlag = readFlag('--date');
  if (viaFlag) return viaFlag;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Pacific/Auckland',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function readFlag(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

export function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

export function normalizeEmail(value: string): string {
  return String(value || '').trim().toLowerCase();
}

function parseTableRow(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || trimmed.startsWith('|---')) return null;
  const parts = trimmed.split('|').slice(1, -1).map((part) => part.trim());
  if (parts.length < 8) return null;
  if (parts[0].toLowerCase() === 'email') return null;
  return parts.slice(0, 8);
}

function parseLegacyMetadataFromNotes(notes: string) {
  const value = String(notes || '').trim();
  const parts = value.split(/\s*;;\s*/).map((part) => part.trim()).filter(Boolean);
  const metadata: Record<string, string> = {};
  const bodyParts: string[] = [];

  for (const part of parts) {
    const match = part.match(/^(source|source_url|url|date_added|added|status|provenance|attempts|last_attempt_at|last_error|failure_reason):\s*(.+)$/i);
    if (match) {
      const key = match[1].toLowerCase();
      const val = match[2].trim();
      if (key === 'source' || key === 'source_url' || key === 'url') metadata.sourceUrl = val;
      else if (key === 'date_added' || key === 'added') metadata.dateAdded = val;
      else if (key === 'status') metadata.status = val.toLowerCase();
      else if (key === 'provenance') metadata.provenance = val;
      else if (key === 'attempts') metadata.attempts = val;
      else if (key === 'last_attempt_at') metadata.lastAttemptAt = val;
      else if (key === 'last_error') metadata.lastError = val;
      else if (key === 'failure_reason') metadata.failureReason = val;
    } else {
      bodyParts.push(part);
    }
  }

  if (!metadata.sourceUrl) {
    const inlineUrl = value.match(/https?:\/\/\S+/i)?.[0] || '';
    if (inlineUrl) metadata.sourceUrl = inlineUrl;
  }

  return {
    body: bodyParts.length ? bodyParts.join(' ;; ') : value,
    sourceUrl: metadata.sourceUrl || '',
    dateAdded: metadata.dateAdded || '',
    status: normalizeStatus(metadata.status || ''),
    provenance: metadata.provenance || '',
    attempts: Number(metadata.attempts || 0),
    lastAttemptAt: metadata.lastAttemptAt || '',
    lastError: metadata.lastError || '',
    failureReason: metadata.failureReason || '',
  };
}

function inferDateFromBatchLabel(label: string) {
  const match = String(label || '').match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})/i);
  if (!match) return '';
  const months: Record<string, string> = { january: '01', february: '02', march: '03', april: '04', may: '05', june: '06', july: '07', august: '08', september: '09', october: '10', november: '11', december: '12' };
  const month = months[match[1].toLowerCase()] || '01';
  const day = match[2].padStart(2, '0');
  return `${match[3]}-${month}-${day}`;
}

function normalizeStatus(value: string): Status {
  const v = String(value || '').trim().toLowerCase();
  if (['intake', 'verified', 'pending', 'sent', 'blocked', 'rejected'].includes(v)) return v as Status;
  return 'pending';
}

function inferStatus(group: Group, response: string): Status {
  if (group === 'do-not-contact') return 'blocked';
  if (group === 'sent') return 'sent';
  const r = String(response || '').toLowerCase();
  if (r.includes('duplicate') || r.includes('skip') || r.includes('stop') || r.includes('blocked')) return 'blocked';
  return 'pending';
}

function inferProvenance(batchLabel: string, notes: string) {
  const label = String(batchLabel || '').trim();
  if (/research/i.test(label)) return 'researched-public-source';
  if (/batch/i.test(label)) return 'legacy-batch-import';
  if (/https?:\/\//i.test(notes)) return 'url-in-notes';
  return 'legacy-import';
}

function parseMarkdownContacts(filePath: string): TrackerState {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  let group: Group = 'pending';
  let batchLabel = '';
  let order = 0;
  const contacts: Contact[] = [];

  for (const line of lines) {
    if (/^##\s+Pending/i.test(line)) {
      group = 'pending';
      batchLabel = '';
      continue;
    }
    if (/^##\s+Sent/i.test(line)) {
      group = 'sent';
      batchLabel = '';
      continue;
    }
    if (/^##\s+Do Not Contact/i.test(line)) {
      group = 'do-not-contact';
      batchLabel = '';
      continue;
    }
    if (/^###\s+/.test(line)) {
      batchLabel = line.replace(/^###\s+/, '').trim();
      continue;
    }
    const row = parseTableRow(line);
    if (!row) continue;

    const [email, name, segment, region, dateSent, followUp, response, notes] = row;
    const legacy = parseLegacyMetadataFromNotes(notes);
    contacts.push({
      email: email.trim(),
      name: name.trim(),
      segment: segment.trim(),
      region: region.trim(),
      dateSent: dateSent.trim(),
      followUp: followUp.trim(),
      response: response.trim(),
      notes: legacy.body.trim(),
      sourceUrl: legacy.sourceUrl,
      dateAdded: legacy.dateAdded || inferDateFromBatchLabel(batchLabel) || (dateSent && dateSent !== '—' ? dateSent : ''),
      status: legacy.status || inferStatus(group, response),
      provenance: legacy.provenance || inferProvenance(batchLabel, notes),
      attempts: legacy.attempts || 0,
      lastAttemptAt: legacy.lastAttemptAt || '',
      lastError: legacy.lastError || '',
      failureReason: legacy.failureReason || '',
      group,
      batchLabel,
      order: order++,
    });
  }

  return { contacts, sourcePath: filePath };
}

function loadMetaState(): MetaState {
  if (!fs.existsSync(META_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(META_PATH, 'utf8')) || {};
  } catch {
    return {};
  }
}

function writeAtomic(filePath: string, content: string) {
  const tmp = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, filePath);
}

function writeAtomicJson(filePath: string, payload: any) {
  writeAtomic(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function buildMetaState(contacts: Contact[]): MetaState {
  const meta: MetaState = {};
  for (const c of contacts) {
    const email = normalizeEmail(c.email);
    if (!email) continue;
    meta[email] = {
      sourceUrl: c.sourceUrl || '',
      dateAdded: c.dateAdded || '',
      status: c.status || 'pending',
      provenance: c.provenance || '',
      attempts: Number(c.attempts || 0),
      lastAttemptAt: c.lastAttemptAt || '',
      lastError: c.lastError || '',
      failureReason: c.failureReason || '',
      batchLabel: c.batchLabel || '',
      order: Number(c.order || 0),
      group: c.group || 'pending',
    };
  }
  return meta;
}

function mergeWithMeta(state: TrackerState, meta: MetaState) {
  for (const c of state.contacts) {
    const email = normalizeEmail(c.email);
    const m = meta[email];
    if (!m) continue;
    c.sourceUrl = m.sourceUrl || c.sourceUrl || '';
    c.dateAdded = m.dateAdded || c.dateAdded || '';
    c.status = normalizeStatus(m.status || c.status || 'pending');
    c.provenance = m.provenance || c.provenance || '';
    c.attempts = Number(m.attempts ?? c.attempts ?? 0);
    c.lastAttemptAt = m.lastAttemptAt || c.lastAttemptAt || '';
    c.lastError = m.lastError || c.lastError || '';
    c.failureReason = m.failureReason || c.failureReason || '';
    c.batchLabel = m.batchLabel || c.batchLabel || '';
    c.order = Number(m.order ?? c.order ?? 0);
    c.group = (m.group as Group) || c.group || 'pending';
  }
  return state;
}

export function loadTracker(which: 'current' | 'archive' = 'current'): TrackerState {
  const base = parseMarkdownContacts(which === 'current' ? CONTACTS_PATH : SENT_ARCHIVE_PATH);
  const meta = loadMetaState();
  return mergeWithMeta(base, meta);
}

export function loadBothTrackers() {
  return {
    current: loadTracker('current'),
    archive: loadTracker('archive'),
  };
}

export function writeTracker(current: TrackerState, archive?: TrackerState) {
  const currentContent = renderContactsFile(current.contacts);
  const currentMeta = buildMetaState(current.contacts);
  let mergedMeta = { ...currentMeta };

  if (archive) {
    const archiveContent = renderArchiveFile(archive.contacts);
    const archiveMeta = buildMetaState(archive.contacts);
    mergedMeta = { ...archiveMeta, ...mergedMeta };
    writeAtomic(SENT_ARCHIVE_PATH, archiveContent);
  }

  writeAtomic(CONTACTS_PATH, currentContent);
  writeAtomicJson(META_PATH, mergedMeta);
}

export function migrateLegacyMetadataToSidecar() {
  const current = parseMarkdownContacts(CONTACTS_PATH);
  const archive = parseMarkdownContacts(SENT_ARCHIVE_PATH);
  writeTracker(current, archive);
  return { currentRows: current.contacts.length, archiveRows: archive.contacts.length };
}

export function getBucketForRegion(region: string): Bucket {
  if (isBucketMatch(region, 'uk-eu')) return 'uk-eu';
  if (isBucketMatch(region, 'us-east')) return 'us-east';
  return 'us-west-global';
}

export function isBucketMatch(region: string, bucket: Bucket): boolean {
  const value = region.toLowerCase();
  if (bucket === 'uk-eu') return value.includes('uk') || value.includes('europe') || value.includes('eu');
  if (bucket === 'us-east') return value === 'us east';
  return !(value.includes('uk') || value.includes('europe') || value.includes('eu') || value === 'us east');
}

export function buildDedupSet(states: TrackerState[]): Set<string> {
  const set = new Set<string>();
  for (const state of states) {
    for (const contact of state.contacts) {
      if (contact.group !== 'pending') {
        const email = normalizeEmail(contact.email);
        if (email) set.add(email);
      }
    }
  }
  return set;
}

export function getEligiblePendingForBucket(current: TrackerState, archive: TrackerState, bucket: Bucket) {
  return getQualifiedPendingByBucket(current, archive, bucket).eligible;
}

export function getPendingCounts(current: TrackerState) {
  const counts: Record<Bucket, number> = { 'uk-eu': 0, 'us-east': 0, 'us-west-global': 0 };
  for (const contact of current.contacts) {
    if (contact.group !== 'pending') continue;
    counts[getBucketForRegion(contact.region)] += 1;
  }
  return counts;
}

export function summarizeSegments(items: Contact[]) {
  const counts: Record<string, number> = {};
  for (const item of items) counts[item.segment] = (counts[item.segment] || 0) + 1;
  return counts;
}

export function renderSegmentSummary(summary: Record<string, number>) {
  const entries = Object.entries(summary).sort((a, b) => a[0].localeCompare(b[0]));
  return entries.length ? entries.map(([k, v]) => `${k}: ${v}`).join(', ') : 'None';
}

export function buildBatchLabel(bucket: Bucket, date: string) {
  const titles: Record<Bucket, string> = {
    'uk-eu': 'UK/Europe Batch',
    'us-east': 'US East Batch',
    'us-west-global': 'US West/Global Batch',
  };
  return `${titles[bucket]} — ${date}`;
}

export function renderContactsFile(contacts: Contact[]): string {
  const pending = contacts.filter((c) => c.group === 'pending').sort((a, b) => a.order - b.order);
  const sent = contacts.filter((c) => c.group === 'sent').sort((a, b) => a.order - b.order);
  const dnc = contacts.filter((c) => c.group === 'do-not-contact').sort((a, b) => a.order - b.order);

  const sections = [
    '# Outreach Contact Tracker',
    '',
    '## Format',
    '| Email | Name | Segment | Region | Date Sent | Follow-up | Response | Notes |',
    '|-------|------|---------|--------|-----------|-----------|----------|-------|',
    '',
    '## Pending',
    '<!-- Script-owned deterministic tracker. Pending = researched but not yet sent. -->',
    '',
    ...renderGroupedContacts(pending, 'No pending contacts.'),
    '',
    '## Sent',
    '<!-- Script moves successful sends here. -->',
    '',
    ...renderGroupedContacts(sent, 'No sent contacts recorded in this tracker.'),
    '',
    '## Do Not Contact',
    '<!-- Anyone who replied stop, bounced, complained, or should never be emailed again. -->',
    '',
    ...renderGroupedContacts(dnc, 'No blocked contacts recorded.'),
    '',
  ];

  return sections.join('\n');
}

export function renderArchiveFile(contacts: Contact[]): string {
  const lines = [
    '# Outreach Contacts — Sent Archive',
    'Contacts that have been emailed. Used for dedup checks by outreach crons.',
    '',
    '| Email | Name | Segment | Region | Date Sent | Follow-up | Response | Notes |',
    '|-------|------|---------|--------|-----------|-----------|----------|-------|',
  ];
  for (const item of contacts.sort((a, b) => a.order - b.order)) {
    lines.push(`| ${escapeCell(item.email)} | ${escapeCell(item.name)} | ${escapeCell(item.segment)} | ${escapeCell(item.region)} | ${escapeCell(item.dateSent || '—')} | ${escapeCell(item.followUp || '—')} | ${escapeCell(item.response || 'Pending')} | ${escapeCell(item.notes)} |`);
  }
  lines.push('');
  return lines.join('\n');
}

function renderGroupedContacts(contacts: Contact[], emptyMessage: string): string[] {
  if (!contacts.length) return [emptyMessage];
  const byLabel = new Map<string, Contact[]>();
  for (const contact of contacts) {
    const label = contact.batchLabel || 'Unbatched';
    if (!byLabel.has(label)) byLabel.set(label, []);
    byLabel.get(label)!.push(contact);
  }
  const lines: string[] = [];
  for (const [label, items] of byLabel.entries()) {
    lines.push(`### ${label}`);
    lines.push('');
    lines.push('| Email | Name | Segment | Region | Date Sent | Follow-up | Response | Notes |');
    lines.push('|-------|------|---------|--------|-----------|-----------|----------|-------|');
    for (const item of items) {
      lines.push(`| ${escapeCell(item.email)} | ${escapeCell(item.name)} | ${escapeCell(item.segment)} | ${escapeCell(item.region)} | ${escapeCell(item.dateSent || '—')} | ${escapeCell(item.followUp || '—')} | ${escapeCell(item.response || 'Pending')} | ${escapeCell(item.notes)} |`);
    }
    lines.push('');
  }
  return lines;
}

function escapeCell(value: string) {
  return String(value || '—').replace(/\|/g, '\\|').trim() || '—';
}

export function appendLogEntry(entry: string) {
  const existing = fs.existsSync(LOG_PATH) ? fs.readFileSync(LOG_PATH, 'utf8').trimEnd() : '# Outreach Log';
  fs.writeFileSync(LOG_PATH, `${existing}\n\n${entry.trim()}\n`, 'utf8');
}

export function reportPath(name: string, date: string) {
  ensureDirs();
  return path.join(REPORT_DIR, `${date}-${name}.json`);
}

export function saveJsonReport(name: string, date: string, payload: any) {
  const filePath = reportPath(name, date);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
  return filePath;
}

function hasLikelyName(name: string) {
  const cleaned = String(name || '').trim();
  return cleaned.length >= 2 && /[A-Za-z]/.test(cleaned) && !/^(unknown|n\/a|test)$/i.test(cleaned);
}

function hasLikelySegment(segment: string) {
  const cleaned = String(segment || '').trim();
  return cleaned.length >= 3 && !/^(unknown|other|n\/a)$/i.test(cleaned);
}

function hasLikelyRegion(region: string) {
  const cleaned = String(region || '').trim();
  return cleaned.length >= 2 && !/^(unknown|n\/a)$/i.test(cleaned);
}

function hasMeaningfulAngleText(notes: string) {
  const stripped = String(notes || '')
    .replace(/^angle:\s*/i, '')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped.length >= 35;
}

function addReason(reasons: string[], codes: string[], code: string, message: string) {
  reasons.push(message);
  codes.push(code);
}

export function validateContact(contact: Contact): ValidationResult {
  const reasons: string[] = [];
  const reasonCodes: string[] = [];
  const warnings: string[] = [];
  const email = normalizeEmail(contact.email);
  const notes = String(contact.notes || '').trim();
  const hasUrlInNotes = /https?:\/\//i.test(notes);
  const hasAnglePrefix = /^angle:/i.test(notes);
  const meaningfulAngle = hasMeaningfulAngleText(notes);
  const hasSourceUrlField = /^https?:\/\//i.test(String(contact.sourceUrl || '').trim());
  const hasDateAdded = /^\d{4}-\d{2}-\d{2}$/.test(String(contact.dateAdded || '').trim());
  const hasProvenance = String(contact.provenance || '').trim().length >= 4;

  const structuredFields = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    name: hasLikelyName(contact.name),
    segment: hasLikelySegment(contact.segment),
    region: hasLikelyRegion(contact.region),
    notes: notes.length >= 0,
    sourceUrl: hasSourceUrlField,
    dateAdded: hasDateAdded,
    provenance: hasProvenance,
  };

  if (!structuredFields.email) addReason(reasons, reasonCodes, 'invalid_email', 'invalid or missing email');
  if (!structuredFields.name) addReason(reasons, reasonCodes, 'bad_name', 'missing reasonable name');
  if (!structuredFields.segment) addReason(reasons, reasonCodes, 'bad_segment', 'missing reasonable segment');
  if (!structuredFields.region) addReason(reasons, reasonCodes, 'bad_region', 'missing reasonable region');
  if (contact.group !== 'pending') addReason(reasons, reasonCodes, 'not_pending', `contact is not pending (${contact.group})`);
  if (/\b(todo|tbd|find email|placeholder|unknown|need source|verify contact|check later)\b/i.test(notes)) warnings.push('notes contain unresolved research markers');
  if (!hasSourceUrlField) warnings.push('no first-class source URL field present');
  if (!hasDateAdded) warnings.push('no date_added metadata present');
  if (!hasProvenance) warnings.push('no provenance metadata present');
  if (!hasAnglePrefix && notes) warnings.push('notes do not use the preferred "angle:" format');
  if (hasUrlInNotes && !hasSourceUrlField) warnings.push('URL exists in notes but has not been normalized into sourceUrl metadata');
  if (contact.dateSent && contact.dateSent !== '—') warnings.push(`pending row already has dateSent=${contact.dateSent}`);
  if (contact.response && !/^(pending|—)?$/i.test(contact.response)) warnings.push(`pending row already has response=${contact.response}`);

  return {
    ok: reasons.length === 0,
    reasons,
    reasonCodes,
    warnings,
    structuredFields,
    qualitySignals: {
      hasAnglePrefix,
      notesLength: notes.length,
      hasUrl: hasUrlInNotes,
      hasMeaningfulAngleText: meaningfulAngle,
      hasDateAdded,
      hasSourceUrlField,
      hasProvenance,
    },
  };
}

export function getQualifiedPendingByBucket(current: TrackerState, archive: TrackerState, bucket: Bucket) {
  const blocked = buildDedupSet([current, archive]);
  const allPending = current.contacts
    .filter((contact) => contact.group === 'pending')
    .filter((contact) => isBucketMatch(contact.region, bucket))
    .sort((a, b) => a.order - b.order);

  const eligible: Contact[] = [];
  const rejected: Array<{ contact: Contact; validation: ValidationResult; bucket: Bucket }> = [];
  let blockedCount = 0;
  const seenPending = new Set<string>();

  for (const contact of allPending) {
    const email = normalizeEmail(contact.email);
    if (blocked.has(email)) {
      const validation = validateContact(contact);
      validation.ok = false;
      validation.reasons = [...validation.reasons, 'email already exists in sent/archive'];
      validation.reasonCodes = [...validation.reasonCodes, 'already_sent'];
      rejected.push({ contact, validation, bucket });
      blockedCount += 1;
      continue;
    }
    if (seenPending.has(email)) {
      const validation = validateContact(contact);
      validation.ok = false;
      validation.reasons = [...validation.reasons, 'duplicate email in pending tracker'];
      validation.reasonCodes = [...validation.reasonCodes, 'duplicate_pending'];
      rejected.push({ contact, validation, bucket });
      continue;
    }
    seenPending.add(email);
    const validation = validateContact(contact);
    if (validation.ok) eligible.push({ ...contact });
    else rejected.push({ contact, validation, bucket });
  }

  return { allPending, eligible, rejected, blockedCount };
}

export function planDailySend(current: TrackerState, archive: TrackerState, date: string, options?: { floor?: number; ceiling?: number; perBucketTarget?: number }): DailyPlan {
  const targetFloor = Math.max(1, Number(options?.floor || DAILY_FLOOR));
  const targetCeiling = Math.max(targetFloor, Number(options?.ceiling || DAILY_CEILING));
  const targetPerBucket = Math.max(1, Number(options?.perBucketTarget || DEFAULT_BUCKET_TARGET));
  const buckets = Object.keys(BUCKETS) as Bucket[];

  const rawPendingByBucket = { 'uk-eu': 0, 'us-east': 0, 'us-west-global': 0 } as Record<Bucket, number>;
  const eligibleByBucket = { 'uk-eu': 0, 'us-east': 0, 'us-west-global': 0 } as Record<Bucket, number>;
  const bucketShortagesToTarget = { 'uk-eu': 0, 'us-east': 0, 'us-west-global': 0 } as Record<Bucket, number>;
  const overflowUsedByBucket = { 'uk-eu': 0, 'us-east': 0, 'us-west-global': 0 } as Record<Bucket, number>;
  const blockedByBucket = { 'uk-eu': 0, 'us-east': 0, 'us-west-global': 0 } as Record<Bucket, number>;
  const selectedByBucket = { 'uk-eu': [], 'us-east': [], 'us-west-global': [] } as Record<Bucket, Contact[]>;
  const pools = new Map<Bucket, Contact[]>();
  const rejected: Array<{ contact: Contact; validation: ValidationResult; bucket: Bucket }> = [];

  for (const bucket of buckets) {
    const pool = getQualifiedPendingByBucket(current, archive, bucket);
    rawPendingByBucket[bucket] = pool.allPending.length;
    eligibleByBucket[bucket] = pool.eligible.length;
    bucketShortagesToTarget[bucket] = Math.max(0, targetPerBucket - pool.eligible.length);
    blockedByBucket[bucket] = pool.blockedCount;
    pools.set(bucket, [...pool.eligible]);
    rejected.push(...pool.rejected);
  }

  for (const bucket of buckets) {
    const pool = pools.get(bucket)!;
    const take = Math.min(targetPerBucket, pool.length);
    selectedByBucket[bucket].push(...pool.splice(0, take));
  }

  let selectedCount = buckets.reduce((sum, bucket) => sum + selectedByBucket[bucket].length, 0);

  if (selectedCount < targetFloor) {
    const bucketsByOverflow = [...buckets].sort((a, b) => (pools.get(b)!.length - pools.get(a)!.length) || a.localeCompare(b));
    while (selectedCount < targetFloor) {
      const donor = bucketsByOverflow.find((bucket) => pools.get(bucket)!.length > 0);
      if (!donor) break;
      const next = pools.get(donor)!.shift()!;
      selectedByBucket[donor].push(next);
      overflowUsedByBucket[donor] += 1;
      selectedCount += 1;
      bucketsByOverflow.sort((a, b) => (pools.get(b)!.length - pools.get(a)!.length) || a.localeCompare(b));
    }
  }

  if (selectedCount < targetCeiling) {
    const bucketsByRemaining = [...buckets].sort((a, b) => (pools.get(b)!.length - pools.get(a)!.length) || a.localeCompare(b));
    while (selectedCount < targetCeiling) {
      const donor = bucketsByRemaining.find((bucket) => pools.get(bucket)!.length > 0);
      if (!donor) break;
      const next = pools.get(donor)!.shift()!;
      selectedByBucket[donor].push(next);
      overflowUsedByBucket[donor] += 1;
      selectedCount += 1;
      bucketsByRemaining.sort((a, b) => (pools.get(b)!.length - pools.get(a)!.length) || a.localeCompare(b));
    }
  }

  const selected = buckets.flatMap((bucket) => selectedByBucket[bucket]);
  const qualityEligible = buckets.reduce((sum, bucket) => sum + eligibleByBucket[bucket], 0);
  const rawPending = buckets.reduce((sum, bucket) => sum + rawPendingByBucket[bucket], 0);
  const blocked = buckets.reduce((sum, bucket) => sum + blockedByBucket[bucket], 0);
  const metFloor = selected.length >= targetFloor;
  const hitCeiling = selected.length >= targetCeiling;

  const notes = [
    metFloor
      ? `Healthy floor met with ${selected.length} quality-qualified contacts.`
      : `Healthy floor missed by ${Math.max(0, targetFloor - selected.length)} because only ${qualityEligible} quality-qualified pending contacts were available.`,
    hitCeiling
      ? `Daily ceiling reached at ${targetCeiling}; remaining qualified contacts were intentionally held back.`
      : `Daily ceiling not reached; only ${selected.length} quality-qualified contacts were available/selected today.`,
    'Automation never lowers the quality bar or fabricates contacts to hit volume.',
  ];

  return {
    date,
    targetFloor,
    targetCeiling,
    targetPerBucket,
    selected,
    selectedByBucket,
    rawPendingByBucket,
    eligibleByBucket,
    bucketShortagesToTarget,
    overflowUsedByBucket,
    rejected,
    blockedByBucket,
    totals: {
      rawPending,
      qualityEligible,
      selected: selected.length,
      rejected: rejected.length,
      blocked,
      metFloor,
      hitCeiling,
      shortageToFloor: Math.max(0, targetFloor - selected.length),
      headroomToCeiling: Math.max(0, targetCeiling - selected.length),
    },
    notes,
  };
}

export function classifySendFailure(errorMessage: string) {
  const msg = String(errorMessage || '').toLowerCase();
  if (!msg) return { hard: false, reason: 'unknown_failure' };
  if (msg.includes('invalid') || msg.includes('hard bounce') || msg.includes('recipient address rejected') || msg.includes('550') || msg.includes('bounce')) return { hard: true, reason: 'hard_bounce' };
  if (msg.includes('rate limit') || msg.includes('429') || msg.includes('quota')) return { hard: false, reason: 'rate_limited' };
  if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('network')) return { hard: false, reason: 'network_failure' };
  if (msg.includes('5xx') || msg.includes('502') || msg.includes('503') || msg.includes('504')) return { hard: false, reason: 'provider_transient' };
  return { hard: false, reason: 'soft_failure' };
}

export function buildResearchLogEntry(date: string, plan: DailyPlan) {
  return `## ${date} — Outreach Research Capacity\n**Raw pending:** UK/Europe ${plan.rawPendingByBucket['uk-eu']} | US East ${plan.rawPendingByBucket['us-east']} | US West/Global ${plan.rawPendingByBucket['us-west-global']}\n**Quality-qualified pending:** UK/Europe ${plan.eligibleByBucket['uk-eu']} | US East ${plan.eligibleByBucket['us-east']} | US West/Global ${plan.eligibleByBucket['us-west-global']}\n**Shortage vs ${plan.targetPerBucket}-per-bucket target:** UK/Europe ${plan.bucketShortagesToTarget['uk-eu']} | US East ${plan.bucketShortagesToTarget['us-east']} | US West/Global ${plan.bucketShortagesToTarget['us-west-global']}\n**Daily capacity:** selected ${plan.totals.selected} | floor ${plan.targetFloor} (${plan.totals.metFloor ? 'met' : `missed by ${plan.totals.shortageToFloor}`}) | ceiling ${plan.targetCeiling} (${plan.totals.hitCeiling ? 'hit' : `${plan.totals.headroomToCeiling} below ceiling`})\n**Validation rejects:** ${plan.totals.rejected}\n**Notes:** Flexible overflow can cover weak buckets, but shortages are still reported explicitly. Automation does not fabricate research or relax quality gates.`;
}

export function buildSendLogEntry(date: string, plan: DailyPlan, sent: Contact[], failures: SendResult[]) {
  const segments = renderSegmentSummary(summarizeSegments(sent));
  const failureList = failures.filter((item) => !item.ok).map((item) => `${item.email}: ${item.error || 'send failed'}`);
  return `## ${date} — Outreach Send Run\n**Attempted:** ${plan.selected.length}\n**Sent:** ${sent.length}\n**Floor/Ceiling:** floor ${plan.targetFloor} (${plan.totals.metFloor ? 'met' : `missed by ${plan.totals.shortageToFloor}`}) | ceiling ${plan.targetCeiling} (${plan.totals.hitCeiling ? 'hit' : `${plan.totals.headroomToCeiling} below ceiling`})\n**Selected by bucket:** UK/Europe ${plan.selectedByBucket['uk-eu'].length} | US East ${plan.selectedByBucket['us-east'].length} | US West/Global ${plan.selectedByBucket['us-west-global'].length}\n**Bucket shortages to target:** UK/Europe ${plan.bucketShortagesToTarget['uk-eu']} | US East ${plan.bucketShortagesToTarget['us-east']} | US West/Global ${plan.bucketShortagesToTarget['us-west-global']}\n**Overflow used:** UK/Europe ${plan.overflowUsedByBucket['uk-eu']} | US East ${plan.overflowUsedByBucket['us-east']} | US West/Global ${plan.overflowUsedByBucket['us-west-global']}\n**Segments:** ${segments}\n**Failures:** ${failureList.length ? failureList.join('; ') : 'None'}\n**Validation rejects before send:** ${plan.totals.rejected}\n**Notes:** Quality gate is strict. No contacts were invented and no low-quality entries were sent just to fill volume.`;
}

export function buildAuditLogEntry(date: string, stats: any) {
  return `## ${date} — Outreach Audit\n**Raw pending:** UK/Europe ${stats.pending.raw['uk-eu']} | US East ${stats.pending.raw['us-east']} | US West/Global ${stats.pending.raw['us-west-global']}\n**Quality-qualified pending:** UK/Europe ${stats.pending.qualityEligible['uk-eu']} | US East ${stats.pending.qualityEligible['us-east']} | US West/Global ${stats.pending.qualityEligible['us-west-global']}\n**Bucket shortages to target:** UK/Europe ${stats.bucketShortagesToTarget['uk-eu']} | US East ${stats.bucketShortagesToTarget['us-east']} | US West/Global ${stats.bucketShortagesToTarget['us-west-global']}\n**Daily floor/ceiling status:** floor ${stats.dailyPlan.targetFloor} (${stats.dailyPlan.totals.metFloor ? 'met' : `missed by ${stats.dailyPlan.totals.shortageToFloor}`}) | ceiling ${stats.dailyPlan.targetCeiling} (${stats.dailyPlan.totals.hitCeiling ? 'hit' : `${stats.dailyPlan.totals.headroomToCeiling} below ceiling`})\n**Validation rejects:** ${stats.dailyPlan.totals.rejected}\n**Total current tracker rows:** ${stats.currentRows}\n**Total sent/archive rows:** ${stats.archiveRows}\n**Notes:** Audit is deterministic and compliance-safe. It reports real capacity, quality gating, and tracker hygiene only.`;
}

export function chooseScanHookText(contact: Contact, date: string) {
  const angle = (contact.notes || '').replace(/^angle:\s*/i, '').trim();
  return angle || `We built Albis as a free 2-minute daily briefing that pulls signal through from 60+ countries, 7 regions, and 16 languages.`;
}

export function buildSubject(contact: Contact) {
  const basis = (contact.notes || '').replace(/^angle:\s*/i, '').trim();
  const short = basis.split(/[—:.]/)[0].trim();
  const fallback = `${contact.segment} + a live dataset`;
  const subject = short ? short.slice(0, 46) : fallback;
  return subject.length > 50 ? subject.slice(0, 50).trim() : subject;
}

export function buildEmailBody(contact: Contact) {
  const angle = chooseScanHookText(contact, '');
  const greetingName = contact.name.split('/')[0].split(' ')[0].replace(/[^\p{L}\p{N}'’.-]/gu, '').trim() || contact.name;
  const lines = [
    `Hi ${greetingName},`,
    '',
    angle,
    '',
    'We built Albis as a free 2-minute daily world briefing that pulls the important signal through from multiple countries, regions, and sources so readers can quickly see what actually matters.',
    '',
    'Underneath that, we scan 60+ countries across 7 regions in 16 languages, which often makes it easier to catch the stories or framing splits that disappear once the English cycle flattens everything.',
    '',
    'Thought it might be useful for your work: https://www.albis.news',
    '',
    'Harry',
    'Albis — albis.news',
    '',
    "If you'd rather not hear from us, just reply and say so.",
  ];
  return lines.join('\n');
}

export function createResendClient() {
  ensureEnvLoaded();
  if (!process.env.RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY');
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendEmails(contacts: Contact[], dryRun = false): Promise<SendResult[]> {
  if (dryRun) {
    return contacts.map((contact) => ({ email: contact.email, name: contact.name, ok: true, resendId: 'dry-run' }));
  }
  const resend = createResendClient();
  const results: SendResult[] = [];
  for (const contact of contacts) {
    try {
      const payload = {
        from: FROM_ADDRESS,
        to: [contact.email],
        subject: buildSubject(contact),
        text: buildEmailBody(contact),
      };
      const response = await resend.emails.send(payload as any);
      if (response.error) throw new Error(response.error.message || 'Resend returned an error');
      results.push({ email: contact.email, name: contact.name, ok: true, resendId: response.data?.id || null });
    } catch (error: any) {
      results.push({ email: contact.email, name: contact.name, ok: false, error: error?.message || String(error) });
    }
  }
  return results;
}
