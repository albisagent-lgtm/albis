"use client";

import { PremiumGate } from "@/app/components/premium-gate";

export default function AskPage() {
  return (
    <PremiumGate>
      <AskPlaceholder />
    </PremiumGate>
  );
}

function AskPlaceholder() {
  return (
    <main>
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-2xl px-6">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-950/30">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-violet-600 dark:text-violet-400"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100 md:text-3xl">
              Ask Albis
            </h1>
            <p className="mt-3 text-zinc-500 dark:text-zinc-400">
              Global perspective on any story. Powered by AI analysis.
            </p>
          </div>

          {/* Mock chat interface */}
          <div className="mt-12 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800/50">
            {/* Chat messages area */}
            <div className="min-h-[300px] space-y-4 p-6">
              {/* System message */}
              <div className="flex gap-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950/50">
                  <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                    A
                  </span>
                </div>
                <div className="rounded-xl rounded-tl-none bg-zinc-100 px-4 py-3 dark:bg-zinc-800/50">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Ask me anything about today&apos;s stories or global patterns.
                    I can cross-reference across regions, explain framing differences,
                    or dig deeper into any topic.
                  </p>
                </div>
              </div>

              {/* Example user message */}
              <div className="flex justify-end gap-3">
                <div className="rounded-xl rounded-tr-none bg-zinc-900 px-4 py-3 dark:bg-zinc-100">
                  <p className="text-sm text-zinc-100 dark:text-zinc-900">
                    Why is the Ukraine peace talk coverage so different between
                    European and American outlets?
                  </p>
                </div>
              </div>

              {/* Coming soon overlay */}
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="mx-auto h-px w-16 bg-zinc-200 dark:bg-zinc-800" />
                  <p className="mt-6 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Coming soon
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
                    Ask Albis is coming soon. You will be able to ask questions about
                    any story and get global perspective analysis — cross-referencing
                    coverage across regions, detecting framing patterns, and surfacing
                    what other sources are omitting.
                  </p>
                </div>
              </div>
            </div>

            {/* Input area (disabled) */}
            <div className="border-t border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800/50 dark:bg-zinc-900/50">
              <div className="flex gap-3">
                <div className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-600">
                  Ask about any story or pattern...
                </div>
                <button
                  disabled
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-200 text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
