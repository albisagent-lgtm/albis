import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { loadVerifiedScanItems } from './src/lib/pipeline-db';
import { rankPublicStories } from './src/lib/public-story-selection';
import { buildStoryPacket, buildArticleBody } from './tmp_phase3_module';

async function main() {
  const env = fs.readFileSync(path.join(process.cwd(), '.env.local'),'utf8');
  for (const line of env.split(/\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const date = '2026-04-26';
  const periods = ['am','midday','pm'] as const;
  const all:any[] = [];
  for (const period of periods) {
    try {
      const items = await loadVerifiedScanItems(supabase, date, period);
      all.push(...items);
    } catch (e) {}
  }
  const dedup = Array.from(new Map(all.map((i:any)=>[i.headline.toLowerCase(), i])).values());
  const ranked = rankPublicStories(dedup).slice(0, 120);
  const byForm = new Map<string, any[]>();
  for (const sel of ranked) {
    if (!byForm.has(sel.articleForm)) byForm.set(sel.articleForm, []);
    byForm.get(sel.articleForm)!.push(sel);
  }
  for (const form of ['human-ground','system-shift','framing-map','numbers-watch','offbeat-signal','turning-point']) {
    const list = byForm.get(form) || [];
    console.log('\n=== FORM', form, '| count', list.length, '===');
    for (const sel of list.slice(0, 3)) {
      const packet = buildStoryPacket(sel.item as any, sel as any);
      const built = buildArticleBody(packet as any);
      console.log('\nTITLE:', packet.title);
      console.log('WHY:', sel.why.join(', '));
      console.log('SIGNALS:', JSON.stringify(sel.articleSignals));
      console.log('OPENING:', built.lede.replace(/\n/g,' '));
      console.log('BODY-SAMPLE:', built.body.split(/\n\n/).slice(0,5).join(' || '));
    }
  }
}

main().catch(err=>{console.error(err);process.exit(1)})
