const fs = require('fs');
const { createClient } = require('/Users/treelight/.openclaw/workspace/albis-app/node_modules/@supabase/supabase-js');
const env = fs.readFileSync('/Users/treelight/.openclaw/workspace/albis-app/.env.local','utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
(async()=>{
 const {data,error}=await supabase.from('pgi_signature_pieces').select('*').order('date',{ascending:false}).limit(1).maybeSingle();
 console.log(JSON.stringify({data,error,keys:data?Object.keys(data):null},null,2));
})();