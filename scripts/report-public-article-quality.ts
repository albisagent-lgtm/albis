#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.resolve(process.cwd(), 'content/blog');
const OUT_DIR = path.resolve(process.cwd(), '../memory/reports');
const OUT_MD = path.join(OUT_DIR, 'public-article-quality-audit-2026-06-12.md');

const PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'scanner/planner mention', pattern: /\b(?:scan|scanner|selected item|article slot|published set|writeability|draft quality|story plan|article form)\b/i },
  { label: 'planner instruction', pattern: /\b(?:make clear|show how|connect (?:a|the) concrete|use (?:an|a) unusual|report what|write (?:a|the)|article should)\b/i },
  { label: 'template shift phrase', pattern: /\b(?:points to a concrete shift|is the engine here|not a side note|decision space around|is now narrower than it was before)\b/i },
  { label: 'abstract constraint phrase', pattern: /\b(?:where an abstract development starts becoming a practical constraint|the practical test now is whether|stays narrow or forces a wider reset)\b/i },
  { label: 'synthetic meta phrase', pattern: /\b(?:visible event and the practical fallout|this is the point of entry|operating reality|cleanest route into the larger pattern|turns this from a single update into a moving story)\b/i },
  { label: 'generic AI analysis phrase', pattern: /\b(?:this matters because|why it matters|the deeper signal|the headline is about|the underlying story is|the useful question|the useful reading)\b/i },
];

function bodyWithoutFrontmatter(markdown: string): string {
  return markdown.replace(/^---[\s\S]*?---\s*/, '').trim();
}

function titleFromMarkdown(markdown: string, fallback: string): string {
  const match = markdown.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  return (match?.[1] || fallback).replace(/^>-\s*/, '').trim();
}

const files = fs.existsSync(CONTENT_DIR)
  ? fs.readdirSync(CONTENT_DIR).filter((file) => file.endsWith('.md')).sort()
  : [];

const failures = files.flatMap((file) => {
  const abs = path.join(CONTENT_DIR, file);
  const markdown = fs.readFileSync(abs, 'utf8');
  const body = bodyWithoutFrontmatter(markdown);
  const labels = PATTERNS.filter(({ pattern }) => pattern.test(body)).map(({ label }) => label);
  if (!labels.length) return [];
  const firstHit = PATTERNS.find(({ pattern }) => pattern.test(body));
  const excerpt = firstHit
    ? body.slice(Math.max(0, body.search(firstHit.pattern) - 120), body.search(firstHit.pattern) + 220).replace(/\s+/g, ' ').trim()
    : body.slice(0, 250).replace(/\s+/g, ' ').trim();
  return [{ file, title: titleFromMarkdown(markdown, file), labels, excerpt }];
});

fs.mkdirSync(OUT_DIR, { recursive: true });
const lines = [
  '# Public article quality audit — 2026-06-12',
  '',
  `Checked: ${files.length} markdown articles`,
  `Flagged: ${failures.length}`,
  '',
  '## Summary by issue',
  '',
];
for (const { label } of PATTERNS) {
  const count = failures.filter((failure) => failure.labels.includes(label)).length;
  lines.push(`- ${label}: ${count}`);
}
lines.push('', '## Flagged articles', '');
for (const failure of failures) {
  lines.push(`### ${failure.file}`);
  lines.push(`- Title: ${failure.title}`);
  lines.push(`- Issues: ${failure.labels.join(', ')}`);
  lines.push(`- Excerpt: ${failure.excerpt}`);
  lines.push('');
}
fs.writeFileSync(OUT_MD, lines.join('\n'));
console.log(`Wrote ${OUT_MD}`);
console.log(`Flagged ${failures.length}/${files.length} articles`);
