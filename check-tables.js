const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wguydvzpxwsgrhvojpnk.supabase.co',
  'REDACTED_SUPABASE_SERVICE_ROLE_KEY'
);

async function checkTables() {
  // Try common table names
  const tables = ['articles', 'posts', 'blog_posts', 'content'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (!error) {
      console.log(`Found table: ${table}`);
      if (data && data[0]) {
        console.log('Sample columns:', Object.keys(data[0]));
      }
      return;
    }
  }
  
  console.log('No common table names found. Error on last attempt:', error);
}

checkTables();
