const fs=require('fs');
const { createClient } = require('./node_modules/@supabase/supabase-js');
const env=fs.readFileSync('/Users/treelight/.openclaw/workspace/.env.credentials','utf8');
const url=env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key=env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const s=createClient(url,key);
function normRegion(r){const m={me:'middle_east',af:'africa',la:'latin_americas',sa:'south_asia',ap:'asia_pacific',eu:'europe',us:'united_states',ru:'russia'}; return m[r]||r;}
(async()=>{
 const date='2026-04-08';
 const {data:stories,error}=await s.from('pgi_story_scores').select('*').eq('scan_date',date);
 if(error) throw error;
 const n=stories.length;
 const avg=(k)=>stories.reduce((a,x)=>a+Number(x[k]||0),0)/n;
 const daily=stories.reduce((a,x)=>a+Number(x.story_pgi||0),0)/n;
 const allRegions=[...new Set(stories.flatMap(x=>x.regions_covered||[]).map(normRegion))].sort();
 const cats={}; const periods={};
 for(const x of stories){
  periods[x.scan_period]=(periods[x.scan_period]||{count:0,sum:0}); periods[x.scan_period].count++; periods[x.scan_period].sum+=Number(x.story_pgi);
  for(const c of String(x.category||'').split('/')){cats[c]=(cats[c]||{count:0,sum:0}); cats[c].count++; cats[c].sum+=Number(x.story_pgi);} }
 const topCats=Object.entries(cats).map(([k,v])=>({category:k,avg:+(v.sum/v.count).toFixed(2),count:v.count})).sort((a,b)=>b.avg-a.avg).slice(0,12);
 const top=stories.sort((a,b)=>Number(b.story_pgi)-Number(a.story_pgi)).slice(0,10).map(x=>({headline:x.story_headline,slug:x.story_slug,pgi:Number(x.story_pgi),regions:x.regions_covered,period:x.scan_period,category:x.category,d1:Number(x.d1_factual),d2:Number(x.d2_causal),d3:Number(x.d3_framing),d4:Number(x.d4_emotional),d5:Number(x.d5_actor_context),d6:Number(x.d6_cui_bono)}));
 console.log(JSON.stringify({n,daily:+daily.toFixed(2),avg_d1:+avg('d1_factual').toFixed(2),avg_d2:+avg('d2_causal').toFixed(2),avg_d3:+avg('d3_framing').toFixed(2),avg_d4:+avg('d4_emotional').toFixed(2),avg_d5:+avg('d5_actor_context').toFixed(2),avg_d6:+avg('d6_cui_bono').toFixed(2),regions:allRegions,regionCount:allRegions.length,periods:Object.fromEntries(Object.entries(periods).map(([k,v])=>[k,{count:v.count,avg:+(v.sum/v.count).toFixed(2)}])),topCats,top},null,2));
})();