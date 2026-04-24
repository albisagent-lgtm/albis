const fs = require('fs');
const { createClient } = require('/Users/treelight/.openclaw/workspace/albis-app/node_modules/@supabase/supabase-js');
const env = fs.readFileSync('/Users/treelight/.openclaw/workspace/albis-app/.env.local','utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
const date='2026-04-24';
(async()=>{
  const [dailyRes, storiesRes, pairsRes] = await Promise.all([
    supabase.from('pgi_daily').select('*').eq('date',date).maybeSingle(),
    supabase.from('pgi_story_scores').select('*').eq('scan_date',date).eq('is_latest',true).order('story_pgi',{ascending:false}),
    supabase.from('pgi_region_pairs').select('*').eq('scan_date',date).order('pair_pgi',{ascending:false})
  ]);
  console.log(JSON.stringify({daily: dailyRes.data, dailyError: dailyRes.error, storiesCount: storiesRes.data?.length, storiesSample: storiesRes.data?.slice(0,10), pairsCount: pairsRes.data?.length, pairsSample: pairsRes.data?.slice(0,20), storiesError: storiesRes.error, pairsError: pairsRes.error}, null, 2));
})();