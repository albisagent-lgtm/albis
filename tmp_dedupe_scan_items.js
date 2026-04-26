const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\n/).filter(Boolean).filter(l=>!l.startsWith('#')).map(l=>{const i=l.indexOf('='); return [l.slice(0,i), l.slice(i+1)];}));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

(async()=>{
  let from = 0;
  const pageSize = 1000;
  const rows = [];
  while (true) {
    const { data, error } = await supabase
      .from('scan_items')
      .select('id,scan_id,headline,created_at')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  const byKey = new Map();
  for (const row of rows) {
    const key = `${row.scan_id}::${String(row.headline || '').trim().toLowerCase()}`;
    if (!key.endsWith('::')) {
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(row);
    }
  }

  const toDelete = [];
  let groups = 0;
  for (const [, group] of byKey) {
    if (group.length <= 1) continue;
    groups += 1;
    group.sort((a, b) => {
      const at = new Date(a.created_at || 0).getTime();
      const bt = new Date(b.created_at || 0).getTime();
      if (at !== bt) return bt - at;
      return Number(b.id) - Number(a.id);
    });
    toDelete.push(...group.slice(1).map(r => r.id));
  }

  console.log(`Fetched ${rows.length} rows; duplicate groups=${groups}; rows to delete=${toDelete.length}`);
  for (let i = 0; i < toDelete.length; i += 100) {
    const batch = toDelete.slice(i, i + 100);
    const { error } = await supabase.from('scan_items').delete().in('id', batch);
    if (error) throw error;
    console.log(`Deleted ${Math.min(i + 100, toDelete.length)}/${toDelete.length}`);
  }
  console.log('Done');
})().catch(err => { console.error(err); process.exit(1); });
