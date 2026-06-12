#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const CONTENT_DIR = path.resolve(process.cwd(), 'content/blog');

const BANNED_PUBLIC_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
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

function listMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
    .map((file) => path.join(dir, file));
}

const args = new Set(process.argv.slice(2));
const changedOnly = args.has('--changed');
const sinceArg = process.argv.find((arg) => arg.startsWith('--since='));
const sinceMs = sinceArg ? Date.parse(sinceArg.slice('--since='.length)) : NaN;

function changedMarkdownFiles(): string[] {
  try {
    const output = execSync('git diff --name-only -- content/blog && git diff --name-only --cached -- content/blog', {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return Array.from(new Set(output.split(/\r?\n/).filter(Boolean)))
      .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
      .map((file) => path.resolve(process.cwd(), file))
      .filter((file) => fs.existsSync(file));
  } catch {
    return [];
  }
}

let files = changedOnly ? changedMarkdownFiles() : listMarkdownFiles(CONTENT_DIR);
if (!Number.isNaN(sinceMs)) {
  files = files.filter((file) => fs.statSync(file).mtimeMs >= sinceMs);
}
const failures: Array<{ file: string; labels: string[] }> = [];

for (const file of files) {
  const body = bodyWithoutFrontmatter(fs.readFileSync(file, 'utf8'));
  const labels = BANNED_PUBLIC_PATTERNS
    .filter(({ pattern }) => pattern.test(body))
    .map(({ label }) => label);
  if (labels.length) failures.push({ file: path.relative(process.cwd(), file), labels });
}

if (failures.length) {
  console.error(`❌ Public article QA failed: ${failures.length}/${files.length} checked article(s) contain banned planner/scaffold language.`);
  for (const failure of failures.slice(0, 50)) {
    console.error(`- ${failure.file}: ${failure.labels.join(', ')}`);
  }
  if (failures.length > 50) console.error(`...and ${failures.length - 50} more`);
  process.exit(1);
}

console.log(`✅ Public article QA passed: ${files.length} article(s) checked.`);
