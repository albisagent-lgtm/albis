const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const env = fs.readFileSync(path.join(process.cwd(), '.env.local'),'utf8');
for (const line of env.split(/\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async()=>{
  const { data, error } = await supabase.from('scans').select('scan_date,scan_time,items').order('scan_date',{ascending:false}).order('scan_time',{ascending:false}).limit(12);
  if (error) throw error;
  console.log(JSON.stringify(data.map(r=>({scan_date:r.scan_date,scan_time:r.scan_time,count:Array.isArray(r.items)?r.items.length:0})), null, 2));
})().catch(err=>{console.error(err);process.exit(1)})
