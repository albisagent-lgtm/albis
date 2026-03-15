#!/usr/bin/env node
// Backfill articles with Unsplash image URLs based on tags
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const BLOG_DIR = join(import.meta.dirname, '..', 'content', 'blog');
let count = 0;
let skipped = 0;

const files = readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));

for (const file of files) {
  const filePath = join(BLOG_DIR, file);
  let content = readFileSync(filePath, 'utf8');
  
  // Check if already has a non-default image
  const imageMatch = content.match(/^image:\s*["']?(.+?)["']?\s*$/m);
  if (imageMatch && !imageMatch[1].includes('og-image.png')) {
    skipped++;
    continue;
  }

  // Extract tags
  let tags = [];
  const tagsBlockMatch = content.match(/^tags:\s*\n((?:\s+-\s+.+\n?)+)/m);
  if (tagsBlockMatch) {
    tags = tagsBlockMatch[1].match(/"\s*([^"]+)\s*"/g)?.map(t => t.replace(/"/g, '').trim()) || [];
  } else {
    const tagsInlineMatch = content.match(/^tags:\s*\[(.+)\]/m);
    if (tagsInlineMatch) {
      tags = tagsInlineMatch[1].split(',').map(t => t.replace(/"/g, '').trim());
    }
  }

  if (tags.length === 0) {
    skipped++;
    continue;
  }

  // Use first 2-3 meaningful tags as keywords, skip meta tags
  const skipTags = new Set(['explainer', 'mechanism-library', 'media-literacy', 'quick-take', 'reactive', 'breaking']);
  const keywords = tags
    .filter(t => !skipTags.has(t.toLowerCase()))
    .slice(0, 3)
    .map(t => t.replace(/\s+/g, '-'))
    .join(',');

  if (!keywords) {
    skipped++;
    continue;
  }

  const url = `https://source.unsplash.com/1200x630/?${encodeURIComponent(keywords)}`;

  if (imageMatch) {
    // Replace existing image line
    content = content.replace(/^image:\s*.*$/m, `image: "${url}"`);
  } else {
    // Add after date line
    content = content.replace(/^(date:\s*.+)$/m, `$1\nimage: "${url}"`);
  }

  writeFileSync(filePath, content);
  count++;
}

console.log(`Backfilled: ${count} articles`);
console.log(`Skipped: ${skipped} articles`);
