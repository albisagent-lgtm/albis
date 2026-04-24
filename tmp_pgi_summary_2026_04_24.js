const fs = require('fs');
const { createClient } = require('/Users/treelight/.openclaw/workspace/albis-app/node_modules/@supabase/supabase-js');
const env = fs.readFileSync('/Users/treelight/.openclaw/workspace/albis-app/.env.local','utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
const date='2026-04-24';
function round(n){return Math.round(n*100)/100}
function weightedAvg(items,key){const tw=items.reduce((s,i)=>s+Number(i.significance||1),0); return tw?items.reduce((s,i)=>s+Number(i[key]||0)*Number(i.significance||1),0)/tw:0}
(async()=>{
 const [dailyRes,storiesRes,pairsRes] = await Promise.all([
  supabase.from('pgi_daily').select('*').eq('date',date).maybeSingle(),
  supabase.from('pgi_story_scores').select('*').eq('scan_date',date).eq('is_latest',true),
  supabase.from('pgi_region_pairs').select('*').eq('scan_date',date)
 ]);
 const stories=storiesRes.data||[]; const pairs=pairsRes.data||[];
 const regionSet=new Set(stories.flatMap(s=>s.regions_covered||[]));
 const cats={}; const periods={}; const regionPresence={};
 for(const s of stories){
   (cats[s.category] ||= []).push(s); (periods[s.scan_period] ||= []).push(s);
   for(const r of (s.regions_covered||[])) regionPresence[r]=(regionPresence[r]||0)+1;
 }
 const pairAgg={};
 for(const p of pairs){ const k=[p.region_a,p.region_b].sort().join('__'); (pairAgg[k] ||= {regions:[p.region_a,p.region_b].sort(),vals:[],count:0}).vals.push(Number(p.pair_pgi)); pairAgg[k].count++; }
 const topStories = [...stories].sort((a,b)=>b.story_pgi-a.story_pgi).slice(0,8).map(s=>({headline:s.story_headline,slug:s.story_slug,pgi:round(s.story_pgi),category:s.category,period:s.scan_period,regions:s.regions_covered,region_count:s.region_count,d1:s.d1_factual,d2:s.d2_causal,d3:s.d3_framing,d4:s.d4_emotional,d5:s.d5_actor_context,d6:s.d6_cui_bono}));
 console.log(JSON.stringify({
  daily:dailyRes.data,
  regionCount:regionSet.size,
  regions:[...regionSet].sort(),
  regionPresence:Object.entries(regionPresence).sort((a,b)=>b[1]-a[1]).map(([region,count])=>({region,count})),
  avg:{d1:round(weightedAvg(stories,'d1_factual')),d2:round(weightedAvg(stories,'d2_causal')),d3:round(weightedAvg(stories,'d3_framing')),d4:round(weightedAvg(stories,'d4_emotional')),d5:round(weightedAvg(stories,'d5_actor_context')),d6:round(weightedAvg(stories,'d6_cui_bono'))},
  categories:Object.entries(cats).map(([category,items])=>({category,pgi:round(weightedAvg(items,'story_pgi')),count:items.length})).sort((a,b)=>b.pgi-a.pgi),
  periods:Object.entries(periods).map(([period,items])=>({period,pgi:round(weightedAvg(items,'story_pgi')),count:items.length})).sort((a,b)=>a.period.localeCompare(b.period)),
  topPairs:Object.values(pairAgg).map(x=>({regions:x.regions,avg:round(x.vals.reduce((m,n)=>m+n,0)/x.vals.length),count:x.count})).sort((a,b)=>b.avg-a.avg).slice(0,12),
  topStories
 },null,2));
})();