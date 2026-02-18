export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-[family-name:var(--font-geist-sans)] dark:bg-zinc-950">
      <main className="flex flex-col items-center gap-6 px-8 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Albis
        </h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          Global news intelligence. Pattern-aware. No noise.
        </p>
        <p className="text-sm text-zinc-400 dark:text-zinc-600">
          Phase 1A — Infrastructure ready.
        </p>
      </main>
    </div>
  );
}
