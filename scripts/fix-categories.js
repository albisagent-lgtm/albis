const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'content', 'blog');

// Map every existing category to the correct newsroom section
const CATEGORY_MAP = {
  // World
  'current-events': 'current-events',
  'current_events': 'current-events',
  'Current Events': 'current-events',
  'geopolitics': 'geopolitics',
  'Geopolitics': 'geopolitics',
  'conflict': 'conflict',
  'Conflict & Security': 'conflict',
  'crisis': 'conflict',
  'crisis-tracker': 'conflict',
  'Crisis Tracker': 'conflict',
  'crisis-analysis': 'conflict',
  'Crisis Analysis': 'conflict',
  'Power & Conflict': 'conflict',
  'power-conflict': 'conflict',
  'migration': 'geopolitics',
  'Migration & Demographics': 'geopolitics',
  'demographics': 'geopolitics',
  'Demographics': 'geopolitics',
  'security': 'conflict',
  'breaking': 'current-events',

  // Politics
  'governance': 'governance',
  'Governance & Rights': 'governance',
  'womens-rights': 'governance',
  'digital-rights': 'governance',

  // Business
  'economic-flows': 'economic-flows',
  'economic': 'economic-flows',
  'economy': 'economic-flows',
  'Economics': 'economic-flows',
  'Economy & Trade': 'economic-flows',
  'markets': 'economic-flows',
  'food': 'economic-flows',
  'food-security': 'economic-flows',
  'food-water': 'economic-flows',
  'food-energy': 'economic-flows',
  'Food & Agriculture': 'economic-flows',
  'Food Security': 'economic-flows',

  // Technology
  'tech-ai': 'tech-ai',
  'tech': 'tech-ai',
  'Technology': 'tech-ai',
  'Technology & AI': 'tech-ai',
  'Tech & Society': 'tech-ai',
  'Tech Geopolitics': 'tech-ai',
  'AI & Technology': 'tech-ai',
  'AI & Intelligence': 'tech-ai',
  'military-ai': 'tech-ai',
  'cyber-info-warfare': 'cyber-info-warfare',
  'information-warfare': 'cyber-info-warfare',
  'Information Warfare': 'cyber-info-warfare',
  'Media & Information': 'cyber-info-warfare',

  // Health
  'health': 'health',
  'Health': 'health',
  'Health & Science': 'health',

  // Science
  'science-space': 'science-space',
  'climate': 'weather-climate',
  'climate-energy': 'climate-energy',
  'Climate, Energy & Natural World': 'climate-energy',
  'energy': 'climate-energy',
  'energy-power': 'climate-energy',
  'Energy & Power': 'climate-energy',
  'Energy & Climate': 'climate-energy',
  'Clean Energy & Water': 'climate-energy',

  // Analysis (perception/media/editorial content)
  'analysis': 'analysis',
  'Analysis': 'analysis',
  'perception-gap-index': 'perception-gap-index',
  'perception-gap': 'perception-gap-index',
  'pgi-breakdown': 'perception-gap-index',
  'PGI Breakdown': 'perception-gap-index',
  'media-literacy': 'media-literacy',
  'Media Literacy': 'media-literacy',
  'Information & Perception': 'analysis',
  'Information & Attention': 'analysis',
  'Information Awareness': 'analysis',
  'data': 'analysis',
  'perspectives': 'analysis',
  'divided': 'analysis',
  'Divided': 'analysis',
  'unseen': 'analysis',
  'Unseen': 'analysis',
  'the-flip': 'analysis',
  'The Flip': 'analysis',
  'under-the-radar': 'analysis',
  'explainer': 'explainer',
  'Explainer': 'explainer',
  'guides': 'explainer',
  'comparison': 'comparison',
  'lens': 'analysis',
  'the-lens': 'analysis',
  'quick-take': 'analysis',
  'Quick Take': 'analysis',
  'trending': 'current-events',
  'Meta': 'analysis',
  'Deep Dive': 'analysis',
  'research': 'analysis',
  'Education & Human Development': 'analysis',
  'weekly-report': 'analysis',
};

// Title-based overrides for articles that should be in specific categories
function guessCategoryFromTitle(title, tags) {
  const t = (title || '').toLowerCase();
  const tagStr = (tags || []).join(' ').toLowerCase();
  
  // Politics signals
  if (t.includes('trump') || t.includes('election') || t.includes('congress') || 
      t.includes('parliament') || t.includes('vote') || t.includes('sanction') ||
      t.includes('legislation') || t.includes('government') || t.includes('rights') ||
      t.includes('protest') || t.includes('democracy')) return 'governance';
  
  // Business signals
  if (t.includes('oil price') || t.includes('market') || t.includes('trade') ||
      t.includes('economy') || t.includes('gdp') || t.includes('inflation') ||
      t.includes('stock') || t.includes('billion') || t.includes('investment') ||
      t.includes('currency') || t.includes('tariff')) return 'economic-flows';
      
  // Technology signals
  if (t.includes('ai ') || t.includes('artificial intelligence') || t.includes('cyber') ||
      t.includes('deepfake') || t.includes('algorithm') || t.includes('robot') ||
      t.includes('tech') || t.includes('data center') || t.includes('chip')) return 'tech-ai';
      
  // Health signals
  if (t.includes('covid') || t.includes('vaccine') || t.includes('health') ||
      t.includes('disease') || t.includes('hospital') || t.includes('medical') ||
      t.includes('drug') || t.includes('pharma')) return 'health';
      
  // Science signals
  if (t.includes('climate') || t.includes('energy') || t.includes('renewable') ||
      t.includes('solar') || t.includes('nuclear') || t.includes('emission') ||
      t.includes('temperature') || t.includes('species')) return 'climate-energy';
  
  return null;
}

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
let changed = 0;
let unchanged = 0;

for (const file of files) {
  const filepath = path.join(BLOG_DIR, file);
  let content = fs.readFileSync(filepath, 'utf-8');
  
  // Extract frontmatter
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) continue;
  
  const fm = match[1];
  const catMatch = fm.match(/^category:\s*"?([^"\n]*)"?\s*$/m);
  if (!catMatch) continue;
  
  const oldCat = catMatch[1].trim();
  let newCat = CATEGORY_MAP[oldCat];
  
  // If still 'analysis' or unmapped, try title-based guess
  if (!newCat || newCat === 'analysis') {
    const titleMatch = fm.match(/^title:\s*"?([^"\n]*)"?\s*$/m);
    const tagsMatch = fm.match(/^tags:\s*\[(.*?)\]/m);
    const title = titleMatch ? titleMatch[1] : '';
    const tags = tagsMatch ? tagsMatch[1].split(',').map(t => t.trim().replace(/"/g, '')) : [];
    
    const guessed = guessCategoryFromTitle(title, tags);
    if (guessed) newCat = guessed;
    else if (!newCat) newCat = 'analysis';
  }
  
  if (newCat !== oldCat) {
    content = content.replace(
      /^category:\s*"?[^"\n]*"?\s*$/m,
      `category: "${newCat}"`
    );
    fs.writeFileSync(filepath, content);
    changed++;
  } else {
    unchanged++;
  }
}

console.log(`Done. Changed: ${changed}, Unchanged: ${unchanged}, Total: ${files.length}`);
