import pkg from 'pg';
const { Client } = pkg;

// Supabase connection string
// Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
const connectionString = 'postgresql://postgres.wguydvzpxwsgrhvojpnk:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndndXlkdnpweHdzZ3Jodm9qcG5rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUyMzg1MiwiZXhwIjoyMDg3MDk5ODUyfQ.KuAP49LLd77I3dfM6PIwQ8u0qErrURYMvbq-Snw3gDU@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

try {
  await client.connect();
  console.log('Connected to database');

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

  const result = await client.query(sql);
  console.log('Table created successfully');
  console.log('Result:', result);
  
  await client.end();
  console.log('Connection closed');
} catch (error) {
  console.error('Error:', error.message);
  console.error('Full error:', error);
  process.exit(1);
}
