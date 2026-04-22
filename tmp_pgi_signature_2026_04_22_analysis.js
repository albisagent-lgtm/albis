const fs = require('fs');
const { createClient } = require('/Users/treelight/.openclaw/workspace/albis-app/node_modules/@supabase/supabase-js');
const env = fs.readFileSync('/Users/treelight/.openclaw/workspace/albis-app/.env.local','utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
const date='2026-04-22';
const round=n=>Math.round(Number(n)*100)/100;
const mean=arr=>arr.length?arr.reduce((a,b)=>a+Number(b||0),0)/arr.length:0;
const weightedAvg=(items,key)=>{const tw=items.reduce((s,i)=>s+Number(i.significance||1),0); return tw?items.reduce((s,i)=>s+Number(i[key]||0)*Number(i.significance||1),0)/tw:0};
(async()=>{
 const [dailyRes,storiesRes,pairsRes] = await Promise.all([
  supabase.from('pgi_daily').select('*').eq('date',date).maybeSingle(),
  supabase.from('pgi_story_scores').select('*').eq('scan_date',date).eq('is_latest',true).order('story_pgi',{ascending:false}),
  supabase.from('pgi_region_pairs').select('*').eq('scan_date',date).order('pair_pgi',{ascending:false})
 ]);
 if(dailyRes.error||storiesRes.error||pairsRes.error){console.error(dailyRes.error||storiesRes.error||pairsRes.error); process.exit(1)}
 const daily=dailyRes.data; const stories=storiesRes.data||[]; const pairs=pairsRes.data||[];
 const regionSet=new Set(stories.flatMap(s=>s.regions_covered||[]));
 const pairAgg={};
 for(const p of pairs){ const k=`${p.region_a}__${p.region_b}`; (pairAgg[k] ||= {a:p.region_a,b:p.region_b,vals:[],stories:[]}).vals.push(Number(p.pair_pgi)); if(p.story_headline) pairAgg[k].stories.push(p.story_headline); }
 const cats={}; const periods={};
 for(const s of stories){(cats[s.category] ||= []).push(s); (periods[s.scan_period] ||= []).push(s)}
 console.log(JSON.stringify({
  daily,
  storyCount:stories.length,
  regionCount:regionSet.size,
  dims:{d1:round(daily?.avg_d1_factual ?? weightedAvg(stories,'d1_factual')),d2:round(daily?.avg_d2_causal ?? weightedAvg(stories,'d2_causal')),d3:round(daily?.avg_d3_framing ?? weightedAvg(stories,'d3_framing')),d4:round(daily?.avg_d4_emotional ?? weightedAvg(stories,'d4_emotional')),d5:round(daily?.avg_d5_actor ?? weightedAvg(stories,'d5_actor_context')),d6:round(daily?.avg_d6_cui_bono ?? weightedAvg(stories,'d6_cui_bono'))},
  categories:Object.entries(cats).map(([category,items])=>({category,pgi:round(weightedAvg(items,'story_pgi')),count:items.length,top:[...items].sort((a,b)=>b.story_pgi-a.story_pgi).slice(0,2).map(x=>x.story_headline)})).sort((a,b)=>b.pgi-a.pgi),
  periods:Object.entries(periods).map(([period,items])=>({period,pgi:round(weightedAvg(items,'story_pgi')),count:items.length})).sort((a,b)=>a.period.localeCompare(b.period)),
  topStories:stories.slice(0,8).map(s=>({headline:s.story_headline,pgi:round(s.story_pgi),category:s.category,regions:s.regions_covered,scan_period:s.scan_period,significance:s.significance,rationale:s.scoring_rationale,d1:round(s.d1_factual),d2:round(s.d2_causal),d3:round(s.d3_framing),d4:round(s.d4_emotional),d5:round(s.d5_actor_context ?? s.d5_actor),d6:round(s.d6_cui_bono)})),
  topPairs:Object.values(pairAgg).map(x=>({a:x.a,b:x.b,avg:round(mean(x.vals)),count:x.vals.length,stories:[...new Set(x.stories)].slice(0,3)})).sort((a,b)=>b.avg-a.avg).slice(0,10)
 },null,2));
})();
