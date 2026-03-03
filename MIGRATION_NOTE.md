# Database Migration Required

## Blog Posts Table

The blog_posts table needs to be created in Supabase. Run this migration:

**File:** `supabase/migrations/20260301_create_blog_posts.sql`

### To run the migration:

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/wguydvzpxwsgrhvojpnk
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/20260301_create_blog_posts.sql`
4. Click "Run"

This will:
- Create the `blog_posts` table with all necessary columns
- Set up proper indexes for performance
- Enable Row Level Security (RLS)
- Create policies for public read access
- Insert the flagship blog post "The Degree You Didn't Know You Had"

### What the migration includes:

The migration creates a blog_posts table with:
- `id` (UUID, primary key)
- `created_at` / `updated_at` (timestamps)
- `title`, `slug`, `author`
- `published_at` (for scheduling)
- `excerpt`, `content` (markdown supported)
- `featured` (boolean flag)
- `tags` (text array)

And it inserts the first flagship Lens article from Ignatius Romero.

### Alternative: Blog post is also saved as markdown

The blog post is also available as a markdown file at:
`content/lens/the-degree-you-didnt-know-you-had.md`

This can be used as a backup or for a static site generator approach if preferred.
