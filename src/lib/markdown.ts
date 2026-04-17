import { TOPICS } from "@/lib/topics";
import { COUNTRIES } from "@/lib/countries";
import { getAllPosts } from "@/lib/blog";

export interface LinkCandidate {
  term: string;
  href: string;
  termLength: number;
}

/**
 * Builds candidates from static TOPICS + COUNTRIES only.
 * Safe to call in any context — no I/O.
 */
function buildStaticLinkCandidates(): LinkCandidate[] {
  const candidates: LinkCandidate[] = [];

  for (const topic of TOPICS) {
    candidates.push({
      term: topic.name,
      href: `/topics/${topic.slug}`,
      termLength: topic.name.length,
    });
  }

  for (const country of COUNTRIES) {
    if (country.name.length >= 4) {
      candidates.push({
        term: country.name,
        href: `/perspectives/${country.slug}`,
        termLength: country.name.length,
      });
    }
  }

  return candidates;
}

/**
 * Build the full candidate list including recent article titles.
 * Async because it awaits `getAllPosts()`. Pass the result into
 * `markdownToHtml(md, candidates)` from the calling server component.
 */
export async function getMarkdownLinkCandidates(): Promise<LinkCandidate[]> {
  const candidates = buildStaticLinkCandidates();

  try {
    const posts = (await getAllPosts()).slice(0, 50);
    for (const post of posts) {
      if (post.title.length >= 20) {
        candidates.push({
          term: post.title,
          href: `/blog/${post.slug}`,
          termLength: post.title.length,
        });
      }
    }
  } catch {
    // ignore — static candidates still usable
  }

  candidates.sort((a, b) => b.termLength - a.termLength);
  return candidates;
}

/**
 * Inject auto-links into HTML text.
 * Rules:
 *  - Max 5 links per article
 *  - Only first occurrence of each term
 *  - Never duplicate destinations
 *  - Never link inside <h1>-<h6>, <a>, <pre>, <code> tags
 *  - Case-insensitive matching but must be a whole word
 */
function injectAutoLinks(html: string, candidates: LinkCandidate[]): string {
  const usedHrefs = new Set<string>();
  let linkCount = 0;
  const MAX_LINKS = 5;

  // Collect all existing hrefs so we don't duplicate
  const existingHrefs = html.matchAll(/href="([^"]+)"/g);
  for (const m of existingHrefs) {
    usedHrefs.add(m[1]);
  }

  for (const candidate of candidates) {
    if (linkCount >= MAX_LINKS) break;
    if (usedHrefs.has(candidate.href)) continue;

    const escaped = candidate.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b(${escaped})\\b`, "i");

    const result = replaceInSafeRegions(
      html,
      regex,
      (match) => `<a href="${candidate.href}" class="auto-link">${match}</a>`
    );

    if (result !== html) {
      html = result;
      usedHrefs.add(candidate.href);
      linkCount++;
    }
  }

  return html;
}

function replaceInSafeRegions(
  html: string,
  regex: RegExp,
  replacer: (match: string) => string
): string {
  const protectedPattern =
    /(<(?:a |a>|h[1-6][ >]|pre[ >]|code[ >])[\s\S]*?<\/(?:a|h[1-6]|pre|code)>)/gi;

  const parts = html.split(protectedPattern);
  let replaced = false;

  for (let i = 0; i < parts.length; i++) {
    if (replaced) break;

    if (protectedPattern.test(parts[i])) {
      protectedPattern.lastIndex = 0;
      continue;
    }
    protectedPattern.lastIndex = 0;

    const newPart = parts[i].replace(regex, (m) => {
      if (replaced) return m;
      replaced = true;
      return replacer(m);
    });
    parts[i] = newPart;
  }

  return parts.join("");
}

// Simple markdown to HTML converter (no heavy deps).
// Pass `linkCandidates` to enable auto-linking; omit to skip it.
export function markdownToHtml(md: string, linkCandidates?: LinkCandidate[]): string {
  let html = md;

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');

  // Headings
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr />');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

  // Unordered lists
  html = html.replace(/^(?:- (.+)\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(line => `<li>${line.replace(/^- /, '')}</li>`).join('\n');
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/^(?:\d+\. (.+)\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(line => `<li>${line.replace(/^\d+\. /, '')}</li>`).join('\n');
    return `<ol>${items}</ol>`;
  });

  // Paragraphs - wrap remaining text blocks
  html = html.replace(/^(?!<[a-z])((?!<\/)[^\n]+)$/gm, '<p>$1</p>');

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');

  if (linkCandidates && linkCandidates.length > 0) {
    html = injectAutoLinks(html, linkCandidates);
  }

  return html;
}
