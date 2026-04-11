const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(Boolean).filter(l=>!l.startsWith('#')).map(l=>{const i=l.indexOf('='); return [l.slice(0,i), l.slice(i+1)]}));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
(async () => {
  for (const table of ['pgi_story_scores','pgi_region_pairs','gai_story_scores']) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    console.log('\nTABLE', table);
    if (error) console.log('ERROR', error);
    else console.log(JSON.stringify(data, null, 2));
  }
})();
