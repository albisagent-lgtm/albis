import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-[#f8f7f4] px-6 dark:bg-[#0f0f0f]">
      {/* Gradient wash */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-50/40 via-transparent to-transparent dark:from-amber-950/10" />

      <div className="animate-fade-in-up relative text-center">
        <p className="font-[family-name:var(--font-playfair)] text-8xl font-bold text-[#c8922a]/15 dark:text-[#c8922a]/10">
          404
        </p>
        <p className="mt-2 text-xs font-medium tracking-[0.2em] uppercase text-[#c8922a]">
          Page not found
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl font-light italic leading-snug text-[#0f0f0f] dark:text-[#f0efec] md:text-4xl">
          This page doesn&apos;t exist.
        </h1>
        <p className="mt-4 text-zinc-500 dark:text-zinc-400">
          It may have been moved, or the URL might be wrong.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[#1a3a5c] px-8 text-sm font-medium text-white shadow-[0_2px_12px_rgb(26,58,92,0.3)] hover:bg-[#243f66]"
          >
            Go home →
          </Link>
          <Link
            href="/briefing"
            className="inline-flex h-12 items-center rounded-full border border-black/[0.1] px-8 text-sm font-medium text-zinc-600 hover:bg-zinc-100/80 dark:border-white/[0.1] dark:text-zinc-400 dark:hover:bg-white/[0.05]"
          >
            Your briefing
          </Link>
        </div>
      </div>
    </main>
  );
}
