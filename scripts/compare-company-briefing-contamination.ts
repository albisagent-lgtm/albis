#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// Compare local company briefing preview JSON files for cross-company leakage.
//
// Usage:
//   npx tsx scripts/compare-company-briefing-contamination.ts /tmp/albis-company-deep-dive-v2
//
// Read-only. No network. No DB writes.
// ---------------------------------------------------------------------------

import fs from "fs";
import path from "path";

type Preview = {
  file: string;
  company: string;
  urls: Set<string>;
  sections: string[];
  titles: string[];
  why: string[];
  text: string;
};

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(p) : [p];
  });
}

function grams(text: string, size = 5): Set<string> {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]+/g, " ").split(/\s+/).filter((w) => w.length > 2);
  const out = new Set<string>();
  for (let i = 0; i <= words.length - size; i += 1) out.add(words.slice(i, i + size).join(" "));
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const intersection = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

function loadPreview(file: string): Preview | null {
  if (!file.endsWith(".json") || path.basename(file).endsWith("-evidence.json")) return null;
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!data.briefing_content || !data.selected_signals) return null;
  const company = data.company_profile?.company_name || data.briefing_content?.company_id || path.basename(file);
  const sections: string[] = [];
  const titles: string[] = [];
  const why: string[] = [];
  let text = "";
  for (const section of data.briefing_content?.main_briefing?.sections || []) {
    sections.push(section.section_id || section.heading || "unknown");
    for (const item of section.items || []) {
      const title = item.title?.text || "";
      const body = item.body?.text || "";
      titles.push(title);
      why.push(body.slice(0, 260));
      text += ` ${title} ${body}`;
    }
  }
  return {
    file,
    company,
    urls: new Set((data.selected_signals || []).map((s: any) => s.source_url || s.url).filter(Boolean)),
    sections,
    titles,
    why,
    text,
  };
}

function main() {
  const root = process.argv[2];
  if (!root) throw new Error("Usage: compare-company-briefing-contamination.ts <preview-dir>");
  const previews = walk(root).map(loadPreview).filter((p): p is Preview => Boolean(p));
  if (previews.length < 2) throw new Error(`Need at least two preview JSON files under ${root}`);

  const lines: string[] = [];
  lines.push(`# Company briefing contamination report`);
  lines.push(``);
  lines.push(`Preview dir: \`${root}\``);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(``);

  for (let i = 0; i < previews.length; i += 1) {
    for (let j = i + 1; j < previews.length; j += 1) {
      const a = previews[i];
      const b = previews[j];
      const sharedUrls = [...a.urls].filter((url) => b.urls.has(url));
      const sharedSections = [...new Set(a.sections.filter((section) => b.sections.includes(section)))];
      const titleOverlap = [...new Set(a.titles.filter((title) => b.titles.includes(title)))];
      const wordingOverlap = jaccard(grams(a.text), grams(b.text));
      const risk = sharedUrls.length >= 3 || titleOverlap.length >= 2 || wordingOverlap > 0.18 ? "HIGH" : sharedUrls.length || wordingOverlap > 0.08 ? "REVIEW" : "LOW";

      lines.push(`## ${a.company} ↔ ${b.company}`);
      lines.push(`- Risk: **${risk}**`);
      lines.push(`- Shared selected URLs: ${sharedUrls.length}`);
      lines.push(`- Shared sections: ${sharedSections.length ? sharedSections.join(", ") : "none"}`);
      lines.push(`- Identical titles: ${titleOverlap.length ? titleOverlap.join("; ") : "none"}`);
      lines.push(`- Wording overlap: ${(wordingOverlap * 100).toFixed(1)}%`);
      if (sharedUrls.length) {
        lines.push(`- Shared URLs:`);
        for (const url of sharedUrls.slice(0, 8)) lines.push(`  - ${url}`);
      }
      lines.push(``);
    }
  }

  const outPath = path.join(root, "contamination-report.md");
  fs.writeFileSync(outPath, `${lines.join("\n")}\n`);
  console.log(outPath);
}

main();
