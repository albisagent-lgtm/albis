const fs = require('fs');
const { createClient } = require('./node_modules/@supabase/supabase-js');
const env = fs.readFileSync('/Users/treelight/.openclaw/workspace/.env.credentials', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceRoleKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, serviceRoleKey);
(async () => {
  const { data, error } = await supabase.from('pgi_daily').select('*').order('date', { ascending: false }).limit(5);
  if (error) throw error;
  console.log(JSON.stringify(data, null, 2));
})().catch(err => { console.error(err); process.exit(1); });