import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.SCAN_INGEST_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Create the breaking_news table using Supabase's pg-meta API
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
    DO $$ BEGIN
      CREATE POLICY "breaking_news_public_read" ON public.breaking_news
        FOR SELECT USING (true);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `;

  // Use the Supabase pg-meta SQL execution endpoint
  const res = await fetch(`${supabaseUrl}/pg/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  const text = await res.text();
  
  if (!res.ok) {
    // Try alternative: use the /sql endpoint  
    const res2 = await fetch(`${supabaseUrl}/sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    const text2 = await res2.text();
    return NextResponse.json({ 
      pg_query: { status: res.status, body: text },
      sql: { status: res2.status, body: text2 },
      message: "Tried both endpoints"
    });
  }

  return NextResponse.json({ success: true, body: text });
}
