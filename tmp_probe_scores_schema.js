const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local','utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
(async()=>{
  for (const table of ['pgi_story_scores','pgi_region_pairs','gai_story_scores']) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    console.log('\nTABLE', table);
    if (error) console.log('ERROR', error);
    else console.log(JSON.stringify(data, null, 2));
  }
})();
