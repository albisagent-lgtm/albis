import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wguydvzpxwsgrhvojpnk.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndXlkdnpweHdzZ3Jodm9qcG5rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUyMzg1MiwiZXhwIjoyMDg3MDk5ODUyfQ.KuAP49LLd77I3dfM6PIwQ8u0qErrURYMvbq-Snw3gDU';

const supabase = createClient(supabaseUrl, serviceKey);

const sql = `
CREATE TABLE IF NOT EXISTS public.breaking_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headline text NOT NULL,
  url text,
  active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.breaking_news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "breaking_news_public_read" ON public.breaking_news;
CREATE POLICY "breaking_news_public_read" 
  ON public.breaking_news 
  FOR SELECT 
  USING (true);
`;

// Execute via RPC if available, or we need to use the SQL editor
// Actually, let's use fetch to call the SQL editor endpoint
const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
  },
  body: JSON.stringify({ query: sql })
});

console.log('Response status:', response.status);
console.log('Response body:', await response.text());
