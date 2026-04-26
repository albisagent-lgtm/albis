import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { loadVerifiedScanItems } from './src/lib/pipeline-db';
import { rankPublicStories, selectPublicStories } from './src/lib/public-story-selection';

const env = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
for (const line of env.split(/\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function inspect(scanDate: string, scanPeriod: 'am'|'pm') {
  const items = await loadVerifiedScanItems(supabase, scanDate, scanPeriod);
  const ranked = rankPublicStories(items);
  const selected = selectPublicStories(items, 5, 5);
  return {
    scanDate, scanPeriod,
    total: items.length,
    topRanked: ranked.slice(0, 8).map((s) => ({
      headline: s.item.headline,
      category: s.categoryKey,
      lane: s.lane,
      form: s.articleForm,
      score: Number(s.score.toFixed(2)),
      writeabilityScore: Number(s.writeabilityScore.toFixed(2)),
      connection: s.item.connection,
      signals: s.articleSignals,
    })),
    selected: selected.map((s) => ({
      headline: s.item.headline,
      category: s.categoryKey,
      lane: s.lane,
      form: s.articleForm,
      score: Number(s.score.toFixed(2)),
      connection: s.item.connection,
      signals: s.articleSignals,
    })),
  };
}

(async()=>{
  const runs = [
    ['2026-04-26','am'],
    ['2026-04-26','pm'],
    ['2026-04-25','am'],
    ['2026-04-25','pm'],
  ] as const;
  const out = [];
  for (const [d,p] of runs) out.push(await inspect(d,p));
  console.log(JSON.stringify(out, null, 2));
})().catch(err=>{console.error(err);process.exit(1)})
