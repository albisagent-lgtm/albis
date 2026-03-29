# Albis Design Spec — Newsroom Model

## Reference Sites
- **Washington Post** — horizontal stacked sections, clear hierarchy, strong typography
- **The Guardian** — bold section headers, color-coded categories, compact story cards
- **New York Times** — clean grid, prominent lead story, sidebar digest
- **Reuters** — wire-service clean, minimal decoration, data-dense

## Key Patterns to Adopt

### Homepage Layout (WaPo/NYT hybrid)
1. **Date bar** — full-width thin bar with date, edition info, scan count
2. **Lead story** — large headline, spans ~60% width, with image
3. **Right rail** — stacked secondary stories (headline + 1-line summary + byline)
4. **Horizontal dividers** — thin rules between story groups (not cards with borders)
5. **Section blocks** — "More News" / "Opinion" / "Latest" as horizontal stacked groups
6. **No card borders on homepage** — stories separated by divider lines, not card containers
7. **Images matter** — lead story always has image, secondary stories may have thumbnails

### Typography (WaPo-style)
- **Headlines:** Serif (Playfair), bold, tight leading (1.15-1.2)
- **Body:** Serif (Source Serif), regular, generous leading (1.7-1.8)
- **UI/Meta:** Sans-serif (Inter), small caps for section labels, tracking-wider
- **Category labels:** ALL CAPS, tiny, tracking-widest, colored underline or background
- **No decorative fonts** — pure editorial typography

### Story Cards (Guardian-style)
- **Minimal:** headline + optional 1-line description + meta (time, region count)
- **No rounded corners on homepage cards** — flat editorial feel
- **Color accent on category** — left border or small colored top stripe
- **Hover:** headline color change only, no shadow/scale transforms

### Article Pages (WaPo)
- **Max-width 680px** for body text (current 720 is close)
- **Author line with link** — "By Author Name" prominent
- **Large featured image** with caption below
- **Pull quotes** — large serif italic, left amber border
- **Related stories** at bottom — simple list, not card grid
- **Reading progress bar** — thin line at top of viewport

### Navigation (NYT/WaPo)
- **Slim nav bar** — logo left, section links center, auth right
- **Sticky on scroll** — but hides on scroll down on mobile
- **Section links:** Today | World | Politics | Business | Tech | Health | Science
- **No hamburger on desktop** — all sections visible

### Dark Mode
- **Background:** #0f0f0f (current)
- **Text:** #f0efec primary, #a1a1aa secondary
- **Borders:** white/[0.06]
- **Cards:** transparent, divider-based
- **Images:** slight brightness reduction

### Mobile
- **Bottom tab bar** — Today, World, Trending, Search, More
- **Single column** — all content stacks vertically
- **Touch targets** — min 44px
- **Safe area padding** — bottom nav respects notch

### Color System
- **Brand amber:** #c8922a (accents, CTAs, active states)
- **Ink:** #0f0f0f (text, backgrounds)
- **Parchment:** #f8f7f4 (light backgrounds)
- **Category colors:** from CATEGORY_META (red for conflict, blue for tech, etc.)
- **Developing/Breaking:** red-600 badge + red-50 background band

### What NOT to Do
- No card shadows on homepage
- No rounded card corners on homepage (flat editorial)
- No gradient backgrounds
- No animation on story cards (just color transition on hover)
- No "Subscribe" as primary CTA in hero (it's woven in naturally)
- No blog-style date-sorted list (newsroom grid hierarchy)
