// ---------------------------------------------------------------------------
// Retrieval stub — Package 5 placeholder.
//
// Intentionally returns an empty array. Package 6 wires up real retrieval
// (NewsAPI / Bing News / RSS / source-specific scrapers). This stub lets
// the scan engine, signal parser, signal resolver, and downstream
// scoring pipeline be built and exercised end-to-end without picking a
// retrieval provider yet.
//
// Provider selection is a separate decision and is not made in Package 5.
// ---------------------------------------------------------------------------
import type { RawArticle, ScanTarget } from "./types";

let warned = false;

export interface RetrievalResult {
  target_id: string;
  target_value: string;
  articles: RawArticle[];
  sources_consulted: number;
}

/**
 * Stub: always returns zero articles. Logs once per process to make the
 * placeholder obvious. Package 6 replaces with real retrieval.
 */
export async function retrieveForTarget(target: ScanTarget): Promise<RetrievalResult> {
  if (!warned) {
    console.log(
      "[retrieval-stub] TODO Package 6: wire up actual retrieval (NewsAPI / Bing News / RSS / etc). " +
        "All scan_targets currently return zero articles."
    );
    warned = true;
  }
  return {
    target_id: target.id,
    target_value: target.target_value,
    articles: [],
    sources_consulted: 0,
  };
}

/** Test-only: reset the once-per-process warn flag. */
export function _resetRetrievalStubWarning() {
  warned = false;
}
