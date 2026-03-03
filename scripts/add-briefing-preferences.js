#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wguydvzpxwsgrhvojpnk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndXlkdnpweHdzZ3Jodm9qcG5rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUyMzg1MiwiZXhwIjoyMDg3MDk5ODUyfQ.KuAP49LLd77I3dfM6PIwQ8u0qErrURYMvbq-Snw3gDU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
  console.log('Adding briefing_preferences column to profiles table...');
  
  // Run the migration using a raw SQL query
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS briefing_preferences JSONB DEFAULT '{}'::jsonb;"
  });

  if (error) {
    console.error('Migration failed:', error);
    
    // Try alternative approach: query the table to check if column exists
    console.log('\nChecking if column already exists...');
    const { data: columns, error: checkError } = await supabase
      .from('profiles')
      .select('briefing_preferences')
      .limit(1);
    
    if (checkError) {
      if (checkError.message.includes('column') && checkError.message.includes('does not exist')) {
        console.log('Column does not exist. Please run this SQL manually in Supabase SQL Editor:');
        console.log('\nALTER TABLE profiles ADD COLUMN IF NOT EXISTS briefing_preferences JSONB DEFAULT \'{}\'::jsonb;\n');
        process.exit(1);
      } else {
        console.error('Error checking column:', checkError);
        process.exit(1);
      }
    } else {
      console.log('✓ Column briefing_preferences already exists!');
      process.exit(0);
    }
  } else {
    console.log('✓ Migration completed successfully!');
    console.log(data);
  }
}

migrate();
