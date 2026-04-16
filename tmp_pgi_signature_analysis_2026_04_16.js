const fs=require('fs');
const { createClient } = require('/Users/treelight/.openclaw/workspace/albis-app/node_modules/@supabase/supabase-js');
const env=fs.readFileSync('/Users/treelight/.openclaw/workspace/.env.credentials','utf8');
const url=env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key=env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const s=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
function round(n){return Math.round(n*100)/100}
function weightedAvg(items,key){const tw=items.reduce((sum,i)=>sum+Number(i.significance||1),0);return tw?items.reduce((sum,i)=>sum+Number(i[key]||0)*Number(i.significance||1),0)/tw:0}
(async()=>{
 const date='2026-04-16';
 const [storiesRes,pairsRes]=await Promise.all([
   s.from('pgi_story_scores').select('*').eq('scan_date',date).eq('is_latest',true),
   s.from('pgi_region_pairs').select('*').eq('scan_date',date),
 ]);
 const stories=storiesRes.data||[]; const pairs=pairsRes.data||[];
 const regionSet=new Set(); const categories={}; const periods={};
 for(const story of stories){
  for(const region of story.regions_covered||[]) regionSet.add(region);
  (categories[story.category] ||= []).push(story);
  (periods[story.scan_period] ||= []).push(story);
 }
 const daily=round(weightedAvg(stories,'story_pgi'));
 const tier=daily<=5?'Different Angles':daily<=7?'Diverging Narratives':'Competing Realities';
 const emoji=daily<=5?'⚪':daily<=7?'🟠':'🔴';
 const dims={d1:round(weightedAvg(stories,'d1_factual')),d2:round(weightedAvg(stories,'d2_causal')),d3:round(weightedAvg(stories,'d3_framing')),d4:round(weightedAvg(stories,'d4_emotional')),d5:round(weightedAvg(stories,'d5_actor_context')),d6:round(weightedAvg(stories,'d6_cui_bono'))};
 const topStories=[...stories].sort((a,b)=>b.story_pgi-a.story_pgi).slice(0,12).map(s=>({headline:s.story_headline,slug:s.story_slug,pgi:round(Number(s.story_pgi)),category:s.category,period:s.scan_period,regions:s.regions_covered,d1:s.d1_factual,d2:s.d2_causal,d3:s.d3_framing,d4:s.d4_emotional,d5:s.d5_actor_context,d6:s.d6_cui_bono}));
 const catSummary=Object.entries(categories).map(([category,items])=>({category,pgi:round(weightedAvg(items,'story_pgi')),count:items.length})).sort((a,b)=>b.pgi-a.pgi);
 const periodSummary=Object.entries(periods).map(([period,items])=>({period,pgi:round(weightedAvg(items,'story_pgi')),count:items.length})).sort((a,b)=>a.period.localeCompare(b.period));
 const pairAgg={};
 for(const pair of pairs){const key=`${pair.region_a}__${pair.region_b}`;(pairAgg[key] ||= {region_a:pair.region_a,region_b:pair.region_b,vals:[]}).vals.push(Number(pair.pair_pgi));}
 const topPairs=Object.values(pairAgg).map(entry=>({region_a:entry.region_a,region_b:entry.region_b,avg_pgi:round(entry.vals.reduce((a,b)=>a+b,0)/entry.vals.length),count:entry.vals.length})).sort((a,b)=>b.avg_pgi-a.avg_pgi).slice(0,12);
 console.log(JSON.stringify({date,daily,tier,emoji,storyCount:stories.length,regionCount:regionSet.size,regions:[...regionSet].sort(),dims,topStories,catSummary,periodSummary,topPairs},null,2));
})();
