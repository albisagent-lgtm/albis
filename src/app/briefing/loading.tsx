export default function BriefingLoading() {
  return (
    <main className="min-h-[60vh]">
      <section className="border-b border-zinc-200 py-16 dark:border-zinc-800/50 md:py-20">
        <div className="mx-auto max-w-3xl px-6">
          {/* Skeleton: date + mood */}
          <div className="flex items-center gap-3">
            <div className="h-4 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-5 w-20 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
          {/* Skeleton: heading */}
          <div className="mt-10">
            <div className="h-3 w-24 animate-pulse rounded bg-amber-200/50 dark:bg-amber-900/30" />
            <div className="mt-4 h-8 w-64 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-4 h-4 w-full max-w-md animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      </section>
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-4 px-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900/50"
            />
          ))}
        </div>
      </section>
    </main>
  );
}
