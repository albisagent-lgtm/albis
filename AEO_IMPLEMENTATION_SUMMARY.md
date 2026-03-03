# AEO (Answer Engine Optimization) Implementation Summary

**Date:** 2026-03-02  
**Status:** ✅ Complete  

## Changes Implemented

### 1. ✅ PGI Citeable Data Rule in Article Cron Prompts

Updated **18 article-writing cron jobs** with PGI data citation rule:

**Rule added:**
```
If this topic has been PGI-scored in recent scans, include at least one specific PGI data point as a standalone quotable sentence. Example format: "The Albis Perception Gap Index scored this story 8.5, with Middle Eastern and US outlets diverging most sharply at 9.8." Only include PGI data when real scores exist — never fabricate. Check /Users/treelight/.openclaw/workspace/memory/scans/YYYY-MM-DD.md for recent PGI scores.
```

**Updated crons:**
- Weekly Deep Piece (Monday 9am)
- Breaking News AM (after scan)
- Breaking News PM (after scan)
- Daily Explainer (12pm)
- Quick Take 1 (9am NZST)
- Quick Take 2 (3pm NZST)
- Quick Take 3 (9pm NZST)
- Quick Take (10am NZST)
- Explainer (11am NZST)
- Quick Take (1:30pm NZST)
- Explainer (5pm NZST)
- Quick Take (10pm NZST)
- AI & Intelligence Tools (9:30am)
- Clean Energy & Water (11:30am)
- Health & Longevity (2:30pm)
- Education & Human Development (5:30pm)
- Information & Attention (9:30pm)
- SEO Keyword Cluster Article (Sunday 5pm)

**Backup:** `/Users/treelight/.openclaw/cron/jobs.json.bak-aeo`

### 2. ✅ robots.txt + ai.txt for AI Crawler Access

**Updated:** `/Users/treelight/.openclaw/workspace/albis-app/public/robots.txt`
- Explicitly allowed: GPTBot, PerplexityBot, Google-Extended, Amazonbot, ClaudeBot, anthropic-ai
- All AI crawlers have unrestricted access to public content

**Created:** `/Users/treelight/.openclaw/workspace/albis-app/public/ai.txt`
- Signals AI crawlers are welcome
- Explains Albis mission and content types
- Provides citation preferences
- Contact information for methodology questions

### 3. ✅ Glossary Page at /glossary

**Created:** `/Users/treelight/.openclaw/workspace/albis-app/src/app/glossary/page.tsx`

**Terms defined:**
- Perception Gap Index
- PGI Tributaries
- Media Framing
- Narrative Divergence
- Information Warfare
- Framing Bias
- Perception Gap
- Editorial Lens
- Cui Bono

**Features:**
- Clean, professional design (Economist-meets-Apple aesthetic)
- DefinedTerm schema markup (JSON-LD) for each term
- Anchor links for each definition
- NOT in main navigation (discoverable via internal links and search)
- No emojis

### 4. ✅ dateModified Markup on Articles

**Updated files:**
- `/Users/treelight/.openclaw/workspace/albis-app/src/lib/blog.ts` - Added `updatedDate` field to BlogPost interface
- `/Users/treelight/.openclaw/workspace/albis-app/src/app/blog/[slug]/page.tsx` - Added visible "Updated" date and JSON-LD dateModified

**Features:**
- Shows "Updated" date below author byline when article has been modified
- Format: "Updated March 2, 2026 · 02:05 UTC" (UTC timezone)
- Only displays when `updatedDate` differs from `date`
- Clean, subtle styling (text-sm, lighter color)
- JSON-LD schema includes `dateModified` field

**Usage:** Add `updatedDate: "YYYY-MM-DD"` to article frontmatter when updating content

### 5. ✅ PGI Data Page at /perception-gap/data

**Created:** `/Users/treelight/.openclaw/workspace/albis-app/src/app/perception-gap/data/page.tsx`

**Features:**
- Current daily PGI score with tier label
- All 7 PGI tributaries (GP, IW, WR, EC, TE, HE, CL) with current readings
- Top 10 scored stories from past 7 days
- Top 10 most divergent region pairs from past 7 days
- Pulls from Supabase tables: `pgi_daily`, `pgi_story_scores`, `pgi_region_pairs`
- Clean professional design, no emojis
- Publicly accessible
- Structured data friendly
- Link back to main PGI overview

**URL:** https://www.albis.news/perception-gap/data

### 6. ✅ Navigation Cleanup — Quiz Removed

**Updated files:**
- `/Users/treelight/.openclaw/workspace/albis-app/src/app/components/nav-auth.tsx` - Removed Quiz from desktop nav
- `/Users/treelight/.openclaw/workspace/albis-app/src/app/components/mobile-nav.tsx` - Removed Quiz from mobile nav (both guest and authenticated)

**Final navigation:**
- The Lens
- Perspectives
- PGI (replaces Quiz in mobile nav)
- About
- Settings (authenticated users only, mobile nav)

**Note:** Quiz page remains accessible at `/quiz` via direct URL, just not in navigation

## Files Modified

1. `/Users/treelight/.openclaw/cron/jobs.json` (18 cron jobs updated)
2. `/Users/treelight/.openclaw/workspace/albis-app/public/robots.txt`
3. `/Users/treelight/.openclaw/workspace/albis-app/public/ai.txt` (NEW)
4. `/Users/treelight/.openclaw/workspace/albis-app/src/app/glossary/page.tsx` (NEW)
5. `/Users/treelight/.openclaw/workspace/albis-app/src/lib/blog.ts`
6. `/Users/treelight/.openclaw/workspace/albis-app/src/app/blog/[slug]/page.tsx`
7. `/Users/treelight/.openclaw/workspace/albis-app/src/app/perception-gap/data/page.tsx` (NEW)
8. `/Users/treelight/.openclaw/workspace/albis-app/src/app/components/nav-auth.tsx`
9. `/Users/treelight/.openclaw/workspace/albis-app/src/app/components/mobile-nav.tsx`

## Backups Created

- `/Users/treelight/.openclaw/cron/jobs.json.bak-aeo`

## Testing Checklist

Before deployment:
- [x] All cron jobs updated with PGI rule
- [x] robots.txt allows AI crawlers
- [x] ai.txt created
- [x] Glossary page created with schema markup
- [x] Blog posts support updatedDate field
- [x] PGI data page pulls from Supabase
- [x] Quiz removed from navigation

After deployment:
- [ ] Test /glossary page loads correctly
- [ ] Test /perception-gap/data page shows current PGI data
- [ ] Verify article updatedDate displays correctly
- [ ] Check robots.txt is accessible
- [ ] Check ai.txt is accessible
- [ ] Verify navigation shows: The Lens | Perspectives | PGI | About

## Expected Impact

**Answer Engine Optimization:**
- AI systems can now cite specific PGI scores from articles
- Crawlers explicitly welcomed via robots.txt and ai.txt
- Glossary provides definitive term definitions with schema markup
- PGI data page offers structured, quotable current scores
- Article modification dates provide freshness signals

**User Experience:**
- Cleaner navigation without Quiz clutter
- Dedicated PGI data page for quick reference
- Glossary accessible for term clarification
- Updated dates show article freshness

## Next Steps

1. Deploy to production
2. Monitor answer engine citations of PGI data
3. Track glossary page discovery and internal linking
4. Verify schema markup in Google Search Console
5. Consider adding more internal links to /glossary from articles

---

**Implementation by:** OpenClaw Agent (Subagent: aeo-build)  
**Requested by:** Ignatius (via Telegram)
