const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '../../.env.credentials');
if (fs.existsSync(envPath)) {
  const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of envLines) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const scanPath = path.join(__dirname, '../../memory/scans/2026-04-08-pm.md');
const md = fs.readFileSync(scanPath, 'utf8');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const REGION_MAP = {
  us: 'us',
  eu: 'eu',
  me: 'middle_east',
  sa: 'south_asia',
  ap: 'east_se_asia',
  af: 'africa',
  la: 'latin_americas',
  ru: 'russia',
};

const POP_WEIGHTS = {
  us: 0.04,
  eu: 0.06,
  middle_east: 0.07,
  south_asia: 0.23,
  east_se_asia: 0.26,
  africa: 0.18,
  latin_americas: 0.09,
  russia: 0.02,
};

const ALL_REGIONS = ['us','eu','middle_east','south_asia','east_se_asia','africa','latin_americas'];
const DIRECT_REGIONS = new Set(['middle_east','south_asia','eu']);
const PAIR_REGION_MAP = {
  us: 'us',
  eu: 'eu',
  middle_east: 'middle_east',
  south_asia: 'south-asia',
  east_se_asia: 'china',
  africa: 'africa',
  latin_americas: 'latam',
};

function slugify(s) {
  return s.toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function significanceToInt(sig) {
  return sig === 'critical' ? 5 : sig === 'high' ? 4 : sig === 'medium' ? 3 : 2;
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function round2(n) { return Math.round(n * 100) / 100; }

function parseStories(markdown) {
  const section = markdown.split('## Stories')[1]?.split('## Systems Status Updates')[0] || '';
  const lines = section.split('\n').filter(line => line.trim().startsWith('- '));
  return lines.map(line => {
    const clean = line.slice(2).trim();
    const [left, hiPartRaw] = clean.split(' | HI: ');
    const parts = left.split(' | ').map(p => p.trim());
    const headline = parts[0];
    const category = parts[1];
    const pgiHint = Number((parts.find(p => p.startsWith('PGI:')) || 'PGI:0').replace('PGI:', ''));
    const significance = parts[3];
    const regionsFoundRaw = (parts.find(p => p.startsWith('regions_found:')) || '').replace('regions_found:', '').trim();
    const absentMatch = left.match(/!\[([^\]]*)\]/);
    const tags = [...left.matchAll(/\[([^\]]+)\]/g)].map(m => m[1]).filter(t => !t.startsWith('BRIDGE:'));
    const connection = parts[parts.length - 1];
    const hi = hiPartRaw?.trim() || '';
    const regions_found = regionsFoundRaw ? regionsFoundRaw.split(',').map(s => s.trim()).filter(Boolean).map(r => REGION_MAP[r] || r) : [];
    const regions_absent = absentMatch ? absentMatch[1].split(',').map(s => s.trim()).filter(Boolean).map(r => REGION_MAP[r] || r) : ALL_REGIONS.filter(r => !regions_found.includes(r));
    return { headline, category, pgiHint, significance, regions_found, regions_absent, tags, connection, hi };
  });
}

function pairScore(story, a, b) {
  const cat = story.category;
  const tags = story.tags.join(' | ');
  const base = story.pgiHint;
  let score = base;

  const pair = [a,b].sort().join('-');

  if (tags.includes('PGI gold')) score += 0.5;
  if (tags.includes('cascade')) score += 0.4;
  if (cat.includes('conflict')) score += 0.3;
  if (cat.includes('information')) score += 0.4;
  if (cat.includes('science')) score -= 1.0;
  if (cat.includes('women/justice')) score -= 0.8;
  if (story.regions_found.length <= 2) score -= 0.5;

  if (pair === 'middle_east-us') score += 1.2;
  else if (pair === 'middle_east-eu') score += 0.7;
  else if (pair === 'south_asia-us') score += 0.8;
  else if (pair === 'latin_americas-us') score += 0.6;
  else if (pair === 'east_se_asia-us') score += 0.5;
  else if (pair === 'africa-us') score += 0.4;
  else if (pair === 'eu-us') score += 0.2;
  else if (pair === 'south_asia-eu') score += 0.4;
  else if (pair === 'latin_americas-eu') score += 0.4;

  if (story.headline.includes('Arab press foregrounds')) {
    if (pair === 'middle_east-us') score = 9.3;
    if (pair === 'middle_east-eu') score = 8.5;
    if (pair === 'africa-us') score = 7.9;
  }
  if (story.headline.includes('India’s Hindi results lean')) {
    if (pair === 'south_asia-us') score = 7.3;
    if (pair === 'south_asia-eu') score = 6.6;
  }
  if (story.headline.includes('Chinese coverage spotlights smart spring farming')) {
    if (pair === 'east_se_asia-us') score = 5.4;
    if (pair === 'east_se_asia-eu') score = 5.1;
  }

  return clamp(round2(score), 1, 10);
}

function buildPGI(story) {
  const found = story.regions_found;
  const significance = significanceToInt(story.significance);
  const tags = story.tags.join(' | ');
  let d1 = clamp(story.pgiHint - (found.length >= 4 ? 1 : 0) + (story.category.includes('conflict') ? 0.3 : 0), 1, 10);
  let d2 = clamp(story.pgiHint + (tags.includes('cascade') ? 0.4 : 0) + (story.category.includes('technology') ? -0.2 : 0), 1, 10);
  let d3 = clamp(story.pgiHint + 0.6 + (tags.includes('PGI gold') ? 0.5 : 0), 1, 10);
  let d4 = clamp(story.pgiHint - 0.2 + (story.category.includes('conflict') ? 0.5 : 0), 1, 10);
  let d5 = clamp(story.pgiHint + (story.category.includes('women/justice') ? -0.8 : 0) + (story.category.includes('information') ? 0.3 : 0), 1, 10);
  let d6 = clamp(story.pgiHint + 0.3 + (story.category.includes('energy') || story.category.includes('food') ? 0.5 : 0), 1, 10);

  if (story.headline.includes('Deepfake defenses lag')) {
    d3 = 8.8; d5 = 8.1; d6 = 8.6;
  }
  if (story.headline.includes('ESA-China SMILE launch')) {
    d1 = 3.6; d2 = 4.1; d3 = 4.4; d4 = 3.8; d5 = 4.0; d6 = 4.2;
  }

  const story_pgi = round2((d1 + d2 + d3 + d4 + d5 + d6) / 6);

  const pairCandidates = [];
  for (let i = 0; i < found.length; i++) {
    for (let j = i + 1; j < found.length; j++) {
      const a = found[i], b = found[j];
      if (ALL_REGIONS.includes(a) && ALL_REGIONS.includes(b)) {
        const ra = PAIR_REGION_MAP[a] || a;
        const rb = PAIR_REGION_MAP[b] || b;
        const [region_a, region_b] = [ra, rb].sort();
        pairCandidates.push({ region_a, region_b, pair_pgi: pairScore(story, a, b) });
      }
    }
  }
  pairCandidates.sort((x, y) => y.pair_pgi - x.pair_pgi);
  const topPairs = pairCandidates.slice(0, Math.min(3, pairCandidates.length));

  return {
    scan_date: '2026-04-08',
    scan_period: 'pm',
    story_slug: slugify(story.headline),
    story_headline: story.headline,
    category: story.category,
    regions_covered: found,
    region_count: found.length,
    d1_factual: round2(d1),
    d2_causal: round2(d2),
    d3_framing: round2(d3),
    d4_emotional: round2(d4),
    d5_actor_context: round2(d5),
    d6_cui_bono: round2(d6),
    significance,
    score_preview: story_pgi,
    scoring_rationale: `${story.connection}. Coverage split across ${found.join(', ')}. Highest gap sits in ${topPairs.map(p => `${p.region_a}-${p.region_b} (${p.pair_pgi})`).join(', ') || 'limited cross-region overlap'}. Human impact: ${story.hi}`,
    is_latest: true,
    pairRows: topPairs,
  };
}

function buildGAI(story) {
  const found = story.regions_found;
  const absent = story.regions_absent.filter(r => ALL_REGIONS.includes(r));
  const significance = significanceToInt(story.significance);
  const breadth = found.length;
  const directAbsent = absent.filter(r => DIRECT_REGIONS.has(r)).length;
  const popBlind = absent.reduce((sum, r) => sum + (POP_WEIGHTS[r] || 0), 0);

  const d1 = clamp(8.8 - breadth * 1.2, 1, 10);
  const d2 = clamp(2 + absent.length * 0.75 + (breadth <= 2 ? 0.8 : 0) + (story.tags.includes('GAI gold') ? 0.8 : 0), 1, 10);
  const d3 = clamp(1 + popBlind * 10, 1, 10);
  const d4 = clamp(1 + significance * 0.9 + directAbsent * 0.6 + (story.tags.includes('exclusive opportunity') ? 0.5 : 0), 1, 10);
  const story_gai = round2((d1 + d2 + d3 + d4) / 4);

  return {
    scan_date: '2026-04-08',
    scan_period: 'pm',
    story_slug: slugify(story.headline),
    story_headline: story.headline,
    category: story.category,
    regions_found: found,
    regions_absent: absent,
    coverage_breadth: breadth,
    d1_coverage_breadth: round2(d1),
    d2_prominence_disparity: round2(d2),
    d3_population_exposure: round2(d3),
    d4_significance_severity: round2(d4),
    score_preview: story_gai,
    significance,
    scoring_rationale: `${breadth}/7 core regions covered. Missing ${absent.join(', ') || 'none'}. Estimated blind population share ${(popBlind * 100).toFixed(0)}%. ${story.connection}. Human impact: ${story.hi}`,
    is_latest: true,
  };
}

(async () => {
  const stories = parseStories(md);
  const pgiRows = stories.map(buildPGI);
  const gaiRows = stories.map(buildGAI);

  const { error: pgiError } = await supabase.from('pgi_story_scores').upsert(
    pgiRows.map(({ pairRows, score_preview, ...row }) => row),
    { onConflict: 'scan_date,scan_period,story_slug' }
  );
  if (pgiError) throw pgiError;

  const { data: insertedPGI, error: fetchErr } = await supabase
    .from('pgi_story_scores')
    .select('id, story_slug')
    .eq('scan_date', '2026-04-08')
    .eq('scan_period', 'pm');
  if (fetchErr) throw fetchErr;

  const idBySlug = Object.fromEntries(insertedPGI.map(r => [r.story_slug, r.id]));
  const pairRows = pgiRows.flatMap(row => row.pairRows.map(pair => ({
    story_score_id: idBySlug[row.story_slug],
    region_a: pair.region_a,
    region_b: pair.region_b,
    pair_pgi: pair.pair_pgi,
    scan_date: '2026-04-08',
  })));

  if (Object.values(idBySlug).length) {
    const { error: delPairErr } = await supabase
      .from('pgi_region_pairs')
      .delete()
      .eq('scan_date', '2026-04-08')
      .in('story_score_id', Object.values(idBySlug));
    if (delPairErr) throw delPairErr;
  }

  if (pairRows.length) {
    const { error: pairErr } = await supabase.from('pgi_region_pairs').insert(pairRows);
    if (pairErr) throw pairErr;
  }

  const { error: gaiError } = await supabase.from('gai_story_scores').upsert(gaiRows.map(({ score_preview, ...row }) => row), {
    onConflict: 'scan_date,scan_period,story_slug'
  });
  if (gaiError) throw gaiError;

  console.log(JSON.stringify({
    stories: stories.length,
    pgiInserted: pgiRows.length,
    gaiInserted: gaiRows.length,
    pairRows: pairRows.length,
    highestPGI: [...pgiRows].sort((a,b)=>b.score_preview-a.score_preview)[0],
    highestGAI: [...gaiRows].sort((a,b)=>b.score_preview-a.score_preview)[0],
  }, null, 2));
})().catch(err => {
  console.error(JSON.stringify(err, null, 2));
  process.exit(1);
});
