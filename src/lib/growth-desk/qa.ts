import type { ChannelDraft, LinkVerification, QAGateResult, SocialDayPack } from './types';

const BANNED_PUBLIC_PHRASES = [
  'scan picked up',
  'selected item',
  'source cluster',
  'briefing artifact',
  'generated row',
  'qa blocker',
  'pipeline',
  'pgi/gai pressure',
  'writeability',
  'draft quality',
  'published set',
];

export function effectiveXLength(text: string): number {
  const urls = text.match(/https?:\/\/\S+/g) || [];
  const withoutUrls = urls.reduce((acc, url) => acc.replace(url, ''), text);
  return withoutUrls.length + urls.length * 23;
}

export async function verifyLink(url: string, expectedTitle: string): Promise<LinkVerification> {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const text = await res.text();
    const normalized = text.toLowerCase();
    const titleWords = expectedTitle.toLowerCase().split(/\s+/).filter((word) => word.length > 4).slice(0, 6);
    const matches = titleWords.filter((word) => normalized.includes(word)).length;
    return {
      url,
      ok: res.ok && matches >= Math.min(3, titleWords.length),
      status: res.status,
      titleMatched: matches >= Math.min(3, titleWords.length),
      contentMatched: !/page not found|not found|404/.test(normalized),
      reason: res.ok ? `matched ${matches}/${titleWords.length} title words` : `HTTP ${res.status}`,
    };
  } catch (error) {
    return { url, ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

export function qaDraft(draft: ChannelDraft): ChannelDraft {
  const notes = [...draft.notes];
  let status: ChannelDraft['qaStatus'] = 'pass';
  const lower = draft.body.toLowerCase();
  const banned = BANNED_PUBLIC_PHRASES.find((phrase) => lower.includes(phrase));
  if (banned) {
    status = 'fail';
    notes.push(`contains internal/public-banned phrase: ${banned}`);
  }
  if (draft.channel === 'x') {
    const count = effectiveXLength(draft.body);
    draft.characterCount = count;
    if (count > 280) {
      status = 'fail';
      notes.push(`X length ${count}/280`);
    }
    if (/#\w+/.test(draft.body)) {
      status = status === 'fail' ? 'fail' : 'warn';
      notes.push('X hashtags are disabled by default');
    }
  }
  if (/\b(guarantees|proves|will definitely|certainly)\b/i.test(draft.body)) {
    status = 'fail';
    notes.push('overcertain claim');
  }
  if (!draft.body.trim()) {
    status = 'fail';
    notes.push('empty draft');
  }
  return { ...draft, qaStatus: status, notes };
}

export function qaSocialDayPack(pack: SocialDayPack): QAGateResult {
  const checks: QAGateResult['checks'] = [];
  if (!pack.mainAngle) {
    checks.push({ name: 'main_angle', status: 'fail', message: 'No main angle selected' });
  } else {
    checks.push({ name: 'main_angle', status: 'pass', message: pack.mainAngle.title });
  }
  if (pack.linkVerification?.ok) {
    checks.push({ name: 'link_verification', status: 'pass', message: pack.linkVerification.reason || 'verified' });
  } else {
    checks.push({ name: 'link_verification', status: 'fail', message: pack.linkVerification?.reason || 'not verified' });
  }
  for (const draft of pack.drafts) {
    checks.push({ name: `${draft.channel}_draft`, status: draft.qaStatus, message: draft.notes.join('; ') || 'ok' });
  }
  const statuses = checks.map((check) => check.status);
  const status: QAGateResult['status'] = statuses.includes('fail') ? 'fail' : statuses.includes('warn') ? 'warn' : 'pass';
  return { status, checks };
}
