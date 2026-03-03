# Breaking News Table Setup

The `breaking_news` table needs to be created manually in the Supabase dashboard.

## Steps:

1. Go to https://supabase.com/dashboard/project/wguydvzpxwsgrhvojpnk
2. Click on "SQL Editor" in the left sidebar
3. Create a new query and paste the following SQL:

```sql
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
```

4. Run the query (F5 or click "Run")
5. Verify the table exists by checking the "Table Editor"

## After Table Creation:

Test the breaking news system:

```bash
# Test POST (set breaking news)
curl -X POST "https://www.albis.news/api/breaking" \
  -H "Authorization: Bearer d328fe4b3da2a1bc20edeae7719865b8daf934ded161fb65a521a6b856302273" \
  -H "Content-Type: application/json" \
  -d '{
    "headline": "Iran Confirms Supreme Leader Khamenei Dead as US Strikes Continue",
    "url": "/blog/khamenei-confirmed-dead-iran-succession-crisis-2026",
    "active": true
  }'

# Test GET (fetch active breaking news)
curl "https://www.albis.news/api/breaking"
```

## What's Already Built:

✅ BreakingNewsBanner component (`src/app/components/breaking-news-banner.tsx`)
✅ RightNow component (`src/app/components/right-now.tsx`)
✅ Breaking News API (`src/app/api/breaking/route.ts`)
✅ Integrated into root layout
✅ Hero shrinks when breaking news is active
✅ Deployed to production

The system is ready - just needs the database table created!
