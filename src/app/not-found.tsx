import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400/80">
          404
        </p>
        <h1 className="mt-4 text-3xl font-light italic leading-snug text-zinc-800 dark:text-zinc-100 md:text-4xl">
          Page not found
        </h1>
        <p className="mt-4 text-zinc-500 dark:text-zinc-400">
          This page does not exist, or it has been moved.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-full bg-zinc-900 px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Go home
          </Link>
          <Link
            href="/briefing"
            className="inline-flex h-11 items-center rounded-full border border-zinc-300 px-8 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
          >
            Your briefing
          </Link>
        </div>
      </div>
    </main>
  );
}
