#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wguydvzpxwsgrhvojpnk.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const scanDate = process.argv[2] || '2026-02-27';
  
  console.log(`📊 Verifying PGI data for ${scanDate}\n`);
  
  // Check story scores
  const { data: scores, error: scoresError } = await supabase
    .from('pgi_story_scores')
    .select('id, story_slug, scan_date, scan_period, region_count, significance')
    .eq('scan_date', scanDate)
    .order('scan_period', { ascending: true })
    .order('story_slug', { ascending: true });
  
  if (scoresError) {
    console.error('❌ Error fetching scores:', scoresError);
    process.exit(1);
  }
  
  console.log(`✅ Found ${scores.length} story scores:\n`);
  
  const byPeriod = scores.reduce((acc, s) => {
    acc[s.scan_period] = (acc[s.scan_period] || 0) + 1;
    return acc;
  }, {});
  
  Object.entries(byPeriod).forEach(([period, count]) => {
    console.log(`   ${period.toUpperCase().padEnd(7)} ${count} stories`);
  });
  
  console.log('\nSample scores:');
  scores.slice(0, 3).forEach(s => {
    console.log(`  • [${s.scan_period.toUpperCase()}] ${s.story_slug}`);
    console.log(`    Regions: ${s.region_count}, Significance: ${s.significance}`);
  });
  
  // Check region pairs
  const { data: pairs, error: pairsError } = await supabase
    .from('pgi_region_pairs')
    .select('region_a, region_b, pair_pgi')
    .eq('scan_date', scanDate)
    .order('pair_pgi', { ascending: false })
    .limit(10);
  
  if (pairsError) {
    console.error('❌ Error fetching pairs:', pairsError);
    process.exit(1);
  }
  
  console.log(`\n✅ Found ${pairs.length > 0 ? 'region pairs' : '0 region pairs'}`);
  if (pairs.length > 0) {
    console.log('\nTop 10 by PGI score:');
    pairs.forEach(p => {
      console.log(`  • ${p.region_a.padEnd(15)} ↔ ${p.region_b.padEnd(15)} ${p.pair_pgi.toFixed(1)}`);
    });
  }
  
  console.log('\n✨ Verification complete!');
})();
