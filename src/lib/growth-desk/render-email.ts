import type { SocialDayPack } from './types';

function esc(value: string | number | undefined | null) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function renderSocialDayMarkdown(pack: SocialDayPack): string {
  const angle = pack.mainAngle;
  return `# Albis Social Day — ${pack.date}\n\n## Frame\n\n**Mispriced Attention** — Albis finds what the world is paying too little attention to, and why it may matter next.\n\n## Main angle\n\n${angle ? `**${angle.title}**\n\n${angle.description}\n\nURL: ${angle.url}\n\nScore: ${angle.scores.total}\n\nReasons:\n${angle.reasons.map((r) => `- ${r}`).join('\n')}` : 'No suitable live angle found.'}\n\n## Link verification\n\n- Status: ${pack.linkVerification?.ok ? 'PASS' : 'FAIL'}\n- Detail: ${pack.linkVerification?.reason || 'not checked'}\n\n## Public hook\n\n${pack.publicHook}\n\n## Business hook\n\n${pack.businessHook}\n\n## CTA\n\n${pack.cta}\n\n## Drafts\n\n${pack.drafts.map((draft) => `### ${draft.title}\n\nChannel: ${draft.channel}\nQA: ${draft.qaStatus}${draft.characterCount ? ` (${draft.characterCount} chars effective)` : ''}\nNotes: ${draft.notes.join('; ') || 'ok'}\n\n${draft.body}`).join('\n\n')}\n\n## QA result\n\nOverall: **${pack.qa.status.toUpperCase()}**\n\n${pack.qa.checks.map((check) => `- ${check.status.toUpperCase()} — ${check.name}: ${check.message}`).join('\n')}\n\n## Metrics snapshot\n\n- Subscribers: ${pack.metrics.subscribers ?? 'unknown'}\n- Company profiles: ${pack.metrics.companyProfiles ?? 'unknown'}\n${pack.metrics.notes.map((note) => `- ${note}`).join('\n')}\n`;
}

export function renderSocialDayEmailHtml(pack: SocialDayPack): string {
  const md = renderSocialDayMarkdown(pack);
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:760px;margin:0 auto;color:#1f2937;line-height:1.6;white-space:pre-wrap;"><h1 style="font-size:22px;color:#111827;">Albis Social Day — ${esc(pack.date)}</h1><pre style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.55;background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:18px;white-space:pre-wrap;">${esc(md)}</pre></div>`;
}
