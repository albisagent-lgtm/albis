const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv(file) {
  const raw = fs.readFileSync(file, 'utf8');
  return Object.fromEntries(
    raw
      .split(/\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i), l.slice(i + 1)];
      })
  );
}

const env = loadEnv(path.join(__dirname, '..', '.env.local'));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const REGION_ALIASES = {
  us: 'us',
  eu: 'eu',
  europe: 'eu',
  'middle east': 'middle_east',
  middle_east: 'middle_east',
  asia: 'asia_pacific',
  'asia pacific': 'asia_pacific',
  asia_pacific: 'asia_pacific',
  pacific: 'asia_pacific',
  south_asia: 'south_asia',
  'south asia': 'south_asia',
  africa: 'africa',
  latam: 'latam',
  'latin america': 'latam',
  americas: 'latam',
  'latin americas': 'latam',
  'eastern europe': 'eu',
  global: 'global',
};

const REGION_POP = {
  us: 380,
  eu: 750,
  middle_east: 680,
  africa: 1300,
  south_asia: 2000,
  asia_pacific: 2400,
  latam: 660,
};
const WORLD_POP = Object.values(REGION_POP).reduce((a, b) => a + b, 0);

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function normRegion(r) {
  if (!r) return null;
  const key = String(r).trim().toLowerCase().replace(/-/g, ' ');
  return REGION_ALIASES[key] || REGION_ALIASES[key.replace(/\s+/g, '_')] || key.replace(/\s+/g, '_');
}

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function significanceNum(sig) {
  const s = String(sig || '').toLowerCase();
  if (s.includes('critical')) return 5;
  if (s.includes('high')) return 4;
  if (s.includes('medium')) return 3;
  if (s.includes('low')) return 2;
  return 3;
}

function clamp(n, lo = 1, hi = 10) {
  return Math.max(lo, Math.min(hi, n));
}

function r1(n) {
  return Math.round(n * 10) / 10;
}

function estimateBasePGI(item) {
  if (typeof item.perception_gap === 'number') return clamp(item.perception_gap);
  const covered = item.coverage_breadth || (item.regions_found || []).length || 1;
  const sig = significanceNum(item.significance);
  const category = String(item.category || '');
  let base = 3.5;
  if (/current|conflict|war|migration/.test(category)) base += 0.8;
  if (/economic|food|health/.test(category)) base += 0.3;
  if (/tech|climate/.test(category)) base -= 0.2;
  if (covered <= 2) base += 0.5;
  if (sig >= 4) base += 0.4;
  return clamp(base);
}

function derivePgiDims(base, item) {
  const category = String(item.category || '');
  let d1 = base - 1.0;
  let d2 = base + (/current|conflict|economic|food/.test(category) ? 0.4 : 0.1);
  let d3 = base + 0.8;
  let d4 = base + (/health|food|current|conflict/.test(category) ? 0.6 : 0.1);
  let d5 = base + (/current|conflict|tech-ai/.test(category) ? 0.5 : 0.2);
  let d6 = base + (/economic|current|conflict/.test(category) ? 0.4 : 0.2);
  if ((item.regions_found || []).length <= 2) {
    d1 -= 0.4;
    d3 += 0.2;
  }
  return {
    d1_factual: r1(clamp(d1)),
    d2_causal: r1(clamp(d2)),
    d3_framing: r1(clamp(d3)),
    d4_emotional: r1(clamp(d4)),
    d5_actor_context: r1(clamp(d5)),
    d6_cui_bono: r1(clamp(d6)),
  };
}

function pairScore(base, a, b, item) {
  const found = new Set((item.regions_found || []).map(normRegion));
  let score = base;
  const pair = [a, b].sort().join('_');
  if (pair.includes('us') && pair.includes('middle_east')) score += 1.2;
  if (pair.includes('us') && pair.includes('south_asia')) score += 0.8;
  if (pair.includes('eu') && pair.includes('middle_east')) score += 0.7;
  if (pair.includes('latam') && pair.includes('us')) score += 0.6;
  if (pair.includes('africa') && pair.includes('eu')) score += 0.5;
  if (!found.has(a) || !found.has(b)) score -= 0.8;
  return r1(clamp(score));
}

function deriveGai(item) {
  const found = uniq((item.regions_found || []).map(normRegion)).filter((r) => r !== 'global');
  const absent = uniq((item.regions_absent || []).map(normRegion)).filter((r) => r !== 'global');
  const covered = item.coverage_breadth || found.length || 1;
  const significance = significanceNum(item.significance);
  const missingPop = absent.reduce((sum, r) => sum + (REGION_POP[r] || 0), 0);
  const exposureShare = missingPop / WORLD_POP;
  const regionSigVals = Object.values(item.region_significance || {});
  const prominenceDisp = regionSigVals.length > 1 ? Math.max(...regionSigVals) - Math.min(...regionSigVals) + 1 : 2;
  const d1 = clamp(8 - covered); // 1 region -> 7, 6 regions -> 2
  const d2 = clamp(prominenceDisp);
  const d3 = clamp(1 + exposureShare * 9);
  const d4 = clamp(1 + ((significance - 1) / 4) * 6 + ((7 - covered) / 6) * 2);
  const story_gai = r1((d1 + d2 + d3 + d4) / 4);
  return {
    found,
    absent,
    d1_coverage_breadth: r1(d1),
    d2_prominence_disparity: r1(d2),
    d3_population_exposure: r1(d3),
    d4_significance_severity: r1(d4),
    story_gai,
  };
}

(async () => {
  const { data: scans, error } = await supabase
    .from('scans')
    .select('id, scan_date, scan_time, created_at, top_theme, raw_markdown, items')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;

  const scan = (scans || []).find((s) => Array.isArray(s.items) && s.items.length > 0);
  if (!scan) throw new Error('No non-empty scan found');

  const scan_date = scan.scan_date;
  const scan_period = String(scan.scan_time || 'am').toLowerCase();

  let scoreCount = 0;
  let pairCount = 0;

  for (const item of scan.items) {
    const story_slug = slugify(item.headline);
    const basePGI = estimateBasePGI(item);
    const pgiDims = derivePgiDims(basePGI, item);
    const regionsCovered = uniq((item.regions_found || item.regions || []).map(normRegion)).filter((r) => r && r !== 'global');
    const significance = significanceNum(item.significance);

    const pgiRow = {
      story_slug,
      story_headline: item.headline,
      category: item.category,
      regions_covered: regionsCovered,
      region_count: regionsCovered.length,
      ...pgiDims,
      significance,
      scoring_rationale: `${item.connection || 'Story shows clear regional framing divergence.'} Base PGI estimated at ${basePGI}/10 from scan framing notes, regional spread, and story significance.`,
      scan_date,
      scan_period,
      is_latest: true,
    };

    const { data: inserted, error: pgiErr } = await supabase
      .from('pgi_story_scores')
      .upsert(pgiRow, { onConflict: 'story_slug,scan_date,scan_period', ignoreDuplicates: false })
      .select('id')
      .single();
    if (pgiErr) throw pgiErr;
    scoreCount++;

    for (let i = 0; i < regionsCovered.length; i++) {
      for (let j = i + 1; j < regionsCovered.length; j++) {
        const region_a = [regionsCovered[i], regionsCovered[j]].sort()[0];
        const region_b = [regionsCovered[i], regionsCovered[j]].sort()[1];
        const pair_pgi = pairScore(basePGI, region_a, region_b, item);
        const { error: pairErr } = await supabase.from('pgi_region_pairs').upsert({
          story_score_id: inserted.id,
          region_a,
          region_b,
          pair_pgi,
          scan_date,
        }, { onConflict: 'story_score_id,region_a,region_b', ignoreDuplicates: false });
        if (pairErr) throw pairErr;
        pairCount++;
      }
    }

    const gai = deriveGai(item);
    const gaiRow = {
      scan_date,
      scan_period,
      story_slug,
      story_headline: item.headline,
      category: item.category,
      regions_found: gai.found,
      regions_absent: gai.absent,
      coverage_breadth: item.coverage_breadth || gai.found.length,
      d1_coverage_breadth: gai.d1_coverage_breadth,
      d2_prominence_disparity: gai.d2_prominence_disparity,
      d3_population_exposure: gai.d3_population_exposure,
      d4_significance_severity: gai.d4_significance_severity,
      story_gai: gai.story_gai,
      significance,
      scoring_rationale: `${item.connection || 'Coverage asymmetry detected.'} Covered in ${gai.found.length} regions; absent from ${gai.absent.length}. Missing-population share ≈ ${Math.round((gai.absent.reduce((s, r) => s + (REGION_POP[r] || 0), 0) / WORLD_POP) * 100)}%.`,
      is_latest: true,
    };

    const { error: gaiErr } = await supabase
      .from('gai_story_scores')
      .upsert(gaiRow, { onConflict: 'scan_date,scan_period,story_slug', ignoreDuplicates: false });
    if (gaiErr) throw gaiErr;
  }

  console.log(JSON.stringify({
    ok: true,
    scan_id: scan.id,
    scan_date,
    scan_period,
    story_count: scan.items.length,
    pgi_scores_upserted: scoreCount,
    pgi_region_pairs_upserted: pairCount,
    top_theme: scan.top_theme,
  }, null, 2));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
