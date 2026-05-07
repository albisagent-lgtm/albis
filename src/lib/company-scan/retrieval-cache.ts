// ---------------------------------------------------------------------------
// Brave retrieval cache + cost guardrails.
//
// This is intentionally small and local-first. It prevents development / QA
// reruns from paying for the same search queries repeatedly while preserving
// live retrieval for production when no cache exists.
// ---------------------------------------------------------------------------

import crypto from "crypto";

export type RetrievalCacheMode = "readwrite" | "readonly" | "off";

const DEFAULT_CACHE_DIR = ".cache/company-retrieval";
let liveSearchesThisProcess = 0;

function cleanDate(value: string | undefined): string {
  return String(value || new Date().toISOString().slice(0, 10)).replace(/[^0-9-]/g, "");
}

function cacheMode(): RetrievalCacheMode {
  const raw = String(process.env.COMPANY_RETRIEVAL_CACHE_MODE || "readwrite").toLowerCase();
  if (raw === "off" || raw === "0" || raw === "false") return "off";
  if (raw === "readonly" || raw === "read-only" || raw === "cache-only") return "readonly";
  return "readwrite";
}

function liveSearchDisabled(): boolean {
  return process.env.COMPANY_RETRIEVAL_DISABLE_LIVE_SEARCH === "1";
}

function liveSearchBudget(): number {
  return envNumber("COMPANY_RETRIEVAL_LIVE_SEARCH_BUDGET_PER_RUN", 80);
}

function cacheKey(parts: Record<string, unknown>): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(parts))
    .digest("hex")
    .slice(0, 32);
}

async function cachePath(namespace: string, date: string, key: string): Promise<string | null> {
  try {
    const path = await import("node:path");
    const dir = process.env.COMPANY_RETRIEVAL_CACHE_DIR || DEFAULT_CACHE_DIR;
    return path.join(process.cwd(), dir, namespace, cleanDate(date), `${key}.json`);
  } catch {
    return null;
  }
}

async function readJson<T>(file: string): Promise<T | null> {
  try {
    const fs = await import("node:fs/promises");
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

async function writeJson(file: string, value: unknown): Promise<void> {
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(value, null, 2));
  } catch {
    // Cache writes are best-effort. Retrieval must not fail because the local
    // runtime lacks a writable filesystem.
  }
}

export function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function cachedRetrieval<T>(input: {
  namespace: string;
  signalDate: string;
  query: string;
  count: number;
  freshness?: string;
  log?: (message: string) => void;
  fetchLive: () => Promise<T>;
}): Promise<T> {
  const mode = cacheMode();
  const key = cacheKey({
    namespace: input.namespace,
    signalDate: cleanDate(input.signalDate),
    query: input.query,
    count: input.count,
    freshness: input.freshness || "pd",
  });
  const file = mode === "off" ? null : await cachePath(input.namespace, input.signalDate, key);

  if (file) {
    const cached = await readJson<{ value: T }>(file);
    if (cached) {
      input.log?.(`      cache hit: ${input.namespace}`);
      return cached.value;
    }
  }

  if (mode === "readonly" || liveSearchDisabled()) {
    throw new Error(
      `Live company retrieval blocked and no cache entry exists for ${input.namespace}: ${input.query}`,
    );
  }

  const budget = liveSearchBudget();
  if (budget >= 0 && liveSearchesThisProcess >= budget) {
    throw new Error(
      `Live company retrieval budget exceeded (${budget} searches/run). Query blocked for ${input.namespace}: ${input.query}`,
    );
  }

  liveSearchesThisProcess += 1;

  const value = await input.fetchLive();
  if (file && mode === "readwrite") {
    await writeJson(file, {
      cached_at: new Date().toISOString(),
      query: input.query,
      value,
    });
  }
  return value;
}
