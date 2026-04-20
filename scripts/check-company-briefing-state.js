const { createClient } = require('@supabase/supabase-js');

const projectUrl = 'https://wguydvzpxwsgrhvojpnk.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_xvK9Nt9uO-jSZ5_0w1Facw_fb8_fEdN';
const COMPANY_ID = process.argv[2] || '6330ca52-2e75-49db-8c9a-5d97ad38a28a';
const DATE = process.argv[3] || '2026-04-19';

const supabase = createClient(projectUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

(async () => {
  const [{ data: scores, error: scoreErr }, { data: briefings, error: briefingErr }] = await Promise.all([
    supabase
      .from('company_story_scores')
      .select('company_profile_id, scan_date, story_headline, relevance_score, selected_for_briefing')
      .eq('company_profile_id', COMPANY_ID)
      .eq('scan_date', DATE)
      .order('relevance_score', { ascending: false }),
    supabase
      .from('company_briefings')
      .select('*')
      .eq('company_profile_id', COMPANY_ID)
      .eq('briefing_date', DATE)
      .order('created_at', { ascending: false })
  ]);

  console.log(JSON.stringify({
    company_profile_id: COMPANY_ID,
    date: DATE,
    score_error: scoreErr ? scoreErr.message : null,
    briefing_error: briefingErr ? briefingErr.message : null,
    score_rows_count: scores ? scores.length : null,
    top_scores: scores ? scores.slice(0, 10) : null,
    briefing_rows_count: briefings ? briefings.length : null,
    briefings
  }, null, 2));
})().catch(err => {
  console.error(err);
  process.exit(1);
});
