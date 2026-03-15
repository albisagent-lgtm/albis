const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wguydvzpxwsgrhvojpnk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndXlkdnpweHdzZ3Jodm9qcG5rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUyMzg1MiwiZXhwIjoyMDg3MDk5ODUyfQ.KuAP49LLd77I3dfM6PIwQ8u0qErrURYMvbq-Snw3gDU'
);

async function checkTables() {
  // Try articles table
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('*')
    .limit(1);

  console.log('Articles table:', articlesError ? `ERROR: ${articlesError.message}` : 'EXISTS');
  
  // Try blog_posts table
  const { data: blogPosts, error: blogError } = await supabase
    .from('blog_posts')
    .select('*')
    .limit(1);

  console.log('Blog_posts table:', blogError ? `ERROR: ${blogError.message}` : 'EXISTS');
}

checkTables();
