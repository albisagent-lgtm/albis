const { createClient } = require('@supabase/supabase-js');

const projectUrl = 'https://wguydvzpxwsgrhvojpnk.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_xvK9Nt9uO-jSZ5_0w1Facw_fb8_fEdN';
const COMPANY_ID = process.argv[2] || '6330ca52-2e75-49db-8c9a-5d97ad38a28a';
const scanDate = process.argv[3] || '2026-04-19';

const supabase = createClient(projectUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

function normaliseCategory(cat) { return String(cat || '').replace(/_/g, '-'); }
function normaliseSignificance(sig) {
  if (!sig) return 'medium';
  const upper = String(sig).toUpperCase();
  if (upper.startsWith('CRITICAL') || upper.startsWith('HIGH')) return 'high';
  if (upper.startsWith('LOW') || upper.startsWith('MINOR')) return 'low';
  if (upper.startsWith('MEDIUM') || upper.startsWith('MODERATE')) return 'medium';
  if (sig === 'high' || sig === 'medium' || sig === 'low') return sig;
  return 'medium';
}
const WEIGHTS = { geography:0.20, sector:0.20, theme:0.15, entity:0.15, supply_chain:0.10, risk:0.10, urgency:0.05, significance:0.05 };
const CATEGORY_TO_SECTORS = {
  'energy':['energy-utilities','mining-resources'], 'climate-energy':['energy-utilities','mining-resources'],
  'economic-flows':['finance-investment','logistics-shipping'], 'markets':['finance-investment'], 'tech-ai':['technology-software'],
  'health':['pharma-healthcare'], 'food-agriculture':['food-agriculture'], 'food':['food-agriculture'], 'water':['food-agriculture'],
  'conflict':['government-public','consulting-advisory','legal-compliance'], 'geopolitics':['government-public','consulting-advisory','finance-investment'],
  'governance':['government-public','legal-compliance'], 'current-events':[], 'cyber-info-warfare':['technology-software','media-comms'],
  'information-warfare':['media-comms','technology-software'], 'media-literacy':['media-comms','education-research'],
  'migration-demographics':['government-public'], 'science-space':['education-research','technology-software'],
  'natural-world':['mining-resources','food-agriculture'], 'weather-climate':['energy-utilities','food-agriculture','construction-infra'],
  'grassroots':[], 'psychology-persuasion':['media-comms','consulting-advisory'], 'culture':['media-comms','retail-consumer'],
  'influential-people':[], 'life-systems':['pharma-healthcare','food-agriculture'], 'breaking':[], 'analysis':[], 'perspectives':[],
  'retail-consumer':['retail-consumer'], 'construction-infra':['construction-infra'], 'manufacturing':['manufacturing'], 'logistics-shipping':['logistics-shipping'],
};
const SCAN_REGION_TO_COMPANY_REGION = {
  'south-asia':['south-asia'],'south_asia':['south-asia'],'east-se-asia':['east-se-asia'],'asia_pacific':['east-se-asia'],
  'middle-east':['middle-east'],'middle_east':['middle-east'],'africa':['africa'],'eastern-europe':['eastern-europe'],
  'europe':['western-europe','eastern-europe'],'eu':['western-europe','eastern-europe'],'western-world':['western-europe','north-america'],
  'us':['north-america'],'latin-americas':['latin-americas'],'latam':['latin-americas'],'global':[],'caribbean':['caribbean'],'central-asia':['central-asia'],'pacific-islands':['pacific-islands']
};
const TAG_TO_RISK = {
  'supply-chain':['supply-chain-disruption'],'shipping':['supply-chain-disruption'],'port':['supply-chain-disruption'],'logistics':['supply-chain-disruption'],'freight':['supply-chain-disruption'],'shortage':['supply-chain-disruption'],
  'oil':['commodity-price-volatility','energy-price'],'gas':['commodity-price-volatility','energy-price'],'wheat':['commodity-price-volatility','food-water-security'],'fertiliser':['commodity-price-volatility','food-water-security'],'fertilizer':['commodity-price-volatility','food-water-security'],'commodity':['commodity-price-volatility'],'price':['commodity-price-volatility'],
  'war':['geopolitical-conflict'],'conflict':['geopolitical-conflict'],'military':['geopolitical-conflict'],'crisis':['geopolitical-conflict'],'geopolitics':['geopolitical-conflict'],'invasion':['geopolitical-conflict'],'strikes':['geopolitical-conflict'],
  'regulation':['regulatory-policy'],'policy':['regulatory-policy'],'law':['regulatory-policy'],'compliance':['regulatory-policy'],
  'sanctions':['trade-tariff-sanctions'],'tariff':['trade-tariff-sanctions'],'tariffs':['trade-tariff-sanctions'],'trade':['trade-tariff-sanctions'],'export-ban':['trade-tariff-sanctions'],
  'currency':['currency-financial'],'inflation':['currency-financial'],'interest-rates':['currency-financial'],'bonds':['currency-financial'],'markets':['currency-financial'],
  'climate':['climate-environmental'],'drought':['climate-environmental','food-water-security'],'flood':['climate-environmental'],'wildfire':['climate-environmental'],'emissions':['climate-environmental'],
  'cyber':['cyber-technology'],'hack':['cyber-technology'],'cybersecurity':['cyber-technology'],'data-breach':['cyber-technology'],'deepfake':['cyber-technology','reputation-narrative'],'ai':['cyber-technology'],'disinformation':['reputation-narrative'],'narrative':['reputation-narrative'],'propaganda':['reputation-narrative'],
  'energy':['energy-price'],'fuel':['energy-price'],'power':['energy-price'],'electricity':['energy-price'],'food':['food-water-security'],'famine':['food-water-security'],'hunger':['food-water-security'],'water':['food-water-security'],
  'labour':['labour-workforce'],'labor':['labour-workforce'],'strike':['labour-workforce'],'unemployment':['labour-workforce'],'workforce':['labour-workforce'],'union':['labour-workforce']
};
function overlapScore(a,b){ if(!a.length||!b.length) return 0; const setB=new Set(b.map(s=>String(s).toLowerCase())); const matches=a.filter(item=>setB.has(String(item).toLowerCase())).length; return matches/Math.min(a.length,b.length); }
function fuzzyTagOverlap(storyTags, companyTerms){ if(!storyTags.length||!companyTerms.length) return 0; const normalised=storyTags.map(t=>String(t).toLowerCase()); let matches=0; for(const term of companyTerms){ const lower=String(term).toLowerCase(); const found=normalised.some(tag=> tag===lower || tag.includes(lower) || lower.includes(tag)); if(found) matches++; } return matches/companyTerms.length; }
function scoreGeography(storyRegions, companyRegions, companyCountries){ if(!storyRegions.length) return 0; if(!companyRegions.length && !companyCountries.length) return 0; const mapped=[]; for(const r of storyRegions){ const m=SCAN_REGION_TO_COMPANY_REGION[r]; if(m) mapped.push(...m); else mapped.push(r); } const regionScore=overlapScore(mapped, companyRegions); return Math.min(1, regionScore); }
function scoreSector(storyCategory, companySector){ if(!companySector || !storyCategory) return 0; const mappedSectors=CATEGORY_TO_SECTORS[storyCategory] || []; if(mappedSectors.includes(companySector)) return 1.0; const catLower=storyCategory.toLowerCase(); const sectorLower=companySector.toLowerCase(); if(catLower.includes(sectorLower)||sectorLower.includes(catLower)) return 0.5; return 0; }
function scoreThemes(storyTags, trackedThemes){ return fuzzyTagOverlap(storyTags, trackedThemes); }
function scoreEntities(storyTags, storyHeadline, watchlistEntities){ if(!watchlistEntities.length) return 0; const headlineLower=String(storyHeadline).toLowerCase(); const tagsLower=storyTags.map(t=>String(t).toLowerCase()); let matches=0; for(const entity of watchlistEntities){ const lower=String(entity).toLowerCase(); if(headlineLower.includes(lower)){ matches++; continue; } if(tagsLower.some(tag=> tag===lower || tag.includes(lower) || lower.includes(tag))) matches++; } return matches/watchlistEntities.length; }
function scoreSupplyChain(storyTags, supplyChainExposure){ return fuzzyTagOverlap(storyTags, supplyChainExposure); }
function scoreRisk(storyTags, storyCategory, riskPriorities){ if(!riskPriorities.length) return 0; const storyRisks=new Set(); for(const tag of storyTags){ const risks = TAG_TO_RISK[String(tag).toLowerCase()]; if(risks) risks.forEach(r=>storyRisks.add(r)); } const catRisks = TAG_TO_RISK[storyCategory]; if(catRisks) catRisks.forEach(r=>storyRisks.add(r)); if(!storyRisks.size) return 0; const matches = riskPriorities.filter(r=>storyRisks.has(r)).length; return matches / riskPriorities.length; }
function significanceToScore(significance){ switch(significance){ case 'high': return 1.0; case 'medium': return 0.6; case 'low': return 0.3; default: return 0.5; } }
function urgencyBoost(patterns, significance){ let score=0; if(significance==='high') score+=0.5; if(patterns.includes('escalation')) score+=0.3; if(patterns.includes('breaking')) score+=0.2; if(patterns.includes('framing')) score+=0.1; return Math.min(1, score); }
function scoreStoriesForCompany(items, profile){ const scored=items.map(item=>{ const geo=scoreGeography(item.regions, profile.regions, profile.countries); const sec=scoreSector(item.category, profile.sector); const thm=scoreThemes(item.tags, profile.tracked_themes); const ent=scoreEntities(item.tags, item.headline, profile.watchlist_entities); const sup=scoreSupplyChain(item.tags, profile.supply_chain_exposure); const rsk=scoreRisk(item.tags, item.category, profile.risk_priorities); const urg=urgencyBoost(item.patterns, item.significance); const sig=significanceToScore(item.significance); const relevance=WEIGHTS.geography*geo+WEIGHTS.sector*sec+WEIGHTS.theme*thm+WEIGHTS.entity*ent+WEIGHTS.supply_chain*sup+WEIGHTS.risk*rsk+WEIGHTS.urgency*urg+WEIGHTS.significance*sig; return { ...item, geography_score:geo, sector_score:sec, theme_score:thm, entity_score:ent, supply_chain_score:sup, risk_score:rsk, urgency_score:urg, significance_score:sig, relevance_score:relevance, selected_for_briefing:false }; }); scored.sort((a,b)=>b.relevance_score-a.relevance_score); const MIN_STORIES=5, MAX_STORIES=8, SCORE_THRESHOLD=0.05; let selectedCount=Math.min(MIN_STORIES, scored.length); for(let i=selectedCount;i<Math.min(MAX_STORIES, scored.length);i++){ if(scored[i].relevance_score>=SCORE_THRESHOLD && scored[i].relevance_score>=scored[selectedCount-1].relevance_score*0.7){ selectedCount=i+1; } else break; } for(let i=0;i<selectedCount;i++){ if(scored[i].relevance_score>=SCORE_THRESHOLD) scored[i].selected_for_briefing=true; } return { scored, thresholds:{ MIN_STORIES, MAX_STORIES, SCORE_THRESHOLD } }; }

async function loadScanItems(scanDate){
  const allItems = [];
  const { data: scans, error } = await supabase.from('scans').select('id, items, scan_time').eq('scan_date', scanDate);
  if (error) throw error;
  const scanIds=[];
  for (const scan of scans || []) {
    scanIds.push(scan.id);
    const items = scan.items;
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item?.headline && item?.category) {
          allItems.push({
            headline: item.headline,
            category: normaliseCategory(item.category),
            regions: Array.isArray(item.regions) ? item.regions : [],
            tags: Array.isArray(item.tags) ? item.tags : [],
            patterns: Array.isArray(item.patterns) ? item.patterns : [],
            significance: normaliseSignificance(item.significance || 'medium'),
            connection: item.connection || '',
            source_scan_time: scan.scan_time,
          });
        }
      }
    }
  }
  const seen = new Set();
  const deduped = allItems.filter(item => { if (seen.has(item.headline)) return false; seen.add(item.headline); return true; });
  return { scans, items: deduped };
}

(async () => {
  const { data: profile, error: pErr } = await supabase.from('company_profiles').select('*').eq('id', COMPANY_ID).single();
  if (pErr) throw pErr;
  const { scans, items } = await loadScanItems(scanDate);
  const { scored, thresholds } = scoreStoriesForCompany(items, profile);
  const out = {
    profile: {
      id: profile.id,
      company_name: profile.company_name,
      sector: profile.sector,
      regions: profile.regions,
      countries_count: Array.isArray(profile.countries) ? profile.countries.length : 0,
      tracked_themes: profile.tracked_themes,
      watchlist_entities: profile.watchlist_entities,
      supply_chain_exposure: profile.supply_chain_exposure,
      risk_priorities: profile.risk_priorities,
    },
    scan_date_requested: scanDate,
    scans_found: (scans || []).map(s => ({ id: s.id, scan_time: s.scan_time, items_len: Array.isArray(s.items) ? s.items.length : 0 })),
    deduped_items_loaded: items.length,
    thresholds,
    selected_count: scored.filter(s => s.selected_for_briefing).length,
    stories: scored.map(s => ({
      headline: s.headline,
      source_scan_time: s.source_scan_time,
      category: s.category,
      significance: s.significance,
      geography_score: +s.geography_score.toFixed(3),
      sector_score: +s.sector_score.toFixed(3),
      theme_score: +s.theme_score.toFixed(3),
      entity_score: +s.entity_score.toFixed(3),
      supply_chain_score: +s.supply_chain_score.toFixed(3),
      risk_score: +s.risk_score.toFixed(3),
      urgency_score: +s.urgency_score.toFixed(3),
      significance_score: +s.significance_score.toFixed(3),
      relevance_score: +s.relevance_score.toFixed(3),
      selected_for_briefing: s.selected_for_briefing,
      tags: s.tags,
      regions: s.regions,
    }))
  };
  console.log(JSON.stringify(out, null, 2));
})().catch(err => {
  console.error(err);
  process.exit(1);
});
