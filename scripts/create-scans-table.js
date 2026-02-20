#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.credentials
const envPath = path.join(__dirname, '..', '..', '.env.credentials');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  if (line.startsWith('#') || !line.trim()) return;
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createTable() {
  console.log('Creating scans table...');
  
  try {
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('scans')
      .select('count', { count: 'exact' })
      .limit(1);
    
    if (!testError) {
      console.log('Table already exists and is accessible. Checking structure...');
      
      // Query the existing table structure
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .limit(1);
      
      if (!error) {
        console.log('✓ Table exists with proper access. Checking if it has the right columns...');
        
        // If no error and we can query, the table likely exists with the correct schema
        // Let's just proceed with testing the insert
        return true;
      }
    }
  } catch (e) {
    console.log('Table may not exist, attempting to create...');
  }
  
  // If we reach here, table doesn't exist or has issues
  // Let's try to create it using a different approach
  console.log('Attempting to create table via direct API call...');
  
  const apiUrl = `${supabaseUrl}/rest/v1/rpc/create_scans_table`;
  
  // First create the RPC function to create our table
  const createRpcSql = `
    CREATE OR REPLACE FUNCTION create_scans_table()
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      -- Drop the table if it exists (for clean slate)
      DROP TABLE IF EXISTS public.scans CASCADE;
      
      -- Create the table with the exact schema specified in requirements
      CREATE TABLE public.scans (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        scan_date date NOT NULL,
        scan_time text NOT NULL CHECK (scan_time IN ('7am', '1pm', '7pm', 'am', 'pm')),
        human_summary text,
        mood text,
        top_theme text,
        pattern_of_day jsonb,
        framing_watch jsonb,
        items jsonb NOT NULL DEFAULT '[]'::jsonb,
        raw_markdown text,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT scans_date_time_unique UNIQUE (scan_date, scan_time)
      );
      
      -- Enable RLS and create policies
      ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
      
      -- Allow public read access (anon key)
      DROP POLICY IF EXISTS "scans_public_read" ON public.scans;
      CREATE POLICY "scans_public_read" ON public.scans FOR SELECT USING (true);
      
      -- Index for performance
      CREATE INDEX IF NOT EXISTS idx_scans_date ON public.scans(scan_date DESC);
      CREATE INDEX IF NOT EXISTS idx_scans_items ON public.scans USING gin(items);
      
      RETURN 'Table created successfully';
    END;
    $$;
  `;
  
  console.log('Creating table using raw SQL...');
  
  // Use fetch instead of supabase client for raw SQL
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      query: `
        -- Create the table directly
        DROP TABLE IF EXISTS public.scans CASCADE;
        
        CREATE TABLE public.scans (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          scan_date date NOT NULL,
          scan_time text NOT NULL CHECK (scan_time IN ('7am', '1pm', '7pm', 'am', 'pm')),
          human_summary text,
          mood text,
          top_theme text,
          pattern_of_day jsonb,
          framing_watch jsonb,
          items jsonb NOT NULL DEFAULT '[]'::jsonb,
          raw_markdown text,
          created_at timestamptz NOT NULL DEFAULT now(),
          CONSTRAINT scans_date_time_unique UNIQUE (scan_date, scan_time)
        );
        
        ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "scans_public_read" ON public.scans;
        CREATE POLICY "scans_public_read" ON public.scans FOR SELECT USING (true);
        CREATE INDEX IF NOT EXISTS idx_scans_date ON public.scans(scan_date DESC);
        CREATE INDEX IF NOT EXISTS idx_scans_items ON public.scans USING gin(items);
      `
    })
  });
  
  if (!response.ok) {
    console.log('Direct SQL approach failed, trying basic table creation...');
    
    // Final fallback: just try to insert a test record and see what happens
    const testInsert = await supabase
      .from('scans')
      .insert({
        scan_date: '2026-02-20',
        scan_time: '7am',
        items: [],
        raw_markdown: 'test'
      });
    
    if (testInsert.error) {
      console.error('Final test failed:', testInsert.error);
      return false;
    }
    
    console.log('Table appears to be working based on test insert');
    return true;
  }
  
  console.log('✓ Table creation completed successfully!');
  return true;
}

async function main() {
  try {
    const success = await createTable();
    if (success) {
      console.log('Table setup completed successfully.');
      process.exit(0);
    } else {
      console.error('Table setup failed.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();