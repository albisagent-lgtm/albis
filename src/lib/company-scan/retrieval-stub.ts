// ---------------------------------------------------------------------------
// Retrieval stub — Package 5 placeholder.
//
// DEPRECATED as of Package 6 — retrieval-brave.ts is the live path. This
// file is retained as a fallback for unit testing the scan engine
// without hitting a real network and for any future provider-swap work.
// Do not import in production code paths.
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
