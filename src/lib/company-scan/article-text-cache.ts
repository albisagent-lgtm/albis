// ---------------------------------------------------------------------------
// Article text fetch/cache for the Researched Understanding Layer.
//
// This is deliberately local-first and cost-safe:
// - URL text is cached by URL hash.
// - Product/email rerenders can run cache-only.
// - Live fetch can be disabled with COMPANY_ARTICLE_TEXT_DISABLE_LIVE_FETCH=1.
// - Fetch count is capped with COMPANY_ARTICLE_TEXT_MAX_FETCHES.
// ---------------------------------------------------------------------------

import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

export type ArticleTextCacheMode = "readwrite" | "readonly" | "off";
export type ArticleTextFetchStatus =
  | "read"
  | "cache_hit"
  | "cache_miss"
  | "disabled"
  | "failed"
  | "skipped";

export interface ArticleTextResult {
  url: string;
  status: ArticleTextFetchStatus;
  title?: string;
  text?: string;
  excerpt?: string;
  word_count?: number;
  fetched_at?: string;
  cache_path?: string;
  error?: string;
}

export interface ArticleTextFetchOptions {
  cacheDir?: string;
  mode?: ArticleTextCacheMode;
  disableLiveFetch?: boolean;
  timeoutMs?: number;
  maxChars?: number;
}

function envString(name: string, fallback: string): string {
  const raw = process.env[name];
  return raw && raw.trim() ? raw.trim() : fallback;
}

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function cacheMode(): ArticleTextCacheMode {
  const raw = envString("COMPANY_ARTICLE_TEXT_CACHE_MODE", "readwrite").toLowerCase();
  if (raw === "readonly" || raw === "cache-only") return "readonly";
  if (raw === "off" || raw === "disabled") return "off";
  return "readwrite";
}

function cacheRoot(cacheDir?: string): string {
  return path.resolve(
    cacheDir || process.env.COMPANY_ARTICLE_TEXT_CACHE_DIR || ".cache/company-article-text",
  );
}

function keyForUrl(url: string): string {
  return crypto.createHash("sha256").update(url).digest("hex");
}

function cachePathFor(url: string, cacheDir?: string): string {
  return path.join(cacheRoot(cacheDir), `${keyForUrl(url)}.json`);
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;?/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function extractTitle(html: string): string | undefined {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1];
  if (og) return decodeEntities(og).trim();
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return title ? decodeEntities(title.replace(/\s+/g, " ")).trim() : undefined;
}

function stripHtml(html: string): string {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ");
  const article =
    withoutNoise.match(/<article[\s\S]*?<\/article>/i)?.[0] ||
    withoutNoise.match(/<main[\s\S]*?<\/main>/i)?.[0] ||
    withoutNoise;
  return decodeEntities(
    article
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/h[1-6]>/gi, "\n")
      .replace(/<li[^>]*>/gi, "- ")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

function normalizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
}

async function readCache(url: string, cacheDir?: string): Promise<ArticleTextResult | null> {
  const file = cachePathFor(url, cacheDir);
  try {
    const cached = JSON.parse(await fs.readFile(file, "utf8")) as ArticleTextResult;
    return { ...cached, status: "cache_hit", cache_path: file };
  } catch {
    return null;
  }
}

async function writeCache(result: ArticleTextResult, cacheDir?: string): Promise<ArticleTextResult> {
  const file = cachePathFor(result.url, cacheDir);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify({ ...result, cache_path: file }, null, 2));
  return { ...result, cache_path: file };
}

export async function fetchArticleText(
  rawUrl: string,
  options: ArticleTextFetchOptions = {},
): Promise<ArticleTextResult> {
  const url = normalizeUrl(rawUrl);
  if (!url) return { url: rawUrl, status: "skipped", error: "invalid_url" };

  const mode = options.mode || cacheMode();
  const cacheDir = options.cacheDir;
  const maxChars = options.maxChars ?? envNumber("COMPANY_ARTICLE_TEXT_MAX_CHARS", 16000);
  const timeoutMs = options.timeoutMs ?? envNumber("COMPANY_ARTICLE_TEXT_TIMEOUT_MS", 8000);
  const disableLiveFetch =
    options.disableLiveFetch ?? process.env.COMPANY_ARTICLE_TEXT_DISABLE_LIVE_FETCH === "1";

  if (mode !== "off") {
    const cached = await readCache(url, cacheDir);
    if (cached) return cached;
  }
  if (mode === "readonly") return { url, status: "cache_miss" };
  if (mode === "off" || disableLiveFetch) return { url, status: "disabled" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "Albis research bot; contact: harry@albis.news",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
      },
    });
    if (!response.ok) throw new Error(`http_${response.status}`);
    const contentType = response.headers.get("content-type") || "";
    const raw = await response.text();
    const text = contentType.includes("text/plain") ? raw : stripHtml(raw);
    const clipped = text.slice(0, maxChars).trim();
    const result: ArticleTextResult = {
      url,
      status: "read",
      title: contentType.includes("text/plain") ? undefined : extractTitle(raw),
      text: clipped,
      excerpt: clipped.slice(0, 700),
      word_count: clipped.split(/\s+/).filter(Boolean).length,
      fetched_at: new Date().toISOString(),
    };
    if (mode === "readwrite") return writeCache(result, cacheDir);
    return result;
  } catch (err) {
    const result: ArticleTextResult = {
      url,
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
      fetched_at: new Date().toISOString(),
    };
    if (mode === "readwrite") return writeCache(result, cacheDir);
    return result;
  } finally {
    clearTimeout(timeout);
  }
}

export function articleTextMaxFetches(): number {
  return Math.max(0, envNumber("COMPANY_ARTICLE_TEXT_MAX_FETCHES", 40));
}
