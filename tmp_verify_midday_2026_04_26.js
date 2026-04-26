const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local','utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
(async()=>{
  const [pgi, pairs, gai] = await Promise.all([
    supabase.from('pgi_story_scores').select('id', { count: 'exact', head: true }).eq('scan_date','2026-04-26').eq('scan_period','midday'),
    supabase.from('pgi_region_pairs').select('id', { count: 'exact', head: true }).eq('scan_date','2026-04-26'),
    supabase.from('gai_story_scores').select('id', { count: 'exact', head: true }).eq('scan_date','2026-04-26').eq('scan_period','midday')
  ]);
  console.log(JSON.stringify({ pgiCount: pgi.count, pairCount: pairs.count, gaiCount: gai.count, pgiError: pgi.error, pairError: pairs.error, gaiError: gai.error }, null, 2));
})();
