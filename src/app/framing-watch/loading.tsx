export default function FramingWatchLoading() {
  return (
    <main className="min-h-[60vh]">
      <section className="border-b border-zinc-200 py-16 dark:border-zinc-800/50 md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-amber-100 dark:bg-amber-950/30" />
            <div className="h-3 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="mt-6 h-10 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-4 h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </section>
    </main>
  );
}
