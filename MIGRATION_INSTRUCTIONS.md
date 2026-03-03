# Briefing Personalization Migration

## Overview
Added personalization layer to the `/briefing` page with category and region preferences.

## Features
- Collapsible preference bar with pill toggles for categories and regions
- Filters briefing to show "Your picks" first, then "Everything else"
- Saves to localStorage (works immediately)
- Syncs to Supabase profile for cross-device support (requires migration)

## Required Migration

The feature works with localStorage immediately, but for cross-device sync, run this SQL in the **Supabase SQL Editor**:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS briefing_preferences JSONB DEFAULT '{}'::jsonb;
```

Or run the migration file:
```bash
# In Supabase SQL Editor, paste contents of:
# supabase/migrations/add_briefing_preferences.sql
```

## How It Works

### UI
- **Preference bar**: Appears at top of briefing page (collapsible)
- **Categories**: Current Events, Tech & AI, Health, Climate & Energy, Economic, Natural World, Culture, Psychology, Grassroots, Weather
- **Regions**: South Asia, East & SE Asia, Middle East, Africa, Eastern Europe, Western World, Latin Americas
- **Active state**: Gold highlight (#c8922a) on selected pills
- **Default**: "All" selected (no filters)

### Data Flow
1. **On load**: Try Supabase profile → fall back to localStorage
2. **On save**: Save to both localStorage AND Supabase (if logged in)
3. **Filtering**: Match `item.category` and `item.regions` against saved preferences

### Persistence
```typescript
// localStorage key
"albis-briefing-prefs"

// Format
{
  categories: string[],  // e.g. ["Current Events", "Tech & AI"]
  regions: string[]      // e.g. ["South Asia", "Western World"]
}

// Supabase column
profiles.briefing_preferences JSONB
```

## Testing
1. Visit `/briefing`
2. Click "Personalise your briefing ✨"
3. Select categories and regions
4. Observe:
   - Pills turn gold when selected
   - Briefing re-organizes into "Your picks" and "Everything else"
   - Preferences persist on reload (localStorage)
   - If logged in + migration run: syncs across devices

## Deployment
```bash
cd albis-app
npx vercel --prod --token=$(grep VERCEL_TOKEN ../.env.credentials | cut -d= -f2)
```
