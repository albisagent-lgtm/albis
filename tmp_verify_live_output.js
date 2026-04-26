const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\n/).filter(Boolean).filter(l=>!l.startsWith('#')).map(l=>{const i=l.indexOf('='); return [l.slice(0,i), l.slice(i+1)];}));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
(async()=>{
  const snap = await supabase.from('site_snapshot').select('*').eq('id',1).single();
  if (snap.error) throw snap.error;
  const articles = await supabase.from('articles').select('slug,title,published_at').order('published_at',{ascending:false}).limit(6);
  if (articles.error) throw articles.error;
  console.log(JSON.stringify({
    snapshot: {
      scan_date: snap.data.scan_date,
      updated_at: snap.data.updated_at,
      top_stories_count: Array.isArray(snap.data.top_stories) ? snap.data.top_stories.length : null,
      top_story_slugs: Array.isArray(snap.data.top_stories) ? snap.data.top_stories.slice(0,5).map(s=>s.slug || s.story_slug || s.title) : null,
      briefing_title: snap.data.briefing?.title || null,
    },
    recent_articles: articles.data,
  }, null, 2));
})();
