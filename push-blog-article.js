#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://wguydvzpxwsgrhvojpnk.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndXlkdnpweHdzZ3Jodm9qcG5rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUyMzg1MiwiZXhwIjoyMDg3MDk5ODUyfQ.KuAP49LLd77I3dfM6PIwQ8u0qErrURYMvbq-Snw3gDU';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createTableAndInsert() {
  // First, create the table if it doesn't exist
  const migrationSQL = fs.readFileSync('./supabase/migrations/20260301_create_blog_posts.sql', 'utf8');
  
  console.log('Creating blog_posts table...');
  const { data: createData, error: createError } = await supabase.rpc('exec_sql', { sql: migrationSQL });
  
  if (createError && !createError.message.includes('already exists')) {
    console.error('Error creating table:', createError);
  } else {
    console.log('✓ Table created or already exists');
  }
  
  // Now insert the article
  const article = {
    title: "Platforms Fight Deepfakes While Governments Ramp Up Censorship",
    content: fs.readFileSync('../temp-article-content.md', 'utf8'),
    slug: "platforms-fight-deepfakes-governments-ramp-censorship",
    author: "Albis Tech & Media Desk",
    published_at: "2026-03-14T04:30:00.000Z",
    excerpt: "YouTube expands deepfake detection to politicians while governments block websites and run covert propaganda campaigns. Information warfare is infrastructure now.",
    featured: false,
    tags: ["information-warfare", "deepfakes", "censorship", "propaganda", "disinformation"]
  };
  
  console.log('Inserting article...');
  const { data, error } = await supabase
    .from('blog_posts')
    .insert(article)
    .select();
  
  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  console.log('✓ Success! Article published:', data[0].slug);
  console.log('  ID:', data[0].id);
  console.log('  Title:', data[0].title);
}

createTableAndInsert();
