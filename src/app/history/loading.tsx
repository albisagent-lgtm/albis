export default function HistoryLoading() {
  return (
    <main className="min-h-[60vh]">
      <section className="border-b border-zinc-200 py-16 dark:border-zinc-800/50 md:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="h-3 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-4 h-8 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </section>
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-3 px-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900/50"
            />
          ))}
        </div>
      </section>
    </main>
  );
}
