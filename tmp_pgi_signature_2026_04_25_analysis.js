const fs=require('fs');
const { createClient } = require('/Users/treelight/.openclaw/workspace/albis-app/node_modules/@supabase/supabase-js');
const env=fs.readFileSync('/Users/treelight/.openclaw/workspace/albis-app/.env.local','utf8');
const url=env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key=env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
const date='2026-04-25';
const round=n=>Math.round(Number(n)*100)/100;
const weightedAvg=(items,key)=>{const tw=items.reduce((s,i)=>s+Number(i.significance||1),0); return tw?items.reduce((s,i)=>s+Number(i[key]||0)*Number(i.significance||1),0)/tw:0};
const mean=arr=>arr.length?arr.reduce((a,b)=>a+Number(b||0),0)/arr.length:0;
(async()=>{
 const [dailyRes,storiesRes,pairsRes]=await Promise.all([
  supabase.from('pgi_daily').select('*').eq('date',date).maybeSingle(),
  supabase.from('pgi_story_scores').select('*').eq('scan_date',date).eq('is_latest',true).order('story_pgi',{ascending:false}),
  supabase.from('pgi_region_pairs').select('story_score_id,region_a,region_b,pair_pgi').eq('scan_date',date).order('pair_pgi',{ascending:false})
 ]);
 if(dailyRes.error||storiesRes.error||pairsRes.error){console.error(JSON.stringify(dailyRes.error||storiesRes.error||pairsRes.error,null,2)); process.exit(1)}
 const daily=dailyRes.data, stories=storiesRes.data||[], pairs=pairsRes.data||[];
 const categories={}; const periods={}; const regionSet=new Set(stories.flatMap(s=>s.regions_covered||[]));
 for(const s of stories){(categories[s.category||'uncategorized'] ||= []).push(s); (periods[s.scan_period||'unknown'] ||= []).push(s)}
 const pairAgg={};
 for(const p of pairs){const key=[...[p.region_a,p.region_b].sort(),p.story_score_id].join('|'); (pairAgg[key] ||= {region_a:p.region_a,region_b:p.region_b,vals:[],story_score_id:p.story_score_id}).vals.push(Number(p.pair_pgi||0));}
 console.log(JSON.stringify({
  daily,
  storyCount: stories.length,
  regionCount: regionSet.size,
  dims:{
   factual: round(daily?.avg_d1_factual ?? weightedAvg(stories,'d1_factual')),
   causal: round(daily?.avg_d2_causal ?? weightedAvg(stories,'d2_causal')),
   framing: round(daily?.avg_d3_framing ?? weightedAvg(stories,'d3_framing')),
   emotional: round(daily?.avg_d4_emotional ?? weightedAvg(stories,'d4_emotional')),
   actor: round(daily?.avg_d5_actor ?? weightedAvg(stories,'d5_actor_context')),
   cui_bono: round(daily?.avg_d6_cui_bono ?? weightedAvg(stories,'d6_cui_bono'))
  },
  periods:Object.entries(periods).map(([period,items])=>({period,pgi:round(weightedAvg(items,'story_pgi')),count:items.length})).sort((a,b)=>a.period.localeCompare(b.period)),
  categories:Object.entries(categories).map(([category,items])=>({category,pgi:round(weightedAvg(items,'story_pgi')),count:items.length,top:items.slice().sort((a,b)=>b.story_pgi-a.story_pgi).slice(0,3).map(x=>x.story_headline)})).sort((a,b)=>b.pgi-a.pgi),
  topStories: stories.slice(0,12).map(s=>({headline:s.story_headline,slug:s.story_slug,pgi:round(s.story_pgi),category:s.category,regions:s.regions_covered,significance:s.significance,period:s.scan_period,rationale:s.scoring_rationale,d1:round(s.d1_factual),d2:round(s.d2_causal),d3:round(s.d3_framing),d4:round(s.d4_emotional),d5:round(s.d5_actor_context),d6:round(s.d6_cui_bono)})),
  pairSummary:Object.values(pairAgg).map(x=>({region_a:x.region_a,region_b:x.region_b,avg:round(mean(x.vals)),story_score_id:x.story_score_id})).sort((a,b)=>b.avg-a.avg).slice(0,20)
 },null,2));
})();
