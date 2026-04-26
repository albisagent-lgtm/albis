const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\n/).filter(Boolean).filter(l=>!l.startsWith('#')).map(l=>{const i=l.indexOf('='); return [l.slice(0,i), l.slice(i+1)];}));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
(async()=>{
  const { data: scans, error: scanErr } = await supabase.from('scans').select('id,scan_date,scan_time,items,created_at').order('scan_date',{ascending:false}).order('scan_time',{ascending:true}).limit(12);
  if (scanErr) throw scanErr;
  console.log('Recent scans:', JSON.stringify(scans.map(s=>({id:s.id,date:s.scan_date,time:s.scan_time,items:Array.isArray(s.items)?s.items.length:null,created_at:s.created_at})), null, 2));
  const scanIds = scans.map(s=>s.id);
  const { data: rows, error } = await supabase.from('scan_items').select('id,scan_id,headline,created_at').in('scan_id', scanIds).limit(5000);
  if (error) throw error;
  const map = new Map();
  for (const r of rows) {
    const key = `${r.scan_id}::${String(r.headline||'').trim().toLowerCase()}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  }
  const dups = [...map.entries()].filter(([,arr])=>arr.length>1);
  console.log('Rows fetched:', rows.length, 'duplicate groups:', dups.length);
  console.log('Sample dups:', JSON.stringify(dups.slice(0,10).map(([k,arr])=>({key:k,count:arr.length,ids:arr.map(x=>x.id),created_at:arr.map(x=>x.created_at)})), null, 2));
})().catch(err => { console.error(err); process.exit(1); });
