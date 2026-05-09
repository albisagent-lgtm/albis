import type { ChannelDraft, GrowthDeskInputs, SocialDayPack } from './types';
import { qaDraft, qaSocialDayPack, verifyLink } from './qa';
import { buildBusinessHook, buildPublicHook, selectMainAngle } from './select-angle';

function truncateForX(text: string, url: string): string {
  const suffix = `\n\n${url}`;
  const maxBody = 250 - 23;
  const clean = text.replace(/\s+/g, ' ').trim();
  return `${clean.length > maxBody ? `${clean.slice(0, maxBody - 1).trim()}…` : clean}${suffix}`;
}

function draftsFor(candidate: SocialDayPack['mainAngle'], publicHook: string, businessHook: string): ChannelDraft[] {
  const url = candidate?.url;
  const title = candidate?.title || 'What your feed missed today';
  const xBody = url
    ? truncateForX(`What your feed may have missed: ${title}. Albis tracks the attention gaps that normal feeds flatten.`, url)
    : 'What your feed may have missed today: Albis tracks the attention gaps that normal feeds flatten.';

  const drafts: ChannelDraft[] = [
    { channel: 'x', title: 'Albis X post', body: xBody, url, qaStatus: 'pass', notes: ['Link counted as ~23 chars for X.'] },
    { channel: 'founder_video', title: 'Founder video script', body: `Hook: One thing today’s global feed may have missed.\n\nStory: ${title}.\n\nGap: ${publicHook}\n\nWhy it matters: ordinary feeds often show what happened, but not who is seeing it differently or what is being underweighted.\n\nClose: That is why I am building Albis — to help people see the wider information picture every day.`, url, qaStatus: 'pass', notes: ['Aim for 60–90 seconds, natural delivery.'] },
    { channel: 'linkedin', title: 'LinkedIn business angle', body: `${businessHook}\n\nThis is the kind of narrative shift Albis is designed to surface early: not just the headline, but what different audiences may do with it next.\n\nCTA: Ask for a free sample narrative-risk scan for your company, sector, or client area.`, url, qaStatus: 'pass', notes: ['Draft only unless posting permission/channel confirmed.'] },
    { channel: 'carousel', title: 'Carousel outline', body: `Slide 1: What your feed may have missed\nSlide 2: ${title}\nSlide 3: Why this is being underpriced in attention\nSlide 4: What different audiences may be seeing\nSlide 5: The missing angle\nSlide 6: Why it matters next\nSlide 7: Read the full Albis story`, url, qaStatus: 'pass', notes: ['Keep each slide sparse.'] },
    { channel: 'telegram', title: 'Telegram summary', body: `${title}\n\n${candidate?.description || 'Albis is watching the attention gap around this story.'}\n\nRead more: ${url || 'https://www.albis.news'}`, url, qaStatus: 'pass', notes: ['Brand-channel draft.'] },
  ];
  return drafts.map(qaDraft);
}

export async function buildSocialDayPack(inputs: GrowthDeskInputs): Promise<SocialDayPack> {
  const mainAngle = selectMainAngle(inputs.candidates);
  const linkVerification = mainAngle ? await verifyLink(mainAngle.url, mainAngle.title) : undefined;
  const publicHook = buildPublicHook(mainAngle);
  const businessHook = buildBusinessHook(mainAngle);
  const cta = mainAngle ? `Read the full Albis story: ${mainAngle.url}` : 'Read today’s Albis briefing: https://www.albis.news';
  const packWithoutQa: SocialDayPack = {
    date: inputs.date,
    frame: 'Mispriced Attention',
    mainAngle,
    linkVerification,
    publicHook,
    businessHook,
    cta,
    drafts: draftsFor(mainAngle, publicHook, businessHook),
    qa: { status: 'warn', checks: [] },
    metrics: inputs.metrics,
    generatedAt: new Date().toISOString(),
  };
  return { ...packWithoutQa, qa: qaSocialDayPack(packWithoutQa) };
}
