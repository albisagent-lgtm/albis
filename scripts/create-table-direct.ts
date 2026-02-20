#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env: Record<string, string> = {};
  
  envContent.split('\n').forEach(line => {
    if (line.startsWith('#') || !line.trim()) return;
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });

  return env;
}

async function createTable() {
  const env = loadEnv();
  
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials');
    return false;
  }

  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // First, let's create a simple RPC function to execute SQL
  const createRpcSql = `
    CREATE OR REPLACE FUNCTION create_scans_table()
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      CREATE TABLE IF NOT EXISTS public.scans (
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
      
      RETURN 'Table created successfully';
    END;
    $$;
  `;

  try {
    console.log('Attempting to create RPC function...');
    
    // Try to create the RPC function first using direct HTTP
    const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: createRpcSql })
    });

    if (response.ok) {
      console.log('RPC function created, now calling it...');
      
      // Now call the RPC function
      const { data, error } = await supabase.rpc('create_scans_table');
      
      if (error) {
        console.error('Error calling RPC:', error);
        return false;
      }
      
      console.log('Table creation result:', data);
      return true;
    } else {
      console.log('Direct SQL approach failed, trying alternative...');
      
      // Alternative: try to query an existing table to test connection
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .limit(1);
      
      if (!error) {
        console.log('Table already exists!');
        return true;
      }
      
      console.log('Table does not exist. Please create it manually using the SQL in create-table.sql');
      return false;
    }
  } catch (e) {
    console.error('Error creating table:', e);
    return false;
  }
}

async function main() {
  const success = await createTable();
  if (success) {
    console.log('✓ Table setup completed');
    
    // Test that we can upload data
    console.log('Testing upload script...');
    const uploadScript = await import('./upload-scans-to-supabase');
    // Run a test upload here if needed
    
  } else {
    console.error('✗ Table setup failed');
    console.log('\nPlease manually create the table using the SQL in create-table.sql');
    console.log('You can paste this into the Supabase SQL Editor at:');
    console.log('https://supabase.com/dashboard/project/wguydvzpxwsgrhvojpnk/sql');
  }
}

main().catch(console.error);